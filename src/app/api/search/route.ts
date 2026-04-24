export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/search
 *
 * Full-text search across properties, destinations, and agents.
 *
 * Uses PostgreSQL full-text search (tsvector / plainto_tsquery) via Prisma $queryRaw
 * for ranked, stemmed, accent-insensitive results. Falls back to ILIKE if the
 * full-text query fails (e.g. on SQLite in test environments).
 *
 * Query parameters:
 * - q: search query (required, min 2 chars)
 * - type: filter by type (properties | destinations | agents)
 * - destination: filter by destination slug
 * - minPrice: minimum asking price in kobo
 * - maxPrice: maximum asking price in kobo
 * - limit: results per page (default 20, max 100)
 * - offset: pagination offset (default 0)
 */

interface PropertyRow {
  id: string;
  title: string;
  description: string;
  hero_image: string | null;
  property_type: string;
  destination_name: string | null;
  destination_state: string | null;
  asking_price_kobo: bigint | null;
  rank: number;
}

interface DestinationRow {
  id: string;
  name: string;
  description: string;
  state: string;
  corridor_km: number | null;
  hero_image: string | null;
  slug: string;
  rank: number;
}

interface AgentRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  agency_name: string | null;
  license_verified: boolean | null;
  rating: number | null;
  review_count: number | null;
  avatar: string | null;
  rank: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();
    const type = searchParams.get('type');
    const destination = searchParams.get('destination');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!q || q.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const results: {
      properties: unknown[];
      destinations: unknown[];
      agents: unknown[];
      total: number;
    } = {
      properties: [],
      destinations: [],
      agents: [],
      total: 0,
    };

    // ── Properties ──────────────────────────────────────────────────────────
    if (!type || type === 'properties') {
      try {
        let properties: PropertyRow[] = [];

        try {
          // PostgreSQL full-text search with ts_rank
          properties = await prisma.$queryRaw<PropertyRow[]>`
            SELECT
              p.id,
              p.title,
              p.description,
              p."heroImage"   AS hero_image,
              p.type          AS property_type,
              d.name          AS destination_name,
              d.state         AS destination_state,
              l."askingPriceKobo" AS asking_price_kobo,
              ts_rank(
                to_tsvector('english', coalesce(p.title,'') || ' ' || coalesce(p.description,'')),
                plainto_tsquery('english', ${q})
              ) AS rank
            FROM "Property" p
            LEFT JOIN "Plot" pl ON pl.id = p."plotId"
            LEFT JOIN "Destination" d ON d.id = pl."destinationId"
            LEFT JOIN "Listing" l ON l."propertyId" = p.id AND l.status = 'ACTIVE'
            WHERE
              p.status = 'ACTIVE'
              AND to_tsvector('english', coalesce(p.title,'') || ' ' || coalesce(p.description,''))
                  @@ plainto_tsquery('english', ${q})
              ${destination ? prisma.$queryRaw`AND d.slug = ${destination}` : prisma.$queryRaw``}
              ${minPrice ? prisma.$queryRaw`AND l."askingPriceKobo" >= ${BigInt(minPrice)}` : prisma.$queryRaw``}
              ${maxPrice ? prisma.$queryRaw`AND l."askingPriceKobo" <= ${BigInt(maxPrice)}` : prisma.$queryRaw``}
            ORDER BY rank DESC
            LIMIT ${limit} OFFSET ${offset}
          `;
        } catch {
          // Fallback: ILIKE (works on all databases)
          const props = await prisma.property.findMany({
            where: {
              status: 'ACTIVE',
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
              ...(destination ? { plot: { destination: { slug: destination } } } : {}),
            },
            include: {
              plot: { include: { destination: true } },
              listings: { where: { status: 'ACTIVE' }, take: 1, orderBy: { createdAt: 'desc' } },
            },
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' },
          });

          type PropWithRelations = typeof props[0];
          properties = props
            .filter((p: PropWithRelations) => {
              if (!minPrice && !maxPrice) return true;
              const price = p.listings[0]?.askingPriceKobo;
              if (!price) return true;
              if (minPrice && price < BigInt(minPrice)) return false;
              if (maxPrice && price > BigInt(maxPrice)) return false;
              return true;
            })
            .map((p: PropWithRelations) => ({
              id: p.id,
              title: p.title,
              description: p.description,
              hero_image: p.heroImage,
              property_type: p.type,
              destination_name: (p.plot as { destination?: { name: string } } | null)?.destination?.name ?? null,
              destination_state: (p.plot as { destination?: { state: string } } | null)?.destination?.state ?? null,
              asking_price_kobo: p.listings[0]?.askingPriceKobo ?? null,
              rank: 0,
            }));
        }

        results.properties = properties.map(p => ({
          id: p.id,
          type: 'property',
          title: p.title,
          description: p.description?.substring(0, 150),
          destination: p.destination_name,
          state: p.destination_state,
          price: p.asking_price_kobo?.toString(),
          image: p.hero_image,
          propertyType: p.property_type,
          slug: p.id,
          rank: p.rank,
        }));

        results.total += results.properties.length;
      } catch (error) {
        console.error('[Search] Property search error:', error);
      }
    }

    // ── Destinations ─────────────────────────────────────────────────────────
    if (!type || type === 'destinations') {
      try {
        let destinations: DestinationRow[] = [];

        try {
          destinations = await prisma.$queryRaw<DestinationRow[]>`
            SELECT
              id,
              name,
              description,
              state,
              "corridorKm"  AS corridor_km,
              "heroImage"   AS hero_image,
              slug,
              ts_rank(
                to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || coalesce(state,'')),
                plainto_tsquery('english', ${q})
              ) AS rank
            FROM "Destination"
            WHERE
              to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || coalesce(state,''))
              @@ plainto_tsquery('english', ${q})
            ORDER BY rank DESC
            LIMIT ${limit} OFFSET ${offset}
          `;
        } catch {
          const dests = await prisma.destination.findMany({
            where: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { state: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: limit,
            skip: offset,
            orderBy: { name: 'asc' },
          });
          type DestRow = typeof dests[0];
          destinations = dests.map((d: DestRow) => ({
            id: d.id,
            name: d.name,
            description: d.description,
            state: d.state,
            corridor_km: d.corridorKm,
            hero_image: d.heroImage,
            slug: d.slug,
            rank: 0,
          }));
        }

        results.destinations = destinations.map(d => ({
          id: d.id,
          type: 'destination',
          title: d.name,
          description: d.description?.substring(0, 150),
          state: d.state,
          corridorKm: d.corridor_km,
          image: d.hero_image,
          slug: d.slug,
          rank: d.rank,
        }));

        results.total += results.destinations.length;
      } catch (error) {
        console.error('[Search] Destination search error:', error);
      }
    }

    // ── Agents ───────────────────────────────────────────────────────────────
    if (!type || type === 'agents') {
      try {
        let agents: AgentRow[] = [];

        try {
          agents = await prisma.$queryRaw<AgentRow[]>`
            SELECT
              u.id,
              pr."firstName"      AS first_name,
              pr."lastName"       AS last_name,
              ap."agencyName"     AS agency_name,
              ap."licenseVerified" AS license_verified,
              ap.rating,
              ap."reviewCount"    AS review_count,
              pr.avatar,
              ts_rank(
                to_tsvector('english',
                  coalesce(pr."firstName",'') || ' ' ||
                  coalesce(pr."lastName",'') || ' ' ||
                  coalesce(ap."agencyName",'')
                ),
                plainto_tsquery('english', ${q})
              ) AS rank
            FROM "User" u
            LEFT JOIN "Profile" pr ON pr."userId" = u.id
            LEFT JOIN "AgentProfile" ap ON ap."userId" = u.id
            WHERE
              u.role = 'AGENT'
              AND to_tsvector('english',
                coalesce(pr."firstName",'') || ' ' ||
                coalesce(pr."lastName",'') || ' ' ||
                coalesce(ap."agencyName",'')
              ) @@ plainto_tsquery('english', ${q})
            ORDER BY rank DESC
            LIMIT ${limit} OFFSET ${offset}
          `;
        } catch {
          const agentUsers = await prisma.user.findMany({
            where: {
              role: 'AGENT',
              OR: [
                { profile: { firstName: { contains: q, mode: 'insensitive' } } },
                { profile: { lastName: { contains: q, mode: 'insensitive' } } },
                { agentProfile: { agencyName: { contains: q, mode: 'insensitive' } } },
              ],
            },
            include: { profile: true, agentProfile: true },
            take: limit,
            skip: offset,
          });
          type AgentUserRow = typeof agentUsers[0];
          agents = agentUsers.map((a: AgentUserRow) => ({
            id: a.id,
            first_name: a.profile?.firstName ?? null,
            last_name: a.profile?.lastName ?? null,
            agency_name: a.agentProfile?.agencyName ?? null,
            license_verified: a.agentProfile?.licenseVerified ?? null,
            rating: a.agentProfile?.rating ?? null,
            review_count: a.agentProfile?.reviewCount ?? null,
            avatar: a.profile?.avatar ?? null,
            rank: 0,
          }));
        }

        results.agents = agents.map(a => ({
          id: a.id,
          type: 'agent',
          title: [a.first_name, a.last_name].filter(Boolean).join(' ') || 'Agent',
          agency: a.agency_name,
          verified: a.license_verified,
          rating: a.rating,
          reviewCount: a.review_count,
          image: a.avatar,
          slug: a.id,
          rank: a.rank,
        }));

        results.total += results.agents.length;
      } catch (error) {
        console.error('[Search] Agent search error:', error);
      }
    }

    return NextResponse.json({
      data: results,
      pagination: {
        limit,
        offset,
        query: q,
        total: results.total,
      },
    });
  } catch (error) {
    console.error('[Search] Fatal error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

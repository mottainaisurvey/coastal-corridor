export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/search
 *
 * Full-text search across properties, destinations, and agents.
 * Query parameters:
 * - q: search query (required, min 2 chars)
 * - type: filter by type (properties, destinations, agents)
 * - destination: filter by destination slug
 * - minPrice: minimum price in kobo
 * - maxPrice: maximum price in kobo
 * - limit: results per page (default 20, max 100)
 * - offset: pagination offset (default 0)
 *
 * PRODUCTION: Replace with PostgreSQL full-text search or Algolia/Meilisearch for better performance.
 */

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

    const results: any = {
      properties: [],
      destinations: [],
      agents: [],
      total: 0,
    };

    // Search properties
    if (!type || type === 'properties') {
      try {
        const propertyWhere: any = {
          status: 'ACTIVE',
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { plot: { plotId: { contains: q, mode: 'insensitive' } } },
          ],
        };

        if (destination) {
          propertyWhere.plot = {
            ...propertyWhere.plot,
            destination: { slug: destination },
          };
        }

        const properties = await prisma.property.findMany({
          where: propertyWhere,
          include: {
            plot: { include: { destination: true } },
            listings: {
              where: { status: 'ACTIVE' },
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        });

        results.properties = properties
          .filter((p: any) => {
            if (!minPrice && !maxPrice) return true;
            const price = p.listings[0]?.askingPriceKobo;
            if (!price) return true;
            if (minPrice && price < BigInt(minPrice)) return false;
            if (maxPrice && price > BigInt(maxPrice)) return false;
            return true;
          })
          .map((p: any) => ({
            id: p.id,
            type: 'property',
            title: p.title,
            description: p.description.substring(0, 150),
            destination: p.plot?.destination?.name,
            state: p.plot?.destination?.state,
            price: p.listings[0]?.askingPriceKobo?.toString(),
            image: p.heroImage,
            slug: p.id,
          }));

        results.total += results.properties.length;
      } catch (error) {
        console.error('Property search error:', error);
      }
    }

    // Search destinations
    if (!type || type === 'destinations') {
      try {
        const destinations = await prisma.destination.findMany({
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

        results.destinations = destinations.map((d: any) => ({
          id: d.id,
          type: 'destination',
          title: d.name,
          description: d.description.substring(0, 150),
          state: d.state,
          corridorKm: d.corridorKm,
          image: d.heroImage,
          slug: d.slug,
        }));

        results.total += results.destinations.length;
      } catch (error) {
        console.error('Destination search error:', error);
      }
    }

    // Search agents
    if (!type || type === 'agents') {
      try {
        const agents = await prisma.user.findMany({
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
          orderBy: { profile: { firstName: 'asc' } },
        });

        results.agents = agents.map((a: any) => ({
          id: a.id,
          type: 'agent',
          title: `${a.profile?.firstName} ${a.profile?.lastName}`,
          agency: a.agentProfile?.agencyName,
          verified: a.agentProfile?.licenseVerified,
          rating: a.agentProfile?.rating,
          reviewCount: a.agentProfile?.reviewCount,
          image: a.profile?.avatar,
          slug: a.id,
        }));

        results.total += results.agents.length;
      } catch (error) {
        console.error('Agent search error:', error);
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
    console.error('Search failed:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

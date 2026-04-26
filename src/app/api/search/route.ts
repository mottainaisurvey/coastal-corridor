export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { properties } from '@/lib/mock/properties';
import { destinations } from '@/lib/mock/destinations';
import { agents } from '@/lib/mock/agents';

/**
 * GET /api/search
 *
 * Full-text search across properties, destinations, and agents.
 * Uses the same in-memory mock data as /api/properties, /api/destinations,
 * and /api/agents so results are always consistent with what the app displays.
 *
 * Query parameters:
 * - q: search query (required, min 2 chars)
 * - type: filter by type (properties | destinations | agents)
 * - destination: filter by destination id/slug
 * - minPrice: minimum asking price in kobo
 * - maxPrice: maximum asking price in kobo
 * - limit: results per page (default 20, max 100)
 * - offset: pagination offset (default 0)
 */

function matches(text: string | null | undefined, q: string): boolean {
  if (!text) return false;
  return text.toLowerCase().includes(q.toLowerCase());
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
      let filtered = properties.filter(p => {
        if (p.listingStatus !== 'ACTIVE') return false;
        if (!matches(p.title, q) && !matches(p.description, q) && !matches(p.destinationName, q) && !matches(p.state, q)) return false;
        if (destination && p.destinationId !== destination && p.slug !== destination) return false;
        if (minPrice && p.priceKobo < Number(minPrice)) return false;
        if (maxPrice && p.priceKobo > Number(maxPrice)) return false;
        return true;
      });

      filtered = filtered.slice(offset, offset + limit);

      results.properties = filtered.map(p => ({
        id: p.id,
        type: 'property',
        title: p.title,
        description: p.description?.substring(0, 150),
        destination: p.destinationName,
        state: p.state,
        price: p.priceKobo?.toString(),
        image: p.heroImage,
        propertyType: p.type,
        slug: p.slug,   // ← real slug, not id
        rank: 0,
      }));

      results.total += results.properties.length;
    }

    // ── Destinations ─────────────────────────────────────────────────────────
    if (!type || type === 'destinations') {
      let filtered = destinations.filter(d =>
        matches(d.name, q) || matches(d.description, q) || matches(d.state, q) || matches(d.tagline, q)
      );

      filtered = filtered.slice(offset, offset + limit);

      results.destinations = filtered.map(d => ({
        id: d.id,
        type: 'destination',
        title: d.name,
        description: d.description?.substring(0, 150),
        state: d.state,
        corridorKm: d.corridorKm,
        image: d.heroImage,
        slug: d.slug,
        rank: 0,
      }));

      results.total += results.destinations.length;
    }

    // ── Agents ───────────────────────────────────────────────────────────────
    if (!type || type === 'agents') {
      let filtered = agents.filter(a =>
        matches(a.name, q) || matches(a.agencyName, q) || matches(a.bio, q)
      );

      filtered = filtered.slice(offset, offset + limit);

      results.agents = filtered.map(a => ({
        id: a.id,
        type: 'agent',
        title: a.name,
        agency: a.agencyName,
        verified: a.licenseVerified,
        rating: a.rating,
        reviewCount: a.reviewCount,
        image: a.avatar,
        slug: a.slug,
        rank: 0,
      }));

      results.total += results.agents.length;
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

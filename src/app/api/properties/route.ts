import { NextRequest, NextResponse } from 'next/server';
import { properties } from '@/lib/mock/properties';

/**
 * GET /api/properties
 * Query parameters:
 *   - destination: destination ID filter
 *   - type: property type filter
 *   - minPrice / maxPrice: price range in kobo
 *   - verified: only verified titles
 *   - limit / offset: pagination
 *   - sort: featured | price-asc | price-desc | newest | yoy
 *
 * PRODUCTION NOTE: Replace in-memory filtering with Prisma queries against
 * indexed PostgreSQL tables. Add rate limiting via middleware.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  let list = [...properties];

  const destination = searchParams.get('destination');
  if (destination && destination !== 'all') {
    list = list.filter((p) => p.destinationId === destination);
  }

  const type = searchParams.get('type');
  if (type && type !== 'all') {
    list = list.filter((p) => p.type === type);
  }

  const minPrice = Number(searchParams.get('minPrice') ?? 0);
  const maxPrice = Number(searchParams.get('maxPrice') ?? Number.MAX_SAFE_INTEGER);
  list = list.filter((p) => p.priceKobo >= minPrice && p.priceKobo <= maxPrice);

  if (searchParams.get('verified') === 'true') {
    list = list.filter((p) => p.titleStatus === 'VERIFIED');
  }

  const sort = searchParams.get('sort') ?? 'featured';
  switch (sort) {
    case 'price-asc':
      list.sort((a, b) => a.priceKobo - b.priceKobo);
      break;
    case 'price-desc':
      list.sort((a, b) => b.priceKobo - a.priceKobo);
      break;
    case 'newest':
      list.sort((a, b) => (a.daysListed ?? 0) - (b.daysListed ?? 0));
      break;
    case 'yoy':
      list.sort((a, b) => (b.yoy ?? 0) - (a.yoy ?? 0));
      break;
    default:
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }

  const total = list.length;
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100);
  const offset = Number(searchParams.get('offset') ?? 0);
  const paged = list.slice(offset, offset + limit);

  return NextResponse.json({
    data: paged,
    pagination: { total, limit, offset, hasMore: offset + limit < total }
  });
}

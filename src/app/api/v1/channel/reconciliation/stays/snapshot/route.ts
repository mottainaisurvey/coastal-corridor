/**
 * GET /api/v1/channel/reconciliation/stays/snapshot
 *
 * Returns a lightweight snapshot of all stay properties and their rooms
 * for reconciliation against the Owambe source of truth.
 *
 * Query parameters:
 *   - page (default: 1)
 *   - per_page (default: 100, max: 500)
 *   - status (optional: ACTIVE | INACTIVE | UNDER_REVIEW)
 *   - city (optional: filter by city)
 *   - updated_since (optional: ISO 8601 datetime — return only records updated after this time)
 *
 * Response shape:
 *   {
 *     "snapshot_at": "2026-05-05T12:00:00.000Z",
 *     "total": 42,
 *     "page": 1,
 *     "per_page": 100,
 *     "properties": [
 *       {
 *         "id": "cuid...",
 *         "owambe_property_id": "prop_abc",
 *         "name": "Beachfront Villa",
 *         "status": "ACTIVE",
 *         "city": "Lagos",
 *         "state": "Lagos",
 *         "updated_at": "2026-05-01T10:00:00.000Z",
 *         "rooms": [
 *           {
 *             "id": "cuid...",
 *             "owambe_room_id": "room_abc",
 *             "name": "Deluxe Suite",
 *             "room_type": "SUITE",
 *             "capacity": 2,
 *             "base_rate": "45000",
 *             "base_currency": "NGN"
 *           }
 *         ]
 *       }
 *     ]
 *   }
 *
 * This endpoint is used by the Owambe reconciliation cron to detect drift
 * between the Coastal Corridor mirror and the Owambe master record.
 *
 * Spec reference: Implementation Brief §11
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyChannelRequest } from '@/lib/channel-auth';
import { getPrisma } from '@/lib/db-safe';

const MAX_PER_PAGE = 500;
const DEFAULT_PER_PAGE = 100;

export async function GET(req: NextRequest): Promise<NextResponse> {
  // HMAC verification — reconciliation endpoints require the same auth as write endpoints
  const guard = await verifyChannelRequest(req);
  if (guard.error) return guard.error;

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  // Parse query parameters
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(1, parseInt(searchParams.get('per_page') ?? String(DEFAULT_PER_PAGE), 10) || DEFAULT_PER_PAGE)
  );
  const statusFilter = searchParams.get('status') ?? undefined;
  const cityFilter = searchParams.get('city') ?? undefined;
  const updatedSince = searchParams.get('updated_since') ?? undefined;

  // Build where clause
  const where: Record<string, unknown> = {};
  if (statusFilter) where.status = statusFilter;
  if (cityFilter) where.city = cityFilter;
  if (updatedSince) {
    const since = new Date(updatedSince);
    if (!isNaN(since.getTime())) {
      where.updatedAt = { gte: since };
    }
  }

  try {
    const [total, properties] = await Promise.all([
      prisma.stayProperty.count({ where }),
      prisma.stayProperty.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          owambePropertyId: true,
          name: true,
          status: true,
          city: true,
          state: true,
          updatedAt: true,
          rooms: {
            select: {
              id: true,
              owambeRoomId: true,
              name: true,
              roomType: true,
              capacity: true,
              baseRate: true,
              baseCurrency: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      snapshot_at: new Date().toISOString(),
      total,
      page,
      per_page: perPage,
      properties: properties.map((p) => ({
        id: p.id,
        owambe_property_id: p.owambePropertyId,
        name: p.name,
        status: p.status,
        city: p.city,
        state: p.state,
        updated_at: p.updatedAt.toISOString(),
        rooms: p.rooms.map((r) => ({
          id: r.id,
          owambe_room_id: r.owambeRoomId,
          name: r.name,
          room_type: r.roomType,
          capacity: r.capacity,
          base_rate: r.baseRate.toString(),
          base_currency: r.baseCurrency,
        })),
      })),
    });
  } catch (err) {
    console.error('[reconciliation/stays/snapshot GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

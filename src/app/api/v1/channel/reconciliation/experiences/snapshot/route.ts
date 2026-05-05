/**
 * GET /api/v1/channel/reconciliation/experiences/snapshot
 *
 * Returns a lightweight snapshot of all experiences and their upcoming time slots
 * for reconciliation against the Owambe source of truth.
 *
 * Query parameters:
 *   - page (default: 1)
 *   - per_page (default: 100, max: 500)
 *   - status (optional: ACTIVE | INACTIVE | UNDER_REVIEW)
 *   - experience_type (optional: TOUR | CHARTER | WORKSHOP | etc.)
 *   - updated_since (optional: ISO 8601 datetime)
 *   - slots_from (optional: ISO 8601 date — only include time slots on/after this date)
 *
 * Response shape:
 *   {
 *     "snapshot_at": "2026-05-05T12:00:00.000Z",
 *     "total": 15,
 *     "page": 1,
 *     "per_page": 100,
 *     "experiences": [
 *       {
 *         "id": "cuid...",
 *         "owambe_experience_id": "exp_abc",
 *         "name": "Sunset Kayak Tour",
 *         "status": "ACTIVE",
 *         "experience_type": "TOUR",
 *         "capacity": 12,
 *         "updated_at": "2026-05-01T10:00:00.000Z",
 *         "time_slots": [
 *           {
 *             "id": "cuid...",
 *             "owambe_time_slot_id": "ts_abc",
 *             "start_date_time": "2026-07-01T09:00:00.000Z",
 *             "end_date_time": "2026-07-01T12:00:00.000Z",
 *             "capacity": 12,
 *             "spots_booked": 3,
 *             "status": "OPEN"
 *           }
 *         ]
 *       }
 *     ]
 *   }
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
  // HMAC verification
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
  const experienceTypeFilter = searchParams.get('experience_type') ?? undefined;
  const updatedSince = searchParams.get('updated_since') ?? undefined;
  const slotsFrom = searchParams.get('slots_from') ?? undefined;

  // Build where clause for experiences
  const where: Record<string, unknown> = {};
  if (statusFilter) where.status = statusFilter;
  if (experienceTypeFilter) where.experienceType = experienceTypeFilter;
  if (updatedSince) {
    const since = new Date(updatedSince);
    if (!isNaN(since.getTime())) {
      where.updatedAt = { gte: since };
    }
  }

  // Build where clause for time slots
  const slotWhere: Record<string, unknown> = {};
  if (slotsFrom) {
    const from = new Date(slotsFrom);
    if (!isNaN(from.getTime())) {
      slotWhere.startDateTime = { gte: from };
    }
  }

  try {
    const [total, experiences] = await Promise.all([
      prisma.experience.count({ where }),
      prisma.experience.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          owambeExperienceId: true,
          name: true,
          status: true,
          experienceType: true,
          capacity: true,
          updatedAt: true,
          timeSlots: {
            where: slotWhere,
            orderBy: { startDateTime: 'asc' },
            select: {
              id: true,
              owambeTimeSlotId: true,
              startDateTime: true,
              endDateTime: true,
              capacity: true,
              spotsBooked: true,
              status: true,
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
      experiences: experiences.map((e) => ({
        id: e.id,
        owambe_experience_id: e.owambeExperienceId,
        name: e.name,
        status: e.status,
        experience_type: e.experienceType,
        capacity: e.capacity,
        updated_at: e.updatedAt.toISOString(),
        time_slots: e.timeSlots.map((s) => ({
          id: s.id,
          owambe_time_slot_id: s.owambeTimeSlotId,
          start_date_time: s.startDateTime.toISOString(),
          end_date_time: s.endDateTime.toISOString(),
          capacity: s.capacity,
          spots_booked: s.spotsBooked,
          status: s.status,
        })),
      })),
    });
  } catch (err) {
    console.error('[reconciliation/experiences/snapshot GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/experiences
 *
 * CC-D-01-A AC-1 — Public guest-facing experience listing endpoint.
 *
 * Returns a paginated list of ACTIVE experiences with optional filters:
 *   - destination: fuzzy text match against meetingPointDescription
 *   - type:        exact match against ExperienceType enum
 *   - date:        ISO date string — filters to experiences with at least
 *                  one TimeSlot with startDateTime on that date
 *   - page:        page number (default 1)
 *   - perPage:     results per page (default 12, max 50)
 *
 * Sort: createdAt desc (no featuredRank field exists — AC-0 confirmed).
 *
 * Always filters to status='ACTIVE'. Non-ACTIVE experiences are not
 * exposed to guests.
 *
 * Public endpoint — no auth required.
 *
 * Data sources (confirmed in AC-0):
 *   - Experience: id, name, description, experienceType, durationMinutes,
 *     capacity, meetingPointDescription, basePrice, baseCurrency, status
 *   - ExperienceImage: primary image via isPrimary=true (or first by sortOrder)
 *   - OperatorProfile: displayName ?? businessName for operator display name
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db-safe';

const DEFAULT_PER_PAGE = 12;
const MAX_PER_PAGE = 50;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);

  const destination = searchParams.get('destination')?.trim() ?? undefined;
  const type        = searchParams.get('type')?.trim() ?? undefined;
  const date        = searchParams.get('date')?.trim() ?? undefined;
  const page        = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const perPage     = Math.min(MAX_PER_PAGE, Math.max(1, parseInt(searchParams.get('perPage') ?? String(DEFAULT_PER_PAGE), 10) || DEFAULT_PER_PAGE));

  const db = getPrismaClient();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  // ── Build where clause ──────────────────────────────────────────────────────

  const where: Record<string, unknown> = {
    status: 'ACTIVE',
  };

  if (destination) {
    where.meetingPointDescription = { contains: destination, mode: 'insensitive' };
  }

  if (type) {
    // Validate against known enum values
    const validTypes = ['TOUR', 'CHARTER', 'WORKSHOP', 'FOOD_EXPERIENCE', 'TRANSPORT', 'EVENT_SPECIALIST', 'WELLNESS', 'OTHER'];
    if (validTypes.includes(type.toUpperCase())) {
      where.experienceType = type.toUpperCase();
    }
  }

  if (date) {
    // Filter experiences with at least one TimeSlot on the given date
    // Uses a subquery via Prisma's `some` relation filter — single query, no N+1
    const dateObj = new Date(date);
    if (!isNaN(dateObj.getTime())) {
      const dayStart = new Date(dateObj);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(dateObj);
      dayEnd.setUTCHours(23, 59, 59, 999);
      where.timeSlots = {
        some: {
          startDateTime: { gte: dayStart, lte: dayEnd },
          status: { in: ['OPEN', 'FULL'] }, // not CANCELLED or COMPLETED
        },
      };
    }
  }

  // ── Count + paginate ────────────────────────────────────────────────────────

  const [totalCount, experiences] = await Promise.all([
    db.experience.count({ where: where as any }),
    db.experience.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      skip:  (page - 1) * perPage,
      take:  perPage,
      select: {
        id:                     true,
        name:                   true,
        description:            true,
        experienceType:         true,
        durationMinutes:        true,
        capacity:               true,
        meetingPointDescription: true,
        basePrice:              true,
        baseCurrency:           true,
        pricingModel:           true,
        images: {
          where:   { isPrimary: true },
          orderBy: { sortOrder: 'asc' },
          take:    1,
          select:  { url: true, caption: true },
        },
        operator: {
          select: {
            operatorProfile: {
              select: {
                displayName:  true,
                businessName: true,
                verificationLevel: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / perPage);

  // ── Shape response ──────────────────────────────────────────────────────────

  const shaped = experiences.map(exp => {
    const primaryImage = exp.images[0]?.url ?? null;
    const op = exp.operator?.operatorProfile;
    const operatorDisplayName = op?.displayName ?? op?.businessName ?? null;
    // Truncate description to ~150 chars for listing card
    const descriptionShort = exp.description.length > 150
      ? exp.description.slice(0, 147) + '…'
      : exp.description;

    return {
      id:                     exp.id,
      name:                   exp.name,
      description:            descriptionShort,
      experienceType:         exp.experienceType,
      durationMinutes:        exp.durationMinutes,
      capacity:               exp.capacity,
      location:               exp.meetingPointDescription,
      priceFrom:              Number(exp.basePrice),
      currency:               exp.baseCurrency,
      pricingModel:           exp.pricingModel,
      primaryImage,
      operatorDisplayName,
    };
  });

  console.log(`[api/experiences GET] page=${page} perPage=${perPage} totalCount=${totalCount} destination=${destination ?? '-'} type=${type ?? '-'} date=${date ?? '-'}`);

  return NextResponse.json({
    experiences: shaped,
    pagination: {
      page,
      perPage,
      totalCount,
      totalPages,
    },
  });
}

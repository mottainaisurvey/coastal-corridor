/**
 * POST /api/diagnostic/seed — CC-D-01-E-PROBE staging seed
 *
 * Creates a deterministic test operator, experience, and time slot in the
 * staging database. Idempotent: if the seed operator email already exists,
 * returns the existing IDs without creating duplicates.
 *
 * Protected by DIAGNOSTIC_SECRET header (default: 'cc-probe-staging-2026').
 * Only active when VERCEL_ENV !== 'production' (staging/preview deployments).
 *
 * Body (optional):
 *   { currency?: 'NGN' | 'USD' | 'GBP' }   — defaults to 'NGN'
 *
 * Response: {
 *   operatorUserId, experienceId, timeSlotId,
 *   paystackSubaccountCode (null in staging),
 *   seeded: boolean (true = newly created, false = already existed),
 *   currency: string
 * }
 *
 * Convention-E.1 (PHASE-5-3-B-COORDINATED-TEST-DATA-ALIGNMENT-01 Amendment 01):
 * owambeExperienceId and owambeTimeSlotId use stable deterministic patterns
 * (`coord-test-exp-${currency}` / `coord-test-slot-${currency}`) without
 * timestamp suffix — enabling bilateral fixture reference resolution across
 * deployments. See docs/integration/test-fixture-conventions.md.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db-safe';

const DIAGNOSTIC_SECRET = process.env.DIAGNOSTIC_SECRET ?? 'cc-probe-staging-2026';

export async function POST(req: NextRequest) {
  // Auth check — DIAGNOSTIC_SECRET header is the sole access control.
  // TODO: remove these diagnostic endpoints before production launch.
  const secret = req.headers.get('x-diagnostic-secret');
  if (secret !== DIAGNOSTIC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  // Parse optional currency from request body
  let currency: 'NGN' | 'USD' | 'GBP' = 'NGN';
  try {
    const body = await req.json().catch(() => ({}));
    if (body?.currency && ['NGN', 'USD', 'GBP'].includes(body.currency)) {
      currency = body.currency as 'NGN' | 'USD' | 'GBP';
    }
  } catch {
    // ignore parse errors — use default NGN
  }

  // Use currency-specific seed names so NGN and USD/GBP probes don't collide
  // Convention-B: email domain @cc-staging.test is the CC-side test marker pattern
  const SEED_OPERATOR_EMAIL = 'coord-test-operator@cc-staging.test';
  const SEED_EXPERIENCE_NAME =
    currency === 'NGN'
      ? 'Coord-Test: Lagos Sunset Boat Tour (NGN)'
      : `Coord-Test: International Experience (${currency})`;  // USD coordinated fixture

  // Base price and rate by currency
  const BASE_PRICE = currency === 'NGN' ? '25000.00' : '50.00';
  const SLOT_RATE = currency === 'NGN' ? '25000.00' : '50.00';

  try {
    // ── 1. Operator User ─────────────────────────────────────────────────────
    let operatorUser = await prisma.user.findUnique({
      where: { email: SEED_OPERATOR_EMAIL },
      include: { operatorProfile: true },
    });

    let seeded = false;

    if (!operatorUser) {
      seeded = true;
      operatorUser = await prisma.user.create({
        data: {
          email: SEED_OPERATOR_EMAIL,
          clerkId: null,
          owambeUserId: 'probe-operator-owambe-id',
          role: 'OPERATOR',
          status: 'ACTIVE',
          operatorProfile: {
            create: {
              displayName: 'Probe Operator',
              businessName: 'CC Probe Tours Ltd',
              commissionRate: '0.15',
              paystackSubaccountCode: null,
            },
          },
        },
        include: { operatorProfile: true },
      });
    } else if (!operatorUser.owambeUserId) {
      operatorUser = await prisma.user.update({
        where: { id: operatorUser.id },
        data: { owambeUserId: 'probe-operator-owambe-id' },
        include: { operatorProfile: true },
      });
    }

    const operatorUserId = operatorUser.id;

    // ── 2. Experience ─────────────────────────────────────────────────────────
    let experience = await prisma.experience.findFirst({
      where: { operatorUserId, name: SEED_EXPERIENCE_NAME },
    });

    if (!experience) {
      seeded = true;
      experience = await prisma.experience.create({
        data: {
          operatorUserId,
          // Convention-E.1: stable deterministic ID (no timestamp) for bilateral fixture coordination
          owambeExperienceId: `coord-test-exp-${currency.toLowerCase()}`,  // e.g. coord-test-exp-ngn
          name: SEED_EXPERIENCE_NAME,
          description: `Automated probe experience for CC-D-01-E end-to-end test (${currency}).`,
          experienceType: 'CHARTER',
          durationMinutes: 120,
          capacity: 10,
          meetingPointDescription: 'Five Cowries Creek, Victoria Island, Lagos',
          meetingPointLatitude: 6.4281,
          meetingPointLongitude: 3.4219,
          pricingModel: 'PER_PERSON',
          basePrice: BASE_PRICE,
          baseCurrency: currency,
          status: 'ACTIVE',
        },
      });
    }

    const experienceId = experience.id;

    // ── 3. Time Slot ──────────────────────────────────────────────────────────
    // Always create a future time slot (48 hours from now) so it's bookable.
    // For currency-specific probes, always create a fresh slot to avoid
    // currency mismatch with existing NGN slots.
    const startDateTime = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const endDateTime = new Date(startDateTime.getTime() + 120 * 60 * 1000);

    let timeSlot = await prisma.timeSlot.findFirst({
      where: {
        experienceId,
        startDateTime: { gte: new Date() },
        status: 'OPEN',
        currency: currency as any,
      },
      orderBy: { startDateTime: 'asc' },
    });

    if (!timeSlot) {
      seeded = true;
      timeSlot = await prisma.timeSlot.create({
        data: {
          experienceId,
          // Convention-E.1: stable deterministic ID (no timestamp) for bilateral fixture coordination
          owambeTimeSlotId: `coord-test-slot-${currency.toLowerCase()}`,  // e.g. coord-test-slot-ngn
          startDateTime,
          endDateTime,
          capacity: 10,
          spotsBooked: 0,
          rate: SLOT_RATE,
          currency: currency as any,
          status: 'OPEN',
        },
      });
    }

    const timeSlotId = timeSlot.id;

    return NextResponse.json({
      operatorUserId,
      operatorOwambeUserId: operatorUser.owambeUserId,
      experienceId,
      timeSlotId,
      paystackSubaccountCode: operatorUser.operatorProfile?.paystackSubaccountCode ?? null,
      seeded,
      experience: {
        name: experience.name,
        basePrice: experience.basePrice.toString(),
        baseCurrency: experience.baseCurrency,
        capacity: experience.capacity,
      },
      timeSlot: {
        startDateTime: timeSlot.startDateTime.toISOString(),
        endDateTime: timeSlot.endDateTime.toISOString(),
        capacity: timeSlot.capacity,
        spotsBooked: timeSlot.spotsBooked,
        currency: timeSlot.currency,
      },
    });
  } catch (err) {
    console.error('[diagnostic/seed] Error:', err);
    return NextResponse.json(
      { error: 'Seed failed', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

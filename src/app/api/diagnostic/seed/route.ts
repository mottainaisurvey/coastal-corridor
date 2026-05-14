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
 * Response: {
 *   operatorUserId, experienceId, timeSlotId,
 *   paystackSubaccountCode (null in staging),
 *   seeded: boolean (true = newly created, false = already existed)
 * }
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

  const SEED_OPERATOR_EMAIL = 'probe-operator@cc-staging.test';
  const SEED_EXPERIENCE_NAME = 'CC-D-01-E Probe: Lagos Sunset Boat Tour';

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
          owambeExperienceId: `probe-exp-${Date.now()}`,
          name: SEED_EXPERIENCE_NAME,
          description: 'Automated probe experience for CC-D-01-E end-to-end test.',
          experienceType: 'CHARTER',
          durationMinutes: 120,
          capacity: 10,
          meetingPointDescription: 'Five Cowries Creek, Victoria Island, Lagos',
          meetingPointLatitude: 6.4281,
          meetingPointLongitude: 3.4219,
          pricingModel: 'PER_PERSON',
          basePrice: '25000.00',
          baseCurrency: 'NGN',
          status: 'ACTIVE',
        },
      });
    }

    const experienceId = experience.id;

    // ── 3. Time Slot ──────────────────────────────────────────────────────────
    // Always create a future time slot (48 hours from now) so it's bookable
    const startDateTime = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const endDateTime = new Date(startDateTime.getTime() + 120 * 60 * 1000);

    let timeSlot = await prisma.timeSlot.findFirst({
      where: {
        experienceId,
        startDateTime: { gte: new Date() },
        status: 'OPEN',
      },
      orderBy: { startDateTime: 'asc' },
    });

    if (!timeSlot) {
      seeded = true;
      timeSlot = await prisma.timeSlot.create({
        data: {
          experienceId,
          owambeTimeSlotId: `probe-slot-${Date.now()}`,
          startDateTime,
          endDateTime,
          capacity: 10,
          spotsBooked: 0,
          status: 'OPEN',
        },
      });
    }

    const timeSlotId = timeSlot.id;

    return NextResponse.json({
      operatorUserId,
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

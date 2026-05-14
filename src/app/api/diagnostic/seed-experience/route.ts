/**
 * POST /api/diagnostic/seed-experience
 *
 * Creates an Experience + TimeSlot for an operator user on staging.
 * Idempotent: if the experience with owambeExperienceId 'founder-test-exp-001' already exists,
 * returns the existing IDs.
 *
 * Protected by x-diagnostic-secret header.
 * Only active when VERCEL_ENV !== 'production'.
 *
 * Body: { operatorEmail: string }
 *
 * Response: { experienceId, timeSlotId, created: boolean }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db-safe';

const DIAGNOSTIC_SECRET = process.env.DIAGNOSTIC_SECRET ?? 'cc-probe-staging-2026';
const SEED_EXP_OWAMBE_ID = 'founder-test-exp-001';
const SEED_SLOT_OWAMBE_ID = 'founder-test-slot-001';

export async function POST(req: NextRequest) {
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }
  const secret = req.headers.get('x-diagnostic-secret');
  if (secret !== DIAGNOSTIC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const { operatorEmail } = body;

  if (!operatorEmail) {
    return NextResponse.json({ error: 'operatorEmail is required' }, { status: 400 });
  }

  try {
    // Find operator user
    const operatorUser = await prisma.user.findUnique({ where: { email: operatorEmail } });
    if (!operatorUser) {
      return NextResponse.json({ error: `Operator user not found: ${operatorEmail}` }, { status: 404 });
    }

    // Check if experience already exists
    let experience = await prisma.experience.findUnique({
      where: { owambeExperienceId: SEED_EXP_OWAMBE_ID },
      include: { timeSlots: true },
    });
    let created = false;

    // Slot start: tomorrow at 10:00 WAT
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 10:00 WAT = 09:00 UTC
    const slotEnd = new Date(tomorrow);
    slotEnd.setHours(11, 0, 0, 0); // 12:00 WAT = 11:00 UTC

    if (!experience) {
      created = true;
      experience = await prisma.experience.create({
        data: {
          owambeExperienceId: SEED_EXP_OWAMBE_ID,
          operatorUserId: operatorUser.id,
          name: 'Founder Test: Lagos Sunset Boat Tour',
          description: 'A scenic sunset boat tour along the Lagos waterfront, perfect for testing the Coastal Corridor operator dashboard.',
          experienceType: 'TOUR',
          durationMinutes: 120,
          capacity: 12,
          meetingPointDescription: 'Five Cowries Creek Jetty, Victoria Island',
          meetingPointLatitude: 6.4281,
          meetingPointLongitude: 3.4219,
          pricingModel: 'PER_PERSON',
          basePrice: 25000,
          baseCurrency: 'NGN',
          status: 'ACTIVE',
          timeSlots: {
            create: {
              owambeTimeSlotId: SEED_SLOT_OWAMBE_ID,
              startDateTime: tomorrow,
              endDateTime: slotEnd,
              capacity: 12,
              spotsBooked: 1,
              rate: 25000,
              currency: 'NGN',
              status: 'OPEN',
            },
          },
        },
        include: { timeSlots: true },
      });
    }

    const timeSlot = experience.timeSlots[0];

    return NextResponse.json({
      experienceId: experience.id,
      timeSlotId: timeSlot?.id ?? null,
      owambeExperienceId: experience.owambeExperienceId,
      owambeTimeSlotId: timeSlot?.owambeTimeSlotId ?? null,
      created,
    });
  } catch (err: any) {
    console.error('[seed-experience] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

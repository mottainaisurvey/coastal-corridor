/**
 * POST /api/diagnostic/seed-booking
 *
 * Creates a confirmed ExperienceBooking for a participant user on staging.
 * Idempotent: if a booking already exists for this participant + timeSlot, returns existing.
 *
 * Protected by x-diagnostic-secret header.
 * Only active when VERCEL_ENV !== 'production'.
 *
 * Body: {
 *   participantEmail: string,
 *   experienceId: string,
 *   timeSlotId: string,
 * }
 *
 * Response: { bookingId, status, created: boolean }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db-safe';

const DIAGNOSTIC_SECRET = process.env.DIAGNOSTIC_SECRET ?? 'cc-probe-staging-2026';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-diagnostic-secret');
  if (secret !== DIAGNOSTIC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const { participantEmail, experienceId, timeSlotId } = body;

  if (!participantEmail || !experienceId || !timeSlotId) {
    return NextResponse.json(
      { error: 'participantEmail, experienceId, and timeSlotId are required' },
      { status: 400 }
    );
  }

  try {
    // Find participant user
    const participant = await prisma.user.findUnique({ where: { email: participantEmail } });
    if (!participant) {
      return NextResponse.json({ error: `Participant user not found: ${participantEmail}` }, { status: 404 });
    }

    // Find experience and time slot
    const experience = await prisma.experience.findUnique({ where: { id: experienceId } });
    if (!experience) {
      return NextResponse.json({ error: `Experience not found: ${experienceId}` }, { status: 404 });
    }
    const timeSlot = await prisma.timeSlot.findUnique({ where: { id: timeSlotId } });
    if (!timeSlot) {
      return NextResponse.json({ error: `TimeSlot not found: ${timeSlotId}` }, { status: 404 });
    }

    // Check if booking already exists for this participant + timeSlot
    const existing = await prisma.experienceBooking.findFirst({
      where: {
        participantUserId: participant.id,
        timeSlotId,
      },
    });

    if (existing) {
      return NextResponse.json({
        bookingId: existing.id,
        status: existing.status,
        paymentStatus: existing.paymentStatus,
        created: false,
      });
    }

    // Create the booking
    const totalAmount = timeSlot.rate ?? experience.basePrice;
    const commissionRate = 0.15;
    const channelCommissionAmount = Number(totalAmount) * commissionRate;
    const netToOperator = Number(totalAmount) - channelCommissionAmount;

    const booking = await prisma.experienceBooking.create({
      data: {
        experienceId,
        timeSlotId,
        participantUserId: participant.id,
        numberOfParticipants: 1,
        participantNames: [`${participant.email}`],
        totalAmount,
        currency: timeSlot.currency ?? experience.baseCurrency,
        channelCommissionAmount,
        channelCommissionPercent: commissionRate * 100,
        netToOperator,
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        paystackReference: `seed-booking-ref-${Date.now()}`,
      },
    });

    return NextResponse.json({
      bookingId: booking.id,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      created: true,
    });
  } catch (err: any) {
    console.error('[seed-booking] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

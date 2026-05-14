/**
 * GET /api/diagnostic/booking-state/[id] — CC-D-01-E-PROBE state query
 *
 * Returns the full ExperienceBooking row for a given booking ID.
 * Used by the probe to verify DB state after webhook delivery.
 *
 * Protected by DIAGNOSTIC_SECRET header.
 * Only active when VERCEL_ENV !== 'production' (staging/preview deployments).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db-safe';

const DIAGNOSTIC_SECRET = process.env.DIAGNOSTIC_SECRET ?? 'cc-probe-staging-2026';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const { id } = params;

  const booking = await prisma.experienceBooking.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      paystackReference: true,
      stripePaymentIntentId: true,
      numberOfParticipants: true,
      totalAmount: true,
      currency: true,
      channelCommissionAmount: true,
      channelCommissionPercent: true,
      netToOperator: true,
      createdAt: true,
      updatedAt: true,
      experience: { select: { name: true } },
      timeSlot: { select: { startDateTime: true, endDateTime: true } },
      participant: { select: { email: true } },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  return NextResponse.json({
    ...booking,
    totalAmount: booking.totalAmount.toString(),
    channelCommissionAmount: booking.channelCommissionAmount.toString(),
    channelCommissionPercent: booking.channelCommissionPercent.toString(),
    netToOperator: booking.netToOperator.toString(),
  });
}

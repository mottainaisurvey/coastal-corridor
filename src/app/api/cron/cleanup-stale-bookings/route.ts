/**
 * Cron: Stale ExperienceBooking Cleanup — Phase E #37
 *
 * Transitions ExperienceBooking records that are stuck in PENDING status
 * (payment URL generated but webhook never fired) to ABANDONED after a
 * configurable threshold (default: 7 days).
 *
 * Background: when a guest proceeds to payment, an ExperienceBooking is
 * created with status=PENDING and a payment URL is returned. If the guest
 * abandons the payment flow, the webhook never fires and the booking stays
 * in PENDING indefinitely. This cron cleans those up.
 *
 * Design decisions:
 *   - Rows are NOT deleted. Transition to ABANDONED preserves audit trail.
 *   - spotsBooked is NOT decremented. The CC-D-01-C pattern only increments
 *     spotsBooked at webhook success; PENDING bookings have never reached
 *     webhook success, so capacity was never consumed.
 *   - Threshold: 7 days (matches BookingDraft.expiresAt pattern).
 *   - BookingDraft cleanup is explicitly out of scope — BookingDraft has its
 *     own TTL via expiresAt; this cron targets ExperienceBooking only.
 *
 * Schedule: daily at 03:30 UTC (staggered 30 min from cleanup-idempotency-cache).
 * Security: protected by CRON_SECRET header (Bearer token).
 *
 * Spec reference: Implementation Brief Phase E #37
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const STALE_THRESHOLD_DAYS = 7;

export async function GET(req: NextRequest): Promise<NextResponse> {
  // ── Auth: CRON_SECRET header guard ──────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  const cutoff = new Date(Date.now() - STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

  try {
    // ── Find stale PENDING bookings ────────────────────────────────────────
    // These are bookings where the payment URL was generated but the Paystack
    // or Stripe webhook never fired to confirm payment.
    const staleBookings = await prisma.experienceBooking.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: cutoff },
      },
      select: {
        id: true,
        createdAt: true,
        timeSlotId: true,
        numberOfParticipants: true,
      },
    });

    if (staleBookings.length === 0) {
      console.info(`[cron/cleanup-stale-bookings] No stale bookings found (cutoff: ${cutoff.toISOString()})`);
      return NextResponse.json({
        success: true,
        transitioned: 0,
        cutoff: cutoff.toISOString(),
        timestamp: startedAt,
      });
    }

    // ── Transition to ABANDONED ────────────────────────────────────────────
    // Bulk update — no spotsBooked decrement needed (see design decisions above).
    const result = await prisma.experienceBooking.updateMany({
      where: {
        id: { in: staleBookings.map((b) => b.id) },
        // Re-check status in the update to guard against concurrent webhook arrival
        status: 'PENDING',
      },
      data: {
        status: 'ABANDONED',
      },
    });

    console.info(
      `[cron/cleanup-stale-bookings] Transitioned ${result.count} stale PENDING → ABANDONED ` +
      `(cutoff: ${cutoff.toISOString()}, ids: [${staleBookings.map((b) => b.id).join(', ')}])`
    );

    return NextResponse.json({
      success: true,
      transitioned: result.count,
      cutoff: cutoff.toISOString(),
      timestamp: startedAt,
      ids: staleBookings.map((b) => b.id),
    });
  } catch (err) {
    console.error('[cron/cleanup-stale-bookings] Error:', err);
    return NextResponse.json(
      {
        error: 'Cleanup failed',
        message: err instanceof Error ? err.message : String(err),
        timestamp: startedAt,
      },
      { status: 500 }
    );
  }
}

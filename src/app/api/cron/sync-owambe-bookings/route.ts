/**
 * Cron: Owambe Experience Booking Sync — CC-D-01-D
 *
 * Implements the outbox pattern for syncing confirmed ExperienceBookings
 * to the Owambe platform via callOwambe.
 *
 * Outbox predicate:
 *   status=CONFIRMED AND paymentStatus=PAID AND owambeBookingId IS NULL
 *   AND owambeSyncAttempts < 3
 *
 * Runs every 5 minutes (configured in vercel.json).
 * Security: Protected by CRON_SECRET Bearer header.
 *
 * On success: sets owambeBookingId from Owambe response.
 * On failure: increments owambeSyncAttempts, stores owambeSyncError.
 * After 3 failures: booking is excluded (dead-letter); Phase E #38 tracks
 *   the refund-on-race-loss flow for future implementation.
 *
 * Idempotency: outboundIdempotencyKey (UUID v4) is set once at booking
 *   creation and used as the callOwambe idempotency key. Re-running the
 *   cron for the same booking is safe.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { runOwambeSyncPass } from '@/lib/sync-experience-booking';

export async function GET(req: NextRequest): Promise<NextResponse> {
  // ── CRON_SECRET guard ─────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.info('[cron/sync-owambe-bookings] Starting sync pass');

  try {
    const summary = await runOwambeSyncPass();

    const durationMs = Date.now() - startTime;

    // Log per-booking results for observability
    for (const result of summary.results) {
      if (result.success) {
        console.info(
          `[cron/sync-owambe-bookings] ✓ booking=${result.bookingId} ` +
          `owambeBookingId=${result.owambeBookingId} fromCache=${result.fromCache}`
        );
      } else {
        console.warn(
          `[cron/sync-owambe-bookings] ✗ booking=${result.bookingId} ` +
          `error=${result.error}`
        );
      }
    }

    if (summary.deadLettered > 0) {
      console.warn(
        `[cron/sync-owambe-bookings] ${summary.deadLettered} dead-lettered booking(s) ` +
        `(owambeSyncAttempts >= 3, unsynced)`
      );
    }

    console.info(
      `[cron/sync-owambe-bookings] Completed in ${durationMs}ms: ` +
      `attempted=${summary.attempted} succeeded=${summary.succeeded} ` +
      `failed=${summary.failed} deadLettered=${summary.deadLettered}`
    );

    return NextResponse.json({
      success: true,
      summary: {
        attempted: summary.attempted,
        succeeded: summary.succeeded,
        failed: summary.failed,
        deadLettered: summary.deadLettered,
        durationMs,
      },
      // Include per-booking results only in non-production for debugging
      ...(process.env.NODE_ENV !== 'production' && {
        results: summary.results,
      }),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[cron/sync-owambe-bookings] Unhandled error:', err);
    return NextResponse.json(
      {
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

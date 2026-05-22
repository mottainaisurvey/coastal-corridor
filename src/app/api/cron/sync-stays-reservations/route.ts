/**
 * Cron: Owambe Stays Reservation Sync — CC-STAYS-RESERVATION-SENDER-01
 *
 * Implements the outbox pattern for pushing confirmed, paid Reservations
 * to the Owambe platform via callOwambe.
 *
 * Outbox predicate:
 *   status=CONFIRMED AND paymentStatus=PAID AND owambeReservationId IS NULL
 *   AND owambeSyncAttempts < 3
 *
 * Runs every 5 minutes (configured in vercel.json).
 * Security: Protected by CRON_SECRET Bearer header.
 *
 * On 201 Created: stores owambeReservationId from Owambe response.
 * On 409 Conflict: initiates Paystack refund; marks reservation FAILED; logs audit entry.
 * On other 4xx: increments owambeSyncAttempts, stores owambeSyncError (permanent failure).
 * On network/timeout: increments owambeSyncAttempts (transient; retried next run).
 * After 3 failures: reservation is excluded (dead-letter).
 *
 * Idempotency: outboundIdempotencyKey (UUID v4) is set once at first sync attempt
 *   and used as the callOwambe idempotency key. Re-running the cron is safe.
 *
 * Contract reference: § 07 STAYS RESERVATIONS INBOUND + Amendment 008
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { runOwambeStaysSyncPass } from '@/lib/sync-stays-reservation';

export async function GET(req: NextRequest): Promise<NextResponse> {
  // ── CRON_SECRET guard ─────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  console.info('[cron/sync-stays-reservations] Starting sync pass');

  try {
    const summary = await runOwambeStaysSyncPass();

    const durationMs = Date.now() - startTime;

    // Log per-reservation results for observability
    for (const result of summary.results) {
      if (result.success) {
        console.info(
          `[cron/sync-stays-reservations] ✓ reservation=${result.reservationId} ` +
          `owambeReservationId=${result.owambeReservationId} fromCache=${result.fromCache}`
        );
      } else {
        if (result.conflictRefundInitiated) {
          console.warn(
            `[cron/sync-stays-reservations] ✗ 409-CONFLICT reservation=${result.reservationId} ` +
            `refund=initiated error=${result.error}`
          );
        } else {
          console.warn(
            `[cron/sync-stays-reservations] ✗ reservation=${result.reservationId} ` +
            `error=${result.error}`
          );
        }
      }
    }

    if (summary.deadLettered > 0) {
      console.warn(
        `[cron/sync-stays-reservations] ${summary.deadLettered} dead-lettered reservation(s) ` +
        `(owambeSyncAttempts >= 3, unsynced)`
      );
    }

    if (summary.conflictRefunds > 0) {
      console.warn(
        `[cron/sync-stays-reservations] ${summary.conflictRefunds} 409-conflict refund(s) initiated`
      );
    }

    console.info(
      `[cron/sync-stays-reservations] Completed in ${durationMs}ms: ` +
      `attempted=${summary.attempted} succeeded=${summary.succeeded} ` +
      `failed=${summary.failed} deadLettered=${summary.deadLettered} ` +
      `conflictRefunds=${summary.conflictRefunds}`
    );

    return NextResponse.json({
      success: true,
      summary: {
        attempted: summary.attempted,
        succeeded: summary.succeeded,
        failed: summary.failed,
        deadLettered: summary.deadLettered,
        conflictRefunds: summary.conflictRefunds,
        durationMs,
      },
      // Include per-reservation results only in non-production for debugging
      ...(process.env.NODE_ENV !== 'production' && {
        results: summary.results,
      }),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[cron/sync-stays-reservations] Unhandled error:', err);
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

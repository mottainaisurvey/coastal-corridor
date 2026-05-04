/**
 * Cron: Owambe Reconciliation — Phase A (Infrastructure)
 *
 * Periodically reconciles Coastal Corridor's local state with Owambe's
 * source of truth for reservations, bookings, and availability.
 *
 * Phase A: Infrastructure only — logs what would be reconciled.
 * Phase B: Implements full property/availability sync.
 * Phase C: Implements full reservation/booking reconciliation.
 *
 * Runs every 6 hours (configured in vercel.json).
 * Security: Protected by CRON_SECRET header.
 *
 * Spec reference: Implementation Brief §10 (Conflict Resolution & Reconciliation),
 *                 API Narrative §9
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db-safe';
import { captureServerEvent } from '@/lib/analytics';

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results = {
    stayPropertiesChecked: 0,
    experiencesChecked: 0,
    reservationsChecked: 0,
    bookingsChecked: 0,
    discrepanciesFound: 0,
    discrepanciesResolved: 0,
    errors: [] as string[],
  };

  try {
    const prisma = getPrisma();

    if (!prisma) {
      return NextResponse.json({
        success: false,
        message: 'Database not connected — reconciliation skipped',
        timestamp: new Date().toISOString(),
      });
    }

    // Phase A: Count what exists locally (full sync implemented in Phase B/C)
    const [stayCount, expCount, resCount, bookCount] = await Promise.all([
      prisma.stayProperty.count({ where: { status: 'ACTIVE' } }),
      prisma.experience.count({ where: { status: 'ACTIVE' } }),
      prisma.reservation.count({
        where: {
          status: { in: ['PENDING', 'CONFIRMED'] },
          checkOut: { gte: new Date() },
        },
      }),
      prisma.experienceBooking.count({
        where: {
          status: { in: ['PENDING', 'CONFIRMED'] },
          eventDate: { gte: new Date() },
        },
      }),
    ]);

    results.stayPropertiesChecked = stayCount;
    results.experiencesChecked = expCount;
    results.reservationsChecked = resCount;
    results.bookingsChecked = bookCount;

    // Phase B will add: fetch Owambe inventory and diff against local
    // Phase C will add: fetch Owambe reservations and reconcile status

    const durationMs = Date.now() - startTime;

    // Track reconciliation run in analytics
    await captureServerEvent('system', 'reconciliation_run_completed', {
      duration_ms: durationMs,
      stay_properties: stayCount,
      experiences: expCount,
      reservations: resCount,
      bookings: bookCount,
      discrepancies: results.discrepanciesFound,
    });

    console.info(`[cron/reconcile-owambe] Completed in ${durationMs}ms`, results);

    return NextResponse.json({
      success: true,
      results,
      durationMs,
      timestamp: new Date().toISOString(),
      note: 'Phase A: Infrastructure only. Full sync implemented in Phase B/C.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[cron/reconcile-owambe] Error:', err);

    return NextResponse.json(
      {
        success: false,
        error: message,
        results,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

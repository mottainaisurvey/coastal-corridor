/**
 * Cron: Idempotency Cache Cleanup — Phase A
 *
 * Deletes expired idempotency cache entries from the database.
 * Runs daily at 03:00 UTC (configured in vercel.json).
 *
 * Security: Protected by CRON_SECRET header (set in Vercel environment variables).
 *
 * Spec reference: Implementation Brief §12
 */

import { NextRequest, NextResponse } from 'next/server';
import { pruneExpiredIdempotencyCache } from '@/lib/idempotency';

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Verify cron secret to prevent unauthorized invocation
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const deleted = await pruneExpiredIdempotencyCache();
    console.info(`[cron/cleanup-idempotency-cache] Deleted ${deleted} expired entries`);

    return NextResponse.json({
      success: true,
      deleted,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[cron/cleanup-idempotency-cache] Error:', err);
    return NextResponse.json(
      { error: 'Cleanup failed', message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

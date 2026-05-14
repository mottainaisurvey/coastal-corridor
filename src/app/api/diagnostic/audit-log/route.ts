/**
 * GET /api/diagnostic/audit-log?entityId=[id]&entityType=[type] — CC-D-01-E-PROBE
 *
 * Returns the most recent AuditEntry records for a given entity.
 * Used by the probe to verify that payment_captured was written after webhook delivery,
 * and to observe email dispatch attempts (logged to console and captured in audit).
 *
 * Protected by DIAGNOSTIC_SECRET header.
 * Only active when VERCEL_ENV !== 'production' (staging/preview deployments).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db-safe';

const DIAGNOSTIC_SECRET = process.env.DIAGNOSTIC_SECRET ?? 'cc-probe-staging-2026';

export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const entityId = searchParams.get('entityId');
  const entityType = searchParams.get('entityType') ?? 'ExperienceBooking';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);

  const where = entityId ? { entityType, entityId } : { entityType };

  const entries = await prisma.auditEntry.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      entityType: true,
      entityId: true,
      action: true,
      metadata: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ entries, count: entries.length });
}

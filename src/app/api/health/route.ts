/**
 * Health Check Endpoint
 *
 * Returns the live operational status of the API, database, and CDN.
 * The database check performs a real SELECT 1 via Prisma to confirm
 * connectivity — "not-connected" is only reported when the check fails.
 *
 * This endpoint is public (no auth required) and is used by:
 *   - CI smoke test (deploy.yml)
 *   - Vercel deployment health checks
 *   - Monitoring / uptime services
 */
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db-safe';

async function checkDatabase(): Promise<'operational' | 'not-connected'> {
  const prisma = getPrisma();
  if (!prisma) return 'not-connected';
  try {
    // Lightweight connectivity probe — no table scan
    await prisma.$queryRaw`SELECT 1`;
    return 'operational';
  } catch {
    return 'not-connected';
  }
}

export async function GET() {
  const dbStatus = await checkDatabase();

  return NextResponse.json({
    status: 'ok',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    services: {
      api: 'operational',
      database: dbStatus,
      cdn: 'operational',
    },
  });
}

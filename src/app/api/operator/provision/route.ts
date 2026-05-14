/**
 * POST /api/operator/provision
 *
 * CC-C-09-A — AC-6: Operator dashboard-load provisioning fallback.
 *
 * Parallel to /api/host/provision (CC-C-08-A). Called by the operator dashboard
 * page on first load (via useEffect) after Clerk redirects the user to
 * /operator/dashboard following a successful sign-up.
 *
 * Flow:
 *   1. Verify the caller is authenticated via Clerk (auth())
 *   2. Look up the CC User record by clerkId
 *   3. Confirm the user has role OPERATOR (guard against non-operator callers)
 *   4. Call ensureOperatorProfile(userId, db) — idempotent, safe to call on
 *      every dashboard load
 *   5. Return { provisioned: boolean, profileId: string, userId: string, wasNew: boolean }
 *
 * Authentication: Clerk session (standard Next.js auth middleware applies)
 * Idempotency: ensureOperatorProfile returns the existing profile if already present
 *
 * Note: The dashboard-page-load wiring (useEffect call to this route) will be
 * added in CC-C-09-B when the operator dashboard is rebuilt. For now, the API
 * route is sufficient to satisfy AC-6.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPrismaClient } from '@/lib/db-safe';
import { ensureOperatorProfile } from '@/lib/operator-profile';

export async function POST(_req: NextRequest): Promise<NextResponse> {
  // 1. Authenticate
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  // 2. DB availability
  const db = getPrismaClient();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  // 3. Look up CC User by clerkId
  const user = await db.user.findUnique({
    where: { clerkId: clerkUserId },
  });

  if (!user) {
    // User record not yet synced from Clerk — return 404 so the dashboard
    // can retry on the next load
    return NextResponse.json(
      { error: 'User record not found. Retry after a moment.' },
      { status: 404 }
    );
  }

  // 4. Guard: only OPERATOR users should provision an OperatorProfile
  if (user.role !== 'OPERATOR') {
    return NextResponse.json(
      { error: 'User is not an OPERATOR', role: user.role },
      { status: 403 }
    );
  }

  // 5. Idempotent provisioning
  const profile = await ensureOperatorProfile(user.id, db);

  const wasNew = profile.createdAt.getTime() > Date.now() - 5000; // created in the last 5s
  console.log(
    `[operator/provision] clerkUserId=${clerkUserId} userId=${user.id} ` +
    `profileId=${profile.id} wasNew=${wasNew}`
  );

  return NextResponse.json(
    {
      provisioned: true,
      profileId: profile.id,
      userId: user.id,
      wasNew,
    },
    { status: 200 }
  );
}

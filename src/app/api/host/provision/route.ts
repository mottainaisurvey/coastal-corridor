/**
 * POST /api/host/provision
 *
 * CC-C-08-A — AC-2: Host sign-up handler provisioning.
 *
 * Called by the host dashboard page on first load (via useEffect) after Clerk
 * redirects the user to /host/dashboard following a successful sign-up.
 *
 * Flow:
 *   1. Verify the caller is authenticated via Clerk (auth())
 *   2. Look up the CC User record by clerkId
 *   3. Confirm the user has role HOST (guard against non-host callers)
 *   4. Call ensureHostProfile(userId, db) — idempotent, safe to call on every
 *      dashboard load
 *   5. Return { provisioned: boolean, profileId: string }
 *
 * Authentication: Clerk session (standard Next.js auth middleware applies)
 * Idempotency: ensureHostProfile returns the existing profile if already present
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPrismaClient } from '@/lib/db-safe';
import { ensureHostProfile } from '@/lib/host-profile';

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

  // 4. Guard: only HOST users should provision a HostProfile
  if (user.role !== 'HOST') {
    return NextResponse.json(
      { error: 'User is not a HOST', role: user.role },
      { status: 403 }
    );
  }

  // 5. Idempotent provisioning
  const profile = await ensureHostProfile(user.id, db);

  const wasNew = profile.createdAt.getTime() > Date.now() - 5000; // created in the last 5s
  console.log(
    `[host/provision] clerkUserId=${clerkUserId} userId=${user.id} ` +
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

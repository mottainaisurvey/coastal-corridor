/**
 * GET /api/operator/stats
 *
 * CC-C-09-B — Operator dashboard real-data fetching.
 *
 * Returns three dashboard stats for the authenticated operator:
 *   - experiencesCount:    count of Experience records where operatorUserId =
 *                          authenticated user's User.id (all statuses included)
 *   - bookingsCount:       count of CC-channel ExperienceBooking records where:
 *                            - experience.operatorUserId = authenticated user
 *                            - owambeBookingId IS NOT NULL (CC-channel origin)
 *                            - status NOT IN ('CANCELLED', 'REFUNDED')
 *   - revenue:             sum of netToOperator for paid CC-channel bookings in
 *                          the current calendar month:
 *                            - paymentStatus IN ('DEPOSIT_PAID', 'PAID', 'PARTIALLY_PAID')
 *                            - same CC-channel filter
 *                            - currency handling: single currency if uniform;
 *                              NGN-only sum with isMixed=true if multiple currencies
 *
 * Channel-origin discriminator: owambeBookingId IS NOT NULL (per AC-0 pre-verification).
 *
 * Authentication: Clerk session (standard Next.js auth middleware applies).
 * Per-operator isolation: all queries filter to the authenticated operator's User.id.
 *
 * AC-2 (CC-C-09-B): stats endpoint
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPrismaClient } from '@/lib/db-safe';
import { getUserRoles } from '@/lib/user-roles';

export async function GET(_req: NextRequest): Promise<NextResponse> {
  // 1. Authenticate
  const { userId: clerkUserId, sessionClaims } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  // 2. Role guard: OPERATOR (array-aware, per CC-C-09-A-0)
  const roles = getUserRoles(sessionClaims?.publicMetadata as Record<string, unknown>);
  const isOperator = roles.some(r => r.toUpperCase() === 'OPERATOR');
  const isAdmin    = roles.some(r => ['ADMIN', 'SUPERADMIN'].includes(r.toUpperCase()));
  if (!isOperator && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden — OPERATOR role required' }, { status: 403 });
  }

  // 3. DB availability
  const db = getPrismaClient();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  // 4. Look up CC User by clerkId
  const user = await db.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true, role: true },
  });
  if (!user) {
    return NextResponse.json(
      { error: 'User record not found. Retry after a moment.' },
      { status: 404 }
    );
  }

  const operatorUserId = user.id;

  // 5. AC-2c: Experiences count — all statuses, this operator's records
  const experiencesCount = await db.experience.count({
    where: { operatorUserId },
  });

  // 6. AC-2c: Bookings count
  //    CC-channel origin: owambeBookingId IS NOT NULL
  //    Excluded statuses: CANCELLED, REFUNDED
  const bookingsCount = await db.experienceBooking.count({
    where: {
      experience: { operatorUserId },
      owambeBookingId: { not: null },
      status: { notIn: ['CANCELLED', 'REFUNDED'] },
    },
  });

  // 7. AC-2c: Revenue this calendar month
  //    Current month: first day of this month (UTC) to first day of next month
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const revenueRows = await db.experienceBooking.findMany({
    where: {
      experience: { operatorUserId },
      owambeBookingId: { not: null },
      paymentStatus: { in: ['DEPOSIT_PAID', 'PAID', 'PARTIALLY_PAID'] },
      createdAt: { gte: monthStart, lt: monthEnd },
    },
    select: { netToOperator: true, currency: true },
  });

  // Sum netToOperator per currency
  const currencyTotals: Record<string, number> = {};
  for (const row of revenueRows) {
    const c = row.currency as string;
    currencyTotals[c] = (currencyTotals[c] ?? 0) + Number(row.netToOperator);
  }
  const currencies = Object.keys(currencyTotals);
  let revenueAmount   = 0;
  let revenueCurrency = 'NGN';
  let revenueMixed    = false;

  if (currencies.length === 0) {
    // No paid bookings this month — return 0 in NGN
    revenueAmount   = 0;
    revenueCurrency = 'NGN';
  } else if (currencies.length === 1) {
    revenueCurrency = currencies[0];
    revenueAmount   = currencyTotals[currencies[0]];
  } else {
    // Multiple currencies: sum NGN portion, flag as mixed
    revenueAmount   = currencyTotals['NGN'] ?? 0;
    revenueCurrency = 'NGN';
    revenueMixed    = true;
  }

  console.log(
    `[operator/stats] clerkUserId=${clerkUserId} operatorUserId=${operatorUserId} ` +
    `experiencesCount=${experiencesCount} bookingsCount=${bookingsCount} ` +
    `revenue=${revenueAmount}${revenueCurrency} revenueMixed=${revenueMixed}`
  );

  return NextResponse.json({
    experiencesCount,
    bookingsCount,
    revenue: {
      amount:   revenueAmount,
      currency: revenueCurrency,
      isMixed:  revenueMixed,
    },
    meta: {
      operatorUserId,
      monthStart: monthStart.toISOString(),
      monthEnd:   monthEnd.toISOString(),
    },
  });
}

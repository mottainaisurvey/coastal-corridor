/**
 * GET /api/host/stats
 *
 * CC-C-08-B — Host dashboard real-data fetching.
 *
 * Returns the four dashboard stats for the authenticated host:
 *   - propertiesActive:  count of ACTIVE StayProperty records for this host
 *   - propertiesReview:  count of UNDER_REVIEW StayProperty records (secondary)
 *   - bookings:          count of CC-channel Reservation records (non-CANCELLED/REFUNDED)
 *   - revenueThisMonth:  sum of netToHost for paid CC-channel reservations in the
 *                        current calendar month (paymentStatus IN DEPOSIT_PAID, PAID,
 *                        PARTIALLY_PAID). Returns 0 if no paid reservations exist.
 *   - revenueCurrency:   the currency of the revenue sum ('NGN' default, or the
 *                        single currency if all reservations share one). If multiple
 *                        currencies are present, returns 'MIXED' and a footnote.
 *
 * Channel-origin discriminator: owambeReservationId IS NOT NULL (per AC-0 pre-verification).
 * Occupancy: deferred to v2 (requires calendar data from Owambe Stays via callOwambe).
 *
 * Authentication: Clerk session (standard Next.js auth middleware applies).
 * Per-host isolation: all queries filter to the authenticated host's User.id.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPrismaClient } from '@/lib/db-safe';

export async function GET(_req: NextRequest): Promise<NextResponse> {
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
    select: { id: true, role: true },
  });
  if (!user) {
    return NextResponse.json(
      { error: 'User record not found. Retry after a moment.' },
      { status: 404 }
    );
  }

  // 4. Guard: only HOST users
  if (user.role !== 'HOST') {
    return NextResponse.json(
      { error: 'User is not a HOST', role: user.role },
      { status: 403 }
    );
  }

  const hostUserId = user.id;

  // 5. AC-1: Properties count (ACTIVE headline + UNDER_REVIEW secondary)
  //    INACTIVE properties are excluded from the dashboard count entirely.
  const propertyCounts = await db.stayProperty.groupBy({
    by: ['status'],
    where: {
      hostUserId,
      status: { in: ['ACTIVE', 'UNDER_REVIEW'] },
    },
    _count: { id: true },
  });
  const propertiesActive =
    propertyCounts.find((r) => r.status === 'ACTIVE')?._count.id ?? 0;
  const propertiesReview =
    propertyCounts.find((r) => r.status === 'UNDER_REVIEW')?._count.id ?? 0;

  // 6. AC-2: Bookings count
  //    CC-channel origin: owambeReservationId IS NOT NULL
  //    Excluded statuses: CANCELLED, REFUNDED
  const bookings = await db.reservation.count({
    where: {
      property: { hostUserId },
      owambeReservationId: { not: null },
      status: { notIn: ['CANCELLED', 'REFUNDED'] },
    },
  });

  // 7. AC-3: Revenue this calendar month
  //    Current month: first day of this month (UTC) to first day of next month
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const revenueRows = await db.reservation.findMany({
    where: {
      property: { hostUserId },
      owambeReservationId: { not: null },
      paymentStatus: { in: ['DEPOSIT_PAID', 'PAID', 'PARTIALLY_PAID'] },
      createdAt: { gte: monthStart, lt: monthEnd },
    },
    select: { netToHost: true, currency: true },
  });

  // Sum netToHost per currency
  const currencyTotals: Record<string, number> = {};
  for (const row of revenueRows) {
    const c = row.currency as string;
    currencyTotals[c] = (currencyTotals[c] ?? 0) + Number(row.netToHost);
  }
  const currencies = Object.keys(currencyTotals);
  let revenueThisMonth = 0;
  let revenueCurrency = 'NGN';
  let revenueMixed = false;

  if (currencies.length === 0) {
    // No paid reservations this month — return 0 in NGN
    revenueThisMonth = 0;
    revenueCurrency = 'NGN';
  } else if (currencies.length === 1) {
    revenueCurrency = currencies[0];
    revenueThisMonth = currencyTotals[currencies[0]];
  } else {
    // Multiple currencies: sum NGN portion, flag as mixed
    revenueThisMonth = currencyTotals['NGN'] ?? 0;
    revenueCurrency = 'NGN';
    revenueMixed = true;
  }

  // 8. AC-4: Occupancy — deferred to v2
  //    Requires calendar data from Owambe Stays via callOwambe wiring.
  //    Returned as null so the UI can render "—" or "Coming soon".
  const occupancy = null;

  console.log(
    `[host/stats] clerkUserId=${clerkUserId} hostUserId=${hostUserId} ` +
    `propertiesActive=${propertiesActive} propertiesReview=${propertiesReview} ` +
    `bookings=${bookings} revenue=${revenueThisMonth}${revenueCurrency} ` +
    `revenueMixed=${revenueMixed}`
  );

  return NextResponse.json({
    propertiesActive,
    propertiesReview,
    bookings,
    revenueThisMonth,
    revenueCurrency,
    revenueMixed,
    occupancy,
    meta: {
      hostUserId,
      monthStart: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString(),
    },
  });
}

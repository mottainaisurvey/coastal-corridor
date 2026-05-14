/**
 * GET /api/operator/revenue
 *
 * CC-C-09-C-1 — AC-3a: Operator revenue breakdown endpoint.
 *
 * Returns the authenticated operator's CC-channel revenue data:
 *   - per-booking line items with experience name, dates, amounts
 *   - grouped by month for the last 12 months
 *   - lifetime sum and current-month sum
 *
 * Filters:
 *   - experience.operatorUserId = authenticated operator's User.id
 *   - owambeBookingId IS NOT NULL (CC-channel origin)
 *
 * Revenue sums include: DEPOSIT_PAID, PAID, PARTIALLY_PAID
 * Line items include all payment statuses (REFUNDED, PENDING shown but excluded from sums).
 *
 * Currency handling: single-currency display if uniform; NGN-only sum with isMixed=true
 * if multiple currencies. No conversion.
 *
 * Authentication: Clerk session. OPERATOR role required.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPrismaClient } from '@/lib/db-safe';
import { getUserRoles } from '@/lib/user-roles';

const PAID_STATUSES = ['DEPOSIT_PAID', 'PAID', 'PARTIALLY_PAID'];

export async function GET(_req: NextRequest): Promise<NextResponse> {
  // 1. Authenticate
  const { userId: clerkUserId, sessionClaims } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  // 2. Role guard
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

  // 4. Look up CC User
  const user = await db.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User record not found. Retry after a moment.' }, { status: 404 });
  }

  const operatorUserId = user.id;

  // 5. Date range: last 12 calendar months (inclusive of current month)
  const now = new Date();
  const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
  const windowEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  // 6. Fetch all CC-channel bookings in the window
  const bookings = await db.experienceBooking.findMany({
    where: {
      experience:     { operatorUserId },
      owambeBookingId: { not: null },
      createdAt:      { gte: windowStart, lt: windowEnd },
    },
    select: {
      id:                      true,
      owambeBookingId:         true,
      paymentStatus:           true,
      totalAmount:             true,
      currency:                true,
      netToOperator:           true,
      channelCommissionAmount: true,
      channelCommissionPercent: true,
      numberOfParticipants:    true,
      participantNames:        true,
      createdAt:               true,
      experience: {
        select: { id: true, name: true },
      },
      timeSlot: {
        select: { startDateTime: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 7. Build monthly buckets
  type LineItem = {
    bookingId:               string;
    owambeBookingId:         string;
    experienceId:            string;
    experienceName:          string;
    experienceDate:          string;
    guestName:               string;
    numberOfParticipants:    number;
    paymentStatus:           string;
    totalAmount:             number;
    currency:                string;
    netToOperator:           number;
    channelCommissionAmount: number;
    channelCommissionPercent: number;
    createdAt:               string;
    includedInSum:           boolean;
  };

  type MonthBucket = {
    monthKey:    string; // e.g. "2026-05"
    monthLabel:  string; // e.g. "May 2026"
    totalNet:    number;
    currency:    string;
    isMixed:     boolean;
    lineItems:   LineItem[];
  };

  const buckets: Record<string, MonthBucket> = {};

  for (const b of bookings) {
    const d = new Date(b.createdAt);
    const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const monthLabel = d.toLocaleString('en-NG', { month: 'long', year: 'numeric', timeZone: 'UTC' });

    if (!buckets[monthKey]) {
      buckets[monthKey] = { monthKey, monthLabel, totalNet: 0, currency: 'NGN', isMixed: false, lineItems: [] };
    }

    const net = Number(b.netToOperator);
    const cur = b.currency as string;
    const includedInSum = PAID_STATUSES.includes(b.paymentStatus as string);

    const item: LineItem = {
      bookingId:               b.id,
      owambeBookingId:         b.owambeBookingId!,
      experienceId:            b.experience.id,
      experienceName:          b.experience.name,
      experienceDate:          b.timeSlot.startDateTime.toISOString(),
      guestName:               b.participantNames?.[0] ?? `Guest (${b.numberOfParticipants} pax)`,
      numberOfParticipants:    b.numberOfParticipants,
      paymentStatus:           b.paymentStatus as string,
      totalAmount:             Number(b.totalAmount),
      currency:                cur,
      netToOperator:           net,
      channelCommissionAmount: Number(b.channelCommissionAmount),
      channelCommissionPercent: Number(b.channelCommissionPercent),
      createdAt:               b.createdAt.toISOString(),
      includedInSum,
    };

    buckets[monthKey].lineItems.push(item);

    if (includedInSum) {
      // Currency handling
      if (buckets[monthKey].lineItems.filter(li => li.includedInSum).length === 1) {
        // First paid item in this bucket — set currency
        buckets[monthKey].currency = cur;
        buckets[monthKey].totalNet = net;
      } else if (buckets[monthKey].currency !== cur) {
        // Mixed currency: sum NGN only, flag as mixed
        buckets[monthKey].isMixed = true;
        if (cur === 'NGN') buckets[monthKey].totalNet += net;
        buckets[monthKey].currency = 'NGN';
      } else {
        buckets[monthKey].totalNet += net;
      }
    }
  }

  // 8. Sort buckets newest-first; omit zero-revenue months
  const sortedBuckets = Object.values(buckets)
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  // 9. Lifetime sum
  const allCurrencies = new Set<string>();
  let lifetimeNet = 0;
  for (const bk of sortedBuckets) {
    if (bk.totalNet > 0) {
      allCurrencies.add(bk.currency);
      if (bk.currency === 'NGN') lifetimeNet += bk.totalNet;
      else if (allCurrencies.size === 1) lifetimeNet += bk.totalNet;
    }
  }
  const lifetimeMixed = allCurrencies.size > 1;
  const lifetimeCurrency = lifetimeMixed ? 'NGN' : (allCurrencies.values().next().value ?? 'NGN');
  if (lifetimeMixed) {
    // Recompute: NGN-only sum across all buckets
    lifetimeNet = sortedBuckets.reduce((sum, bk) => {
      if (bk.currency === 'NGN') return sum + bk.totalNet;
      return sum;
    }, 0);
  }

  // 10. Current-month sum
  const currentMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const currentBucket = buckets[currentMonthKey];
  const currentMonthNet      = currentBucket?.totalNet ?? 0;
  const currentMonthCurrency = currentBucket?.currency ?? 'NGN';
  const currentMonthMixed    = currentBucket?.isMixed ?? false;

  console.log(
    `[operator/revenue] operatorUserId=${operatorUserId} ` +
    `buckets=${sortedBuckets.length} lifetimeNet=${lifetimeNet}${lifetimeCurrency}`
  );

  return NextResponse.json({
    months: sortedBuckets,
    summary: {
      lifetimeNet,
      lifetimeCurrency,
      lifetimeMixed,
      currentMonthNet,
      currentMonthCurrency,
      currentMonthMixed,
      currentMonthKey,
    },
    meta: { operatorUserId, windowStart: windowStart.toISOString(), windowEnd: windowEnd.toISOString() },
  });
}

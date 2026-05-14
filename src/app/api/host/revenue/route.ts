/**
 * GET /api/host/revenue
 *
 * CC-C-08-C-1 AC-3a — Host revenue breakdown endpoint.
 *
 * Returns the authenticated host's CC-channel revenue data:
 *   - lineItems: per-booking line items (all statuses, last 12 months)
 *   - monthlyBuckets: grouped by month, revenue-included statuses only
 *     (DEPOSIT_PAID, PAID, PARTIALLY_PAID)
 *   - lifetimeTotal: sum of netToHost for all revenue-included reservations
 *   - currentMonthTotal: sum of netToHost for revenue-included reservations
 *     in the current calendar month
 *   - currency: primary currency (or 'NGN' with revenueMixed=true if multiple)
 *
 * Revenue-included statuses: DEPOSIT_PAID, PAID, PARTIALLY_PAID.
 * REFUNDED and PENDING are returned as line items but excluded from sums.
 *
 * Monthly bucketing: last 12 calendar months (current month + 11 prior).
 * Months with zero revenue are omitted from monthlyBuckets (AC-3b).
 *
 * Authentication: Clerk session. HOST role required (AC-4a).
 * Per-host isolation: filtered to authenticated host's User.id (AC-4b).
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPrismaClient } from '@/lib/db-safe';

const REVENUE_STATUSES = ['DEPOSIT_PAID', 'PAID', 'PARTIALLY_PAID'] as const;

function monthKey(date: Date): string {
  // e.g. "2026-05"
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-NG', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const db = getPrismaClient();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const user = await db.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true, role: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User record not found' }, { status: 404 });
  }
  if (user.role !== 'HOST') {
    return NextResponse.json({ error: 'Forbidden — HOST role required', role: user.role }, { status: 403 });
  }

  // Date range: last 12 calendar months (start of 12 months ago to end of current month)
  const now = new Date();
  const rangeStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));

  const reservations = await db.reservation.findMany({
    where: {
      property: { hostUserId: user.id },
      owambeReservationId: { not: null },
      createdAt: { gte: rangeStart },
    },
    select: {
      id: true,
      owambeReservationId: true,
      checkInDate: true,
      paymentStatus: true,
      totalAmount: true,
      currency: true,
      netToHost: true,
      channelCommissionAmount: true,
      channelCommissionPercent: true,
      createdAt: true,
      property: { select: { name: true } },
      guest: {
        select: {
          email: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Build line items
  const lineItems = reservations.map((r) => ({
    id: r.id,
    owambeReservationId: r.owambeReservationId,
    guestName: r.guest.profile
      ? `${r.guest.profile.firstName} ${r.guest.profile.lastName}`.trim()
      : r.guest.email,
    propertyName: r.property.name,
    checkInDate: r.checkInDate instanceof Date ? r.checkInDate.toISOString().split('T')[0] : String(r.checkInDate),
    paymentStatus: r.paymentStatus,
    totalAmount: Number(r.totalAmount),
    currency: r.currency,
    netToHost: Number(r.netToHost),
    channelCommissionAmount: Number(r.channelCommissionAmount),
    channelCommissionPercent: Number(r.channelCommissionPercent),
    createdAt: r.createdAt.toISOString(),
    isRevenue: (REVENUE_STATUSES as readonly string[]).includes(r.paymentStatus),
  }));

  // Revenue-included items only
  const revenueItems = lineItems.filter((li) => li.isRevenue);

  // Currency handling (same pattern as CC-C-08-B AC-3c)
  const currencyTotals: Record<string, number> = {};
  for (const item of revenueItems) {
    currencyTotals[item.currency] = (currencyTotals[item.currency] ?? 0) + item.netToHost;
  }
  const currencies = Object.keys(currencyTotals);
  const revenueMixed = currencies.length > 1;
  const primaryCurrency = currencies.length === 1 ? currencies[0] : 'NGN';

  // Lifetime total
  const lifetimeTotal = currencies.length === 1
    ? Object.values(currencyTotals)[0] ?? 0
    : currencyTotals['NGN'] ?? 0;

  // Current month total
  const currentMonthKey = monthKey(now);
  const currentMonthTotal = revenueItems
    .filter((li) => monthKey(new Date(li.createdAt)) === currentMonthKey)
    .filter((li) => li.currency === primaryCurrency || !revenueMixed)
    .reduce((sum, li) => sum + li.netToHost, 0);

  // Monthly buckets (last 12 months, omit zero-revenue months)
  const bucketMap: Record<string, { monthLabel: string; total: number; items: typeof lineItems }> = {};

  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = monthKey(d);
    bucketMap[key] = { monthLabel: monthLabel(key), total: 0, items: [] };
  }

  for (const item of lineItems) {
    const key = monthKey(new Date(item.createdAt));
    if (bucketMap[key]) {
      bucketMap[key].items.push(item);
      if (item.isRevenue && (item.currency === primaryCurrency || !revenueMixed)) {
        bucketMap[key].total += item.netToHost;
      }
    }
  }

  // Only include months that have at least one revenue-included item
  const monthlyBuckets = Object.entries(bucketMap)
    .filter(([, bucket]) => bucket.items.some((i) => i.isRevenue))
    .sort(([a], [b]) => b.localeCompare(a)) // newest first
    .map(([key, bucket]) => ({
      monthKey: key,
      monthLabel: bucket.monthLabel,
      total: bucket.total,
      currency: primaryCurrency,
      items: bucket.items,
    }));

  console.log(
    `[api/host/revenue] clerkUserId=${clerkUserId} hostUserId=${user.id} ` +
    `lineItems=${lineItems.length} revenueItems=${revenueItems.length} ` +
    `lifetimeTotal=${lifetimeTotal}${primaryCurrency} revenueMixed=${revenueMixed}`
  );

  return NextResponse.json({
    lineItems,
    monthlyBuckets,
    lifetimeTotal,
    currentMonthTotal,
    currency: primaryCurrency,
    revenueMixed,
    hasRevenue: revenueItems.length > 0,
  });
}

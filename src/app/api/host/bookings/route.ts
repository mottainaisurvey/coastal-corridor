/**
 * GET /api/host/bookings
 *
 * CC-C-08-C-1 AC-2a — Host bookings list endpoint.
 *
 * Returns the authenticated host's CC-channel Reservation records with:
 *   - id, owambeReservationId
 *   - guestName (Profile.firstName + lastName, fallback to User.email)
 *   - guestEmail (User.email)
 *   - propertyName (StayProperty.name)
 *   - checkInDate, checkOutDate
 *   - status, paymentStatus
 *   - totalAmount, currency
 *   - netToHost
 *   - cancellationReason (if status is CANCELLED)
 *
 * Filters:
 *   - property.hostUserId = authenticated host's User.id
 *   - owambeReservationId IS NOT NULL (CC-channel origin)
 * ALL statuses returned — no status filter at endpoint level (AC-2a).
 *
 * Authentication: Clerk session. HOST role required (AC-4a).
 * Per-host isolation: filtered to authenticated host's User.id (AC-4b).
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPrismaClient } from '@/lib/db-safe';

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

  const reservations = await db.reservation.findMany({
    where: {
      property: { hostUserId: user.id },
      owambeReservationId: { not: null },
    },
    select: {
      id: true,
      owambeReservationId: true,
      checkInDate: true,
      checkOutDate: true,
      status: true,
      paymentStatus: true,
      totalAmount: true,
      currency: true,
      netToHost: true,
      cancellationReason: true,
      property: { select: { name: true } },
      guest: {
        select: {
          email: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  const result = reservations.map((r) => ({
    id: r.id,
    owambeReservationId: r.owambeReservationId,
    guestName: r.guest.profile
      ? `${r.guest.profile.firstName} ${r.guest.profile.lastName}`.trim()
      : r.guest.email,
    guestEmail: r.guest.email,
    propertyName: r.property.name,
    checkInDate: r.checkInDate instanceof Date ? r.checkInDate.toISOString().split('T')[0] : String(r.checkInDate),
    checkOutDate: r.checkOutDate instanceof Date ? r.checkOutDate.toISOString().split('T')[0] : String(r.checkOutDate),
    status: r.status,
    paymentStatus: r.paymentStatus,
    totalAmount: Number(r.totalAmount),
    currency: r.currency,
    netToHost: Number(r.netToHost),
    cancellationReason: r.cancellationReason ?? null,
  }));

  console.log(`[api/host/bookings] clerkUserId=${clerkUserId} hostUserId=${user.id} count=${result.length}`);

  return NextResponse.json({ bookings: result, count: result.length });
}

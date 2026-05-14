/**
 * GET /api/operator/bookings
 *
 * CC-C-09-C-1 — AC-2a: Operator bookings list endpoint.
 *
 * Returns the authenticated operator's CC-channel ExperienceBooking records.
 * Fields returned per booking:
 *   id, owambeBookingId, status, paymentStatus,
 *   totalAmount, currency, netToOperator, channelCommissionAmount,
 *   channelCommissionPercent, numberOfParticipants, participantNames,
 *   specialRequirements, pickupRequested, pickupAddress,
 *   cancellationReason, cancellationInitiatedBy,
 *   createdAt, updatedAt
 *   + experience: { id, name, experienceType, durationMinutes }
 *   + timeSlot:   { startDateTime, endDateTime }
 *   + participant: { id } (no PII beyond what's on the booking)
 *
 * Filters:
 *   - experience.operatorUserId = authenticated operator's User.id
 *   - owambeBookingId IS NOT NULL (CC-channel origin)
 *   ALL statuses returned (UI groups by status).
 *
 * Authentication: Clerk session. OPERATOR role required.
 * Per-operator isolation: filtered via experience.operatorUserId.
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

  // 5. Fetch CC-channel bookings for this operator's experiences
  const bookings = await db.experienceBooking.findMany({
    where: {
      experience: { operatorUserId },
      owambeBookingId: { not: null },
    },
    select: {
      id:                      true,
      owambeBookingId:         true,
      status:                  true,
      paymentStatus:           true,
      totalAmount:             true,
      currency:                true,
      netToOperator:           true,
      channelCommissionAmount: true,
      channelCommissionPercent: true,
      numberOfParticipants:    true,
      participantNames:        true,
      specialRequirements:     true,
      pickupRequested:         true,
      pickupAddress:           true,
      cancellationReason:      true,
      cancellationInitiatedBy: true,
      createdAt:               true,
      updatedAt:               true,
      experience: {
        select: {
          id:             true,
          name:           true,
          experienceType: true,
          durationMinutes: true,
        },
      },
      timeSlot: {
        select: {
          startDateTime: true,
          endDateTime:   true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 6. Serialise Decimal fields
  const result = bookings.map(b => ({
    ...b,
    totalAmount:             Number(b.totalAmount),
    netToOperator:           Number(b.netToOperator),
    channelCommissionAmount: Number(b.channelCommissionAmount),
    channelCommissionPercent: Number(b.channelCommissionPercent),
  }));

  console.log(`[operator/bookings] operatorUserId=${operatorUserId} count=${result.length}`);

  return NextResponse.json({ bookings: result, meta: { operatorUserId } });
}

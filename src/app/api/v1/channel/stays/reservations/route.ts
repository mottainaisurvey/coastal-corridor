/**
 * POST /api/v1/channel/stays/reservations
 *
 * CC-C-07 — Reservation creation with commission persistence.
 *
 * Creates a Reservation record with:
 *   - Commission split calculated via CommissionCalculator
 *   - channelCommissionAmount, channelCommissionPercent, netToHost persisted
 *   - AuditEntry logged with full commission breakdown
 *   - Idempotency guard via x-idempotency-key header
 *
 * Authentication: HMAC-SHA256 via verifyChannelRequest (same as all channel endpoints)
 *
 * AC-1: CommissionCalculator.calculate() called with correct vertical=STAYS
 * AC-2: Commission fields persisted on Reservation row
 * AC-3: Rate resolves from HostProfile.commissionRate if set (negotiated)
 * AC-4: Rate resolves from cohort default (12%) if cohort_member=true and no negotiated rate
 * AC-5: Rate resolves from standard default (15%) if not cohort member and no negotiated rate
 * AC-6: AuditEntry created with commission breakdown in metadata
 * AC-7: Idempotency guard returns cached response on duplicate key
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyChannelRequest } from '@/lib/channel-auth';
import { getCommissionCalculator } from '@/lib/commission';
import { getPrismaClient } from '@/lib/db-safe';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const guard = await verifyChannelRequest(req);
  if (guard.error) return guard.error;

  // ── DB availability ───────────────────────────────────────────────────────
  const db = getPrismaClient();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  // ── Idempotency ───────────────────────────────────────────────────────────
  const idempotencyKey = guard.idempotencyKey || '';
  if (idempotencyKey) {
    const cached = await db.idempotencyCache.findUnique({
      where: { key: idempotencyKey },
    });
    if (cached) {
      return NextResponse.json(
        { ...JSON.parse(cached.responseBody), duplicate: true },
        { status: cached.statusCode }
      );
    }
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(guard.rawBody || '{}');
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    owambe_reservation_id,
    owambe_property_id,
    owambe_room_id,
    guest_owambe_user_id,
    check_in_date,
    check_out_date,
    number_of_guests,
    total_amount,
    currency,
    damage_deposit,
    special_requests,
    paystack_reference,
  } = body as Record<string, string | number | undefined>;

  // Required field validation
  const missing: string[] = [];
  if (!owambe_property_id) missing.push('owambe_property_id');
  if (!owambe_room_id) missing.push('owambe_room_id');
  if (!guest_owambe_user_id) missing.push('guest_owambe_user_id');
  if (!check_in_date) missing.push('check_in_date');
  if (!check_out_date) missing.push('check_out_date');
  if (!number_of_guests) missing.push('number_of_guests');
  if (!total_amount) missing.push('total_amount');
  if (!currency) missing.push('currency');

  if (missing.length > 0) {
    return NextResponse.json(
      { error: 'Missing required fields', missing },
      { status: 422 }
    );
  }

  // Currency validation
  const validCurrencies = ['NGN', 'USD', 'GBP'];
  if (!validCurrencies.includes(currency as string)) {
    return NextResponse.json(
      { error: `Invalid currency. Must be one of: ${validCurrencies.join(', ')}` },
      { status: 422 }
    );
  }

  // ── Resolve property, room, guest ─────────────────────────────────────────
  const property = await db.stayProperty.findUnique({
    where: { owambePropertyId: owambe_property_id as string },
    include: {
      host: {
        include: {
          hostProfile: true,
        },
      },
    },
  });
  if (!property) {
    return NextResponse.json(
      { error: `Property not found: ${owambe_property_id}` },
      { status: 404 }
    );
  }

  const room = await db.room.findUnique({
    where: { owambeRoomId: owambe_room_id as string },
  });
  if (!room) {
    return NextResponse.json(
      { error: `Room not found: ${owambe_room_id}` },
      { status: 404 }
    );
  }
  if (room.propertyId !== property.id) {
    return NextResponse.json(
      { error: 'Room does not belong to the specified property' },
      { status: 422 }
    );
  }

  const guest = await db.user.findUnique({
    where: { owambeUserId: guest_owambe_user_id as string },
  });
  if (!guest) {
    return NextResponse.json(
      { error: `Guest not found: ${guest_owambe_user_id}` },
      { status: 404 }
    );
  }

  // ── Commission calculation (AC-1 through AC-5) ────────────────────────────
  const totalAmountSmallestUnit = Math.round(Number(total_amount) * 100); // convert to kobo/cents
  const hostProfile = property.host?.hostProfile;
  const isCohortMember = property.host?.cohortMember ?? false;

  // Negotiated rate: stored as Decimal(5,4) e.g. 0.1200 = 12%
  const negotiatedRate =
    hostProfile?.commissionRate !== null && hostProfile?.commissionRate !== undefined
      ? Number(hostProfile.commissionRate)
      : undefined;

  const calculator = getCommissionCalculator();
  const commissionResult = calculator.calculate({
    totalAmountSmallestUnit,
    currency: currency as 'NGN' | 'USD' | 'GBP',
    vertical: 'STAYS',
    isCohortMember,
    negotiatedRate,
  });

  // Convert back to decimal for Prisma Decimal fields (2 decimal places)
  const channelCommissionAmount = (commissionResult.channelCommissionSmallestUnit / 100).toFixed(2);
  const netToHost = (commissionResult.netToHostSmallestUnit / 100).toFixed(2);
  const channelCommissionPercent = commissionResult.ratePercent.toFixed(2);

  // ── Create reservation (AC-2) ─────────────────────────────────────────────
  const outboundIdempotencyKey = randomUUID();

  const reservation = await db.reservation.create({
    data: {
      owambeReservationId: owambe_reservation_id as string | undefined,
      propertyId: property.id,
      roomId: room.id,
      guestUserId: guest.id,
      checkInDate: new Date(check_in_date as string),
      checkOutDate: new Date(check_out_date as string),
      numberOfGuests: Number(number_of_guests),
      totalAmount: (Number(total_amount)).toFixed(2),
      currency: currency as 'NGN' | 'USD' | 'GBP',
      channelCommissionAmount,
      channelCommissionPercent,
      netToHost,
      damageDeposit: damage_deposit ? (Number(damage_deposit)).toFixed(2) : null,
      specialRequests: special_requests as string | undefined,
      paystackReference: paystack_reference as string | undefined,
      outboundIdempotencyKey,
      paymentStatus: 'PENDING',
      status: 'PENDING',
    },
  });

  // ── Audit entry (AC-6) ────────────────────────────────────────────────────
  await db.auditEntry.create({
    data: {
      userId: guest.id,
      entityType: 'Reservation',
      entityId: reservation.id,
      action: 'create',
      metadata: JSON.stringify({
        event: 'reservation_created',
        owambeReservationId: owambe_reservation_id,
        owambePropertyId: owambe_property_id,
        owambeRoomId: owambe_room_id,
        commissionBreakdown: commissionResult.breakdown,
        rateApplied: commissionResult.rateApplied,
        channelCommissionAmount,
        netToHost,
      }),
    },
  });

  // ── Cache idempotency key (AC-7) ──────────────────────────────────────────
  const responseBody = {
    id: reservation.id,
    owambe_reservation_id: reservation.owambeReservationId,
    status: reservation.status,
    payment_status: reservation.paymentStatus,
    channel_commission_amount: channelCommissionAmount,
    channel_commission_percent: channelCommissionPercent,
    net_to_host: netToHost,
    outbound_idempotency_key: outboundIdempotencyKey,
    created_at: reservation.createdAt.toISOString(),
  };

  if (idempotencyKey) {
    await db.idempotencyCache.create({
      data: {
        key: idempotencyKey,
        responseBody: JSON.stringify(responseBody),
        statusCode: 201,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });
  }

  console.log(
    `[channel/stays/reservations] reservation created: id=${reservation.id} ` +
    `commission=${commissionResult.breakdown}`
  );

  return NextResponse.json(responseBody, { status: 201 });
}

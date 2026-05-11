/**
 * POST /api/v1/channel/experiences/bookings
 *
 * CC-C-07 — Experience booking creation with commission persistence.
 *
 * Creates an ExperienceBooking record with:
 *   - Commission split calculated via CommissionCalculator (vertical=EXPERIENCES)
 *   - channelCommissionAmount, channelCommissionPercent, netToOperator persisted
 *   - AuditEntry logged with full commission breakdown
 *   - Idempotency guard via x-idempotency-key header
 *
 * Authentication: HMAC-SHA256 via verifyChannelRequest
 *
 * AC-1: CommissionCalculator.calculate() called with correct vertical=EXPERIENCES
 * AC-2: Commission fields persisted on ExperienceBooking row
 * AC-3: Rate resolves from OperatorProfile.commissionRate if set (negotiated)
 * AC-4: Rate resolves from cohort default (15%) if cohort_member=true and no negotiated rate
 * AC-5: Rate resolves from standard default (18%) if not cohort member and no negotiated rate
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
    owambe_booking_id,
    owambe_experience_id,
    owambe_time_slot_id,
    participant_owambe_user_id,
    number_of_participants,
    participant_names,
    total_amount,
    currency,
    special_requirements,
    pickup_requested,
    pickup_address,
    paystack_reference,
  } = body as Record<string, unknown>;

  // Required field validation
  const missing: string[] = [];
  if (!owambe_experience_id) missing.push('owambe_experience_id');
  if (!owambe_time_slot_id) missing.push('owambe_time_slot_id');
  if (!participant_owambe_user_id) missing.push('participant_owambe_user_id');
  if (!number_of_participants) missing.push('number_of_participants');
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

  // ── Resolve experience, time slot, participant ────────────────────────────
  const experience = await db.experience.findUnique({
    where: { owambeExperienceId: owambe_experience_id as string },
    include: {
      operator: {
        include: {
          operatorProfile: true,
        },
      },
    },
  });
  if (!experience) {
    return NextResponse.json(
      { error: `Experience not found: ${owambe_experience_id}` },
      { status: 404 }
    );
  }

  const timeSlot = await db.timeSlot.findUnique({
    where: { owambeTimeSlotId: owambe_time_slot_id as string },
  });
  if (!timeSlot) {
    return NextResponse.json(
      { error: `Time slot not found: ${owambe_time_slot_id}` },
      { status: 404 }
    );
  }
  if (timeSlot.experienceId !== experience.id) {
    return NextResponse.json(
      { error: 'Time slot does not belong to the specified experience' },
      { status: 422 }
    );
  }

  const participant = await db.user.findUnique({
    where: { owambeUserId: participant_owambe_user_id as string },
  });
  if (!participant) {
    return NextResponse.json(
      { error: `Participant not found: ${participant_owambe_user_id}` },
      { status: 404 }
    );
  }

  // ── Commission calculation (AC-1 through AC-5) ────────────────────────────
  const totalAmountSmallestUnit = Math.round(Number(total_amount) * 100);
  const operatorProfile = experience.operator?.operatorProfile;
  const isCohortMember = experience.operator?.cohortMember ?? false;

  const negotiatedRate =
    operatorProfile?.commissionRate !== null && operatorProfile?.commissionRate !== undefined
      ? Number(operatorProfile.commissionRate)
      : undefined;

  const calculator = getCommissionCalculator();
  const commissionResult = calculator.calculate({
    totalAmountSmallestUnit,
    currency: currency as 'NGN' | 'USD' | 'GBP',
    vertical: 'EXPERIENCES',
    isCohortMember,
    negotiatedRate,
  });

  const channelCommissionAmount = (commissionResult.channelCommissionSmallestUnit / 100).toFixed(2);
  const netToOperator = (commissionResult.netToHostSmallestUnit / 100).toFixed(2);
  const channelCommissionPercent = commissionResult.ratePercent.toFixed(2);

  // ── Create booking (AC-2) ─────────────────────────────────────────────────
  const outboundIdempotencyKey = randomUUID();

  const booking = await db.experienceBooking.create({
    data: {
      owambeBookingId: owambe_booking_id as string | undefined,
      experienceId: experience.id,
      timeSlotId: timeSlot.id,
      participantUserId: participant.id,
      numberOfParticipants: Number(number_of_participants),
      participantNames: Array.isArray(participant_names) ? participant_names as string[] : [],
      totalAmount: (Number(total_amount)).toFixed(2),
      currency: currency as 'NGN' | 'USD' | 'GBP',
      channelCommissionAmount,
      channelCommissionPercent,
      netToOperator,
      specialRequirements: special_requirements as string | undefined,
      pickupRequested: Boolean(pickup_requested),
      pickupAddress: pickup_address as string | undefined,
      paystackReference: paystack_reference as string | undefined,
      outboundIdempotencyKey,
      paymentStatus: 'PENDING',
      status: 'PENDING',
    },
  });

  // ── Audit entry (AC-6) ────────────────────────────────────────────────────
  await db.auditEntry.create({
    data: {
      userId: participant.id,
      entityType: 'ExperienceBooking',
      entityId: booking.id,
      action: 'create',
      metadata: JSON.stringify({
        event: 'experience_booking_created',
        owambeBookingId: owambe_booking_id,
        owambeExperienceId: owambe_experience_id,
        owambeTimeSlotId: owambe_time_slot_id,
        commissionBreakdown: commissionResult.breakdown,
        rateApplied: commissionResult.rateApplied,
        channelCommissionAmount,
        netToOperator,
      }),
    },
  });

  // ── Cache idempotency key (AC-7) ──────────────────────────────────────────
  const responseBody = {
    id: booking.id,
    owambe_booking_id: booking.owambeBookingId,
    status: booking.status,
    payment_status: booking.paymentStatus,
    channel_commission_amount: channelCommissionAmount,
    channel_commission_percent: channelCommissionPercent,
    net_to_operator: netToOperator,
    outbound_idempotency_key: outboundIdempotencyKey,
    created_at: booking.createdAt.toISOString(),
  };

  if (idempotencyKey) {
    await db.idempotencyCache.create({
      data: {
        key: idempotencyKey,
        responseBody: JSON.stringify(responseBody),
        statusCode: 201,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log(
    `[channel/experiences/bookings] booking created: id=${booking.id} ` +
    `commission=${commissionResult.breakdown}`
  );

  return NextResponse.json(responseBody, { status: 201 });
}

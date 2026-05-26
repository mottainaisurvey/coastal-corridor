/**
 * Inbound Owambe Webhook Handler — CC-C-06
 *
 * Receives webhook events from Owambe and processes them:
 *   - Verifies HMAC-SHA256 signature
 *   - Checks for duplicate delivery (idempotent)
 *   - Routes to the appropriate handler by event type
 *   - Returns 200 immediately; processing is synchronous but fast
 *
 * Supported events per OpenAPI spec (12 contract events):
 *   reservation.cancelled
 *   reservation.no_show
 *   reservation.guest_checked_in
 *   reservation.guest_checked_out
 *   reservation.refunded
 *   booking.cancelled
 *   booking.no_show
 *   booking.completed
 *   booking.refunded
 *   property.deactivated
 *   experience.deactivated
 *   reconciliation.requested
 *
 * Supplementary events (not in OpenAPI spec; useful for internal state):
 *   reservation.confirmed
 *   booking.confirmed
 *   property.updated
 *   experience.updated
 *   availability.updated
 *
 * Spec reference: Implementation Brief §10, API Narrative §7
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyInboundWebhook } from '@/lib/hmac';
import { getPrisma } from '@/lib/db-safe';

// ─── POST /api/v1/channel/webhooks/inbound ────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Read raw body (must be done before any parsing)
  const rawBody = await req.text();

  // 2. Extract signature headers — Amendment 010 dual-acceptance (canonical-checked-first per EP-CC-2)
  // Step 1: Try canonical headers (X-Signature + X-Timestamp)
  let signature = req.headers.get('x-signature') ?? '';
  let timestamp = req.headers.get('x-timestamp') ?? '';
  let receiptClassification: 'canonical' | 'legacy' | 'none' = 'none';
  if (signature && timestamp) {
    receiptClassification = 'canonical';
  } else {
    // Step 2: Fall back to legacy headers (x-owambe-signature + x-owambe-timestamp)
    signature = req.headers.get('x-owambe-signature') ?? '';
    timestamp = req.headers.get('x-owambe-timestamp') ?? '';
    if (signature && timestamp) {
      receiptClassification = 'legacy';
    }
  }
  const eventId = req.headers.get('x-owambe-event-id') ?? '';

  // 3. Validate required headers
  if (!signature || !timestamp || !eventId) {
    return NextResponse.json(
      { error: 'Missing required webhook headers' },
      { status: 400 }
    );
  }

  // 4. Verify HMAC signature (timing-safe, with 5-minute tolerance)
  let signatureValid = false;
  try {
    signatureValid = verifyInboundWebhook(rawBody, signature, timestamp);
  } catch (err) {
    console.error('[webhook/inbound] Signature verification error:', err);
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  if (!signatureValid) {
    console.warn('[webhook/inbound] Invalid signature for event:', eventId);
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 401 }
    );
  }

  // 4a. Receipt-distinction structured logging (Amendment 010 § 4.2 + EP-CC-3 + AC-CC5)
  if (receiptClassification === 'legacy') {
    console.warn(
      '[webhook/inbound] DEPRECATION: legacy signature headers received ' +
      '(x-owambe-signature + x-owambe-timestamp); ' +
      'canonical headers (X-Signature + X-Timestamp) expected post-Amendment-010-cutover',
      { receipt_classification: receiptClassification, event_id: eventId }
    );
  }
  console.info('[webhook/inbound] receipt-classification', {
    receipt_classification: receiptClassification,
    event_id: eventId,
    timestamp_header: timestamp,
  });

  // 5. Parse payload
  let payload: { event_type: string; event_id?: string; data: Record<string, unknown> };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  const { event_type: event, data } = payload;

  // 6. Idempotency check — reject duplicate deliveries
  const prisma = getPrisma();
  if (prisma) {
    const existing = await prisma.webhookDelivery.findUnique({
      where: { eventId },
    });
    if (existing) {
      // Already processed — return 200 to prevent Owambe retrying
      console.info('[webhook/inbound] Duplicate event ignored:', eventId);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // 7. Record delivery attempt
    await prisma.webhookDelivery.create({
      data: {
        eventId,
        eventType: event,
        targetPlatform: 'OWAMBE',
        payload: data as object,
        signature,
        status: 'PENDING',
      },
    });
  }

  // 8. Route to handler
  try {
    await routeWebhookEvent(event, data, eventId);

    // 9. Mark as delivered
    if (prisma) {
      await prisma.webhookDelivery.update({
        where: { eventId },
        data: { status: 'DELIVERED' },
      });
    }
  } catch (err) {
    console.error(`[webhook/inbound] Handler error for event ${event}:`, err);
    // Mark as failed — will be retried by Owambe
    if (prisma) {
      await prisma.webhookDelivery.update({
        where: { eventId },
        data: {
          status: 'FAILED',
          errorMessage: err instanceof Error ? err.message : String(err),
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });
    }
    // Return 500 so Owambe retries
    return NextResponse.json(
      { error: 'Internal processing error' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

// ─── Event router ─────────────────────────────────────────────────────────────
async function routeWebhookEvent(
  event: string,
  data: Record<string, unknown>,
  eventId: string
): Promise<void> {
  switch (event) {
    // ── Contract events: Stays (OpenAPI spec §7) ──────────────────────────────
    case 'reservation.cancelled':
      await handleReservationCancelled(data);
      break;
    case 'reservation.no_show':
      await handleReservationNoShow(data);
      break;
    case 'reservation.guest_checked_in':
      await handleReservationGuestCheckedIn(data);
      break;
    case 'reservation.guest_checked_out':
      await handleReservationGuestCheckedOut(data);
      break;
    case 'reservation.refunded':
      await handleReservationRefunded(data);
      break;

    // ── CC-WEBHOOK-HANDLERS-01 Scope A: supplementary event aliases ───────────
    // These event type strings are used by Owambe's webhook publisher in some
    // integration contexts (e.g. joint-window test payloads). They alias the
    // OpenAPI spec event types above and are dispatched to the same handlers.
    case 'reservation.checked_in':
      // Alias for reservation.guest_checked_in (CC-WEBHOOK-HANDLERS-01 Scope A)
      await handleReservationGuestCheckedIn(data);
      break;
    case 'reservation.checked_out':
      // Alias for reservation.guest_checked_out (CC-WEBHOOK-HANDLERS-01 Scope A)
      await handleReservationGuestCheckedOut(data);
      break;
    case 'reservation.status_changed':
      // CC-WEBHOOK-HANDLERS-01 Scope A: handler-layer dispatch only (no full business logic)
      await handleReservationStatusChanged(data, eventId);
      break;

    // ── Contract events: Experiences (OpenAPI spec §7) ────────────────────────
    // Amendment 009 — booking event family (booking.created NEW; booking.cancelled + booking.refunded UPGRADED)
    case 'booking.created':
      await handleBookingCreated(data, eventId);
      break;
    case 'booking.cancelled':
      await handleBookingCancelled(data, eventId);
      break;
    case 'booking.no_show':
      await handleBookingNoShow(data);
      break;
    case 'booking.completed':
      await handleBookingCompleted(data);
      break;
    case 'booking.refunded':
      await handleBookingRefunded(data, eventId);
      break;

    // ── Contract events: Inventory (OpenAPI spec §7) ──────────────────────────
    case 'property.deactivated':
      await handlePropertyDeactivated(data);
      break;
    case 'experience.deactivated':
      await handleExperienceDeactivated(data);
      break;

    // ── Contract events: Reconciliation (OpenAPI spec §7) ─────────────────────
    case 'reconciliation.requested':
      await handleReconciliationRequested(data, eventId);
      break;

    // ── Supplementary events (not in OpenAPI spec; internal use only) ─────────
    // These are NOT emitted by Owambe's webhook publisher per the API contract.
    // They are retained for internal state management and future use.
    case 'reservation.confirmed':
      await handleReservationConfirmed(data);
      break;
    case 'booking.confirmed':
      await handleBookingConfirmed(data);
      break;
    case 'property.updated':
      console.info(`[webhook/inbound] property.updated received for ${data.property_id} — Phase B reconciliation`);
      break;
    case 'experience.updated':
      console.info(`[webhook/inbound] experience.updated received for ${data.experience_id} — Phase B reconciliation`);
      break;
    case 'availability.updated':
      console.info(`[webhook/inbound] availability.updated received for room ${data.room_id} — Phase B calendar sync`);
      break;

    default:
      // Unknown event — log and acknowledge (do not error)
      console.warn(`[webhook/inbound] Unknown event type: ${event} (id: ${eventId})`);
  }
}

// ─── Contract: Stays handlers ─────────────────────────────────────────────────

/**
 * reservation.cancelled (host-originated on Owambe side) — CC-C-06 AC-3
 *
 * Business logic:
 *   1. Mark reservation CANCELLED with reason and initiator
 *   2. Initiate refund via PaystackAdapter if paystackReference is available;
 *      otherwise emit refund-pending audit entry for the reconciliation worker
 *   3. Queue guest notification (audit entry read by CC-D-04 notification worker)
 *   4. Audit log entry for traceability (AC-7)
 */
async function handleReservationCancelled(
  data: Record<string, unknown>
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  const owambeReservationId = data.reservation_id as string;
  if (!owambeReservationId) {
    console.warn('[webhook/inbound] reservation.cancelled: missing reservation_id');
    return;
  }

  // Step 1: Mark reservation CANCELLED
  const updateResult = await prisma.reservation.updateMany({
    where: { owambeReservationId },
    data: {
      status: 'CANCELLED',
      cancellationReason: (data.reason as string) ?? 'Cancelled by host via Owambe',
      cancellationInitiatedBy: 'OWAMBE',
      updatedAt: new Date(),
    },
  });

  // Step 2: Initiate refund via PaystackAdapter if paystackReference is available
  const paystackReference = data.paystack_reference as string | undefined;
  let refundStatus: 'initiated' | 'pending' | 'no_payment_reference' = 'no_payment_reference';
  let refundId: string | undefined;

  if (paystackReference) {
    try {
      const { getPaystackAdapter } = await import('@/lib/paystack-adapter');
      const adapter = getPaystackAdapter();
      const refundResult = await adapter.refundTransaction(paystackReference);
      refundStatus = 'initiated';
      refundId = refundResult.refundId;
      console.info(
        `[webhook/inbound] reservation.cancelled: refund initiated for ${paystackReference} (refundId: ${refundId})`
      );
    } catch (err) {
      // Refund initiation failed — log as pending for reconciliation worker
      refundStatus = 'pending';
      console.error(
        `[webhook/inbound] reservation.cancelled: refund initiation failed for ${paystackReference}:`,
        err
      );
    }
  }

  // Step 3: Queue guest notification (CC-D-04 notification worker reads action=guest_notification_queued)
  await prisma.auditEntry.create({
    data: {
      entityType: 'Reservation',
      entityId: owambeReservationId,
      action: 'guest_notification_queued',
      metadata: JSON.stringify({
        event: 'reservation.cancelled',
        owambeReservationId,
        reason: (data.reason as string) ?? 'Cancelled by host via Owambe',
        notificationType: 'CANCELLATION',
        queuedAt: new Date().toISOString(),
      }),
    },
  }).catch((err) => console.error('[webhook/inbound] Guest notification queue error:', err));

  // Step 4: Audit log entry (AC-7)
  await prisma.auditEntry.create({
    data: {
      entityType: 'Reservation',
      entityId: owambeReservationId,
      action: 'reservation_cancelled_by_owambe',
      metadata: JSON.stringify({
        event: 'reservation.cancelled',
        owambeReservationId,
        reason: (data.reason as string) ?? 'Cancelled by host via Owambe',
        recordsUpdated: updateResult.count,
        refundStatus,
        refundId,
        paystackReference,
      }),
    },
  }).catch((err) => console.error('[webhook/inbound] Audit log error:', err));

  console.info(
    `[webhook/inbound] reservation.cancelled: ${owambeReservationId} — ${updateResult.count} record(s) updated, refund: ${refundStatus}`
  );
}

async function handleReservationNoShow(
  data: Record<string, unknown>
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  const owambeReservationId = data.reservation_id as string;
  if (!owambeReservationId) return;
  await prisma.reservation.updateMany({
    where: { owambeReservationId },
    data: { status: 'NO_SHOW', updatedAt: new Date() },
  });
}

async function handleReservationGuestCheckedIn(
  data: Record<string, unknown>
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  const owambeReservationId = data.reservation_id as string;
  if (!owambeReservationId) return;
  await prisma.reservation.updateMany({
    where: { owambeReservationId },
    data: { status: 'CHECKED_IN', updatedAt: new Date() },
  });
}

async function handleReservationGuestCheckedOut(
  data: Record<string, unknown>
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  const owambeReservationId = data.reservation_id as string;
  if (!owambeReservationId) return;
  await prisma.reservation.updateMany({
    where: { owambeReservationId },
    data: { status: 'CHECKED_OUT', updatedAt: new Date() },
  });
}

async function handleReservationRefunded(
  data: Record<string, unknown>
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  const owambeReservationId = data.reservation_id as string;
  if (!owambeReservationId) return;
  await prisma.reservation.updateMany({
    where: { owambeReservationId },
    data: {
      status: 'REFUNDED',
      refundAmount: data.refund_amount != null
        ? (data.refund_amount as number)
        : undefined,
      updatedAt: new Date(),
    },
  });
}

// ─── Contract: Experiences handlers (Amendment 009) ─────────────────────────

/**
 * booking.created — Amendment 009 § 3.1
 *
 * Business logic:
 *   1. Validate required fields (booking_id, experience_id, time_slot_id, guest_count,
 *      booking_date, guest_details.primary_guest_name, guest_details.primary_guest_email)
 *   2. Idempotency: check inboundIdempotencyKey (eventId) — return early if already processed
 *   3. Resolve Experience via owambeExperienceId → HTTP 404 if not found
 *   4. Resolve TimeSlot via owambeTimeSlotId → HTTP 404 if not found
 *   5. Atomic transaction:
 *      a. Upsert ExperienceBooking on owambeBookingId (idempotent re-delivery)
 *      b. Increment TimeSlot.spotsBooked by guest_count
 *      c. Post-increment over-booking guard (throw → rollback)
 *   6. Structured log
 */
async function handleBookingCreated(
  data: Record<string, unknown>,
  eventId: string
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) throw new Error('[booking.created] Database unavailable');

  // 1. Validate required fields per Amendment 009 § 3.1
  const booking_id = data.booking_id as string | undefined;
  const experience_id = data.experience_id as string | undefined;
  const time_slot_id = data.time_slot_id as string | undefined;
  const guest_count = data.guest_count as number | undefined;
  const booking_date = data.booking_date as string | undefined;
  const guest_details = data.guest_details as Record<string, unknown> | undefined;
  const primary_guest_name = guest_details?.primary_guest_name as string | undefined;
  const primary_guest_email = guest_details?.primary_guest_email as string | undefined;

  if (!booking_id || !experience_id || !time_slot_id || !guest_count || !booking_date ||
      !primary_guest_name || !primary_guest_email) {
    throw Object.assign(
      new Error('[booking.created] Missing required fields: booking_id, experience_id, time_slot_id, guest_count, booking_date, guest_details.primary_guest_name, guest_details.primary_guest_email'),
      { statusCode: 400 }
    );
  }

  const guestCountNum = Number(guest_count);
  if (!Number.isInteger(guestCountNum) || guestCountNum < 1) {
    throw Object.assign(
      new Error('[booking.created] Invalid guest_count: must be a positive integer'),
      { statusCode: 400 }
    );
  }

  // 2. Idempotency: check inboundIdempotencyKey (eventId) — return early if already processed
  const existing = await prisma.experienceBooking.findUnique({
    where: { inboundIdempotencyKey: eventId },
  });
  if (existing) {
    console.info('[booking.created] Duplicate delivery — already processed', {
      eventId,
      owambeBookingId: booking_id,
      existingId: existing.id,
    });
    return;
  }

  // 3. Resolve Experience via owambeExperienceId
  const experience = await prisma.experience.findUnique({
    where: { owambeExperienceId: experience_id },
  });
  if (!experience) {
    throw Object.assign(
      new Error(`[booking.created] Experience not found: owambeExperienceId=${experience_id}`),
      { statusCode: 404 }
    );
  }

  // 4. Resolve TimeSlot via owambeTimeSlotId
  const timeSlot = await prisma.timeSlot.findUnique({
    where: { owambeTimeSlotId: time_slot_id },
  });
  if (!timeSlot) {
    throw Object.assign(
      new Error(`[booking.created] TimeSlot not found: owambeTimeSlotId=${time_slot_id}`),
      { statusCode: 404 }
    );
  }
  if (timeSlot.experienceId !== experience.id) {
    throw Object.assign(
      new Error(`[booking.created] TimeSlot ${time_slot_id} does not belong to experience ${experience_id}`),
      { statusCode: 422 }
    );
  }

  // 5. Atomic transaction: upsert booking + increment capacity
  await prisma.$transaction(async (tx) => {
    // a. Upsert ExperienceBooking on owambeBookingId
    await tx.experienceBooking.upsert({
      where: { owambeBookingId: booking_id },
      create: {
        owambeBookingId: booking_id,
        inboundIdempotencyKey: eventId,
        experienceId: experience.id,
        timeSlotId: timeSlot.id,
        participantUserId: null,  // Owambe-originated: no CC user account at booking.created time
        numberOfParticipants: guestCountNum,
        participantNames: [primary_guest_name],
        guestName: primary_guest_name,
        guestEmail: primary_guest_email,
        guestPhone: (guest_details?.primary_guest_phone as string | undefined) ?? null,
        totalAmount: data.total_amount != null ? String(data.total_amount) : '0',
        currency: (data.currency as string) ?? 'NGN',
        channelCommissionAmount: data.channel_commission_amount != null ? String(data.channel_commission_amount) : '0',
        channelCommissionPercent: data.channel_commission_percent != null ? String(data.channel_commission_percent) : '0',
        netToOperator: data.net_to_operator != null ? String(data.net_to_operator) : '0',
        specialRequirements: data.special_requests as string | undefined,
        paystackReference: data.paystack_reference as string | undefined,
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
      },
      update: {
        // Re-delivery: update inboundIdempotencyKey if not already set (race-condition guard)
        inboundIdempotencyKey: eventId,
        updatedAt: new Date(),
      },
    });

    // b. Increment TimeSlot.spotsBooked by guest_count
    const updatedSlot = await tx.timeSlot.update({
      where: { id: timeSlot.id },
      data: { spotsBooked: { increment: guestCountNum } },
      select: { spotsBooked: true, capacity: true },
    });

    // c. Post-increment over-booking guard
    if (updatedSlot.spotsBooked > updatedSlot.capacity) {
      throw new Error(
        `[booking.created] Over-booking detected: slot ${timeSlot.id} ` +
        `spotsBooked=${updatedSlot.spotsBooked} capacity=${updatedSlot.capacity} ` +
        `— transaction rolled back`
      );
    }
  });

  // 6. Structured log
  console.info('[booking.created] Booking accepted and persisted', {
    eventId,
    owambeBookingId: booking_id,
    experienceId: experience.id,
    timeSlotId: timeSlot.id,
    guestCount: guestCountNum,
  });
}

/**
 * booking.cancelled — Amendment 009 § 3.2 (UPGRADED from stub)
 *
 * Business logic:
 *   1. Validate required fields (booking_id, cancellation_reason, cancellation_initiated_by)
 *   2. Enum validation: cancellation_initiated_by in [GUEST, HOST, PLATFORM, OWAMBE]
 *   3. Resolve ExperienceBooking via owambeBookingId → HTTP 404 if not found
 *   4. Idempotency: already CANCELLED → return early
 *   5. Atomic transaction:
 *      a. Update ExperienceBooking status → CANCELLED
 *      b. Conditional TimeSlot.spotsBooked decrement if capacity_restoration_required === true
 *   6. Structured log
 */
async function handleBookingCancelled(
  data: Record<string, unknown>,
  eventId: string
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) throw new Error('[booking.cancelled] Database unavailable');

  // 1. Validate required fields per Amendment 009 § 3.2
  const booking_id = data.booking_id as string | undefined;
  const cancellation_reason = data.cancellation_reason as string | undefined;
  const cancellation_initiated_by = data.cancellation_initiated_by as string | undefined;

  if (!booking_id || !cancellation_reason || !cancellation_initiated_by) {
    throw Object.assign(
      new Error('[booking.cancelled] Missing required fields: booking_id, cancellation_reason, cancellation_initiated_by'),
      { statusCode: 400 }
    );
  }

  // 2. Enum validation: cancellation_initiated_by
  const VALID_INITIATED_BY = ['GUEST', 'HOST', 'PLATFORM', 'OWAMBE'];
  if (!VALID_INITIATED_BY.includes(cancellation_initiated_by)) {
    throw Object.assign(
      new Error(`[booking.cancelled] Invalid cancellation_initiated_by: ${cancellation_initiated_by}. Must be one of: ${VALID_INITIATED_BY.join(', ')}`),
      { statusCode: 400 }
    );
  }

  const capacityRestorationRequired = Boolean(data.capacity_restoration_required);

  // 3. Resolve ExperienceBooking via owambeBookingId
  const booking = await prisma.experienceBooking.findUnique({
    where: { owambeBookingId: booking_id },
    select: { id: true, status: true, timeSlotId: true, numberOfParticipants: true },
  });
  if (!booking) {
    throw Object.assign(
      new Error(`[booking.cancelled] ExperienceBooking not found: owambeBookingId=${booking_id}`),
      { statusCode: 404 }
    );
  }

  // 4. Idempotency: already CANCELLED → return early
  if (booking.status === 'CANCELLED') {
    console.info('[booking.cancelled] Already cancelled — idempotent re-delivery', {
      eventId,
      owambeBookingId: booking_id,
      bookingId: booking.id,
    });
    return;
  }

  // 5. Atomic transaction: cancel booking + conditional capacity restoration
  await prisma.$transaction(async (tx) => {
    // a. Update ExperienceBooking status → CANCELLED
    await tx.experienceBooking.update({
      where: { id: booking.id },
      data: {
        status: 'CANCELLED',
        cancellationReason: cancellation_reason,
        cancellationInitiatedBy: cancellation_initiated_by,
        updatedAt: new Date(),
      },
    });

    // b. Conditional TimeSlot.spotsBooked decrement per EP-CC-B2 declarative operation
    if (capacityRestorationRequired) {
      await tx.timeSlot.update({
        where: { id: booking.timeSlotId },
        data: { spotsBooked: { decrement: booking.numberOfParticipants } },
      });
    }
  });

  // 6. Structured log
  console.info('[booking.cancelled] Booking cancelled', {
    eventId,
    owambeBookingId: booking_id,
    bookingId: booking.id,
    capacityRestored: capacityRestorationRequired,
    cancellationInitiatedBy: cancellation_initiated_by,
  });
}

async function handleBookingNoShow(
  data: Record<string, unknown>
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  const owambeBookingId = data.booking_id as string;
  if (!owambeBookingId) return;
  await prisma.experienceBooking.updateMany({
    where: { owambeBookingId },
    data: { status: 'NO_SHOW', updatedAt: new Date() },
  });
}

async function handleBookingCompleted(
  data: Record<string, unknown>
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  const owambeBookingId = data.booking_id as string;
  if (!owambeBookingId) return;
  await prisma.experienceBooking.updateMany({
    where: { owambeBookingId },
    data: { status: 'COMPLETED', updatedAt: new Date() },
  });
}

/**
 * booking.refunded — Amendment 009 § 3.3 (UPGRADED from stub)
 *
 * Business logic:
 *   1. Validate required fields (booking_id, refund_amount, refund_type)
 *   2. Enum validation: refund_type in [FULL, PARTIAL]
 *   3. Resolve ExperienceBooking via owambeBookingId → HTTP 404 if not found
 *   4. Idempotency: already REFUNDED → return early
 *   5. Update ExperienceBooking with refund metadata + paystack_refund_reference
 *   6. Structured log
 */
async function handleBookingRefunded(
  data: Record<string, unknown>,
  eventId: string
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) throw new Error('[booking.refunded] Database unavailable');

  // 1. Validate required fields per Amendment 009 § 3.3
  const booking_id = data.booking_id as string | undefined;
  const refund_amount = data.refund_amount as number | undefined;
  const refund_type = data.refund_type as string | undefined;

  if (!booking_id || refund_amount == null || !refund_type) {
    throw Object.assign(
      new Error('[booking.refunded] Missing required fields: booking_id, refund_amount, refund_type'),
      { statusCode: 400 }
    );
  }

  // 2. Enum validation: refund_type
  const VALID_REFUND_TYPES = ['FULL', 'PARTIAL'];
  if (!VALID_REFUND_TYPES.includes(refund_type)) {
    throw Object.assign(
      new Error(`[booking.refunded] Invalid refund_type: ${refund_type}. Must be one of: ${VALID_REFUND_TYPES.join(', ')}`),
      { statusCode: 400 }
    );
  }

  // 3. Resolve ExperienceBooking via owambeBookingId
  const booking = await prisma.experienceBooking.findUnique({
    where: { owambeBookingId: booking_id },
    select: { id: true, status: true },
  });
  if (!booking) {
    throw Object.assign(
      new Error(`[booking.refunded] ExperienceBooking not found: owambeBookingId=${booking_id}`),
      { statusCode: 404 }
    );
  }

  // 4. Idempotency: already REFUNDED → return early
  if (booking.status === 'REFUNDED') {
    console.info('[booking.refunded] Already refunded — idempotent re-delivery', {
      eventId,
      owambeBookingId: booking_id,
      bookingId: booking.id,
    });
    return;
  }

  // 5. Update ExperienceBooking with refund metadata + paystack_refund_reference
  await prisma.experienceBooking.update({
    where: { id: booking.id },
    data: {
      status: 'REFUNDED',
      refundAmount: refund_amount != null ? String(refund_amount) : undefined,
      refundType: refund_type,
      refundReason: data.refund_reason as string | undefined,
      refundedAt: new Date(),
      paystackRefundReference: data.paystack_refund_reference as string | undefined,
      updatedAt: new Date(),
    },
  });

  // 6. Structured log
  console.info('[booking.refunded] Refund metadata persisted', {
    eventId,
    owambeBookingId: booking_id,
    bookingId: booking.id,
    refundType: refund_type,
    paystackRefundReference: data.paystack_refund_reference ?? null,
  });
}

// ─── Contract: Inventory handlers ────────────────────────────────────────────

/**
 * property.deactivated — CC-C-06 AC-1
 *
 * Business logic:
 *   1. Set StayProperty.status = INACTIVE (removes from search results within 60s;
 *      search queries filter WHERE status = 'ACTIVE')
 *   2. Existing Reservations on this property are NOT touched (AC-1: remain readable and valid)
 *   3. Audit log entry for traceability (AC-7)
 */
async function handlePropertyDeactivated(
  data: Record<string, unknown>
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  const owambePropertyId = data.property_id as string;
  if (!owambePropertyId) {
    console.warn('[webhook/inbound] property.deactivated: missing property_id');
    return;
  }

  // Step 1: Deactivate the property (search exclusion — AC-1)
  const updateResult = await prisma.stayProperty.updateMany({
    where: { owambePropertyId },
    data: { status: 'INACTIVE', updatedAt: new Date() },
  });

  // Step 2: Existing reservations are preserved — no update to Reservation table
  // (AC-1: "existing reservations on that property remain readable and valid")

  // Step 3: Audit log entry (AC-7)
  await prisma.auditEntry.create({
    data: {
      entityType: 'StayProperty',
      entityId: owambePropertyId,
      action: 'property_deactivated_by_owambe',
      metadata: JSON.stringify({
        event: 'property.deactivated',
        owambePropertyId,
        reason: (data.reason as string) ?? undefined,
        recordsUpdated: updateResult.count,
        existingReservationsPreserved: true,
      }),
    },
  }).catch((err) => console.error('[webhook/inbound] Audit log error:', err));

  console.info(
    `[webhook/inbound] property.deactivated: ${owambePropertyId} — ${updateResult.count} property record(s) set INACTIVE`
  );
}

/**
 * experience.deactivated — CC-C-06 AC-2
 *
 * Business logic:
 *   1. Set Experience.status = INACTIVE (removes from search results within 60s;
 *      search queries filter WHERE status = 'ACTIVE')
 *   2. Existing ExperienceBookings on this experience are NOT touched (AC-2: remain readable and valid)
 *   3. Audit log entry for traceability (AC-7)
 */
async function handleExperienceDeactivated(
  data: Record<string, unknown>
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  const owambeExperienceId = data.experience_id as string;
  if (!owambeExperienceId) {
    console.warn('[webhook/inbound] experience.deactivated: missing experience_id');
    return;
  }

  // Step 1: Deactivate the experience (search exclusion — AC-2)
  const updateResult = await prisma.experience.updateMany({
    where: { owambeExperienceId },
    data: { status: 'INACTIVE', updatedAt: new Date() },
  });

  // Step 2: Existing bookings are preserved — no update to ExperienceBooking table
  // (AC-2: "existing bookings on that experience remain readable and valid")

  // Step 3: Audit log entry (AC-7)
  await prisma.auditEntry.create({
    data: {
      entityType: 'Experience',
      entityId: owambeExperienceId,
      action: 'experience_deactivated_by_owambe',
      metadata: JSON.stringify({
        event: 'experience.deactivated',
        owambeExperienceId,
        reason: (data.reason as string) ?? undefined,
        recordsUpdated: updateResult.count,
        existingBookingsPreserved: true,
      }),
    },
  }).catch((err) => console.error('[webhook/inbound] Audit log error:', err));

  console.info(
    `[webhook/inbound] experience.deactivated: ${owambeExperienceId} — ${updateResult.count} experience record(s) set INACTIVE`
  );
}

// ─── Contract: Reconciliation handler ────────────────────────────────────────

async function handleReconciliationRequested(
  data: Record<string, unknown>,
  eventId: string
): Promise<void> {
  // Owambe is requesting a reconciliation snapshot.
  // Phase B will implement the full reconciliation response (GET /api/v1/channel/reconciliation/stays/snapshot
  // and GET /api/v1/channel/reconciliation/experiences/snapshot).
  // For Phase A, log the request so it is visible in the audit trail.
  const scope = (data.scope as string) ?? 'UNKNOWN';
  console.info(
    `[webhook/inbound] reconciliation.requested (scope: ${scope}, event: ${eventId}) — Phase B will implement snapshot response`
  );
  // Log to ReconciliationLog so the request is traceable
  const prisma = getPrisma();
  if (!prisma) return;
  await prisma.reconciliationLog.create({
    data: {
      scope,
      entitiesChecked: 0,
      mismatchesFound: 0,
      autoCorrected: 0,
      manualReviewItems: 0,
      details: { trigger: 'owambe_webhook', eventId, raw: data } as object,
      durationMs: 0,
    },
  });
}

// ─── CC-WEBHOOK-HANDLERS-01 Scope A: status_changed handler ─────────────────

/**
 * reservation.status_changed — CC-WEBHOOK-HANDLERS-01 Scope A
 *
 * Scope A: handler-layer dispatch only. Logs the status transition and writes
 * an audit entry. Full business logic (e.g. conditional Reservation.status
 * update based on new_status value) is deferred to Phase 5.2 semantic layer.
 */
async function handleReservationStatusChanged(
  data: Record<string, unknown>,
  eventId: string
): Promise<void> {
  const owambeReservationId = data.reservation_id as string | undefined;
  const newStatus = data.new_status as string | undefined;
  const previousStatus = data.previous_status as string | undefined;

  console.info(
    `[webhook/inbound] reservation.status_changed: reservation=${owambeReservationId ?? 'UNKNOWN'} ` +
    `${previousStatus ?? '?'} → ${newStatus ?? '?'} (event: ${eventId}) — Scope A dispatch`
  );

  const prisma = getPrisma();
  if (!prisma || !owambeReservationId) return;

  await prisma.auditEntry.create({
    data: {
      entityType: 'Reservation',
      entityId: owambeReservationId,
      action: 'reservation_status_changed_by_owambe',
      metadata: JSON.stringify({
        event: 'reservation.status_changed',
        owambeReservationId,
        previousStatus,
        newStatus,
        eventId,
        scopeNote: 'CC-WEBHOOK-HANDLERS-01 Scope A — semantic update deferred to Phase 5.2',
      }),
    },
  }).catch((err) => console.error('[webhook/inbound] Audit log error (status_changed):', err));
}

// ─── Supplementary: internal-only handlers ───────────────────────────────────
// These handle events NOT in the OpenAPI spec. Owambe does not emit them.
// They exist for internal state management only.

async function handleReservationConfirmed(
  data: Record<string, unknown>
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  const owambeReservationId = data.reservation_id as string;
  if (!owambeReservationId) return;
  await prisma.reservation.updateMany({
    where: { owambeReservationId },
    data: { status: 'CONFIRMED', updatedAt: new Date() },
  });
}

async function handleBookingConfirmed(
  data: Record<string, unknown>
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  const owambeBookingId = data.booking_id as string;
  if (!owambeBookingId) return;
  await prisma.experienceBooking.updateMany({
    where: { owambeBookingId },
    data: { status: 'CONFIRMED', updatedAt: new Date() },
  });
}

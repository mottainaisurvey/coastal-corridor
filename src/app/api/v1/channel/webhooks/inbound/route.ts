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

  // 2. Extract signature headers
  const signature = req.headers.get('x-owambe-signature') ?? '';
  const timestamp = req.headers.get('x-owambe-timestamp') ?? '';
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

  // 5. Parse payload
  let payload: { event: string; data: Record<string, unknown> };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  const { event, data } = payload;

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
        payload: data as Record<string, unknown>,
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

    // ── Contract events: Experiences (OpenAPI spec §7) ────────────────────────
    case 'booking.cancelled':
      await handleBookingCancelled(data);
      break;
    case 'booking.no_show':
      await handleBookingNoShow(data);
      break;
    case 'booking.completed':
      await handleBookingCompleted(data);
      break;
    case 'booking.refunded':
      await handleBookingRefunded(data);
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

// ─── Contract: Experiences handlers ──────────────────────────────────────────

async function handleBookingCancelled(
  data: Record<string, unknown>
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  const owambeBookingId = data.booking_id as string;
  if (!owambeBookingId) return;
  await prisma.experienceBooking.updateMany({
    where: { owambeBookingId },
    data: {
      status: 'CANCELLED',
      cancellationReason: (data.reason as string) ?? 'Cancelled by Owambe',
      cancellationInitiatedBy: 'OWAMBE',
      updatedAt: new Date(),
    },
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

async function handleBookingRefunded(
  data: Record<string, unknown>
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  const owambeBookingId = data.booking_id as string;
  if (!owambeBookingId) return;
  await prisma.experienceBooking.updateMany({
    where: { owambeBookingId },
    data: {
      status: 'REFUNDED',
      refundAmount: data.refund_amount != null
        ? (data.refund_amount as number)
        : undefined,
      updatedAt: new Date(),
    },
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
      details: { trigger: 'owambe_webhook', eventId, raw: data },
      durationMs: 0,
    },
  });
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

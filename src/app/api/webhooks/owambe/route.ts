/**
 * Inbound Owambe Webhook Handler — Phase A
 *
 * Receives webhook events from Owambe and processes them:
 *   - Verifies HMAC-SHA256 signature
 *   - Checks for duplicate delivery (idempotent)
 *   - Routes to the appropriate handler by event type
 *   - Returns 200 immediately; processing is synchronous but fast
 *
 * Supported events (Phase A — infrastructure only; handlers added in Phase B/C):
 *   - reservation.confirmed
 *   - reservation.cancelled
 *   - reservation.checked_in
 *   - reservation.checked_out
 *   - booking.confirmed
 *   - booking.cancelled
 *   - booking.completed
 *   - property.updated
 *   - property.deactivated
 *   - experience.updated
 *   - experience.deactivated
 *   - availability.updated
 *
 * Spec reference: Implementation Brief §10, API Narrative §7
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyInboundWebhook } from '@/lib/hmac';
import { getPrisma } from '@/lib/db-safe';

// ─── POST /api/webhooks/owambe ────────────────────────────────────────────────

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
    console.error('[webhook/owambe] Signature verification error:', err);
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  if (!signatureValid) {
    console.warn('[webhook/owambe] Invalid signature for event:', eventId);
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
      console.info('[webhook/owambe] Duplicate event ignored:', eventId);
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
    console.error(`[webhook/owambe] Handler error for event ${event}:`, err);

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
    // Stays events
    case 'reservation.confirmed':
      await handleReservationConfirmed(data);
      break;
    case 'reservation.cancelled':
      await handleReservationCancelled(data);
      break;
    case 'reservation.checked_in':
      await handleReservationCheckedIn(data);
      break;
    case 'reservation.checked_out':
      await handleReservationCheckedOut(data);
      break;

    // Experiences events
    case 'booking.confirmed':
      await handleBookingConfirmed(data);
      break;
    case 'booking.cancelled':
      await handleBookingCancelled(data);
      break;
    case 'booking.completed':
      await handleBookingCompleted(data);
      break;

    // Inventory events
    case 'property.updated':
    case 'property.deactivated':
      await handlePropertyEvent(event, data);
      break;
    case 'experience.updated':
    case 'experience.deactivated':
      await handleExperienceEvent(event, data);
      break;
    case 'availability.updated':
      await handleAvailabilityUpdated(data);
      break;

    default:
      // Unknown event — log and acknowledge (do not error)
      console.warn(`[webhook/owambe] Unknown event type: ${event} (id: ${eventId})`);
  }
}

// ─── Stays handlers ───────────────────────────────────────────────────────────

async function handleReservationConfirmed(
  data: Record<string, unknown>
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;

  const owambeReservationId = data.reservation_id as string;
  if (!owambeReservationId) return;

  await prisma.reservation.updateMany({
    where: { owambeReservationId },
    data: {
      status: 'CONFIRMED',
      updatedAt: new Date(),
    },
  });
}

async function handleReservationCancelled(
  data: Record<string, unknown>
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;

  const owambeReservationId = data.reservation_id as string;
  if (!owambeReservationId) return;

  await prisma.reservation.updateMany({
    where: { owambeReservationId },
    data: {
      status: 'CANCELLED',
      cancellationReason: (data.reason as string) ?? 'Cancelled by Owambe',
      cancellationInitiatedBy: 'OWAMBE',
      updatedAt: new Date(),
    },
  });
}

async function handleReservationCheckedIn(
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

async function handleReservationCheckedOut(
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

// ─── Experiences handlers ─────────────────────────────────────────────────────

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

// ─── Inventory handlers ───────────────────────────────────────────────────────

async function handlePropertyEvent(
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;

  const owambePropertyId = data.property_id as string;
  if (!owambePropertyId) return;

  if (event === 'property.deactivated') {
    await prisma.stayProperty.updateMany({
      where: { owambePropertyId },
      data: { status: 'INACTIVE', updatedAt: new Date() },
    });
  } else if (event === 'property.updated') {
    // Phase B will implement full property sync here
    // For Phase A, just log the event — the reconciliation cron handles sync
    console.info(`[webhook/owambe] property.updated received for ${owambePropertyId} — reconciliation will sync`);
  }
}

async function handleExperienceEvent(
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;

  const owambeExperienceId = data.experience_id as string;
  if (!owambeExperienceId) return;

  if (event === 'experience.deactivated') {
    await prisma.experience.updateMany({
      where: { owambeExperienceId },
      data: { status: 'INACTIVE', updatedAt: new Date() },
    });
  } else if (event === 'experience.updated') {
    console.info(`[webhook/owambe] experience.updated received for ${owambeExperienceId} — reconciliation will sync`);
  }
}

async function handleAvailabilityUpdated(
  data: Record<string, unknown>
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;

  // Phase B will implement full calendar sync here
  // For Phase A, log the event
  const roomId = data.room_id as string;
  console.info(`[webhook/owambe] availability.updated received for room ${roomId} — calendar sync in Phase B`);
}

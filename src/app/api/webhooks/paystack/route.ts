/**
 * Inbound Paystack Webhook Handler — CC-C-01
 *
 * Receives payment event webhooks from Paystack and processes them:
 *   - Verifies HMAC-SHA512 signature via PaystackAdapter (mode-aware, AC-8)
 *   - Idempotency check on event ID
 *   - Routes to the appropriate handler by event type
 *
 * Supported events:
 *   - charge.success       — payment completed, update reservation/booking status
 *   - charge.failed        — payment failed
 *   - refund.processed     — refund completed; updates booking to REFUNDED (AC-7)
 *   - transfer.success     — subaccount payout completed
 *   - transfer.failed      — subaccount payout failed
 *
 * AC-4: This route never branches on PAYSTACK_MODE — all mode logic is in PaystackAdapter.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPaystackAdapter } from '@/lib/paystack-adapter';
import { getPrisma } from '@/lib/db-safe';
import { assertPaymentStatusTransition, PaymentStatusTransitionError } from '@/lib/payment-status-guard';
import { PaymentStatus } from '@prisma/client';
import { sendEmail, guestBookingConfirmationEmail, operatorBookingNotificationEmail, type ExperienceBookingEmailData } from '@/lib/email';

// ─── POST /api/webhooks/paystack ──────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Read raw body
  const rawBody = await req.text();

  // 2. Extract signature header
  const signature = req.headers.get('x-paystack-signature') ?? '';
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing x-paystack-signature header' },
      { status: 400 }
    );
  }

  // 3. Verify HMAC-SHA512 signature via PaystackAdapter (AC-8: uses correct secret per mode)
  let signatureValid = false;
  try {
    const adapter = getPaystackAdapter();
    signatureValid = adapter.verifyWebhookSignature(rawBody, signature);
  } catch (err) {
    console.error('[webhook/paystack] Adapter/signature error:', err);
    return NextResponse.json(
      { error: 'Payment webhook secret not configured' },
      { status: 500 }
    );
  }

  if (!signatureValid) {
    console.warn('[webhook/paystack] Invalid signature');
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 401 }
    );
  }

  // 4. Parse payload
  let payload: { event: string; data: Record<string, unknown> };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const { event, data } = payload;
  const eventId = (data.id as string) ?? (data.reference as string);

  // 5. Idempotency check
  const prisma = getPrisma();
  if (prisma && eventId) {
    const existing = await prisma.webhookDelivery.findFirst({
      where: { eventId: `paystack_${eventId}`, targetPlatform: 'PAYSTACK' },
    });
    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    await prisma.webhookDelivery.create({
      data: {
        eventId: `paystack_${eventId}`,
        eventType: event,
        targetPlatform: 'PAYSTACK',
        payload: data,
        signature,
        status: 'PENDING',
      },
    });
  }

  // 6. Route to handler
  try {
    await routePaystackEvent(event, data);

    if (prisma && eventId) {
      await prisma.webhookDelivery.updateMany({
        where: { eventId: `paystack_${eventId}`, targetPlatform: 'PAYSTACK' },
        data: { status: 'DELIVERED' },
      });
    }
  } catch (err) {
    console.error(`[webhook/paystack] Handler error for event ${event}:`, err);
    
    if (err instanceof PaymentStatusTransitionError) {
      if (prisma && eventId) {
        await prisma.webhookDelivery.updateMany({
          where: { eventId: `paystack_${eventId}`, targetPlatform: 'PAYSTACK' },
          data: {
            status: 'FAILED',
            errorMessage: err.message,
            attempts: { increment: 1 },
            lastAttemptAt: new Date(),
          },
        });
      }
      return NextResponse.json({ error: err.message }, { status: 422 });
    }

    if (prisma && eventId) {
      await prisma.webhookDelivery.updateMany({
        where: { eventId: `paystack_${eventId}`, targetPlatform: 'PAYSTACK' },
        data: {
          status: 'FAILED',
          errorMessage: err instanceof Error ? err.message : String(err),
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });
    }
    return NextResponse.json({ error: 'Processing error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ─── Event router ─────────────────────────────────────────────────────────────
async function routePaystackEvent(
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  switch (event) {
    case 'charge.success':
      await handleChargeSuccess(data);
      break;
    case 'charge.failed':
      await handleChargeFailed(data);
      break;
    case 'refund.processed':
      await handleRefundProcessed(data);
      break;
    case 'transfer.success':
      await handleTransferSuccess(data);
      break;
    case 'transfer.failed':
      await handleTransferFailed(data);
      break;
    default:
      console.info(`[webhook/paystack] Unhandled event type: ${event}`);
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────
async function handleChargeSuccess(data: Record<string, unknown>): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;

  const reference = data.reference as string;
  const metadata = data.metadata as Record<string, unknown> | undefined;
  if (!reference) return;

  // Determine if this is a Stay reservation or Experience booking from metadata
  const reservationType = metadata?.reservation_type as string | undefined;
  const entityId = metadata?.entity_id as string | undefined;
  
  // Map payment_type to canonical state
  const paymentType = metadata?.payment_type as string | undefined;
  let targetStatus: any = 'PAID';
  if (paymentType === 'DEPOSIT_PAID') targetStatus = 'DEPOSIT_PAID';
  else if (paymentType === 'PARTIALLY_PAID') targetStatus = 'PARTIALLY_PAID';

  if (reservationType === 'STAY' && entityId) {
    const current = await prisma.reservation.findUnique({ where: { id: entityId } });
    if (current) {
      assertPaymentStatusTransition(current.paymentStatus, targetStatus);
      await prisma.reservation.update({
        where: { id: entityId },
        data: {
          paymentStatus: targetStatus,
          paystackReference: reference,
          updatedAt: new Date(),
        },
      });
    }
  } else if (reservationType === 'EXPERIENCE' && entityId) {
    // CC-D-01-C AC-4a: Full ExperienceBooking confirmation with capacity reservation
    const current = await prisma.experienceBooking.findUnique({
      where: { id: entityId },
      select: {
        id: true,
        paymentStatus: true,
        status: true,
        numberOfParticipants: true,
        timeSlotId: true,
      },
    });
    if (current) {
      // Idempotency: if already CONFIRMED, no-op (AC-4a idempotent re-delivery)
      if (current.status === 'CONFIRMED' && current.paymentStatus === 'PAID') {
        console.info(
          `[webhook/paystack] charge.success idempotent: booking ${entityId} already CONFIRMED`
        );
        return;
      }
      assertPaymentStatusTransition(current.paymentStatus, targetStatus);
      // Atomic transaction: confirm booking + increment spotsBooked (AC-4a)
      await prisma.$transaction(async (tx) => {
        // 1. Update ExperienceBooking: paymentStatus=PAID, status=CONFIRMED
        await tx.experienceBooking.update({
          where: { id: entityId },
          data: {
            paymentStatus: targetStatus,
            status: 'CONFIRMED',
            paystackReference: reference,
            updatedAt: new Date(),
          },
        });
        // 2. Increment TimeSlot.spotsBooked by numberOfParticipants
        const updatedSlot = await tx.timeSlot.update({
          where: { id: current.timeSlotId },
          data: { spotsBooked: { increment: current.numberOfParticipants } },
          select: { spotsBooked: true, capacity: true },
        });
        // 3. Post-increment over-booking guard (AC-4d defensive check)
        if (updatedSlot.spotsBooked > updatedSlot.capacity) {
          // Rollback the transaction by throwing — Prisma will revert all writes
          // Phase E: trigger refund via Paystack API on race-condition loss
          throw new Error(
            `[webhook/paystack] Over-booking detected: slot ${current.timeSlotId} ` +
            `spotsBooked=${updatedSlot.spotsBooked} capacity=${updatedSlot.capacity} ` +
            `— transaction rolled back`
          );
        }
        // 4. Update BookingDraft to COMPLETED (terminal state)
        await tx.bookingDraft.updateMany({
          where: { experienceBookingId: entityId },
          data: { status: 'COMPLETED' },
        });
      });

      // CC-D-01-E AC-2/3: Fire-and-forget email notifications after transaction commit.
      // Non-blocking: email send failures are logged but do not affect the webhook 200 response.
      // Idempotency: gated behind the same CONFIRMED transition check above — re-delivery
      // short-circuits before reaching this point, so no duplicate emails.
      const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_BASE_URL ?? 'https://coastalcorridor.co';
      const bookingForEmail = await prisma.experienceBooking.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          numberOfParticipants: true,
          totalAmount: true,
          currency: true,
          channelCommissionAmount: true,
          channelCommissionPercent: true,
          netToOperator: true,
          specialRequirements: true,
          pickupRequested: true,
          pickupAddress: true,
          experience: {
            select: {
              name: true,
              meetingPointDescription: true,
              meetingPointLatitude: true,
              meetingPointLongitude: true,
              operator: {
                select: {
                  email: true,
                  operatorProfile: { select: { displayName: true, businessName: true } },
                },
              },
            },
          },
          timeSlot: { select: { startDateTime: true, endDateTime: true } },
          participant: { select: { name: true, email: true, phone: true } },
        },
      });
      if (bookingForEmail) {
        const operatorDisplayName =
          bookingForEmail.experience.operator.operatorProfile?.displayName ??
          bookingForEmail.experience.operator.operatorProfile?.businessName ??
          'Your Operator';
        const emailData: ExperienceBookingEmailData = {
          bookingId: bookingForEmail.id,
          bookingRef: `CC-EXP-${bookingForEmail.id.slice(0, 8).toUpperCase()}`,
          guestName: bookingForEmail.participant.name ?? bookingForEmail.id,
          guestEmail: bookingForEmail.participant.email,
          guestPhone: bookingForEmail.participant.phone ?? null,
          experienceName: bookingForEmail.experience.name,
          startDateTime: bookingForEmail.timeSlot.startDateTime.toISOString(),
          endDateTime: bookingForEmail.timeSlot.endDateTime.toISOString(),
          numberOfParticipants: bookingForEmail.numberOfParticipants,
          totalAmount: bookingForEmail.totalAmount.toString(),
          currency: bookingForEmail.currency,
          channelCommissionAmount: bookingForEmail.channelCommissionAmount.toString(),
          channelCommissionPercent: bookingForEmail.channelCommissionPercent.toString(),
          netToOperator: bookingForEmail.netToOperator.toString(),
          meetingPointDescription: bookingForEmail.experience.meetingPointDescription,
          meetingPointLatitude: bookingForEmail.experience.meetingPointLatitude.toString(),
          meetingPointLongitude: bookingForEmail.experience.meetingPointLongitude.toString(),
          specialRequirements: bookingForEmail.specialRequirements,
          pickupRequested: bookingForEmail.pickupRequested,
          pickupAddress: bookingForEmail.pickupAddress,
          operatorDisplayName,
          operatorEmail: bookingForEmail.experience.operator.email,
          confirmationPageUrl: `${APP_BASE_URL}/booking-complete/${bookingForEmail.id}`,
          operatorBookingsUrl: `${APP_BASE_URL}/operator/bookings`,
        };
        const guestEmail = guestBookingConfirmationEmail(emailData);
        sendEmail({ to: emailData.guestEmail, subject: guestEmail.subject, htmlBody: guestEmail.htmlBody, textBody: guestEmail.textBody })
          .catch(err => console.error('[webhook/paystack] Guest email send failed:', err));
        const opEmail = operatorBookingNotificationEmail(emailData);
        sendEmail({ to: emailData.operatorEmail, subject: opEmail.subject, htmlBody: opEmail.htmlBody, textBody: opEmail.textBody })
          .catch(err => console.error('[webhook/paystack] Operator email send failed:', err));
      }
    }
  }

  // Audit log
  const prismaForAudit = getPrisma();
  if (prismaForAudit) {
    await prismaForAudit.auditEntry.create({
      data: {
        entityType: reservationType === 'STAY' ? 'Reservation' : 'ExperienceBooking',
        entityId: entityId ?? 'unknown',
        action: 'payment_captured',
        metadata: JSON.stringify({ reference, event: 'charge.success', reservationType, targetStatus }),
      },
    }).catch((err) => console.error('[webhook/paystack] Audit log error:', err));
  }

  console.info(`[webhook/paystack] charge.success: ${reference} (${reservationType} ${entityId}) -> ${targetStatus}`);
}

async function handleChargeFailed(data: Record<string, unknown>): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;

  const reference = data.reference as string;
  const metadata = data.metadata as Record<string, unknown> | undefined;
  const reservationType = metadata?.reservation_type as string | undefined;
  const entityId = metadata?.entity_id as string | undefined;

  if (reservationType === 'STAY' && entityId) {
    const current = await prisma.reservation.findUnique({ where: { id: entityId } });
    if (current) {
      assertPaymentStatusTransition(current.paymentStatus, 'FAILED');
      await prisma.reservation.update({
        where: { id: entityId },
        data: { paymentStatus: 'FAILED', updatedAt: new Date() },
      });
    }
  } else if (reservationType === 'EXPERIENCE' && entityId) {
    const current = await prisma.experienceBooking.findUnique({ where: { id: entityId } });
    if (current) {
      assertPaymentStatusTransition(current.paymentStatus, 'FAILED');
      await prisma.experienceBooking.update({
        where: { id: entityId },
        data: { paymentStatus: 'FAILED', updatedAt: new Date() },
      });
    }
  }

  console.warn(`[webhook/paystack] charge.failed: ${reference}`);
}

/**
 * refund.processed — Paystack has processed a refund.
 * Updates Reservation or ExperienceBooking paymentStatus and status to REFUNDED or PARTIALLY_REFUNDED.
 */
async function handleRefundProcessed(data: Record<string, unknown>): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;

  const reference = data.transaction_reference as string;
  const refundAmountKobo = data.amount as number | undefined;
  const metadata = data.metadata as Record<string, unknown> | undefined;
  
  if (!reference) {
    console.warn('[webhook/paystack] refund.processed: missing transaction_reference');
    return;
  }

  // Map refund_type to canonical state
  const refundType = metadata?.refund_type as string | undefined;
  let targetStatus: any = 'REFUNDED';
  if (refundType === 'PARTIALLY_REFUNDED') targetStatus = 'PARTIALLY_REFUNDED';

  // Find the records first to check transitions
  const stays = await prisma.reservation.findMany({ where: { paystackReference: reference } });
  const experiences = await prisma.experienceBooking.findMany({ where: { paystackReference: reference } });

  let stayCount = 0;
  let experienceCount = 0;

  for (const stay of stays) {
    assertPaymentStatusTransition(stay.paymentStatus, targetStatus);
    await prisma.reservation.update({
      where: { id: stay.id },
      data: {
        paymentStatus: targetStatus,
        status: targetStatus === 'REFUNDED' ? 'REFUNDED' : stay.status,
        refundAmount: refundAmountKobo != null ? refundAmountKobo / 100 : undefined,
        updatedAt: new Date(),
      },
    });
    stayCount++;
  }

  for (const exp of experiences) {
    assertPaymentStatusTransition(exp.paymentStatus, targetStatus);
    await prisma.experienceBooking.update({
      where: { id: exp.id },
      data: {
        paymentStatus: targetStatus,
        status: targetStatus === 'REFUNDED' ? 'REFUNDED' : exp.status,
        refundAmount: refundAmountKobo != null ? refundAmountKobo / 100 : undefined,
        updatedAt: new Date(),
      },
    });
    experienceCount++;
  }

  const totalUpdated = stayCount + experienceCount;

  // Audit log
  await prisma.auditEntry.create({
    data: {
      entityType: 'Payment',
      entityId: reference,
      action: 'refund_processed',
      metadata: JSON.stringify({
        reference,
        refundAmountKobo,
        targetStatus,
        stayRecordsUpdated: stayCount,
        experienceRecordsUpdated: experienceCount,
      }),
    },
  }).catch((err) => console.error('[webhook/paystack] Audit log error:', err));

  console.info(
    `[webhook/paystack] refund.processed: ${reference} — ${totalUpdated} record(s) updated to ${targetStatus}`
  );
}

async function handleTransferSuccess(data: Record<string, unknown>): Promise<void> {
  const transferCode = data.transfer_code as string;
  console.info(`[webhook/paystack] transfer.success: ${transferCode}`);
  // CC-C-07 will implement full payout tracking
}

async function handleTransferFailed(data: Record<string, unknown>): Promise<void> {
  const transferCode = data.transfer_code as string;
  console.error(`[webhook/paystack] transfer.failed: ${transferCode} — manual intervention required`);
}

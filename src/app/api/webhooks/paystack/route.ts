/**
 * Inbound Paystack Webhook Handler — Phase A
 *
 * Receives payment event webhooks from Paystack and processes them:
 *   - Verifies HMAC-SHA512 signature (Paystack's algorithm)
 *   - Idempotency check on event ID
 *   - Routes to the appropriate handler by event type
 *
 * Supported events (Phase A):
 *   - charge.success       — payment completed, update reservation/booking status
 *   - charge.failed        — payment failed
 *   - refund.processed     — refund completed
 *   - transfer.success     — subaccount payout completed
 *   - transfer.failed      — subaccount payout failed
 *
 * Spec reference: Implementation Brief §13
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyPaystackWebhook } from '@/lib/paystack';
import { getPrisma } from '@/lib/db-safe';

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

  // 3. Verify HMAC-SHA512 signature
  let signatureValid = false;
  try {
    signatureValid = verifyPaystackWebhook(rawBody, signature);
  } catch (err) {
    console.error('[webhook/paystack] Signature verification error:', err);
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

  if (reservationType === 'STAY' && entityId) {
    await prisma.reservation.updateMany({
      where: { id: entityId },
      data: {
        paymentStatus: 'PAID',
        paystackReference: reference,
        updatedAt: new Date(),
      },
    });
  } else if (reservationType === 'EXPERIENCE' && entityId) {
    await prisma.experienceBooking.updateMany({
      where: { id: entityId },
      data: {
        paymentStatus: 'PAID',
        paystackReference: reference,
        updatedAt: new Date(),
      },
    });
  }

  // Log to audit
  console.info(`[webhook/paystack] charge.success: ${reference} (${reservationType} ${entityId})`);
}

async function handleChargeFailed(data: Record<string, unknown>): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;

  const reference = data.reference as string;
  const metadata = data.metadata as Record<string, unknown> | undefined;
  const reservationType = metadata?.reservation_type as string | undefined;
  const entityId = metadata?.entity_id as string | undefined;

  if (reservationType === 'STAY' && entityId) {
    await prisma.reservation.updateMany({
      where: { id: entityId },
      data: { paymentStatus: 'FAILED', updatedAt: new Date() },
    });
  } else if (reservationType === 'EXPERIENCE' && entityId) {
    await prisma.experienceBooking.updateMany({
      where: { id: entityId },
      data: { paymentStatus: 'FAILED', updatedAt: new Date() },
    });
  }

  console.warn(`[webhook/paystack] charge.failed: ${reference}`);
}

async function handleRefundProcessed(data: Record<string, unknown>): Promise<void> {
  const reference = data.transaction_reference as string;
  console.info(`[webhook/paystack] refund.processed for transaction: ${reference}`);
  // Phase C will implement full refund reconciliation
}

async function handleTransferSuccess(data: Record<string, unknown>): Promise<void> {
  const transferCode = data.transfer_code as string;
  console.info(`[webhook/paystack] transfer.success: ${transferCode}`);
  // Phase C will implement payout tracking
}

async function handleTransferFailed(data: Record<string, unknown>): Promise<void> {
  const transferCode = data.transfer_code as string;
  console.error(`[webhook/paystack] transfer.failed: ${transferCode} — manual intervention required`);
}

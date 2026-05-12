/**
 * Stripe webhook handler for Coastal Corridor Stays/Experiences bookings.
 * CC-C-02 — distinct from the existing /api/webhooks/stripe route which
 * handles real-estate transactions.
 *
 * Handles:
 *   payment_intent.succeeded  → updates Reservation.paymentStatus = PAID
 *   payment_intent.payment_failed → updates Reservation.paymentStatus = FAILED
 *   charge.refunded           → updates Reservation.paymentStatus = REFUNDED
 *
 * Idempotency: events are deduplicated via IdempotencyCache keyed on
 * Stripe event ID.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getStripeAdapter } from '@/lib/stripe-adapter';
import { getPrismaClient } from '@/lib/db-safe';
import { assertPaymentStatusTransition, PaymentStatusTransitionError } from '@/lib/payment-status-guard';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  // ── Initialise adapter ────────────────────────────────────────────────────
  let adapter;
  try {
    adapter = getStripeAdapter();
  } catch (err) {
    console.error('[webhook/stripe-cc] Adapter init failed:', err);
    return NextResponse.json({ error: 'Payment adapter unavailable' }, { status: 503 });
  }

  // ── Verify signature (AC-9) ───────────────────────────────────────────────
  let event;
  try {
    event = adapter.verifyWebhookSignature(rawBody, signature);
  } catch (err) {
    console.error('[webhook/stripe-cc] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // ── DB ────────────────────────────────────────────────────────────────────
  const db = getPrismaClient();
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  // ── Idempotency check (deduplicate on Stripe event ID) ────────────────────
  const cached = await db.idempotencyCache.findUnique({
    where: { key: `stripe_cc_event_${event.id}` },
  });

  if (cached) {
    console.log(`[webhook/stripe-cc] duplicate event ${event.id} — skipping`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  // ── Event dispatch ────────────────────────────────────────────────────────
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as { id: string; amount: number; currency: string; metadata?: Record<string, string> };
        const reservationId = pi.metadata?.cc_reservation_id;
        
        if (!reservationId) {
          console.warn('[webhook/stripe-cc] payment_intent.succeeded: no cc_reservation_id in metadata');
          break;
        }

        const paymentType = pi.metadata?.payment_type;
        let targetStatus: any = 'PAID';
        if (paymentType === 'DEPOSIT_PAID') targetStatus = 'DEPOSIT_PAID';
        else if (paymentType === 'PARTIALLY_PAID') targetStatus = 'PARTIALLY_PAID';

        const reservation = await db.reservation.findUnique({ where: { id: reservationId } });
        if (reservation) {
          assertPaymentStatusTransition(reservation.paymentStatus, targetStatus);
          await db.reservation.update({
            where: { id: reservationId },
            data: {
              paymentStatus: targetStatus,
              stripePaymentIntentId: pi.id,
            },
          });
        }

        await db.auditEntry.create({
          data: {
            userId: reservationId, // placeholder — no guestUserId in scope here
            entityType: 'Reservation',
            entityId: reservationId,
            action: 'stripe_payment_succeeded',
            metadata: JSON.stringify({
              event: 'payment_intent.succeeded',
              stripeEventId: event.id,
              paymentIntentId: pi.id,
              amountSmallestUnit: pi.amount,
              currency: pi.currency,
              targetStatus,
            }),
          },
        });

        console.log(
          `[webhook/stripe-cc] payment_intent.succeeded: reservation ${reservationId} → ${targetStatus} ` +
          `(pi=${pi.id} amount=${pi.amount} currency=${pi.currency})`
        );
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as { id: string; metadata?: Record<string, string> };
        const reservationId = pi.metadata?.cc_reservation_id;
        
        if (!reservationId) {
          console.warn('[webhook/stripe-cc] payment_intent.payment_failed: no cc_reservation_id in metadata');
          break;
        }

        const reservation = await db.reservation.findUnique({ where: { id: reservationId } });
        if (reservation) {
          assertPaymentStatusTransition(reservation.paymentStatus, 'FAILED');
          await db.reservation.update({
            where: { id: reservationId },
            data: {
              paymentStatus: 'FAILED',
            },
          });
        }

        console.log(`[webhook/stripe-cc] payment_intent.payment_failed: reservation ${reservationId} → FAILED`);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as {
          payment_intent?: string;
          amount_refunded: number;
          currency: string;
          refunds?: { data: Array<{ id: string; status: string }> };
          metadata?: Record<string, string>;
        };
        const piId = charge.payment_intent;
        
        if (!piId) {
          console.warn('[webhook/stripe-cc] charge.refunded: no payment_intent on charge');
          break;
        }

        // Find reservation by stripePaymentIntentId
        const reservation = await db.reservation.findFirst({
          where: { stripePaymentIntentId: piId },
        });

        if (!reservation) {
          console.warn(`[webhook/stripe-cc] charge.refunded: no reservation for pi=${piId}`);
          break;
        }

        const refundType = charge.metadata?.refund_type;
        let targetStatus: any = 'REFUNDED';
        if (refundType === 'PARTIALLY_REFUNDED') targetStatus = 'PARTIALLY_REFUNDED';

        assertPaymentStatusTransition(reservation.paymentStatus, targetStatus);

        const refundAmountDecimal = (charge.amount_refunded / 100).toFixed(2);
        await db.reservation.update({
          where: { id: reservation.id },
          data: {
            paymentStatus: targetStatus,
            status: targetStatus === 'REFUNDED' ? 'REFUNDED' : reservation.status,
            refundAmount: refundAmountDecimal,
          },
        });

        await db.auditEntry.create({
          data: {
            userId: reservation.guestUserId,
            entityType: 'Reservation',
            entityId: reservation.id,
            action: 'stripe_refund_processed',
            metadata: JSON.stringify({
              event: 'charge.refunded',
              stripeEventId: event.id,
              paymentIntentId: piId,
              amountRefundedSmallestUnit: charge.amount_refunded,
              currency: charge.currency,
              refundId: charge.refunds?.data?.[0]?.id,
              targetStatus,
            }),
          },
        });

        console.log(
          `[webhook/stripe-cc] charge.refunded: reservation ${reservation.id} → ${targetStatus} ` +
          `(pi=${piId} amount_refunded=${charge.amount_refunded} currency=${charge.currency})`
        );
        break;
      }
      default:
        console.log(`[webhook/stripe-cc] unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('[webhook/stripe-cc] handler error:', err);
    if (err instanceof PaymentStatusTransitionError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  // ── Cache event ID ────────────────────────────────────────────────────────
  await db.idempotencyCache.create({
    data: {
      key: `stripe_cc_event_${event.id}`,
      responseBody: Buffer.from(JSON.stringify({ received: true })),
      statusCode: 200,
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
    },
  });

  return NextResponse.json({ received: true });
}

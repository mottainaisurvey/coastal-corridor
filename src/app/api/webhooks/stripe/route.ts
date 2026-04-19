export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature || !stripe) {
    return NextResponse.json(
      { error: 'Missing signature or Stripe not configured' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const transactionId = paymentIntent.metadata?.transactionId;

        if (transactionId) {
          // Update transaction status
          const transaction = await prisma.transaction.update({
            where: { id: transactionId },
            data: {
              status: 'ESCROW_FUNDED',
            },
            include: {
              buyer: { include: { profile: true } },
              listing: { include: { property: true, owner: true } },
            },
          });

          // Update payment record
          await prisma.payment.updateMany({
            where: { providerRef: paymentIntent.id },
            data: {
              status: 'successful',
              processedAt: new Date(),
              rawProviderJson: JSON.stringify(paymentIntent),
            },
          });

          // Send confirmation emails
          if (transaction.buyer?.email) {
            await sendEmail({
              to: transaction.buyer.email,
              subject: 'Payment Received - Transaction Initiated',
              htmlBody: `
                <div style="font-family: 'Inter Tight', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="font-size: 24px; font-weight: 300;">Payment Received</h1>
                  <p>Your payment of ₦${(Number(transaction.agreedPriceKobo) / 100).toLocaleString('en-NG')} has been received and is now in escrow.</p>
                  <p><strong>Transaction Reference:</strong> ${transaction.reference}</p>
                  <p><strong>Property:</strong> ${transaction.listing?.property?.title}</p>
                  <p>Your transaction is now in the document review phase. You will receive updates as the process progresses.</p>
                </div>
              `,
            });
          }

          // Notify agent
          if (transaction.listing?.owner?.email) {
            await sendEmail({
              to: transaction.listing.owner.email,
              subject: 'New Transaction - Payment Received',
              htmlBody: `
                <div style="font-family: 'Inter Tight', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="font-size: 24px; font-weight: 300;">Transaction Initiated</h1>
                  <p>A buyer has initiated a transaction for your property.</p>
                  <p><strong>Transaction Reference:</strong> ${transaction.reference}</p>
                  <p><strong>Property:</strong> ${transaction.listing?.property?.title}</p>
                  <p><strong>Agreed Price:</strong> ₦${(Number(transaction.agreedPriceKobo) / 100).toLocaleString('en-NG')}</p>
                  <p>The payment is now in escrow. Please log in to your dashboard to proceed with document verification.</p>
                </div>
              `,
            });
          }

          // Log audit entry
          await prisma.auditEntry.create({
            data: {
              userId: transaction.buyerId,
              entityType: 'Transaction',
              entityId: transactionId,
              action: 'update',
              metadata: JSON.stringify({ status: 'ESCROW_FUNDED', paymentIntentId: paymentIntent.id }),
            },
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const transactionId = paymentIntent.metadata?.transactionId;

        if (transactionId) {
          // Update transaction status
          await prisma.transaction.update({
            where: { id: transactionId },
            data: {
              status: 'CANCELLED',
              cancelReason: 'Payment failed',
            },
          });

          // Update payment record
          await prisma.payment.updateMany({
            where: { providerRef: paymentIntent.id },
            data: {
              status: 'failed',
              rawProviderJson: JSON.stringify(paymentIntent),
            },
          });

          // Log audit entry
          await prisma.auditEntry.create({
            data: {
              entityType: 'Transaction',
              entityId: transactionId,
              action: 'update',
              metadata: JSON.stringify({ status: 'CANCELLED', reason: 'Payment failed' }),
            },
          });
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;

        if (paymentIntentId) {
          // Update payment record
          await prisma.payment.updateMany({
            where: { providerRef: paymentIntentId },
            data: {
              status: 'refunded',
              rawProviderJson: JSON.stringify(charge),
            },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

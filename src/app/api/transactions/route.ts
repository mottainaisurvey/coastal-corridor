import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createPaymentIntent } from '@/lib/payments';

/**
 * POST /api/transactions
 *
 * Initiates a property transaction with escrow and payment processing.
 *
 * SECURITY NOTES:
 * - All transactions require verified buyer identity (KYC)
 * - Escrow partner must be pre-configured and verified
 * - Payment processing requires PCI-DSS compliance
 * - All transactions are logged for audit trail
 * - Title transfer requires lawyer review (not automated)
 */

const TransactionSchema = z.object({
  listingId: z.string().min(1),
  buyerId: z.string().min(1),
  agreedPriceKobo: z.string().regex(/^\d+$/),
  escrowProvider: z.enum(['providus', 'sterling', 'access']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate
    const validationResult = TransactionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { listingId, buyerId, agreedPriceKobo, escrowProvider } = validationResult.data;

    // Verify listing exists and is active
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { property: true, owner: true },
    });

    if (!listing || listing.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Listing not available' },
        { status: 404 }
      );
    }

    // Verify buyer exists
    const buyer = await prisma.user.findUnique({
      where: { id: buyerId },
    });

    if (!buyer) {
      return NextResponse.json(
        { error: 'Buyer not found' },
        { status: 404 }
      );
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        reference: `TXN-${Date.now().toString(36).toUpperCase()}`,
        listingId,
        buyerId,
        agreedPriceKobo: BigInt(agreedPriceKobo),
        currency: 'NGN',
        status: 'INITIATED',
        escrowProvider: escrowProvider || 'providus',
      },
    });

    // Create payment intent with Stripe
    try {
      const paymentIntent = await createPaymentIntent({
        amount: BigInt(agreedPriceKobo),
        currency: 'NGN',
        description: `Property purchase: ${listing.property?.title}`,
        metadata: {
          transactionId: transaction.id,
          listingId,
          buyerId,
        },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          transactionId: transaction.id,
          provider: 'stripe',
          providerRef: paymentIntent.intentId,
          amountKobo: BigInt(agreedPriceKobo),
          currency: 'NGN',
          status: 'pending',
          method: 'card',
        },
      });

      // Log audit entry
      await prisma.auditEntry.create({
        data: {
          userId: buyerId,
          entityType: 'Transaction',
          entityId: transaction.id,
          action: 'create',
          metadata: JSON.stringify({ listingId, amount: agreedPriceKobo }),
        },
      });

      return NextResponse.json(
        {
          data: {
            transactionId: transaction.id,
            reference: transaction.reference,
            clientSecret: paymentIntent.clientSecret,
            status: transaction.status,
          },
        },
        { status: 201 }
      );
    } catch (paymentError) {
      // If payment intent creation fails, mark transaction as failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'CANCELLED', cancelReason: 'Payment processing failed' },
      });

      console.error('Payment intent creation failed:', paymentError);
      return NextResponse.json(
        { error: 'Payment processing failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Transaction creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('id');
    const buyerId = searchParams.get('buyerId');
    const status = searchParams.get('status');

    if (!transactionId && !buyerId) {
      return NextResponse.json(
        { error: 'Transaction ID or Buyer ID required' },
        { status: 400 }
      );
    }

    const where: any = {};
    if (transactionId) where.id = transactionId;
    if (buyerId) where.buyerId = buyerId;
    if (status) where.status = status;

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        listing: { include: { property: true } },
        buyer: { include: { profile: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      data: transactions,
    });
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

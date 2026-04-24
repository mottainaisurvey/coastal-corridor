export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { advanceEscrow, buildMilestones, getAvailableTransitions } from '@/lib/escrow';
import type { EscrowState } from '@/lib/escrow';

/**
 * GET /api/escrow/[transactionId]
 * Returns full transaction detail with escrow milestones and available transitions.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const transaction = await prisma.transaction.findUnique({
    where: { id: params.transactionId },
    include: {
      buyer: { select: { id: true, email: true, role: true } },
      listing: {
        include: {
          property: { select: { title: true, plotId: true, propertyType: true } },
          owner: { select: { id: true, email: true } },
        },
      },
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!transaction) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  // Only buyer, agent/owner, or admin can view
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(user.role);
  const isBuyer = transaction.buyerId === user.id;
  const isOwner = transaction.listing?.owner?.id === user.id;

  if (!isAdmin && !isBuyer && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const currentState = transaction.status as EscrowState;
  const milestones = buildMilestones(currentState, {
    createdAt: transaction.createdAt,
    escrowFundedAt: transaction.escrowFundedAt,
    completedAt: transaction.completedAt,
  });

  const availableTransitions = isAdmin || isOwner
    ? getAvailableTransitions(currentState)
    : [];

  return NextResponse.json({
    transaction: {
      id: transaction.id,
      reference: transaction.reference,
      status: transaction.status,
      agreedPriceKobo: transaction.agreedPriceKobo.toString(),
      currency: transaction.currency,
      escrowProvider: transaction.escrowProvider,
      escrowReference: transaction.escrowReference,
      escrowFundedAt: transaction.escrowFundedAt,
      completedAt: transaction.completedAt,
      cancelledAt: transaction.cancelledAt,
      cancelReason: transaction.cancelReason,
      docsChecklistJson: transaction.docsChecklistJson,
      createdAt: transaction.createdAt,
      buyer: transaction.buyer,
      listing: transaction.listing,
      payments: transaction.payments.map((p: { amountKobo: bigint; [key: string]: unknown }) => ({
        ...p,
        amountKobo: p.amountKobo.toString(),
      })),
    },
    milestones,
    availableTransitions,
  });
}

/**
 * PATCH /api/escrow/[transactionId]
 * Advance the escrow state. Admin or listing owner only.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json();
  const { toState, note } = body as { toState: EscrowState; note?: string };

  if (!toState) {
    return NextResponse.json({ error: 'toState is required' }, { status: 400 });
  }

  // Verify permission: admin, or listing owner
  const transaction = await prisma.transaction.findUnique({
    where: { id: params.transactionId },
    include: { listing: { include: { owner: true } } },
  });

  if (!transaction) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(user.role);
  const isOwner = transaction.listing?.owner?.id === user.id;
  const isBuyer = transaction.buyerId === user.id;

  // Buyers can only cancel or raise disputes
  const buyerAllowed = ['CANCELLED', 'DISPUTED'].includes(toState);
  if (!isAdmin && !isOwner && !(isBuyer && buyerAllowed)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await advanceEscrow(params.transactionId, toState, user.id, note);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, newState: toState });
}

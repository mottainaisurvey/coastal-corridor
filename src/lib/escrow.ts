/**
 * Coastal Corridor — Escrow State Machine
 *
 * Manages the lifecycle of a property transaction through defined states.
 * All transitions are logged to the AuditEntry table.
 *
 * State flow:
 *   INITIATED → ESCROW_FUNDED → DOCUMENTS_REVIEW → AWAITING_GOVT_CONSENT → COMPLETED
 *                                                                          ↘ CANCELLED
 *                                                ↘ DISPUTED (from any active state)
 */

import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export type EscrowState =
  | 'INITIATED'
  | 'ESCROW_FUNDED'
  | 'DOCUMENTS_REVIEW'
  | 'AWAITING_GOVT_CONSENT'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export interface EscrowTransition {
  from: EscrowState[];
  to: EscrowState;
  label: string;
  description: string;
}

// Valid state transitions
export const ESCROW_TRANSITIONS: EscrowTransition[] = [
  {
    from: ['INITIATED'],
    to: 'ESCROW_FUNDED',
    label: 'Fund Escrow',
    description: 'Buyer funds the escrow account. Funds are held by the escrow provider.',
  },
  {
    from: ['ESCROW_FUNDED'],
    to: 'DOCUMENTS_REVIEW',
    label: 'Begin Document Review',
    description: 'Both parties submit required documents for legal review.',
  },
  {
    from: ['DOCUMENTS_REVIEW'],
    to: 'AWAITING_GOVT_CONSENT',
    label: 'Submit for Government Consent',
    description: 'Documents approved. Submitted to relevant land registry for consent.',
  },
  {
    from: ['AWAITING_GOVT_CONSENT'],
    to: 'COMPLETED',
    label: 'Complete Transaction',
    description: 'Government consent obtained. Funds released to seller. Title transferred.',
  },
  {
    from: ['INITIATED', 'ESCROW_FUNDED', 'DOCUMENTS_REVIEW', 'AWAITING_GOVT_CONSENT'],
    to: 'CANCELLED',
    label: 'Cancel Transaction',
    description: 'Transaction cancelled. Escrow funds returned to buyer (minus fees).',
  },
  {
    from: ['ESCROW_FUNDED', 'DOCUMENTS_REVIEW', 'AWAITING_GOVT_CONSENT'],
    to: 'DISPUTED',
    label: 'Raise Dispute',
    description: 'A dispute has been raised. Transaction paused pending resolution.',
  },
];

export function canTransition(from: EscrowState, to: EscrowState): boolean {
  return ESCROW_TRANSITIONS.some(t => t.from.includes(from) && t.to === to);
}

export function getAvailableTransitions(state: EscrowState): EscrowTransition[] {
  return ESCROW_TRANSITIONS.filter(t => t.from.includes(state));
}

export interface EscrowMilestone {
  state: EscrowState;
  label: string;
  description: string;
  completedAt?: Date | null;
  isActive: boolean;
  isCompleted: boolean;
}

export function buildMilestones(
  currentState: EscrowState,
  transaction: {
    createdAt: Date;
    escrowFundedAt?: Date | null;
    completedAt?: Date | null;
  }
): EscrowMilestone[] {
  const flow: EscrowState[] = [
    'INITIATED',
    'ESCROW_FUNDED',
    'DOCUMENTS_REVIEW',
    'AWAITING_GOVT_CONSENT',
    'COMPLETED',
  ];

  const flowIndex = flow.indexOf(currentState);

  return flow.map((state, i) => ({
    state,
    label: ESCROW_TRANSITIONS.find(t => t.to === state)?.label ?? 'Transaction Initiated',
    description:
      ESCROW_TRANSITIONS.find(t => t.to === state)?.description ??
      'Transaction has been created and is awaiting escrow funding.',
    completedAt:
      state === 'INITIATED'
        ? transaction.createdAt
        : state === 'ESCROW_FUNDED'
        ? transaction.escrowFundedAt
        : state === 'COMPLETED'
        ? transaction.completedAt
        : null,
    isActive: state === currentState,
    isCompleted: i < flowIndex || currentState === 'COMPLETED',
  }));
}

/**
 * Advance a transaction to the next state.
 * Validates the transition, updates the DB, logs an audit entry,
 * and sends email notifications.
 */
export async function advanceEscrow(
  transactionId: string,
  toState: EscrowState,
  actorUserId: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      buyer: true,
      listing: {
        include: {
          property: true,
          owner: true,
        },
      },
    },
  });

  if (!transaction) {
    return { success: false, error: 'Transaction not found' };
  }

  const fromState = transaction.status as EscrowState;

  if (!canTransition(fromState, toState)) {
    return {
      success: false,
      error: `Cannot transition from ${fromState} to ${toState}`,
    };
  }

  // Build update payload
  const updateData: Record<string, unknown> = { status: toState };
  if (toState === 'ESCROW_FUNDED') updateData.escrowFundedAt = new Date();
  if (toState === 'COMPLETED') updateData.completedAt = new Date();
  if (toState === 'CANCELLED') {
    updateData.cancelledAt = new Date();
    if (note) updateData.cancelReason = note;
  }

  // Update transaction
  await prisma.transaction.update({
    where: { id: transactionId },
    data: updateData,
  });

  // Log audit entry
  await prisma.auditEntry.create({
    data: {
      userId: actorUserId,
      action: `ESCROW_${toState}`,
      entityType: 'Transaction',
      entityId: transactionId,
      details: JSON.stringify({
        from: fromState,
        to: toState,
        note: note ?? null,
      }),
    },
  });

  // Send email notifications
  try {
    const propertyTitle =
      transaction.listing?.property?.title ?? 'Property';
    const reference = transaction.reference;

    // Notify buyer
    if (transaction.buyer?.email) {
      await sendEmail({
        to: transaction.buyer.email,
        subject: `Transaction Update — ${reference}`,
        htmlBody: `
          <p>Dear ${transaction.buyer.email},</p>
          <p>Your transaction for <strong>${propertyTitle}</strong> (ref: <code>${reference}</code>) 
          has been updated to: <strong>${toState.replace(/_/g, ' ')}</strong>.</p>
          ${note ? `<p>Note: ${note}</p>` : ''}
          <p>Log in to your account to view the full transaction timeline.</p>
          <p>— Coastal Corridor</p>
        `,
      });
    }

    // Notify agent/seller
    if (transaction.listing?.owner?.email) {
      await sendEmail({
        to: transaction.listing.owner.email,
        subject: `Transaction Update — ${reference}`,
        htmlBody: `
          <p>Transaction <code>${reference}</code> for <strong>${propertyTitle}</strong> 
          has moved to: <strong>${toState.replace(/_/g, ' ')}</strong>.</p>
          ${note ? `<p>Note: ${note}</p>` : ''}
          <p>— Coastal Corridor</p>
        `,
      });
    }
  } catch {
    // Email failure is non-fatal
  }

  return { success: true };
}

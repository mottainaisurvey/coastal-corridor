import { PaymentStatus } from '@prisma/client';

/**
 * Coastal Corridor Channel Adapter
 * 
 * Enforces canonical-only type narrowing for outbound PATCH to Owambe.
 * This adapter ensures that only the 7 canonical PaymentStatus values
 * are emitted to the Owambe platform.
 */

export type CanonicalPaymentStatus = 
  | 'PENDING'
  | 'DEPOSIT_PAID'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED'
  | 'FAILED';

export function toCanonicalPaymentStatus(status: string): CanonicalPaymentStatus {
  const validStatuses: CanonicalPaymentStatus[] = [
    'PENDING',
    'DEPOSIT_PAID',
    'PARTIALLY_PAID',
    'PAID',
    'PARTIALLY_REFUNDED',
    'REFUNDED',
    'FAILED'
  ];

  if (validStatuses.includes(status as CanonicalPaymentStatus)) {
    return status as CanonicalPaymentStatus;
  }

  throw new Error(`Invalid canonical payment status: ${status}`);
}

export interface OwambePatchPayload {
  paymentStatus: CanonicalPaymentStatus;
  [key: string]: any;
}

export function createOwambePatchPayload(status: string, additionalData: Record<string, any> = {}): OwambePatchPayload {
  return {
    paymentStatus: toCanonicalPaymentStatus(status),
    ...additionalData
  };
}

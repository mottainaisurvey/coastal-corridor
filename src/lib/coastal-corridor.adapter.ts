import { PaymentStatus } from '@prisma/client';

/**
 * Coastal Corridor Channel Adapter
 *
 * Enforces canonical-only type narrowing for outbound PATCH to Owambe.
 * This adapter ensures that only the 7 canonical PaymentStatus values
 * are emitted to the Owambe platform.
 *
 * Outbound URL path constants (v1.3 canonical — Amendment 007):
 *   POST  /api/v1/channel/stays/reservations
 *   PATCH /api/v1/channel/stays/reservations/{cc_reservation_id}
 *
 * Legacy paths (/coastal-corridor/reservations) are kept alive on
 * Owambe staging until Phase B cleanup; do NOT use them for new calls.
 */

// ── Outbound URL path constants ───────────────────────────────────────────────
// These are the canonical paths CC emits to Owambe (v1.3 / Amendment 007).
// The base URL is read from OWAMBE_API_BASE_URL at runtime.
// NOTE (Phase E #2 / 2026-05-17): OWAMBE_RESERVATION_POST_PATH is currently orphaned —
// no CC-initiated outbound POST to Owambe for stays reservations exists or is being built.
// The active integration direction is Owambe → CC (Owambe originates the POST;
// CC receives at /api/v1/channel/stays/reservations and returns 201 with cc_property_id
// in the response body). This constant is preserved as documented intent in case a
// CC-initiated push direction is added in a future wave. If that path is never built,
// this constant should be removed at that point.
export const OWAMBE_RESERVATION_POST_PATH = '/api/v1/channel/stays/reservations';
export const OWAMBE_RESERVATION_PATCH_PATH = (ccReservationId: string) =>
  `/api/v1/channel/stays/reservations/${ccReservationId}`;

// CC-D-01-D: Experience booking outbound path
export const OWAMBE_EXPERIENCE_BOOKING_POST_PATH = '/api/v1/channel/experiences/bookings';

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
  payment_status: CanonicalPaymentStatus;
  [key: string]: any;
}

export function createOwambePatchPayload(status: string, additionalData: Record<string, any> = {}): OwambePatchPayload {
  return {
    payment_status: toCanonicalPaymentStatus(status),
    ...additionalData
  };
}

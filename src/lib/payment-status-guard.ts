/**
 * PAY-CANONICAL-01-CC — Payment Status Transition Guard
 *
 * Enforces the 14-edge directed acyclic graph of valid PaymentStatus transitions.
 * Any attempt to apply an unlisted transition throws PaymentStatusTransitionError,
 * which callers should surface as HTTP 422.
 *
 * Canonical 7-state graph (contract v1.1):
 *
 *   PENDING ──────────────────────────────────────────────► FAILED
 *   PENDING ──────────────────────────────────────────────► DEPOSIT_PAID
 *   PENDING ──────────────────────────────────────────────► PARTIALLY_PAID
 *   PENDING ──────────────────────────────────────────────► PAID
 *   DEPOSIT_PAID ─────────────────────────────────────────► PARTIALLY_PAID
 *   DEPOSIT_PAID ─────────────────────────────────────────► PAID
 *   DEPOSIT_PAID ─────────────────────────────────────────► PARTIALLY_REFUNDED
 *   DEPOSIT_PAID ─────────────────────────────────────────► REFUNDED
 *   DEPOSIT_PAID ─────────────────────────────────────────► FAILED
 *   PARTIALLY_PAID ───────────────────────────────────────► PAID
 *   PARTIALLY_PAID ───────────────────────────────────────► PARTIALLY_REFUNDED
 *   PARTIALLY_PAID ───────────────────────────────────────► REFUNDED
 *   PAID ─────────────────────────────────────────────────► PARTIALLY_REFUNDED
 *   PAID ─────────────────────────────────────────────────► REFUNDED
 *
 * Terminal states: FAILED, REFUNDED
 * PARTIALLY_REFUNDED is not terminal — a second refund can reach REFUNDED.
 */

export type PaymentStatus =
  | 'PENDING'
  | 'DEPOSIT_PAID'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED'
  | 'FAILED';

/**
 * Directed adjacency list — 14 edges.
 * Key: from-state. Value: set of reachable to-states.
 */
const TRANSITIONS: Readonly<Record<PaymentStatus, ReadonlySet<PaymentStatus>>> = {
  PENDING: new Set<PaymentStatus>(['FAILED', 'DEPOSIT_PAID', 'PARTIALLY_PAID', 'PAID']),
  DEPOSIT_PAID: new Set<PaymentStatus>(['PARTIALLY_PAID', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED']),
  PARTIALLY_PAID: new Set<PaymentStatus>(['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED']),
  PAID: new Set<PaymentStatus>(['PARTIALLY_REFUNDED', 'REFUNDED']),
  PARTIALLY_REFUNDED: new Set<PaymentStatus>(['REFUNDED']),
  REFUNDED: new Set<PaymentStatus>(),   // terminal
  FAILED: new Set<PaymentStatus>(),     // terminal
};

/**
 * Thrown when a requested PaymentStatus transition is not in the allowed graph.
 * Callers should return HTTP 422 with this error's message.
 */
export class PaymentStatusTransitionError extends Error {
  public readonly from: PaymentStatus;
  public readonly to: PaymentStatus;
  public readonly statusCode = 422;

  constructor(from: PaymentStatus, to: PaymentStatus) {
    super(
      `Invalid PaymentStatus transition: ${from} → ${to}. ` +
      `Allowed transitions from ${from}: [${[...TRANSITIONS[from]].join(', ') || 'none — terminal state'}].`
    );
    this.name = 'PaymentStatusTransitionError';
    this.from = from;
    this.to = to;
  }
}

/**
 * Asserts that the transition from → to is valid.
 * Throws PaymentStatusTransitionError if not.
 *
 * @param from - Current PaymentStatus
 * @param to   - Requested PaymentStatus
 */
export function assertPaymentStatusTransition(
  from: PaymentStatus,
  to: PaymentStatus
): void {
  if (from === to) return; // idempotent — no-op
  const allowed = TRANSITIONS[from];
  if (!allowed.has(to)) {
    throw new PaymentStatusTransitionError(from, to);
  }
}

/**
 * Returns true if the transition from → to is valid, false otherwise.
 * Non-throwing variant for conditional logic.
 */
export function isValidPaymentStatusTransition(
  from: PaymentStatus,
  to: PaymentStatus
): boolean {
  if (from === to) return true;
  return TRANSITIONS[from].has(to);
}

/**
 * Returns the set of valid next states from the given state.
 */
export function allowedTransitionsFrom(
  from: PaymentStatus
): ReadonlySet<PaymentStatus> {
  return TRANSITIONS[from];
}

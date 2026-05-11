/**
 * CommissionCalculator — CC-C-07
 *
 * Canonical commission calculation for Stays and Experiences verticals.
 *
 * Contract rates (Section 13 of the Owambe API contract):
 *   STAYS   — COHORT HOST     12%  (host receives 88% net)
 *   STAYS   — STANDARD HOST   15%  (host receives 85% net)
 *   EXPERIENCES — COHORT OP   15%  (operator receives 85% net)
 *   EXPERIENCES — STANDARD OP 18%  (operator receives 82% net)
 *
 * Rate resolution order:
 *   1. HostProfile.commissionRate / OperatorProfile.commissionRate (negotiated)
 *   2. Cohort default (cohort_member = true)
 *   3. Standard default
 *
 * All monetary values are in the smallest currency unit (kobo for NGN,
 * cents for USD/GBP). Decimal arithmetic uses integer rounding to avoid
 * floating-point drift.
 *
 * CC-C-07 Acceptance criteria: AC-1 through AC-7.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type BookingVertical = 'STAYS' | 'EXPERIENCES';

export interface CommissionInput {
  /** Total booking amount in smallest currency unit */
  totalAmountSmallestUnit: number;
  /** ISO 4217 currency code */
  currency: 'NGN' | 'USD' | 'GBP';
  vertical: BookingVertical;
  /** Whether the host/operator is a cohort member */
  isCohortMember: boolean;
  /**
   * Negotiated commission rate as a decimal fraction (e.g. 0.12 = 12%).
   * If provided, overrides the cohort/standard default.
   */
  negotiatedRate?: number;
}

export interface CommissionResult {
  /** Commission rate applied as a decimal fraction */
  rateApplied: number;
  /** Commission rate as a percentage (for storage in Reservation.channelCommissionPercent) */
  ratePercent: number;
  /** Channel commission in smallest currency unit */
  channelCommissionSmallestUnit: number;
  /** Net amount to host/operator in smallest currency unit */
  netToHostSmallestUnit: number;
  /** Human-readable breakdown string for audit logs */
  breakdown: string;
}

// ─── Default rates ────────────────────────────────────────────────────────────

export const COMMISSION_RATES = {
  STAYS: {
    COHORT: 0.12,
    STANDARD: 0.15,
  },
  EXPERIENCES: {
    COHORT: 0.15,
    STANDARD: 0.18,
  },
} as const;

// ─── CommissionCalculator ─────────────────────────────────────────────────────

export class CommissionCalculator {
  /**
   * Calculates the commission split for a booking.
   *
   * Uses integer arithmetic to avoid floating-point drift:
   * channelCommission = round(total * rate)
   * netToHost = total - channelCommission
   */
  calculate(input: CommissionInput): CommissionResult {
    const { totalAmountSmallestUnit, currency, vertical, isCohortMember, negotiatedRate } = input;

    if (totalAmountSmallestUnit < 0) {
      throw new Error(`[CommissionCalculator] totalAmountSmallestUnit must be non-negative, got ${totalAmountSmallestUnit}`);
    }

    // Resolve rate
    let rateApplied: number;
    let rateSource: string;

    if (negotiatedRate !== undefined && negotiatedRate !== null) {
      if (negotiatedRate < 0 || negotiatedRate > 1) {
        throw new Error(`[CommissionCalculator] negotiatedRate must be between 0 and 1, got ${negotiatedRate}`);
      }
      rateApplied = negotiatedRate;
      rateSource = 'negotiated';
    } else if (isCohortMember) {
      rateApplied = COMMISSION_RATES[vertical].COHORT;
      rateSource = 'cohort_default';
    } else {
      rateApplied = COMMISSION_RATES[vertical].STANDARD;
      rateSource = 'standard_default';
    }

    const channelCommissionSmallestUnit = Math.round(totalAmountSmallestUnit * rateApplied);
    const netToHostSmallestUnit = totalAmountSmallestUnit - channelCommissionSmallestUnit;
    const ratePercent = rateApplied * 100;

    const breakdown =
      `vertical=${vertical} currency=${currency} total=${totalAmountSmallestUnit} ` +
      `rate=${ratePercent.toFixed(2)}% (${rateSource}) ` +
      `commission=${channelCommissionSmallestUnit} net=${netToHostSmallestUnit}`;

    console.log(`[CommissionCalculator] ${breakdown}`);

    return {
      rateApplied,
      ratePercent,
      channelCommissionSmallestUnit,
      netToHostSmallestUnit,
      breakdown,
    };
  }

  /**
   * Resolves the commission rate for a host/operator from their profile.
   * Returns the negotiated rate if set, otherwise the cohort/standard default.
   *
   * @param profileCommissionRate - Decimal from HostProfile.commissionRate or OperatorProfile.commissionRate
   * @param isCohortMember - From User.cohort_member
   * @param vertical - STAYS or EXPERIENCES
   */
  static resolveRate(
    profileCommissionRate: number | null | undefined,
    isCohortMember: boolean,
    vertical: BookingVertical
  ): { rate: number; source: 'negotiated' | 'cohort_default' | 'standard_default' } {
    if (profileCommissionRate !== null && profileCommissionRate !== undefined) {
      return { rate: profileCommissionRate, source: 'negotiated' };
    }
    if (isCohortMember) {
      return { rate: COMMISSION_RATES[vertical].COHORT, source: 'cohort_default' };
    }
    return { rate: COMMISSION_RATES[vertical].STANDARD, source: 'standard_default' };
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _calculator: CommissionCalculator | null = null;

export function getCommissionCalculator(): CommissionCalculator {
  if (!_calculator) {
    _calculator = new CommissionCalculator();
  }
  return _calculator;
}

/** @internal — test use only */
export function _resetCommissionCalculatorForTesting(): void {
  _calculator = null;
}

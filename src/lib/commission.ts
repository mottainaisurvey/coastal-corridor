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
 * Rate resolution order (updated CC-WAVE5-COHORT-FLAG-ENFORCEMENT-01):
 *   1. Cohort flag (isCohortMember = true) — cohortMember is the authoritative
 *      source of truth for cohort enrolment. Takes precedence over stored
 *      commissionRate so that onboarding gaps (new cohort hosts whose
 *      commissionRate was not updated by the CC-C-08-D-1 backfill) never
 *      produce the wrong rate.
 *   2. Negotiated rate (HostProfile.commissionRate / OperatorProfile.commissionRate)
 *      — applies only to non-cohort hosts/operators with a stored rate.
 *   3. Standard default — fallback for non-cohort hosts/operators with no
 *      stored rate.
 *
 * Note: HostProfile.commissionRate has @default(0.15) and is non-nullable,
 * so negotiatedRate is always populated at the call site in the reservations
 * route. The cohort flag check MUST come first to prevent the negotiated-rate
 * branch from masking cohort hosts (CC-WAVE5-COMMISSION-PROBE-01 finding).
 *
 * All monetary values are in the smallest currency unit (kobo for NGN,
 * cents for USD/GBP). Decimal arithmetic uses integer rounding to avoid
 * floating-point drift.
 *
 * CC-C-07 Acceptance criteria: AC-1 through AC-7.
 * CC-WAVE5-COHORT-FLAG-ENFORCEMENT-01: priority order updated (Phase E #17).
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
    // Priority order (CC-WAVE5-COHORT-FLAG-ENFORCEMENT-01):
    //   1. cohortMember flag — authoritative for cohort enrolment.
    //      cohortMember=true → cohort rate (12% for STAYS, 15% for EXPERIENCES)
    //      regardless of stored HostProfile.commissionRate value.
    //   2. negotiatedRate — stored commissionRate for non-cohort hosts.
    //      (Always populated for STAYS because HostProfile.commissionRate
    //      has @default(0.15); see probe transcript CC-WAVE5-COMMISSION-PROBE-01.)
    //   3. Standard default — fallback when neither cohort flag nor negotiated
    //      rate is available.
    let rateApplied: number;
    let rateSource: string;

    if (isCohortMember) {
      // Priority 1: cohort flag is authoritative.
      // cohortMember=true → use cohort rate regardless of stored commissionRate.
      rateApplied = COMMISSION_RATES[vertical].COHORT;
      rateSource = 'cohort_default';
    } else if (negotiatedRate !== undefined && negotiatedRate !== null) {
      // Priority 2: stored negotiated rate for non-cohort hosts/operators.
      if (negotiatedRate < 0 || negotiatedRate > 1) {
        throw new Error(`[CommissionCalculator] negotiatedRate must be between 0 and 1, got ${negotiatedRate}`);
      }
      rateApplied = negotiatedRate;
      rateSource = 'negotiated';
    } else {
      // Priority 3: standard default.
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
   *
   * Priority order (CC-WAVE5-COHORT-FLAG-ENFORCEMENT-01 — mirrors calculate()):
   *   1. cohortMember flag — authoritative for cohort enrolment.
   *      cohortMember=true → cohort rate regardless of stored commissionRate.
   *   2. profileCommissionRate — stored negotiated rate for non-cohort hosts.
   *   3. Standard default — fallback.
   *
   * @param profileCommissionRate - Decimal from HostProfile.commissionRate or OperatorProfile.commissionRate
   * @param isCohortMember - From User.cohortMember
   * @param vertical - STAYS or EXPERIENCES
   */
  static resolveRate(
    profileCommissionRate: number | null | undefined,
    isCohortMember: boolean,
    vertical: BookingVertical
  ): { rate: number; source: 'negotiated' | 'cohort_default' | 'standard_default' } {
    // Priority 1: cohort flag is authoritative.
    if (isCohortMember) {
      return { rate: COMMISSION_RATES[vertical].COHORT, source: 'cohort_default' };
    }
    // Priority 2: stored negotiated rate.
    if (profileCommissionRate !== null && profileCommissionRate !== undefined) {
      return { rate: profileCommissionRate, source: 'negotiated' };
    }
    // Priority 3: standard default.
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

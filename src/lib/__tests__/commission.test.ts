/**
 * CommissionCalculator unit tests — CC-C-07
 *
 * Covers all acceptance criteria for the CommissionCalculator module:
 *   AC-1: calculate() accepts vertical=STAYS and vertical=EXPERIENCES
 *   AC-2: Commission fields are computed correctly (integer arithmetic)
 *   AC-3: Negotiated rate overrides cohort/standard default
 *   AC-4: Cohort default applied when isCohortMember=true and no negotiated rate
 *         STAYS cohort = 12%, EXPERIENCES cohort = 15%
 *   AC-5: Standard default applied when isCohortMember=false and no negotiated rate
 *         STAYS standard = 15%, EXPERIENCES standard = 18%
 *   AC-6: breakdown string is logged and returned
 *   AC-7: Invalid inputs throw with descriptive error messages
 *
 * Additional:
 *   - COMMISSION_RATES constants match contract Section 13
 *   - resolveRate static method returns correct source label
 *   - Integer rounding: commission = round(total * rate), net = total - commission
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  CommissionCalculator,
  COMMISSION_RATES,
  getCommissionCalculator,
  _resetCommissionCalculatorForTesting,
} from '../commission';

// ─── COMMISSION_RATES constants ───────────────────────────────────────────────
describe('COMMISSION_RATES constants (contract Section 13)', () => {
  it('STAYS COHORT rate is 12%', () => {
    expect(COMMISSION_RATES.STAYS.COHORT).toBe(0.12);
  });
  it('STAYS STANDARD rate is 15%', () => {
    expect(COMMISSION_RATES.STAYS.STANDARD).toBe(0.15);
  });
  it('EXPERIENCES COHORT rate is 15%', () => {
    expect(COMMISSION_RATES.EXPERIENCES.COHORT).toBe(0.15);
  });
  it('EXPERIENCES STANDARD rate is 18%', () => {
    expect(COMMISSION_RATES.EXPERIENCES.STANDARD).toBe(0.18);
  });
});

// ─── CommissionCalculator.calculate() ────────────────────────────────────────
describe('CommissionCalculator.calculate()', () => {
  let calculator: CommissionCalculator;

  beforeEach(() => {
    calculator = new CommissionCalculator();
  });

  // AC-4: STAYS cohort default (12%)
  it('AC-4: STAYS cohort member → 12% commission', () => {
    const result = calculator.calculate({
      totalAmountSmallestUnit: 100_000, // NGN 1,000.00 in kobo
      currency: 'NGN',
      vertical: 'STAYS',
      isCohortMember: true,
    });
    expect(result.rateApplied).toBe(0.12);
    expect(result.ratePercent).toBe(12);
    expect(result.channelCommissionSmallestUnit).toBe(12_000);
    expect(result.netToHostSmallestUnit).toBe(88_000);
  });

  // AC-5: STAYS standard default (15%)
  it('AC-5: STAYS non-cohort member → 15% commission', () => {
    const result = calculator.calculate({
      totalAmountSmallestUnit: 100_000,
      currency: 'NGN',
      vertical: 'STAYS',
      isCohortMember: false,
    });
    expect(result.rateApplied).toBe(0.15);
    expect(result.ratePercent).toBe(15);
    expect(result.channelCommissionSmallestUnit).toBe(15_000);
    expect(result.netToHostSmallestUnit).toBe(85_000);
  });

  // AC-4: EXPERIENCES cohort default (15%)
  it('AC-4: EXPERIENCES cohort member → 15% commission', () => {
    const result = calculator.calculate({
      totalAmountSmallestUnit: 50_000,
      currency: 'NGN',
      vertical: 'EXPERIENCES',
      isCohortMember: true,
    });
    expect(result.rateApplied).toBe(0.15);
    expect(result.ratePercent).toBe(15);
    expect(result.channelCommissionSmallestUnit).toBe(7_500);
    expect(result.netToHostSmallestUnit).toBe(42_500);
  });

  // AC-5: EXPERIENCES standard default (18%)
  it('AC-5: EXPERIENCES non-cohort member → 18% commission', () => {
    const result = calculator.calculate({
      totalAmountSmallestUnit: 50_000,
      currency: 'NGN',
      vertical: 'EXPERIENCES',
      isCohortMember: false,
    });
    expect(result.rateApplied).toBe(0.18);
    expect(result.ratePercent).toBe(18);
    expect(result.channelCommissionSmallestUnit).toBe(9_000);
    expect(result.netToHostSmallestUnit).toBe(41_000);
  });

  // AC-3: Negotiated rate overrides cohort default
  it('AC-3: negotiatedRate overrides cohort default for STAYS', () => {
    const result = calculator.calculate({
      totalAmountSmallestUnit: 100_000,
      currency: 'NGN',
      vertical: 'STAYS',
      isCohortMember: true,
      negotiatedRate: 0.10, // 10% negotiated
    });
    expect(result.rateApplied).toBe(0.10);
    expect(result.ratePercent).toBe(10);
    expect(result.channelCommissionSmallestUnit).toBe(10_000);
    expect(result.netToHostSmallestUnit).toBe(90_000);
  });

  // AC-3: Negotiated rate overrides standard default
  it('AC-3: negotiatedRate overrides standard default for EXPERIENCES', () => {
    const result = calculator.calculate({
      totalAmountSmallestUnit: 200_000,
      currency: 'GBP',
      vertical: 'EXPERIENCES',
      isCohortMember: false,
      negotiatedRate: 0.08, // 8% negotiated
    });
    expect(result.rateApplied).toBe(0.08);
    expect(result.channelCommissionSmallestUnit).toBe(16_000);
    expect(result.netToHostSmallestUnit).toBe(184_000);
  });

  // AC-2: Integer arithmetic — rounding
  it('AC-2: uses integer rounding (round half up)', () => {
    // 10001 kobo * 0.15 = 1500.15 → rounds to 1500
    const result = calculator.calculate({
      totalAmountSmallestUnit: 10_001,
      currency: 'NGN',
      vertical: 'STAYS',
      isCohortMember: false,
    });
    expect(result.channelCommissionSmallestUnit).toBe(1_500);
    expect(result.netToHostSmallestUnit).toBe(8_501);
  });

  // AC-2: net = total - commission (no floating-point drift)
  it('AC-2: net + commission = total (no floating-point drift)', () => {
    const result = calculator.calculate({
      totalAmountSmallestUnit: 333_333,
      currency: 'NGN',
      vertical: 'STAYS',
      isCohortMember: true,
    });
    expect(result.channelCommissionSmallestUnit + result.netToHostSmallestUnit).toBe(333_333);
  });

  // AC-2: zero amount
  it('AC-2: zero total amount → zero commission and zero net', () => {
    const result = calculator.calculate({
      totalAmountSmallestUnit: 0,
      currency: 'NGN',
      vertical: 'STAYS',
      isCohortMember: false,
    });
    expect(result.channelCommissionSmallestUnit).toBe(0);
    expect(result.netToHostSmallestUnit).toBe(0);
  });

  // AC-6: breakdown string
  it('AC-6: returns a non-empty breakdown string', () => {
    const result = calculator.calculate({
      totalAmountSmallestUnit: 100_000,
      currency: 'USD',
      vertical: 'STAYS',
      isCohortMember: false,
    });
    expect(result.breakdown).toContain('vertical=STAYS');
    expect(result.breakdown).toContain('currency=USD');
    expect(result.breakdown).toContain('rate=15.00%');
    expect(result.breakdown).toContain('standard_default');
  });

  // AC-7: negative total throws
  it('AC-7: throws on negative totalAmountSmallestUnit', () => {
    expect(() =>
      calculator.calculate({
        totalAmountSmallestUnit: -1,
        currency: 'NGN',
        vertical: 'STAYS',
        isCohortMember: false,
      })
    ).toThrow('must be non-negative');
  });

  // AC-7: out-of-range negotiated rate throws
  it('AC-7: throws if negotiatedRate > 1', () => {
    expect(() =>
      calculator.calculate({
        totalAmountSmallestUnit: 100_000,
        currency: 'NGN',
        vertical: 'STAYS',
        isCohortMember: false,
        negotiatedRate: 1.5,
      })
    ).toThrow('must be between 0 and 1');
  });

  it('AC-7: throws if negotiatedRate < 0', () => {
    expect(() =>
      calculator.calculate({
        totalAmountSmallestUnit: 100_000,
        currency: 'NGN',
        vertical: 'STAYS',
        isCohortMember: false,
        negotiatedRate: -0.01,
      })
    ).toThrow('must be between 0 and 1');
  });
});

// ─── CommissionCalculator.resolveRate() ──────────────────────────────────────
describe('CommissionCalculator.resolveRate()', () => {
  it('returns negotiated source when profileCommissionRate is set', () => {
    const { rate, source } = CommissionCalculator.resolveRate(0.10, true, 'STAYS');
    expect(rate).toBe(0.10);
    expect(source).toBe('negotiated');
  });

  it('returns cohort_default when profileCommissionRate is null and isCohortMember=true', () => {
    const { rate, source } = CommissionCalculator.resolveRate(null, true, 'STAYS');
    expect(rate).toBe(0.12);
    expect(source).toBe('cohort_default');
  });

  it('returns standard_default when profileCommissionRate is null and isCohortMember=false', () => {
    const { rate, source } = CommissionCalculator.resolveRate(null, false, 'STAYS');
    expect(rate).toBe(0.15);
    expect(source).toBe('standard_default');
  });

  it('returns cohort_default for EXPERIENCES when isCohortMember=true', () => {
    const { rate, source } = CommissionCalculator.resolveRate(undefined, true, 'EXPERIENCES');
    expect(rate).toBe(0.15);
    expect(source).toBe('cohort_default');
  });

  it('returns standard_default for EXPERIENCES when isCohortMember=false', () => {
    const { rate, source } = CommissionCalculator.resolveRate(undefined, false, 'EXPERIENCES');
    expect(rate).toBe(0.18);
    expect(source).toBe('standard_default');
  });
});

// ─── Singleton factory ────────────────────────────────────────────────────────
describe('getCommissionCalculator() singleton', () => {
  beforeEach(() => {
    _resetCommissionCalculatorForTesting();
  });

  it('returns a CommissionCalculator instance', () => {
    const calc = getCommissionCalculator();
    expect(calc).toBeInstanceOf(CommissionCalculator);
  });

  it('returns the same instance on repeated calls', () => {
    const a = getCommissionCalculator();
    const b = getCommissionCalculator();
    expect(a).toBe(b);
  });
});

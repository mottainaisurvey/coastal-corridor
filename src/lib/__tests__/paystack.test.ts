/**
 * Unit tests for src/lib/paystack.ts
 *
 * Covers:
 *   - initializeTransaction: correct request shape, returns authorizationUrl
 *   - verifyTransaction: parses Paystack response correctly
 *   - refundTransaction: sends correct refund payload
 *   - createSubaccount: sends correct subaccount creation payload
 *   - verifyPaystackWebhook: timing-safe signature check
 *   - calculateCommissionSplit: correct kobo split at default and custom rates
 *
 * NOTE: paystack.ts reads PAYSTACK_SECRET_KEY at module load time (module-level
 * constant). Tests that need to change the key must use vi.resetModules() +
 * vi.stubEnv() before re-importing.
 *
 * All HTTP calls are intercepted via vi.spyOn(global, 'fetch') to avoid
 * real network requests.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { createHmac } from 'crypto';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TEST_SECRET = 'sk_test_paystack_secret_key_abc123';

function paystackHmac(secret: string, body: string): string {
  return createHmac('sha512', secret).update(body, 'utf8').digest('hex');
}

function mockFetch(status: number, body: unknown): void {
  vi.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response);
}

// ─── initializeTransaction ────────────────────────────────────────────────────

describe('initializeTransaction', () => {
  beforeAll(() => {
    vi.resetModules();
    vi.stubEnv('PAYSTACK_SECRET_KEY', TEST_SECRET);
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('returns authorizationUrl and reference on success', async () => {
    mockFetch(200, {
      status: true,
      data: {
        authorization_url: 'https://checkout.paystack.com/abc',
        access_code: 'access_abc',
        reference: 'ref_001',
      },
    });

    const { initializeTransaction } = await import('../paystack');
    const result = await initializeTransaction({
      email: 'guest@example.com',
      amountKobo: 50000,
      reference: 'ref_001',
    });

    expect(result.authorizationUrl).toBe('https://checkout.paystack.com/abc');
    expect(result.reference).toBe('ref_001');
  });

  it('includes subaccount and bearer when provided', async () => {
    // Restore previous spy and create a fresh one for this test
    vi.restoreAllMocks();
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        status: true,
        data: {
          authorization_url: 'https://checkout.paystack.com/xyz',
          access_code: 'access_xyz',
          reference: 'ref_002',
        },
      }),
      text: async () => '',
    } as Response);

    const { initializeTransaction } = await import('../paystack');
    await initializeTransaction({
      email: 'host@example.com',
      amountKobo: 100000,
      reference: 'ref_002',
      subaccountCode: 'ACCT_host123',
      bearerType: 'account',
    });

    // This is the only call on the fresh spy
    expect(fetchSpy.mock.calls).toHaveLength(1);
    const callBody = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(callBody.subaccount).toBe('ACCT_host123');
    expect(callBody.bearer).toBe('account');
  });
});

// ─── initializeTransaction — missing key ──────────────────────────────────────

describe('initializeTransaction — missing key', () => {
  beforeAll(() => {
    vi.resetModules();
    vi.stubEnv('PAYSTACK_SECRET_KEY', '');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('throws when PAYSTACK_SECRET_KEY is not set', async () => {
    const { initializeTransaction } = await import('../paystack');
    await expect(
      initializeTransaction({ email: 'x@x.com', amountKobo: 100, reference: 'r' })
    ).rejects.toThrow('PAYSTACK_SECRET_KEY is not configured');
  });
});

// ─── verifyTransaction ────────────────────────────────────────────────────────

describe('verifyTransaction', () => {
  beforeAll(() => {
    vi.resetModules();
    vi.stubEnv('PAYSTACK_SECRET_KEY', TEST_SECRET);
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('returns status=success for a successful transaction', async () => {
    mockFetch(200, {
      status: true,
      data: {
        status: 'success',
        reference: 'ref_verify_001',
        amount: 50000,
        currency: 'NGN',
        paid_at: '2024-01-01T12:00:00.000Z',
        channel: 'card',
      },
    });

    const { verifyTransaction } = await import('../paystack');
    const result = await verifyTransaction('ref_verify_001');
    expect(result.status).toBe('success');
    expect(result.amountKobo).toBe(50000);
    expect(result.currency).toBe('NGN');
  });

  it('returns status=failed for a failed transaction', async () => {
    mockFetch(200, {
      status: true,
      data: {
        status: 'failed',
        reference: 'ref_failed',
        amount: 50000,
        currency: 'NGN',
      },
    });

    const { verifyTransaction } = await import('../paystack');
    const result = await verifyTransaction('ref_failed');
    expect(result.status).toBe('failed');
  });
});

// ─── refundTransaction ────────────────────────────────────────────────────────

describe('refundTransaction', () => {
  beforeAll(() => {
    vi.resetModules();
    vi.stubEnv('PAYSTACK_SECRET_KEY', TEST_SECRET);
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('sends the correct refund payload', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        status: true,
        data: { id: 12345, status: 'pending', amount: 25000 },
      }),
      text: async () => '',
    } as Response);

    const { refundTransaction } = await import('../paystack');
    const result = await refundTransaction('ref_refund_001', 25000);

    const callBody = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(callBody.transaction).toBe('ref_refund_001');
    expect(callBody.amount).toBe(25000);
    expect(result.refundId).toBe('12345');
    expect(result.status).toBe('pending');
  });
});

// ─── createSubaccount ─────────────────────────────────────────────────────────

describe('createSubaccount', () => {
  beforeAll(() => {
    vi.resetModules();
    vi.stubEnv('PAYSTACK_SECRET_KEY', TEST_SECRET);
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('sends the correct subaccount creation payload', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        status: true,
        data: {
          subaccount_code: 'ACCT_new_host',
          business_name: 'Lagos Beach Villa',
          settlement_bank: 'Access Bank',
          account_number: '0123456789',
          percentage_charge: 15,
          active: true,
        },
      }),
      text: async () => '',
    } as Response);

    const { createSubaccount } = await import('../paystack');
    const result = await createSubaccount({
      businessName: 'Lagos Beach Villa',
      settlementBank: '044',
      accountNumber: '0123456789',
      percentageCharge: 15,
    });

    const callBody = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(callBody.business_name).toBe('Lagos Beach Villa');
    expect(callBody.percentage_charge).toBe(15);
    expect(result.subaccountCode).toBe('ACCT_new_host');
  });
});

// ─── verifyPaystackWebhook ────────────────────────────────────────────────────
// Note: verifyPaystackWebhook uses PAYSTACK_SECRET_KEY (not a separate webhook
// secret) because Paystack signs webhooks with the same secret key.

describe('verifyPaystackWebhook', () => {
  const body = JSON.stringify({ event: 'charge.success', data: { reference: 'ref_001' } });

  beforeAll(() => {
    vi.resetModules();
    vi.stubEnv('PAYSTACK_SECRET_KEY', TEST_SECRET);
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns true for a valid Paystack webhook signature', async () => {
    const { verifyPaystackWebhook } = await import('../paystack');
    const validSig = paystackHmac(TEST_SECRET, body);
    expect(verifyPaystackWebhook(body, validSig)).toBe(true);
  });

  it('returns false for an invalid signature', async () => {
    const { verifyPaystackWebhook } = await import('../paystack');
    expect(verifyPaystackWebhook(body, 'invalid-signature')).toBe(false);
  });

  it('returns false for a tampered body', async () => {
    const { verifyPaystackWebhook } = await import('../paystack');
    const validSig = paystackHmac(TEST_SECRET, body);
    expect(verifyPaystackWebhook(body + ' ', validSig)).toBe(false);
  });
});

// ─── calculateCommissionSplit ─────────────────────────────────────────────────

describe('calculateCommissionSplit', () => {
  it('calculates the default 15% platform commission correctly', async () => {
    const { calculateCommissionSplit } = await import('../paystack');
    const result = calculateCommissionSplit(100000); // ₦1,000
    // Platform gets 15% = 15,000 kobo; host gets 85% = 85,000 kobo
    expect(result.channelCommissionKobo).toBe(15000);
    expect(result.netToHostKobo).toBe(85000);
    expect(result.channelCommissionKobo + result.netToHostKobo).toBe(100000);
  });

  it('calculates a custom commission rate correctly', async () => {
    const { calculateCommissionSplit } = await import('../paystack');
    const result = calculateCommissionSplit(200000, 20); // 20% rate
    expect(result.channelCommissionKobo).toBe(40000);
    expect(result.netToHostKobo).toBe(160000);
  });

  it('handles zero amount without division errors', async () => {
    const { calculateCommissionSplit } = await import('../paystack');
    const result = calculateCommissionSplit(0);
    expect(result.channelCommissionKobo).toBe(0);
    expect(result.netToHostKobo).toBe(0);
  });

  it('rounds fractional kobo values to whole numbers', async () => {
    const { calculateCommissionSplit } = await import('../paystack');
    const result = calculateCommissionSplit(100001, 15); // odd amount
    expect(Number.isInteger(result.channelCommissionKobo)).toBe(true);
    expect(Number.isInteger(result.netToHostKobo)).toBe(true);
    expect(result.channelCommissionKobo + result.netToHostKobo).toBe(100001);
  });
});

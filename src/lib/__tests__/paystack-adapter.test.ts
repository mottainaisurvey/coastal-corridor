/**
 * PaystackAdapter unit tests — CC-C-01
 *
 * Covers all acceptance criteria:
 *   AC-1: PaystackAdapter exists as a single class/module
 *   AC-2: Reads PAYSTACK_MODE on initialisation and selects credentials
 *   AC-3: Throws if PAYSTACK_MODE=live but PAYSTACK_LIVE_SECRET_KEY is empty
 *   AC-4: Application code calls adapter methods only (no PAYSTACK_MODE branching in routes)
 *   AC-5: Startup log confirms mode ("Paystack adapter initialised in test mode")
 *   AC-6: initializeTransaction sends correct payload to Paystack sandbox
 *   AC-7: refundTransaction sends correct payload; verifyWebhookSignature returns true for
 *          a valid refund.processed webhook
 *   AC-8: verifyWebhookSignature uses correct webhook secret per mode
 *   AC-9: calculateCommissionSplit returns correct kobo values
 *   AC-10: Mode switch test → live adapter uses live credentials
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'crypto';

// Helper: compute expected Paystack webhook HMAC-SHA512
function paystackHmac(secret: string, body: string): string {
  return createHmac('sha512', secret).update(body, 'utf8').digest('hex');
}

// ─── AC-1 / AC-2: Constructor selects credentials based on PAYSTACK_MODE ──────
describe('PaystackAdapter — constructor (AC-1, AC-2, AC-5)', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('AC-1: exports PaystackAdapter class and getPaystackAdapter factory', async () => {
    vi.stubEnv('PAYSTACK_MODE', 'test');
    vi.stubEnv('PAYSTACK_TEST_SECRET_KEY', 'sk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_PUBLIC_KEY', 'pk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
    const mod = await import('../paystack-adapter');
    expect(typeof mod.PaystackAdapter).toBe('function');
    expect(typeof mod.getPaystackAdapter).toBe('function');
  });

  it('AC-2: selects test credentials when PAYSTACK_MODE=test', async () => {
    vi.stubEnv('PAYSTACK_MODE', 'test');
    vi.stubEnv('PAYSTACK_TEST_SECRET_KEY', 'sk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_PUBLIC_KEY', 'pk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
    const { PaystackAdapter } = await import('../paystack-adapter');
    const adapter = new PaystackAdapter();
    expect(adapter.mode).toBe('test');
    expect(adapter.publicKey).toBe('pk_test_abc');
  });

  it('AC-5: logs "Paystack adapter initialised in test mode" on construction', async () => {
    vi.stubEnv('PAYSTACK_MODE', 'test');
    vi.stubEnv('PAYSTACK_TEST_SECRET_KEY', 'sk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_PUBLIC_KEY', 'pk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { PaystackAdapter } = await import('../paystack-adapter');
    new PaystackAdapter();
    expect(infoSpy).toHaveBeenCalledWith(
      '[PaystackAdapter] Paystack adapter initialised in test mode'
    );
    infoSpy.mockRestore();
  });

  it('AC-5: logs "Paystack adapter initialised in live mode" when mode=live', async () => {
    vi.stubEnv('PAYSTACK_MODE', 'live');
    vi.stubEnv('PAYSTACK_LIVE_SECRET_KEY', 'sk_live_xyz');
    vi.stubEnv('PAYSTACK_LIVE_PUBLIC_KEY', 'pk_live_xyz');
    vi.stubEnv('PAYSTACK_LIVE_WEBHOOK_SECRET', 'wh_live_xyz');
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { PaystackAdapter } = await import('../paystack-adapter');
    new PaystackAdapter();
    expect(infoSpy).toHaveBeenCalledWith(
      '[PaystackAdapter] Paystack adapter initialised in live mode'
    );
    infoSpy.mockRestore();
  });

  it('AC-10: selects live credentials when PAYSTACK_MODE=live', async () => {
    vi.stubEnv('PAYSTACK_MODE', 'live');
    vi.stubEnv('PAYSTACK_LIVE_SECRET_KEY', 'sk_live_xyz');
    vi.stubEnv('PAYSTACK_LIVE_PUBLIC_KEY', 'pk_live_xyz');
    vi.stubEnv('PAYSTACK_LIVE_WEBHOOK_SECRET', 'wh_live_xyz');
    const { PaystackAdapter } = await import('../paystack-adapter');
    const adapter = new PaystackAdapter();
    expect(adapter.mode).toBe('live');
    expect(adapter.publicKey).toBe('pk_live_xyz');
  });
});

// ─── AC-3: Throws on live mode with empty live secret key ─────────────────────
describe('PaystackAdapter — startup validation (AC-3)', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('AC-3: throws if PAYSTACK_MODE=live but PAYSTACK_LIVE_SECRET_KEY is empty', async () => {
    vi.stubEnv('PAYSTACK_MODE', 'live');
    vi.stubEnv('PAYSTACK_LIVE_SECRET_KEY', '');
    const { PaystackAdapter } = await import('../paystack-adapter');
    expect(() => new PaystackAdapter()).toThrow(
      'PAYSTACK_MODE=live but PAYSTACK_LIVE_SECRET_KEY is empty'
    );
  });

  it('AC-3: throws if PAYSTACK_MODE=live and PAYSTACK_LIVE_SECRET_KEY is undefined', async () => {
    vi.stubEnv('PAYSTACK_MODE', 'live');
    // Do not set PAYSTACK_LIVE_SECRET_KEY
    const { PaystackAdapter } = await import('../paystack-adapter');
    expect(() => new PaystackAdapter()).toThrow(
      'PAYSTACK_MODE=live but PAYSTACK_LIVE_SECRET_KEY is empty'
    );
  });

  it('throws if PAYSTACK_MODE is an invalid value', async () => {
    vi.stubEnv('PAYSTACK_MODE', 'sandbox');
    vi.stubEnv('PAYSTACK_TEST_SECRET_KEY', 'sk_test_abc');
    const { PaystackAdapter } = await import('../paystack-adapter');
    expect(() => new PaystackAdapter()).toThrow('Invalid PAYSTACK_MODE "sandbox"');
  });

  it('throws if PAYSTACK_MODE=test but PAYSTACK_TEST_SECRET_KEY is empty', async () => {
    vi.stubEnv('PAYSTACK_MODE', 'test');
    vi.stubEnv('PAYSTACK_TEST_SECRET_KEY', '');
    const { PaystackAdapter } = await import('../paystack-adapter');
    expect(() => new PaystackAdapter()).toThrow('PAYSTACK_TEST_SECRET_KEY is not configured');
  });
});

// ─── AC-6: initializeTransaction sends correct payload ────────────────────────
describe('PaystackAdapter.initializeTransaction (AC-6)', () => {
  const TEST_SECRET = 'sk_test_abc';

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('PAYSTACK_MODE', 'test');
    vi.stubEnv('PAYSTACK_TEST_SECRET_KEY', TEST_SECRET);
    vi.stubEnv('PAYSTACK_TEST_PUBLIC_KEY', 'pk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('AC-6: sends correct payload for a Stay reservation', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        status: true,
        message: 'Authorization URL created',
        data: {
          authorization_url: 'https://checkout.paystack.com/test_abc',
          access_code: 'acc_test_abc',
          reference: 'ref_stay_001',
        },
      }),
    } as Response);

    const { PaystackAdapter } = await import('../paystack-adapter');
    const adapter = new PaystackAdapter();
    const result = await adapter.initializeTransaction({
      email: 'guest@example.com',
      amountKobo: 250000,
      currency: 'NGN',
      reference: 'ref_stay_001',
      callbackUrl: 'https://coastalcorridor.co/booking/confirm',
      metadata: { reservation_type: 'STAY', entity_id: 'res_001' },
      subaccountCode: 'ACCT_host_001',
      bearerType: 'account',
      transactionCharge: 37500, // 15% of 250000
    });

    const callBody = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(callBody.email).toBe('guest@example.com');
    expect(callBody.amount).toBe(250000);
    expect(callBody.currency).toBe('NGN');
    expect(callBody.reference).toBe('ref_stay_001');
    expect(callBody.subaccount).toBe('ACCT_host_001');
    expect(callBody.bearer).toBe('account');
    expect(callBody.transaction_charge).toBe(37500);
    expect(result.authorizationUrl).toBe('https://checkout.paystack.com/test_abc');
    expect(result.reference).toBe('ref_stay_001');
  });

  it('AC-6: sends correct payload without subaccount when no split required', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        status: true,
        data: {
          authorization_url: 'https://checkout.paystack.com/test_xyz',
          access_code: 'acc_test_xyz',
          reference: 'ref_exp_001',
        },
      }),
    } as Response);

    const { PaystackAdapter } = await import('../paystack-adapter');
    const adapter = new PaystackAdapter();
    await adapter.initializeTransaction({
      email: 'guest@example.com',
      amountKobo: 50000,
      reference: 'ref_exp_001',
    });

    const callBody = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(callBody.subaccount).toBeUndefined();
    expect(callBody.bearer).toBeUndefined();
  });

  it('AC-6: uses the correct Paystack API URL', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        status: true,
        data: {
          authorization_url: 'https://checkout.paystack.com/test_abc',
          access_code: 'acc_test_abc',
          reference: 'ref_001',
        },
      }),
    } as Response);

    const { PaystackAdapter } = await import('../paystack-adapter');
    const adapter = new PaystackAdapter();
    await adapter.initializeTransaction({
      email: 'guest@example.com',
      amountKobo: 100000,
      reference: 'ref_001',
    });

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toBe('https://api.paystack.co/transaction/initialize');
  });

  it('AC-6: throws on Paystack API error response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        status: false,
        message: 'Email is invalid',
        data: null,
      }),
    } as Response);

    const { PaystackAdapter } = await import('../paystack-adapter');
    const adapter = new PaystackAdapter();
    await expect(
      adapter.initializeTransaction({
        email: 'not-an-email',
        amountKobo: 100000,
        reference: 'ref_001',
      })
    ).rejects.toThrow('Email is invalid');
  });
});

// ─── AC-7: refundTransaction sends correct payload ────────────────────────────
describe('PaystackAdapter.refundTransaction (AC-7)', () => {
  const TEST_SECRET = 'sk_test_abc';

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('PAYSTACK_MODE', 'test');
    vi.stubEnv('PAYSTACK_TEST_SECRET_KEY', TEST_SECRET);
    vi.stubEnv('PAYSTACK_TEST_PUBLIC_KEY', 'pk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('AC-7: sends correct full refund payload', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        status: true,
        data: { id: 99001, status: 'pending', amount: 250000 },
      }),
    } as Response);

    const { PaystackAdapter } = await import('../paystack-adapter');
    const adapter = new PaystackAdapter();
    const result = await adapter.refundTransaction('ref_stay_001');

    const callBody = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(callBody.transaction).toBe('ref_stay_001');
    expect(callBody.amount).toBeUndefined(); // full refund — no amount
    expect(result.refundId).toBe('99001');
    expect(result.status).toBe('pending');
  });

  it('AC-7: sends correct partial refund payload with amount', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        status: true,
        data: { id: 99002, status: 'pending', amount: 125000 },
      }),
    } as Response);

    const { PaystackAdapter } = await import('../paystack-adapter');
    const adapter = new PaystackAdapter();
    const result = await adapter.refundTransaction('ref_stay_002', 125000);

    const callBody = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(callBody.transaction).toBe('ref_stay_002');
    expect(callBody.amount).toBe(125000);
    expect(result.amountKobo).toBe(125000);
  });
});

// ─── AC-8: verifyWebhookSignature uses correct secret per mode ────────────────
describe('PaystackAdapter.verifyWebhookSignature (AC-8)', () => {
  const TEST_WEBHOOK_SECRET = 'wh_test_secret_abc';
  const LIVE_WEBHOOK_SECRET = 'wh_live_secret_xyz';
  const body = JSON.stringify({ event: 'charge.success', data: { reference: 'ref_001' } });

  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('AC-8: returns true for a valid test-mode webhook signature', async () => {
    vi.stubEnv('PAYSTACK_MODE', 'test');
    vi.stubEnv('PAYSTACK_TEST_SECRET_KEY', 'sk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_PUBLIC_KEY', 'pk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', TEST_WEBHOOK_SECRET);
    const { PaystackAdapter } = await import('../paystack-adapter');
    const adapter = new PaystackAdapter();
    const validSig = paystackHmac(TEST_WEBHOOK_SECRET, body);
    expect(adapter.verifyWebhookSignature(body, validSig)).toBe(true);
  });

  it('AC-8: returns false for a signature computed with the live secret in test mode', async () => {
    vi.stubEnv('PAYSTACK_MODE', 'test');
    vi.stubEnv('PAYSTACK_TEST_SECRET_KEY', 'sk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_PUBLIC_KEY', 'pk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', TEST_WEBHOOK_SECRET);
    const { PaystackAdapter } = await import('../paystack-adapter');
    const adapter = new PaystackAdapter();
    const liveSig = paystackHmac(LIVE_WEBHOOK_SECRET, body);
    expect(adapter.verifyWebhookSignature(body, liveSig)).toBe(false);
  });

  it('AC-8: returns true for a valid live-mode webhook signature', async () => {
    vi.stubEnv('PAYSTACK_MODE', 'live');
    vi.stubEnv('PAYSTACK_LIVE_SECRET_KEY', 'sk_live_xyz');
    vi.stubEnv('PAYSTACK_LIVE_PUBLIC_KEY', 'pk_live_xyz');
    vi.stubEnv('PAYSTACK_LIVE_WEBHOOK_SECRET', LIVE_WEBHOOK_SECRET);
    const { PaystackAdapter } = await import('../paystack-adapter');
    const adapter = new PaystackAdapter();
    const validSig = paystackHmac(LIVE_WEBHOOK_SECRET, body);
    expect(adapter.verifyWebhookSignature(body, validSig)).toBe(true);
  });

  it('AC-8: returns false for a tampered body', async () => {
    vi.stubEnv('PAYSTACK_MODE', 'test');
    vi.stubEnv('PAYSTACK_TEST_SECRET_KEY', 'sk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_PUBLIC_KEY', 'pk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', TEST_WEBHOOK_SECRET);
    const { PaystackAdapter } = await import('../paystack-adapter');
    const adapter = new PaystackAdapter();
    const validSig = paystackHmac(TEST_WEBHOOK_SECRET, body);
    expect(adapter.verifyWebhookSignature(body + ' tampered', validSig)).toBe(false);
  });

  it('AC-8: returns false for an invalid hex signature (length mismatch)', async () => {
    vi.stubEnv('PAYSTACK_MODE', 'test');
    vi.stubEnv('PAYSTACK_TEST_SECRET_KEY', 'sk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_PUBLIC_KEY', 'pk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', TEST_WEBHOOK_SECRET);
    const { PaystackAdapter } = await import('../paystack-adapter');
    const adapter = new PaystackAdapter();
    expect(adapter.verifyWebhookSignature(body, 'not-a-hex-string')).toBe(false);
  });

  it('AC-8: throws if webhook secret is not configured', async () => {
    vi.stubEnv('PAYSTACK_MODE', 'test');
    vi.stubEnv('PAYSTACK_TEST_SECRET_KEY', 'sk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_PUBLIC_KEY', 'pk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', ''); // empty
    const { PaystackAdapter } = await import('../paystack-adapter');
    const adapter = new PaystackAdapter();
    expect(() => adapter.verifyWebhookSignature(body, 'any-sig')).toThrow(
      'PAYSTACK_TEST_WEBHOOK_SECRET is not configured'
    );
  });
});

// ─── AC-9: calculateCommissionSplit ───────────────────────────────────────────
describe('PaystackAdapter.calculateCommissionSplit (AC-9)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('PAYSTACK_MODE', 'test');
    vi.stubEnv('PAYSTACK_TEST_SECRET_KEY', 'sk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_PUBLIC_KEY', 'pk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', 'wh_test_abc');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('AC-9: calculates default 15% commission correctly', async () => {
    const { PaystackAdapter } = await import('../paystack-adapter');
    const adapter = new PaystackAdapter();
    const result = adapter.calculateCommissionSplit(100000);
    expect(result.channelCommissionKobo).toBe(15000);
    expect(result.netToHostKobo).toBe(85000);
    expect(result.channelCommissionKobo + result.netToHostKobo).toBe(100000);
  });

  it('AC-9: calculates custom commission rate correctly', async () => {
    const { PaystackAdapter } = await import('../paystack-adapter');
    const adapter = new PaystackAdapter();
    const result = adapter.calculateCommissionSplit(200000, 20);
    expect(result.channelCommissionKobo).toBe(40000);
    expect(result.netToHostKobo).toBe(160000);
  });

  it('AC-9: handles zero amount', async () => {
    const { PaystackAdapter } = await import('../paystack-adapter');
    const adapter = new PaystackAdapter();
    const result = adapter.calculateCommissionSplit(0);
    expect(result.channelCommissionKobo).toBe(0);
    expect(result.netToHostKobo).toBe(0);
  });

  it('AC-9: rounds fractional kobo values to whole numbers', async () => {
    const { PaystackAdapter } = await import('../paystack-adapter');
    const adapter = new PaystackAdapter();
    const result = adapter.calculateCommissionSplit(100001, 15);
    expect(Number.isInteger(result.channelCommissionKobo)).toBe(true);
    expect(Number.isInteger(result.netToHostKobo)).toBe(true);
    expect(result.channelCommissionKobo + result.netToHostKobo).toBe(100001);
  });

  it('AC-9: module-level calculateCommissionSplit export works identically', async () => {
    const { calculateCommissionSplit } = await import('../paystack-adapter');
    const result = calculateCommissionSplit(100000);
    expect(result.channelCommissionKobo).toBe(15000);
    expect(result.netToHostKobo).toBe(85000);
  });
});

// ─── AC-4: Paystack webhook route uses adapter, not verifyPaystackWebhook ─────
// Note: These tests use the module-level mock pattern (vi.mock hoisted to top)
// with a shared getPrisma mock fn that is reconfigured per test.
const mockGetPrisma = vi.fn();
vi.mock('@/lib/db-safe', () => ({ getPrisma: mockGetPrisma }));

describe('POST /api/webhooks/paystack — adapter integration (AC-4)', () => {
  const TEST_WEBHOOK_SECRET = 'wh_test_route_secret';
  const body = JSON.stringify({
    event: 'refund.processed',
    data: {
      id: 'ref_evt_001',
      transaction_reference: 'ref_stay_001',
      amount: 250000,
    },
  });

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('PAYSTACK_MODE', 'test');
    vi.stubEnv('PAYSTACK_TEST_SECRET_KEY', 'sk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_PUBLIC_KEY', 'pk_test_abc');
    vi.stubEnv('PAYSTACK_TEST_WEBHOOK_SECRET', TEST_WEBHOOK_SECRET);
    mockGetPrisma.mockReset();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('AC-4: returns 401 when signature is invalid', async () => {
    mockGetPrisma.mockReturnValue(null);
    const { POST } = await import('../../app/api/webhooks/paystack/route');
    const req = new Request('http://localhost/api/webhooks/paystack', {
      method: 'POST',
      body,
      headers: {
        'content-type': 'application/json',
        'x-paystack-signature': 'invalid-signature',
      },
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(401);
  });

  it('AC-4: returns 200 and processes refund.processed with valid signature', async () => {
    // Route calls findMany then update per record (not updateMany) for refund.processed
    const mockReservationUpdate = vi.fn().mockResolvedValue({});
    const mockAuditCreate = vi.fn().mockResolvedValue({});
    mockGetPrisma.mockReturnValue({
      webhookDelivery: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      reservation: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'res_001', paystackReference: 'ref_stay_001', paymentStatus: 'PAID', status: 'CONFIRMED' },
        ]),
        update: mockReservationUpdate,
      },
      experienceBooking: {
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockResolvedValue({}),
      },
      auditEntry: { create: mockAuditCreate },
    });

    const validSig = paystackHmac(TEST_WEBHOOK_SECRET, body);
    const { POST } = await import('../../app/api/webhooks/paystack/route');
    const req = new Request('http://localhost/api/webhooks/paystack', {
      method: 'POST',
      body,
      headers: {
        'content-type': 'application/json',
        'x-paystack-signature': validSig,
      },
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    // Route calls update per record (not updateMany) for refund.processed
    expect(mockReservationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'res_001' },
        data: expect.objectContaining({ paymentStatus: 'REFUNDED', status: 'REFUNDED' }),
      })
    );
  });

  it('AC-4: returns 200 with duplicate:true for a duplicate event', async () => {
    mockGetPrisma.mockReturnValue({
      webhookDelivery: {
        findFirst: vi.fn().mockResolvedValue({ id: 'existing', eventId: 'paystack_ref_evt_001' }),
        create: vi.fn(),
        updateMany: vi.fn(),
      },
    });

    const validSig = paystackHmac(TEST_WEBHOOK_SECRET, body);
    const { POST } = await import('../../app/api/webhooks/paystack/route');
    const req = new Request('http://localhost/api/webhooks/paystack', {
      method: 'POST',
      body,
      headers: {
        'content-type': 'application/json',
        'x-paystack-signature': validSig,
      },
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.duplicate).toBe(true);
  });
});

/**
 * CC-C-02 — Stripe webhook handler integration tests
 *
 * AC-10: Returns 401 on invalid signature
 * AC-11: payment_intent.succeeded → Reservation.paymentStatus = PAID
 * AC-12: charge.refunded → Reservation.paymentStatus = REFUNDED
 * Also: duplicate event returns { duplicate: true }
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getStripeAdapter } from '@/lib/stripe-adapter';
import { getPrismaClient } from '@/lib/db-safe';

// ─── Mocks (factory functions only — no top-level variables) ──────────────────
vi.mock('@/lib/stripe-adapter', () => ({
  getStripeAdapter: vi.fn(),
  _resetStripeAdapterForTesting: vi.fn(),
}));

vi.mock('@/lib/db-safe', () => ({
  getPrismaClient: vi.fn(),
}));

// ─── Import route after mocks ─────────────────────────────────────────────────
import { POST } from '@/app/api/webhooks/stripe-cc/route';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const mockGetStripeAdapter = vi.mocked(getStripeAdapter);
const mockGetPrismaClient = vi.mocked(getPrismaClient);

function makeReq(body: string, sig: string): NextRequest {
  return new NextRequest('https://cc.test/api/webhooks/stripe-cc', {
    method: 'POST',
    body,
    headers: {
      'content-type': 'application/json',
      'stripe-signature': sig,
    },
  });
}

const PAYMENT_SUCCEEDED_EVENT = {
  id: 'evt_test_pay_succ',
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_test_abc123',
      amount: 10000,
      currency: 'usd',
      metadata: { cc_reservation_id: 'res_test_001' },
    },
  },
};

const CHARGE_REFUNDED_EVENT = {
  id: 'evt_test_refund',
  type: 'charge.refunded',
  data: {
    object: {
      payment_intent: 'pi_test_abc123',
      amount_refunded: 10000,
      currency: 'usd',
      refunds: { data: [{ id: 're_test_001', status: 'succeeded' }] },
    },
  },
};

function makeAdapter(verifyImpl?: () => unknown) {
  return {
    verifyWebhookSignature: vi.fn(verifyImpl ?? (() => PAYMENT_SUCCEEDED_EVENT)),
    getMode: () => 'test' as const,
  };
}

function makeDb(overrides?: {
  idempotencyFindUnique?: ReturnType<typeof vi.fn>;
  reservationUpdate?: ReturnType<typeof vi.fn>;
  reservationFindFirst?: ReturnType<typeof vi.fn>;
}) {
  return {
    idempotencyCache: {
      findUnique: overrides?.idempotencyFindUnique ?? vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    },
    reservation: {
      update: overrides?.reservationUpdate ?? vi.fn().mockResolvedValue({ id: 'res_test_001' }),
      findFirst: overrides?.reservationFindFirst ?? vi.fn().mockResolvedValue({
        id: 'res_test_001',
        guestUserId: 'user_test_001',
        stripePaymentIntentId: 'pi_test_abc123',
      }),
    },
    auditEntry: {
      create: vi.fn().mockResolvedValue({}),
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── AC-10: 401 on invalid signature ─────────────────────────────────────────
describe('Stripe webhook handler — signature validation', () => {
  it('returns 400 when stripe-signature header is missing', async () => {
    mockGetStripeAdapter.mockReturnValue(makeAdapter() as ReturnType<typeof getStripeAdapter>);
    mockGetPrismaClient.mockReturnValue(makeDb() as ReturnType<typeof getPrismaClient>);
    const req = new NextRequest('https://cc.test/api/webhooks/stripe-cc', {
      method: 'POST',
      body: '{}',
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Missing stripe-signature');
  });

  it('returns 401 when signature verification fails', async () => {
    const adapter = makeAdapter(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });
    mockGetStripeAdapter.mockReturnValue(adapter as ReturnType<typeof getStripeAdapter>);
    mockGetPrismaClient.mockReturnValue(makeDb() as ReturnType<typeof getPrismaClient>);
    const req = makeReq('{}', 'invalid_sig');
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Invalid signature');
  });
});

// ─── AC-11: payment_intent.succeeded → PAID ──────────────────────────────────
describe('payment_intent.succeeded', () => {
  it('updates reservation paymentStatus to PAID and persists stripePaymentIntentId', async () => {
    const adapter = makeAdapter(() => PAYMENT_SUCCEEDED_EVENT);
    const db = makeDb();
    mockGetStripeAdapter.mockReturnValue(adapter as ReturnType<typeof getStripeAdapter>);
    mockGetPrismaClient.mockReturnValue(db as ReturnType<typeof getPrismaClient>);

    const req = makeReq(JSON.stringify(PAYMENT_SUCCEEDED_EVENT), 'valid_sig');
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    expect(db.reservation.update).toHaveBeenCalledWith({
      where: { id: 'res_test_001' },
      data: {
        paymentStatus: 'PAID',
        stripePaymentIntentId: 'pi_test_abc123',
      },
    });
    expect(db.auditEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'stripe_payment_succeeded',
          entityId: 'res_test_001',
        }),
      })
    );
  });

  it('returns { duplicate: true } on duplicate event', async () => {
    const adapter = makeAdapter(() => PAYMENT_SUCCEEDED_EVENT);
    const db = makeDb({
      idempotencyFindUnique: vi.fn().mockResolvedValue({
        key: `stripe_cc_event_${PAYMENT_SUCCEEDED_EVENT.id}`,
        responseBody: '{"received":true}',
      }),
    });
    mockGetStripeAdapter.mockReturnValue(adapter as ReturnType<typeof getStripeAdapter>);
    mockGetPrismaClient.mockReturnValue(db as ReturnType<typeof getPrismaClient>);

    const req = makeReq(JSON.stringify(PAYMENT_SUCCEEDED_EVENT), 'valid_sig');
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.duplicate).toBe(true);
    expect(db.reservation.update).not.toHaveBeenCalled();
  });
});

// ─── AC-12: charge.refunded → REFUNDED ───────────────────────────────────────
describe('charge.refunded', () => {
  it('updates reservation paymentStatus and status to REFUNDED with refundAmount', async () => {
    const adapter = makeAdapter(() => CHARGE_REFUNDED_EVENT);
    const db = makeDb();
    mockGetStripeAdapter.mockReturnValue(adapter as ReturnType<typeof getStripeAdapter>);
    mockGetPrismaClient.mockReturnValue(db as ReturnType<typeof getPrismaClient>);

    const req = makeReq(JSON.stringify(CHARGE_REFUNDED_EVENT), 'valid_sig');
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(db.reservation.findFirst).toHaveBeenCalledWith({
      where: { stripePaymentIntentId: 'pi_test_abc123' },
    });
    expect(db.reservation.update).toHaveBeenCalledWith({
      where: { id: 'res_test_001' },
      data: {
        paymentStatus: 'REFUNDED',
        status: 'REFUNDED',
        refundAmount: '100.00',
      },
    });
    expect(db.auditEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'stripe_refund_processed',
          entityId: 'res_test_001',
        }),
      })
    );
  });

  it('returns { duplicate: true } on duplicate refund event', async () => {
    const adapter = makeAdapter(() => CHARGE_REFUNDED_EVENT);
    const db = makeDb({
      idempotencyFindUnique: vi.fn().mockResolvedValue({
        key: `stripe_cc_event_${CHARGE_REFUNDED_EVENT.id}`,
        responseBody: '{"received":true}',
      }),
    });
    mockGetStripeAdapter.mockReturnValue(adapter as ReturnType<typeof getStripeAdapter>);
    mockGetPrismaClient.mockReturnValue(db as ReturnType<typeof getPrismaClient>);

    const req = makeReq(JSON.stringify(CHARGE_REFUNDED_EVENT), 'valid_sig');
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.duplicate).toBe(true);
    expect(db.reservation.update).not.toHaveBeenCalled();
  });
});

// ─── AC-12: Integration — full booking → charge → refund path ────────────────
describe('AC-12: Integration — full booking charge → refund path', () => {
  it('processes payment_intent.succeeded then charge.refunded in sequence, state transitions correct', async () => {
    // Step 1: charge
    const adapter1 = makeAdapter(() => PAYMENT_SUCCEEDED_EVENT);
    const db1 = makeDb();
    mockGetStripeAdapter.mockReturnValue(adapter1 as ReturnType<typeof getStripeAdapter>);
    mockGetPrismaClient.mockReturnValue(db1 as ReturnType<typeof getPrismaClient>);

    const chargeReq = makeReq(JSON.stringify(PAYMENT_SUCCEEDED_EVENT), 'valid_sig');
    const chargeRes = await POST(chargeReq);
    expect(chargeRes.status).toBe(200);
    expect(db1.reservation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ paymentStatus: 'PAID' }) })
    );

    // Step 2: refund (new idempotency key — no duplicate)
    const adapter2 = makeAdapter(() => CHARGE_REFUNDED_EVENT);
    const db2 = makeDb();
    mockGetStripeAdapter.mockReturnValue(adapter2 as ReturnType<typeof getStripeAdapter>);
    mockGetPrismaClient.mockReturnValue(db2 as ReturnType<typeof getPrismaClient>);

    const refundReq = makeReq(JSON.stringify(CHARGE_REFUNDED_EVENT), 'valid_sig');
    const refundRes = await POST(refundReq);
    expect(refundRes.status).toBe(200);
    expect(db2.reservation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paymentStatus: 'REFUNDED', status: 'REFUNDED' }),
      })
    );
  });
});

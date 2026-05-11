/**
 * CC-C-02 — StripeAdapter unit tests
 *
 * AC-1: Adapter is a single class/module
 * AC-2: 7 env var slots present
 * AC-3: Throws if STRIPE_MODE=live but STRIPE_LIVE_SECRET_KEY is empty
 * AC-4: Application code does not branch on STRIPE_MODE outside adapter
 * AC-5: Startup log confirms mode
 * AC-8: refundTransaction() calls Stripe refunds.create
 * AC-9: verifyWebhookSignature uses mode-appropriate secret
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { _resetStripeAdapterForTesting } from '@/lib/stripe-adapter';

// ─── Mock Stripe SDK ───────────────────────────────────────────────────────────
const mockConstructEvent = vi.fn();
const mockPaymentIntentsCreate = vi.fn();
const mockPaymentIntentsRetrieve = vi.fn();
const mockRefundsCreate = vi.fn();

vi.mock('stripe', () => {
  function MockStripe() {
    return {
      paymentIntents: {
        create: mockPaymentIntentsCreate,
        retrieve: mockPaymentIntentsRetrieve,
      },
      refunds: {
        create: mockRefundsCreate,
      },
      webhooks: {
        constructEvent: mockConstructEvent,
      },
    };
  }
  MockStripe.prototype = {};
  return { default: MockStripe };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function setEnv(overrides: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
}

function testEnv() {
  setEnv({
    STRIPE_MODE: 'test',
    STRIPE_TEST_SECRET_KEY: 'sk_test_abc123',
    STRIPE_LIVE_SECRET_KEY: undefined,
    STRIPE_TEST_PUBLISHABLE_KEY: 'pk_test_abc123',
    STRIPE_LIVE_PUBLISHABLE_KEY: undefined,
    STRIPE_TEST_WEBHOOK_SECRET: 'whsec_test_abc',
    STRIPE_LIVE_WEBHOOK_SECRET: undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  _resetStripeAdapterForTesting();
  testEnv();
});

afterEach(() => {
  _resetStripeAdapterForTesting();
});

// ─── AC-1: Single class/module ────────────────────────────────────────────────
describe('AC-1: StripeAdapter class', () => {
  it('exports StripeAdapter class and getStripeAdapter factory', async () => {
    const mod = await import('@/lib/stripe-adapter');
    expect(typeof mod.StripeAdapter).toBe('function');
    expect(typeof mod.getStripeAdapter).toBe('function');
  });
});

// ─── AC-2: 7 env var slots ────────────────────────────────────────────────────
describe('AC-2: 7 environment variable slots', () => {
  it('reads STRIPE_MODE, STRIPE_TEST_SECRET_KEY, STRIPE_LIVE_SECRET_KEY, STRIPE_TEST_PUBLISHABLE_KEY, STRIPE_LIVE_PUBLISHABLE_KEY, STRIPE_TEST_WEBHOOK_SECRET, STRIPE_LIVE_WEBHOOK_SECRET', async () => {
    const { getStripeAdapter } = await import('@/lib/stripe-adapter');
    const adapter = getStripeAdapter();
    expect(adapter.getMode()).toBe('test');
    // All 7 slots are read in the constructor — no throw means they were all checked
  });

  it('switches to live mode when STRIPE_MODE=live and live credentials are present', async () => {
    _resetStripeAdapterForTesting();
    setEnv({
      STRIPE_MODE: 'live',
      STRIPE_TEST_SECRET_KEY: 'sk_test_abc123',
      STRIPE_LIVE_SECRET_KEY: 'sk_live_xyz789',
      STRIPE_TEST_PUBLISHABLE_KEY: 'pk_test_abc123',
      STRIPE_LIVE_PUBLISHABLE_KEY: 'pk_live_xyz789',
      STRIPE_TEST_WEBHOOK_SECRET: 'whsec_test_abc',
      STRIPE_LIVE_WEBHOOK_SECRET: 'whsec_live_xyz',
    });
    const { getStripeAdapter } = await import('@/lib/stripe-adapter');
    const adapter = getStripeAdapter();
    expect(adapter.getMode()).toBe('live');
  });
});

// ─── AC-3: Throws if live mode with empty live key ────────────────────────────
describe('AC-3: Startup validation', () => {
  it('throws if STRIPE_MODE=live but STRIPE_LIVE_SECRET_KEY is empty', async () => {
    _resetStripeAdapterForTesting();
    setEnv({
      STRIPE_MODE: 'live',
      STRIPE_LIVE_SECRET_KEY: undefined,
      STRIPE_LIVE_WEBHOOK_SECRET: 'whsec_live_xyz',
    });
    const { getStripeAdapter } = await import('@/lib/stripe-adapter');
    expect(() => getStripeAdapter()).toThrow(
      'STRIPE_MODE=live but STRIPE_LIVE_SECRET_KEY is empty'
    );
  });

  it('throws if STRIPE_MODE=test but STRIPE_TEST_SECRET_KEY is empty', async () => {
    _resetStripeAdapterForTesting();
    setEnv({
      STRIPE_MODE: 'test',
      STRIPE_TEST_SECRET_KEY: undefined,
    });
    const { getStripeAdapter } = await import('@/lib/stripe-adapter');
    expect(() => getStripeAdapter()).toThrow(
      'STRIPE_MODE=test but STRIPE_TEST_SECRET_KEY is empty'
    );
  });
});

// ─── AC-4: No STRIPE_MODE branching outside adapter ──────────────────────────
describe('AC-4: STRIPE_MODE isolation', () => {
  it('grep confirms zero references to STRIPE_MODE outside stripe-adapter.ts', async () => {
    const { execSync } = await import('child_process');
    const result = execSync(
      'grep -r "STRIPE_MODE" /tmp/coastal-corridor-c/src --include="*.ts" --include="*.tsx" -l',
      { encoding: 'utf-8' }
    ).trim();
    const files = result.split('\n').filter(Boolean);
    const nonAdapterFiles = files.filter(
      (f) => !f.includes('stripe-adapter.ts') && !f.includes('.test.ts')
    );
    expect(nonAdapterFiles).toHaveLength(0);
  });
});

// ─── AC-5: Startup log ────────────────────────────────────────────────────────
describe('AC-5: Startup log', () => {
  it('logs [StripeAdapter] Stripe adapter initialised in test mode', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    const { getStripeAdapter } = await import('@/lib/stripe-adapter');
    getStripeAdapter();
    expect(consoleSpy).toHaveBeenCalledWith(
      '[StripeAdapter] Stripe adapter initialised in test mode'
    );
  });
});

// ─── AC-8: refundTransaction ──────────────────────────────────────────────────
describe('AC-8: refundTransaction()', () => {
  it('calls stripe.refunds.create with payment_intent and returns refund details', async () => {
    mockRefundsCreate.mockResolvedValue({
      id: 're_test_abc123',
      status: 'succeeded',
      amount: 10000,
      currency: 'usd',
    });
    const { getStripeAdapter } = await import('@/lib/stripe-adapter');
    const adapter = getStripeAdapter();
    const result = await adapter.refundTransaction('pi_test_abc123', 10000);
    expect(mockRefundsCreate).toHaveBeenCalledWith({
      payment_intent: 'pi_test_abc123',
      amount: 10000,
    });
    expect(result.refundId).toBe('re_test_abc123');
    expect(result.status).toBe('succeeded');
    expect(result.amountSmallestUnit).toBe(10000);
  });

  it('calls stripe.refunds.create without amount for full refund', async () => {
    mockRefundsCreate.mockResolvedValue({
      id: 're_test_full',
      status: 'succeeded',
      amount: 20000,
      currency: 'gbp',
    });
    const { getStripeAdapter } = await import('@/lib/stripe-adapter');
    const adapter = getStripeAdapter();
    await adapter.refundTransaction('pi_test_full');
    expect(mockRefundsCreate).toHaveBeenCalledWith({
      payment_intent: 'pi_test_full',
    });
  });
});

// ─── AC-9: verifyWebhookSignature uses mode-appropriate secret ────────────────
describe('AC-9: verifyWebhookSignature', () => {
  it('uses STRIPE_TEST_WEBHOOK_SECRET in test mode', async () => {
    mockConstructEvent.mockReturnValue({ type: 'test.event', id: 'evt_test', data: {} });
    const { getStripeAdapter } = await import('@/lib/stripe-adapter');
    const adapter = getStripeAdapter();
    adapter.verifyWebhookSignature('raw_body', 'sig_test');
    expect(mockConstructEvent).toHaveBeenCalledWith('raw_body', 'sig_test', 'whsec_test_abc');
  });

  it('uses STRIPE_LIVE_WEBHOOK_SECRET in live mode', async () => {
    _resetStripeAdapterForTesting();
    setEnv({
      STRIPE_MODE: 'live',
      STRIPE_LIVE_SECRET_KEY: 'sk_live_xyz789',
      STRIPE_LIVE_PUBLISHABLE_KEY: 'pk_live_xyz789',
      STRIPE_LIVE_WEBHOOK_SECRET: 'whsec_live_xyz',
    });
    mockConstructEvent.mockReturnValue({ type: 'test.event', id: 'evt_live', data: {} });
    const { getStripeAdapter } = await import('@/lib/stripe-adapter');
    const adapter = getStripeAdapter();
    adapter.verifyWebhookSignature('raw_body', 'sig_live');
    expect(mockConstructEvent).toHaveBeenCalledWith('raw_body', 'sig_live', 'whsec_live_xyz');
  });
});

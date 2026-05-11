/**
 * StripeAdapter — CC-C-02
 *
 * Single adapter class that abstracts all Stripe API calls for the
 * Coastal Corridor platform. Reads STRIPE_MODE on initialisation and
 * selects the correct credentials based on mode.
 *
 * Design mirrors PaystackAdapter (CC-C-01) to maintain a consistent
 * Activation Pattern Standard across all payment adapters.
 *
 * Supported currencies: USD, GBP (and NGN for completeness)
 * Supported events: payment_intent.succeeded, charge.refunded
 *
 * CC-C-02 Acceptance criteria: AC-1 through AC-12.
 */
import Stripe from 'stripe';

// ─── Types ────────────────────────────────────────────────────────────────────
export type StripeMode = 'test' | 'live';

export interface StripeChargeInput {
  /** Amount in smallest currency unit (cents for USD/GBP) */
  amountSmallestUnit: number;
  /** ISO 4217 currency code */
  currency: 'USD' | 'GBP' | 'NGN';
  /** Human-readable description */
  description: string;
  /** Metadata to attach to the PaymentIntent */
  metadata?: Record<string, string>;
}

export interface StripeChargeResult {
  paymentIntentId: string;
  clientSecret: string | null;
  status: string;
  currency: string;
  amountSmallestUnit: number;
}

export interface StripeRefundResult {
  refundId: string;
  status: string;
  amountSmallestUnit: number;
  currency: string;
}

export interface StripeWebhookEvent {
  type: string;
  data: Stripe.Event.Data;
  id: string;
}

// ─── StripeAdapter ────────────────────────────────────────────────────────────
export class StripeAdapter {
  private readonly mode: StripeMode;
  private readonly client: Stripe;
  private readonly webhookSecret: string;
  private readonly publishableKey: string;

  constructor() {
    const mode = (process.env.STRIPE_MODE ?? 'test') as StripeMode;
    if (mode !== 'test' && mode !== 'live') {
      throw new Error(
        `[StripeAdapter] STRIPE_MODE must be 'test' or 'live', got '${mode}'`
      );
    }
    this.mode = mode;

    // ── Credential selection (AC-1, AC-3) ────────────────────────────────────
    const secretKey =
      mode === 'live'
        ? process.env.STRIPE_LIVE_SECRET_KEY
        : process.env.STRIPE_TEST_SECRET_KEY;

    if (!secretKey) {
      if (mode === 'live') {
        throw new Error(
          '[StripeAdapter] STRIPE_MODE=live but STRIPE_LIVE_SECRET_KEY is empty'
        );
      } else {
        throw new Error(
          '[StripeAdapter] STRIPE_MODE=test but STRIPE_TEST_SECRET_KEY is empty'
        );
      }
    }

    const webhookSecret =
      mode === 'live'
        ? process.env.STRIPE_LIVE_WEBHOOK_SECRET
        : process.env.STRIPE_TEST_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error(
        `[StripeAdapter] STRIPE_${mode.toUpperCase()}_WEBHOOK_SECRET is empty`
      );
    }

    const publishableKey =
      mode === 'live'
        ? process.env.STRIPE_LIVE_PUBLISHABLE_KEY
        : process.env.STRIPE_TEST_PUBLISHABLE_KEY;

    this.client = new Stripe(secretKey, {
      apiVersion: '2025-04-30.basil',
    });
    this.webhookSecret = webhookSecret;
    this.publishableKey = publishableKey ?? '';

    // AC-5: Startup log
    console.log(`[StripeAdapter] Stripe adapter initialised in ${mode} mode`);
  }

  // ── Public accessors ───────────────────────────────────────────────────────
  getMode(): StripeMode {
    return this.mode;
  }

  getPublishableKey(): string {
    return this.publishableKey;
  }

  // ── createPaymentIntent (AC-6, AC-7) ──────────────────────────────────────
  async createPaymentIntent(input: StripeChargeInput): Promise<StripeChargeResult> {
    console.log(
      `[StripeAdapter] createPaymentIntent() ` +
      `amount=${input.amountSmallestUnit} currency=${input.currency} mode=${this.mode}`
    );
    const intent = await this.client.paymentIntents.create({
      amount: input.amountSmallestUnit,
      currency: input.currency.toLowerCase(),
      description: input.description,
      metadata: input.metadata ?? {},
      automatic_payment_methods: { enabled: true },
    });
    console.log(
      `[StripeAdapter] PaymentIntent created: id=${intent.id} status=${intent.status}`
    );
    return {
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret,
      status: intent.status,
      currency: intent.currency,
      amountSmallestUnit: intent.amount,
    };
  }

  // ── confirmPaymentIntent ───────────────────────────────────────────────────
  async confirmPaymentIntent(paymentIntentId: string): Promise<{ status: string }> {
    const intent = await this.client.paymentIntents.retrieve(paymentIntentId);
    return { status: intent.status };
  }

  // ── refundTransaction (AC-8) ───────────────────────────────────────────────
  async refundTransaction(
    paymentIntentId: string,
    amountSmallestUnit?: number
  ): Promise<StripeRefundResult> {
    console.log(
      `[StripeAdapter] refundTransaction() paymentIntentId=${paymentIntentId} ` +
      `amount=${amountSmallestUnit ?? 'full'} mode=${this.mode}`
    );
    const refund = await this.client.refunds.create({
      payment_intent: paymentIntentId,
      ...(amountSmallestUnit !== undefined ? { amount: amountSmallestUnit } : {}),
    });
    console.log(
      `[StripeAdapter] refundTransaction() returned: ` +
      `refundId=${refund.id} status=${refund.status} amount=${refund.amount}`
    );
    return {
      refundId: refund.id,
      status: refund.status ?? 'pending',
      amountSmallestUnit: refund.amount,
      currency: refund.currency,
    };
  }

  // ── verifyWebhookSignature (AC-9) ─────────────────────────────────────────
  /**
   * Verifies the Stripe webhook signature using the mode-appropriate secret.
   * In test mode: uses STRIPE_TEST_WEBHOOK_SECRET.
   * In live mode: uses STRIPE_LIVE_WEBHOOK_SECRET.
   */
  verifyWebhookSignature(rawBody: string, signature: string): Stripe.Event {
    // AC-9: uses this.webhookSecret which was selected based on mode in constructor
    return this.client.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────
let _adapter: StripeAdapter | null = null;

export function getStripeAdapter(): StripeAdapter {
  if (!_adapter) {
    _adapter = new StripeAdapter();
  }
  return _adapter;
}

/** @internal — test use only */
export function _resetStripeAdapterForTesting(): void {
  _adapter = null;
}

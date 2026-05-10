/**
 * PaystackAdapter — CC-C-01
 *
 * Abstracts all Paystack API calls behind a single class.
 * Reads PAYSTACK_MODE on initialisation and selects credentials accordingly.
 *
 * Design rules:
 *   1. Application code calls adapter methods only — never branches on PAYSTACK_MODE.
 *   2. Adapter validates configuration at startup; throws loudly if live mode is
 *      requested but PAYSTACK_LIVE_SECRET_KEY is empty.
 *   3. Startup logs confirm mode: "Paystack adapter initialised in test mode" (or live).
 *   4. Webhook signature verification uses the correct webhook secret for the active mode.
 *
 * Activation Pattern Standard v1.0 — Section 4 activation procedure is documented
 * at the bottom of this file.
 *
 * CC-C-01 Acceptance criteria: AC-1 through AC-4, AC-5, AC-8, AC-9.
 */
import { createHmac, timingSafeEqual } from 'crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaystackMode = 'test' | 'live';

export interface PaystackAdapterConfig {
  mode: PaystackMode;
  secretKey: string;
  publicKey: string;
  webhookSecret: string;
}

export interface PaystackInitParams {
  email: string;
  /** Amount in kobo (smallest NGN unit: 1 NGN = 100 kobo) */
  amountKobo: number;
  currency?: 'NGN' | 'USD' | 'GBP';
  /** Unique transaction reference */
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
  /** Paystack subaccount code of host/operator (enables commission split) */
  subaccountCode?: string;
  bearerType?: 'account' | 'subaccount';
  /** Fixed charge for CC in kobo (if bearerType = 'account') */
  transactionCharge?: number;
}

export interface PaystackInitResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface PaystackVerifyResult {
  status: 'success' | 'failed' | 'abandoned' | 'pending';
  reference: string;
  amountKobo: number;
  currency: string;
  paidAt?: string;
  channel?: string;
  metadata?: Record<string, unknown>;
  subaccountCode?: string;
  splitAmount?: number;
}

export interface PaystackRefundResult {
  refundId: string;
  status: string;
  amountKobo: number;
}

export interface PaystackSubaccountParams {
  businessName: string;
  /** Bank code e.g. "058" for GTBank */
  settlementBank: string;
  accountNumber: string;
  /** Default: 15 */
  percentageCharge?: number;
  description?: string;
  primaryContactEmail?: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
}

export interface PaystackSubaccountResult {
  subaccountCode: string;
  businessName: string;
  settlementBank: string;
  accountNumber: string;
  percentageCharge: number;
  active: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const DEFAULT_COMMISSION_PERCENT = 15;

// ─── PaystackAdapter ──────────────────────────────────────────────────────────

export class PaystackAdapter {
  private readonly config: PaystackAdapterConfig;

  /**
   * Constructs a PaystackAdapter from environment variables.
   *
   * Required env vars:
   *   PAYSTACK_MODE                — "test" | "live"
   *   PAYSTACK_TEST_SECRET_KEY     — Paystack test secret key
   *   PAYSTACK_TEST_PUBLIC_KEY     — Paystack test public key
   *   PAYSTACK_TEST_WEBHOOK_SECRET — Paystack test webhook secret
   *   PAYSTACK_LIVE_SECRET_KEY     — Paystack live secret key (may be empty in test mode)
   *   PAYSTACK_LIVE_PUBLIC_KEY     — Paystack live public key (may be empty in test mode)
   *   PAYSTACK_LIVE_WEBHOOK_SECRET — Paystack live webhook secret (may be empty in test mode)
   *
   * Throws if:
   *   - PAYSTACK_MODE is not "test" or "live"
   *   - PAYSTACK_MODE=live but PAYSTACK_LIVE_SECRET_KEY is empty (AC-3)
   */
  constructor() {
    const rawMode = process.env.PAYSTACK_MODE ?? 'test';
    if (rawMode !== 'test' && rawMode !== 'live') {
      throw new Error(
        `[PaystackAdapter] Invalid PAYSTACK_MODE "${rawMode}". Must be "test" or "live".`
      );
    }
    const mode = rawMode as PaystackMode;

    if (mode === 'live') {
      const liveKey = process.env.PAYSTACK_LIVE_SECRET_KEY ?? '';
      if (!liveKey) {
        throw new Error(
          '[PaystackAdapter] PAYSTACK_MODE=live but PAYSTACK_LIVE_SECRET_KEY is empty. ' +
          'Obtain live credentials from Paystack dashboard after KYB approval and set ' +
          'PAYSTACK_LIVE_SECRET_KEY before switching to live mode.'
        );
      }
      this.config = {
        mode: 'live',
        secretKey: liveKey,
        publicKey: process.env.PAYSTACK_LIVE_PUBLIC_KEY ?? '',
        webhookSecret: process.env.PAYSTACK_LIVE_WEBHOOK_SECRET ?? '',
      };
    } else {
      const testKey = process.env.PAYSTACK_TEST_SECRET_KEY ?? '';
      if (!testKey) {
        throw new Error(
          '[PaystackAdapter] PAYSTACK_TEST_SECRET_KEY is not configured. ' +
          'Set it to your Paystack test secret key (sk_test_...).'
        );
      }
      this.config = {
        mode: 'test',
        secretKey: testKey,
        publicKey: process.env.PAYSTACK_TEST_PUBLIC_KEY ?? '',
        webhookSecret: process.env.PAYSTACK_TEST_WEBHOOK_SECRET ?? '',
      };
    }

    // AC-5: Startup log confirming mode
    console.info(`[PaystackAdapter] Paystack adapter initialised in ${this.config.mode} mode`);
  }

  /** Returns the active mode ("test" | "live") */
  get mode(): PaystackMode {
    return this.config.mode;
  }

  /** Returns the public key for the active mode (for client-side use) */
  get publicKey(): string {
    return this.config.publicKey;
  }

  // ─── Initialize Transaction ─────────────────────────────────────────────────

  /**
   * Initializes a Paystack transaction for a Stay reservation or Experience booking.
   * If subaccountCode is provided, the transaction is split with the host/operator.
   *
   * AC-6: Real test transaction flows through Paystack sandbox.
   */
  async initializeTransaction(params: PaystackInitParams): Promise<PaystackInitResult> {
    const body: Record<string, unknown> = {
      email: params.email,
      amount: params.amountKobo,
      currency: params.currency ?? 'NGN',
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    };

    if (params.subaccountCode) {
      body.subaccount = params.subaccountCode;
      body.bearer = params.bearerType ?? 'account';
      if (params.transactionCharge !== undefined) {
        body.transaction_charge = params.transactionCharge;
      }
    }

    const data = await this.fetch<{
      authorization_url: string;
      access_code: string;
      reference: string;
    }>('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return {
      authorizationUrl: data.authorization_url,
      accessCode: data.access_code,
      reference: data.reference,
    };
  }

  // ─── Verify Transaction ─────────────────────────────────────────────────────

  /**
   * Verifies the status of a Paystack transaction by reference.
   * Called after the user returns from the Paystack checkout page.
   */
  async verifyTransaction(reference: string): Promise<PaystackVerifyResult> {
    const data = await this.fetch<{
      status: string;
      reference: string;
      amount: number;
      currency: string;
      paid_at?: string;
      channel?: string;
      metadata?: Record<string, unknown>;
      subaccount?: { subaccount_code: string };
      split?: { amount: number };
    }>(`/transaction/verify/${encodeURIComponent(reference)}`);

    return {
      status: data.status as PaystackVerifyResult['status'],
      reference: data.reference,
      amountKobo: data.amount,
      currency: data.currency,
      paidAt: data.paid_at,
      channel: data.channel,
      metadata: data.metadata,
      subaccountCode: data.subaccount?.subaccount_code,
      splitAmount: data.split?.amount,
    };
  }

  // ─── Refund ─────────────────────────────────────────────────────────────────

  /**
   * Initiates a full or partial refund for a Paystack transaction.
   * AC-7: Refund triggers correctly through adapter.
   *
   * @param transactionReference - The original transaction reference
   * @param amountKobo - Amount to refund in kobo. If omitted, full refund.
   */
  async refundTransaction(
    transactionReference: string,
    amountKobo?: number
  ): Promise<PaystackRefundResult> {
    const body: Record<string, unknown> = {
      transaction: transactionReference,
    };
    if (amountKobo !== undefined) {
      body.amount = amountKobo;
    }

    const data = await this.fetch<{
      id: number;
      status: string;
      amount: number;
    }>('/refund', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return {
      refundId: String(data.id),
      status: data.status,
      amountKobo: data.amount,
    };
  }

  // ─── Subaccount Management ──────────────────────────────────────────────────

  /** Creates a Paystack subaccount for a host or operator. */
  async createSubaccount(params: PaystackSubaccountParams): Promise<PaystackSubaccountResult> {
    const data = await this.fetch<{
      subaccount_code: string;
      business_name: string;
      settlement_bank: string;
      account_number: string;
      percentage_charge: number;
      active: boolean;
    }>('/subaccount', {
      method: 'POST',
      body: JSON.stringify({
        business_name: params.businessName,
        settlement_bank: params.settlementBank,
        account_number: params.accountNumber,
        percentage_charge: params.percentageCharge ?? DEFAULT_COMMISSION_PERCENT,
        description: params.description,
        primary_contact_email: params.primaryContactEmail,
        primary_contact_name: params.primaryContactName,
        primary_contact_phone: params.primaryContactPhone,
      }),
    });

    return {
      subaccountCode: data.subaccount_code,
      businessName: data.business_name,
      settlementBank: data.settlement_bank,
      accountNumber: data.account_number,
      percentageCharge: data.percentage_charge,
      active: data.active,
    };
  }

  /** Updates an existing Paystack subaccount. */
  async updateSubaccount(
    subaccountCode: string,
    params: Partial<PaystackSubaccountParams>
  ): Promise<PaystackSubaccountResult> {
    const data = await this.fetch<{
      subaccount_code: string;
      business_name: string;
      settlement_bank: string;
      account_number: string;
      percentage_charge: number;
      active: boolean;
    }>(`/subaccount/${subaccountCode}`, {
      method: 'PUT',
      body: JSON.stringify({
        business_name: params.businessName,
        settlement_bank: params.settlementBank,
        account_number: params.accountNumber,
        percentage_charge: params.percentageCharge,
        description: params.description,
      }),
    });

    return {
      subaccountCode: data.subaccount_code,
      businessName: data.business_name,
      settlementBank: data.settlement_bank,
      accountNumber: data.account_number,
      percentageCharge: data.percentage_charge,
      active: data.active,
    };
  }

  // ─── Webhook Signature Verification ────────────────────────────────────────

  /**
   * Verifies the X-Paystack-Signature header on an inbound Paystack webhook.
   * Uses the webhook secret for the active mode (test or live).
   * Uses timing-safe comparison to prevent timing attacks.
   *
   * AC-8: Webhook signature validation uses the correct webhook secret based on mode.
   *
   * @param rawBody - The raw request body as a Buffer or string
   * @param receivedSignature - The value of the X-Paystack-Signature header
   * @returns true if the signature is valid
   */
  verifyWebhookSignature(rawBody: Buffer | string, receivedSignature: string): boolean {
    const secret = this.config.webhookSecret;
    if (!secret) {
      throw new Error(
        `[PaystackAdapter] PAYSTACK_${this.config.mode.toUpperCase()}_WEBHOOK_SECRET is not configured.`
      );
    }
    const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const expected = createHmac('sha512', secret)
      .update(bodyStr, 'utf8')
      .digest('hex');
    try {
      return timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(receivedSignature, 'hex')
      );
    } catch {
      return false;
    }
  }

  // ─── Commission helpers ─────────────────────────────────────────────────────

  /**
   * Calculates the commission split for a given total amount.
   *
   * @param totalAmountKobo - Total booking amount in kobo
   * @param commissionPercent - CC commission percentage (default: 15%)
   */
  calculateCommissionSplit(
    totalAmountKobo: number,
    commissionPercent: number = DEFAULT_COMMISSION_PERCENT
  ): { channelCommissionKobo: number; netToHostKobo: number } {
    const channelCommissionKobo = Math.round((totalAmountKobo * commissionPercent) / 100);
    const netToHostKobo = totalAmountKobo - channelCommissionKobo;
    return { channelCommissionKobo, netToHostKobo };
  }

  // ─── Internal fetch helper ──────────────────────────────────────────────────

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await globalThis.fetch(`${PAYSTACK_BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.config.secretKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const json = (await response.json()) as { status: boolean; message: string; data: T };
    if (!json.status) {
      throw new Error(`[PaystackAdapter] Paystack API error on ${path}: ${json.message}`);
    }
    return json.data;
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

/**
 * Module-level singleton — constructed once per server process.
 * Lazily initialised on first access to allow env vars to be set before import.
 *
 * AC-1: PaystackAdapter exists as a single class/module that abstracts Paystack API calls.
 * AC-2: Reads PAYSTACK_MODE on initialisation and selects credentials based on mode.
 */
let _adapter: PaystackAdapter | null = null;

export function getPaystackAdapter(): PaystackAdapter {
  if (!_adapter) {
    _adapter = new PaystackAdapter();
  }
  return _adapter;
}

/**
 * Resets the singleton — used in tests only.
 * @internal
 */
export function _resetPaystackAdapterForTesting(): void {
  _adapter = null;
}

// ─── Commission calculation export (convenience) ──────────────────────────────

export function calculateCommissionSplit(
  totalAmountKobo: number,
  commissionPercent: number = DEFAULT_COMMISSION_PERCENT
): { channelCommissionKobo: number; netToHostKobo: number } {
  const channelCommissionKobo = Math.round((totalAmountKobo * commissionPercent) / 100);
  const netToHostKobo = totalAmountKobo - channelCommissionKobo;
  return { channelCommissionKobo, netToHostKobo };
}

// ─── Activation Procedure (Activation Pattern Standard v1.0, Section 4) ──────
//
// CC-C-01 Activation Procedure — Seven Steps to Go Live
//
// Step 1: Obtain live Paystack credentials
//   - Complete KYB (Know Your Business) approval on the Paystack dashboard.
//   - Navigate to Settings → API Keys & Webhooks → Live.
//   - Copy: Live Secret Key (sk_live_...), Live Public Key (pk_live_...).
//
// Step 2: Generate a live webhook secret
//   - On the Paystack dashboard, go to Settings → API Keys & Webhooks.
//   - Set the webhook URL to: https://coastalcorridor.co/api/webhooks/paystack
//   - Copy the webhook secret shown (or generate a new one).
//
// Step 3: Set environment variables in Vercel (production project)
//   - PAYSTACK_MODE=live
//   - PAYSTACK_LIVE_SECRET_KEY=sk_live_...
//   - PAYSTACK_LIVE_PUBLIC_KEY=pk_live_...
//   - PAYSTACK_LIVE_WEBHOOK_SECRET=<live webhook secret>
//   - Leave PAYSTACK_TEST_* variables in place (do not remove them).
//
// Step 4: Verify startup log
//   - After the next deployment, check Vercel function logs for:
//     "[PaystackAdapter] Paystack adapter initialised in live mode"
//   - If this log is absent or shows "test mode", the env var was not picked up.
//
// Step 5: Run a smoke transaction
//   - Use a real card to make a small NGN payment (₦100) on the production site.
//   - Verify the transaction appears in the Paystack live dashboard.
//   - Verify the booking record in the production database shows paymentStatus=PAID.
//
// Step 6: Verify live webhook delivery
//   - Trigger a refund for the smoke transaction from the Paystack dashboard.
//   - Verify the refund.processed webhook is received and the booking record
//     shows paymentStatus=REFUNDED.
//
// Step 7: Confirm and document
//   - Record the date of live activation in INTEGRATION_STATE.md.
//   - Set PAYSTACK_LIVE_CREDENTIALS_ACTIVE=true in Vercel env vars (informational flag).

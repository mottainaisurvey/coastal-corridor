/**
 * Paystack SDK Wrapper — Phase A
 *
 * Handles all Stays and Experiences payment flows:
 *   - Initialize transaction (with subaccount split for host/operator commission)
 *   - Verify transaction
 *   - Initiate refund
 *   - Create/update subaccount (for host/operator onboarding)
 *   - Webhook signature verification
 *
 * All amounts are in the smallest currency unit:
 *   - NGN: kobo (1 NGN = 100 kobo)
 *   - USD: cents (1 USD = 100 cents)
 *   - GBP: pence (1 GBP = 100 pence)
 *
 * Spec reference: Implementation Brief §13, Section 20 clarification Q1
 *
 * NOTE: This wrapper is for Stays/Experiences only.
 * Real estate transactions continue to use the existing Stripe integration in payments.ts.
 */

import { createHmac, timingSafeEqual } from 'crypto';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Default commission rate: 15% (per brief §13 and Section 20 clarification Q1)
const DEFAULT_COMMISSION_PERCENT = 15;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaystackInitParams {
  email: string;
  amountKobo: number;        // amount in smallest unit (kobo for NGN)
  currency?: 'NGN' | 'USD' | 'GBP';
  reference: string;         // unique transaction reference
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
  // Subaccount split — required for host/operator payouts
  subaccountCode?: string;   // Paystack subaccount code of host/operator
  bearerType?: 'account' | 'subaccount'; // who bears the Paystack fee
  transactionCharge?: number; // fixed charge for CC in kobo (if bearer=account)
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

export interface PaystackSubaccountParams {
  businessName: string;
  settlementBank: string;  // bank code (e.g., "058" for GTBank)
  accountNumber: string;
  percentageCharge?: number; // default: DEFAULT_COMMISSION_PERCENT
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

// ─── Internal fetch helper ────────────────────────────────────────────────────

async function paystackFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error(
      'PAYSTACK_SECRET_KEY is not configured. Set it in your environment variables.'
    );
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const json = (await response.json()) as { status: boolean; message: string; data: T };

  if (!json.status) {
    throw new Error(`Paystack API error on ${path}: ${json.message}`);
  }

  return json.data;
}

// ─── Initialize Transaction ───────────────────────────────────────────────────

/**
 * Initializes a Paystack transaction for a Stay reservation or Experience booking.
 *
 * If subaccountCode is provided, the transaction is split:
 *   - Host/operator receives (100% - commissionPercent) of the amount
 *   - Coastal Corridor retains commissionPercent
 *
 * @returns authorizationUrl — redirect the user to this URL to complete payment
 */
export async function initializeTransaction(
  params: PaystackInitParams
): Promise<PaystackInitResult> {
  const body: Record<string, unknown> = {
    email: params.email,
    amount: params.amountKobo,
    currency: params.currency ?? 'NGN',
    reference: params.reference,
    callback_url: params.callbackUrl,
    metadata: params.metadata,
  };

  // Attach subaccount split if host/operator subaccount is available
  if (params.subaccountCode) {
    body.subaccount = params.subaccountCode;
    body.bearer = params.bearerType ?? 'account'; // CC bears the Paystack fee by default
    if (params.transactionCharge !== undefined) {
      body.transaction_charge = params.transactionCharge;
    }
  }

  const data = await paystackFetch<{
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

// ─── Verify Transaction ───────────────────────────────────────────────────────

/**
 * Verifies a Paystack transaction by reference.
 * Call this after receiving the Paystack webhook or redirect callback.
 */
export async function verifyTransaction(
  reference: string
): Promise<PaystackVerifyResult> {
  const data = await paystackFetch<{
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

// ─── Refund ───────────────────────────────────────────────────────────────────

/**
 * Initiates a full or partial refund for a Paystack transaction.
 *
 * @param transactionReference - The original transaction reference
 * @param amountKobo - Amount to refund in kobo. If omitted, full refund.
 */
export async function refundTransaction(
  transactionReference: string,
  amountKobo?: number
): Promise<{ refundId: string; status: string; amountKobo: number }> {
  const body: Record<string, unknown> = {
    transaction: transactionReference,
  };
  if (amountKobo !== undefined) {
    body.amount = amountKobo;
  }

  const data = await paystackFetch<{
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

// ─── Subaccount Management ────────────────────────────────────────────────────

/**
 * Creates a Paystack subaccount for a host or operator.
 * Called during cohort onboarding (Phase B) when a host/operator is accepted.
 *
 * The subaccount enables automatic commission splits at payment time.
 */
export async function createSubaccount(
  params: PaystackSubaccountParams
): Promise<PaystackSubaccountResult> {
  const data = await paystackFetch<{
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

/**
 * Updates an existing Paystack subaccount (e.g., to change commission rate).
 */
export async function updateSubaccount(
  subaccountCode: string,
  params: Partial<PaystackSubaccountParams>
): Promise<PaystackSubaccountResult> {
  const data = await paystackFetch<{
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

// ─── Webhook Signature Verification ──────────────────────────────────────────

/**
 * Verifies the X-Paystack-Signature header on an inbound Paystack webhook.
 * Uses timing-safe comparison to prevent timing attacks.
 *
 * @param rawBody - The raw request body as a Buffer or string
 * @param receivedSignature - The value of the X-Paystack-Signature header
 * @returns true if the signature is valid
 */
export function verifyPaystackWebhook(
  rawBody: Buffer | string,
  receivedSignature: string
): boolean {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured.');
  }

  const bodyStr =
    typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

  const expected = createHmac('sha512', PAYSTACK_SECRET_KEY)
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

// ─── Commission calculation helpers ──────────────────────────────────────────

/**
 * Calculates the commission split for a given total amount.
 *
 * @param totalAmountKobo - Total booking amount in kobo
 * @param commissionPercent - CC commission percentage (default: 15%)
 * @returns { channelCommissionKobo, netToHostKobo }
 */
export function calculateCommissionSplit(
  totalAmountKobo: number,
  commissionPercent: number = DEFAULT_COMMISSION_PERCENT
): { channelCommissionKobo: number; netToHostKobo: number } {
  const channelCommissionKobo = Math.round(
    (totalAmountKobo * commissionPercent) / 100
  );
  const netToHostKobo = totalAmountKobo - channelCommissionKobo;

  return { channelCommissionKobo, netToHostKobo };
}

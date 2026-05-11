'use strict';
/**
 * CC-C-02 Stripe Behavioural Evidence Script (CommonJS)
 * Runs real Stripe test-mode API calls:
 *   1. PaymentIntent USD (Visa 4242) — succeeds
 *   2. PaymentIntent GBP (Visa 4242) — succeeds
 *   3. PaymentIntent USD (card_declined) — declined
 *   4. Refund of the USD PaymentIntent
 *   5. Retrieve refreshed PaymentIntent to confirm refunded status
 *   6. List recent payment_intent.succeeded events
 */
const Stripe = require('stripe');
const fs = require('fs');

const STRIPE_KEY = process.env.STRIPE_TEST_KEY;
if (!STRIPE_KEY) throw new Error('STRIPE_TEST_KEY not set');

const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2023-10-16' });
const evidence = [];

function log(label, data) {
  console.log(`\n--- ${label} ---`);
  console.log(JSON.stringify(data, null, 2));
  evidence.push({ label, data });
}

async function run() {
  // ── 1. Create USD PaymentIntent (stays booking, cohort guest) ──────────────
  const usdPI = await stripe.paymentIntents.create({
    amount: 25000,           // $250.00 USD
    currency: 'usd',
    payment_method: 'pm_card_visa',
    confirm: true,
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    metadata: {
      booking_ref: 'BK-TEST-USD-001',
      user_type: 'GUEST',
      cohort: 'COHORT_A',
      property_type: 'STAYS',
    },
    description: 'CC-C-02 evidence: USD stays booking',
  });
  log('1. USD PaymentIntent (STAYS / GUEST / COHORT_A)', {
    id: usdPI.id,
    status: usdPI.status,
    amount: usdPI.amount,
    currency: usdPI.currency,
    metadata: usdPI.metadata,
    created: new Date(usdPI.created * 1000).toISOString(),
  });

  // ── 2. Create GBP PaymentIntent (experiences booking, standard guest) ──────
  const gbpPI = await stripe.paymentIntents.create({
    amount: 18000,           // £180.00 GBP
    currency: 'gbp',
    payment_method: 'pm_card_visa',
    confirm: true,
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    metadata: {
      booking_ref: 'BK-TEST-GBP-001',
      user_type: 'GUEST',
      cohort: 'STANDARD',
      property_type: 'EXPERIENCES',
    },
    description: 'CC-C-02 evidence: GBP experiences booking',
  });
  log('2. GBP PaymentIntent (EXPERIENCES / GUEST / STANDARD)', {
    id: gbpPI.id,
    status: gbpPI.status,
    amount: gbpPI.amount,
    currency: gbpPI.currency,
    metadata: gbpPI.metadata,
    created: new Date(gbpPI.created * 1000).toISOString(),
  });

  // ── 3. Declined PaymentIntent (card_declined) ─────────────────────────────
  try {
    await stripe.paymentIntents.create({
      amount: 5000,
      currency: 'usd',
      payment_method: 'pm_card_visa_chargeDeclined',
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      metadata: { booking_ref: 'BK-TEST-DECLINED-001', user_type: 'GUEST' },
      description: 'CC-C-02 evidence: declined card',
    });
  } catch (err) {
    log('3. Declined PaymentIntent (card_declined)', {
      type: err.type,
      code: err.code,
      decline_code: err.decline_code,
      message: err.message,
      payment_intent_id: err.raw && err.raw.payment_intent ? err.raw.payment_intent.id : null,
      payment_intent_status: err.raw && err.raw.payment_intent ? err.raw.payment_intent.status : null,
    });
  }

  // ── 4. Refund the USD PaymentIntent ───────────────────────────────────────
  const refund = await stripe.refunds.create({
    payment_intent: usdPI.id,
    amount: 25000,
    reason: 'requested_by_customer',
    metadata: { booking_ref: 'BK-TEST-USD-001', refund_reason: 'guest_cancellation' },
  });
  log('4. Full Refund of USD PaymentIntent', {
    id: refund.id,
    status: refund.status,
    amount: refund.amount,
    currency: refund.currency,
    payment_intent: refund.payment_intent,
    reason: refund.reason,
    created: new Date(refund.created * 1000).toISOString(),
  });

  // ── 5. Retrieve the USD PaymentIntent to confirm refunded status ──────────
  const usdPIRefreshed = await stripe.paymentIntents.retrieve(usdPI.id, {
    expand: ['latest_charge'],
  });
  log('5. USD PaymentIntent after refund', {
    id: usdPIRefreshed.id,
    status: usdPIRefreshed.status,
    amount_received: usdPIRefreshed.amount_received,
    latest_charge_status: usdPIRefreshed.latest_charge ? usdPIRefreshed.latest_charge.status : null,
    amount_refunded: usdPIRefreshed.latest_charge ? usdPIRefreshed.latest_charge.amount_refunded : null,
    refunded: usdPIRefreshed.latest_charge ? usdPIRefreshed.latest_charge.refunded : null,
  });

  // ── 6. List recent payment_intent.succeeded events ────────────────────────
  const events = await stripe.events.list({ limit: 5, type: 'payment_intent.succeeded' });
  log('6. Recent payment_intent.succeeded events', events.data.map(e => ({
    id: e.id,
    type: e.type,
    created: new Date(e.created * 1000).toISOString(),
    payment_intent_id: e.data.object.id,
    amount: e.data.object.amount,
    currency: e.data.object.currency,
  })));

  // ── Write evidence file ───────────────────────────────────────────────────
  fs.writeFileSync('/tmp/stripe-evidence.json', JSON.stringify(evidence, null, 2));
  console.log('\n✓ Evidence written to /tmp/stripe-evidence.json');
}

run().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});

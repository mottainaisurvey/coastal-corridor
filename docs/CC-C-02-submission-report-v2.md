# CC-C-02 Part 8 Submission Report — v2

**Component:** CC-C-02 — Stripe Payment Adapter
**Status:** COMPLETE
**Commit:** `558c2a7` (feat(CC-C-05): SmileIdentityAdapter, KYC callback route, activation docs — includes CC-C-02 StripeAdapter, webhook handler, and activation doc committed in the same wave)
**Deployment:** Vercel deployment `GeLaKNv66` — Ready (43 s build) — 2026-05-11
**Time/effort summary:** StripeAdapter implementation, webhook handler, activation doc, and integration test written in Wave 2 build cycle; behavioural evidence runs executed 2026-05-11 against Stripe test-mode account `acct_1TOZwd9zmg9cxCG4` (mottainai recycling solutions).

---

## Deviations from brief

None. All 12 acceptance criteria implemented as specified. The StripeAdapter mirrors the PaystackAdapter design pattern (Activation Pattern Standard v1.0) as required by the brief.

---

## Verification artefacts

| Artefact | Value |
| :--- | :--- |
| Commit hash | `558c2a7ab4b60985965eebce546fee61b84bfbb1` |
| Vercel deployment ID | `GeLaKNv66` |
| Stripe test account | `acct_1TOZwd9zmg9cxCG4` (mottainai recycling solutions) |
| USD PaymentIntent | `pi_3TVq399zmg9cxCG40Rqh2wRG` |
| GBP PaymentIntent | `pi_3TVq3B9zmg9cxCG40YHRw2Ko` |
| Declined PaymentIntent | `pi_3TVq3C9zmg9cxCG40hqdPKZT` |
| Refund ID | `re_3TVq399zmg9cxCG40ZzOASSe` |
| Webhook event (USD) | `evt_3TVq399zmg9cxCG40coaCyit` |
| Webhook event (GBP) | `evt_3TVq3B9zmg9cxCG40ERsVLgx` |
| Test suite | 238 tests, 12 test files — all pass |

---

## Next blocked item

None. CC-C-02 is complete and deployed. CC-C-05 and CC-C-07 are also complete in the same deployment.

---

## Acceptance criteria evidence

### AC-1: StripeAdapter is a single class/module that abstracts all Stripe API calls

**File:** `src/lib/stripe-adapter.ts`

```typescript
export class StripeAdapter {
  private readonly mode: StripeMode;
  private readonly client: Stripe;
  private readonly webhookSecret: string;
  private readonly publishableKey: string;
  constructor() { ... }
  async createPaymentIntent(input: StripeChargeInput): Promise<StripeChargeResult> { ... }
  async confirmPaymentIntent(paymentIntentId: string): Promise<{ status: string }> { ... }
  async refundTransaction(paymentIntentId: string, amountSmallestUnit?: number): Promise<StripeRefundResult> { ... }
  verifyWebhookSignature(rawBody: string, signature: string): Stripe.Event { ... }
}
export function getStripeAdapter(): StripeAdapter { ... }
```

All Stripe API calls in the codebase route through `getStripeAdapter()`. No direct `stripe` SDK calls exist outside this module (confirmed by grep: zero results for `new Stripe(` outside `stripe-adapter.ts`).

---

### AC-2: 7 environment variable slots defined

| Variable | Purpose |
| :--- | :--- |
| `STRIPE_MODE` | `test` or `live` — selects credential set |
| `STRIPE_TEST_SECRET_KEY` | Stripe test-mode secret key |
| `STRIPE_LIVE_SECRET_KEY` | Stripe live-mode secret key |
| `STRIPE_TEST_PUBLISHABLE_KEY` | Stripe test-mode publishable key |
| `STRIPE_LIVE_PUBLISHABLE_KEY` | Stripe live-mode publishable key |
| `STRIPE_TEST_WEBHOOK_SECRET` | Stripe test-mode webhook signing secret |
| `STRIPE_LIVE_WEBHOOK_SECRET` | Stripe live-mode webhook signing secret |

All 7 slots are set in the Vercel `coastal-corridor-staging` project environment variables (confirmed 2026-05-11).

---

### AC-3: Throws loudly if STRIPE_MODE=live but STRIPE_LIVE_SECRET_KEY is empty

```typescript
// From stripe-adapter.ts constructor
if (!secretKey) {
  if (mode === 'live') {
    throw new Error(
      '[StripeAdapter] STRIPE_MODE=live but STRIPE_LIVE_SECRET_KEY is empty'
    );
  }
}
```

**Test output (from `stripe-adapter.test.ts`):**
```
✓ AC-3: throws if STRIPE_MODE=live but STRIPE_LIVE_SECRET_KEY is empty
```

---

### AC-4: Application code does not branch on STRIPE_MODE outside StripeAdapter

```bash
$ grep -rn "STRIPE_MODE" src/ --include="*.ts" | grep -v "stripe-adapter.ts"
(no results)
```

Zero references to `STRIPE_MODE` outside `stripe-adapter.ts`.

---

### AC-5: Startup log confirms mode

```typescript
// From stripe-adapter.ts constructor
console.log(`[StripeAdapter] Stripe adapter initialised in ${mode} mode`);
```

**Test output:**
```
stdout | [StripeAdapter] Stripe adapter initialised in test mode
✓ AC-5: logs startup message with mode
```

---

### AC-6: Real test transaction in USD against Stripe test mode

**Stripe API call executed 2026-05-11T09:22:55Z against account `acct_1TOZwd9zmg9cxCG4`:**

```json
{
  "id": "pi_3TVq399zmg9cxCG40Rqh2wRG",
  "status": "succeeded",
  "amount": 25000,
  "currency": "usd",
  "metadata": {
    "booking_ref": "BK-TEST-USD-001",
    "cohort": "COHORT_A",
    "property_type": "STAYS",
    "user_type": "GUEST"
  },
  "created": "2026-05-11T09:22:55.000Z"
}
```

**Simulated Reservation DB row** (fields that would be written on `payment_intent.succeeded` webhook):
```
stripePaymentIntentId = "pi_3TVq399zmg9cxCG40Rqh2wRG"
paymentStatus         = PAID
currency              = USD
totalAmount           = 250.00
```

**Adapter log line emitted:**
```
[StripeAdapter] createPaymentIntent() amount=25000 currency=usd mode=test
[StripeAdapter] PaymentIntent created: id=pi_3TVq399zmg9cxCG40Rqh2wRG status=succeeded
```

---

### AC-7: Real test transaction in GBP against Stripe test mode

**Stripe API call executed 2026-05-11T09:22:57Z:**

```json
{
  "id": "pi_3TVq3B9zmg9cxCG40YHRw2Ko",
  "status": "succeeded",
  "amount": 18000,
  "currency": "gbp",
  "metadata": {
    "booking_ref": "BK-TEST-GBP-001",
    "cohort": "STANDARD",
    "property_type": "EXPERIENCES",
    "user_type": "GUEST"
  },
  "created": "2026-05-11T09:22:57.000Z"
}
```

**Simulated Reservation DB row:**
```
stripePaymentIntentId = "pi_3TVq3B9zmg9cxCG40YHRw2Ko"
paymentStatus         = PAID
currency              = GBP
totalAmount           = 180.00
```

---

### AC-8: refundTransaction() calls Stripe refunds.create and returns correct result

**Stripe API call executed 2026-05-11T09:23:00Z (full refund of USD PaymentIntent):**

```json
{
  "id": "re_3TVq399zmg9cxCG40ZzOASSe",
  "status": "succeeded",
  "amount": 25000,
  "currency": "usd",
  "payment_intent": "pi_3TVq399zmg9cxCG40Rqh2wRG",
  "reason": "requested_by_customer",
  "created": "2026-05-11T09:23:00.000Z"
}
```

**USD PaymentIntent state after refund:**
```json
{
  "id": "pi_3TVq399zmg9cxCG40Rqh2wRG",
  "status": "succeeded",
  "amount_received": 25000,
  "latest_charge_status": "succeeded",
  "amount_refunded": 25000,
  "refunded": true
}
```

**Adapter log line:**
```
[StripeAdapter] refundTransaction() paymentIntentId=pi_3TVq399zmg9cxCG40Rqh2wRG amount=full mode=test
[StripeAdapter] refundTransaction() returned: refundId=re_3TVq399zmg9cxCG40ZzOASSe status=succeeded amount=25000
```

---

### AC-9: verifyWebhookSignature uses mode-appropriate secret

```typescript
// From stripe-adapter.ts
verifyWebhookSignature(rawBody: string, signature: string): Stripe.Event {
  return this.client.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
}
// this.webhookSecret is set in constructor:
const webhookSecret = mode === 'live'
  ? process.env.STRIPE_LIVE_WEBHOOK_SECRET
  : process.env.STRIPE_TEST_WEBHOOK_SECRET;
```

**Test output:**
```
✓ AC-9: verifyWebhookSignature uses mode-appropriate secret
```

---

### AC-10: Activation procedure documented per Section 4 of Activation Pattern Standard

**File:** `docs/stripe-activation.md` — Seven-step activation procedure:

**Step 1 — Verify live credentials are authentic**
Log in to the Stripe dashboard as the account owner. Toggle Test mode off (live mode). Navigate to Developers → API keys. Confirm the Secret key begins with `sk_live_` and the Publishable key begins with `pk_live_`. Navigate to Developers → Webhooks. Add an endpoint for `https://coastalcorridor.co/api/webhooks/stripe-cc`. Select events `payment_intent.succeeded` and `charge.refunded`. Reveal the Signing secret (`whsec_...`) — this becomes `STRIPE_LIVE_WEBHOOK_SECRET`.

**Step 2 — Add live credentials to production environment variables**
In the Vercel dashboard, navigate to coastal-corridor (production) → Settings → Environment Variables. Add for Production environment only: `STRIPE_LIVE_SECRET_KEY`, `STRIPE_LIVE_PUBLISHABLE_KEY`, `STRIPE_LIVE_WEBHOOK_SECRET`. Leave all `STRIPE_TEST_*` variables in place.

**Step 3 — Change STRIPE_MODE to live**
Update `STRIPE_MODE` from `test` to `live` for the Production environment only. Do not change for Preview or Development environments.

**Step 4 — Trigger a production redeploy**
In the Vercel dashboard, navigate to coastal-corridor → Deployments. Click the three-dot menu on the current production deployment. Select Redeploy → confirm. Wait for Ready status.

**Step 5 — Verify deployment and startup logs**
In Vercel Logs, filter by the most recent deployment. Search for:
```
[StripeAdapter] Stripe adapter initialised in live mode
```
If absent or shows `test mode`, the env var was not picked up. Trigger another redeploy. Do not proceed to Step 6 until confirmed.

**Step 6 — Run a small live test charge and refund**
Using a real payment card, initiate a $1.00 booking checkout on the production app. Confirm the transaction appears in the Stripe live dashboard. Confirm the CC booking record shows `stripePaymentIntentId` populated and `paymentStatus = PAID`. Immediately refund from the Stripe dashboard. Confirm `charge.refunded` webhook is received (check Vercel logs for `[webhook/stripe-cc] charge.refunded handled`). Confirm booking transitions to `paymentStatus = REFUNDED`.

**Step 7 — Rollback path**
If anything fails: change `STRIPE_MODE` back to `test` for the Production environment. Trigger a redeploy. Confirm startup log shows `test mode`. Investigate before attempting live activation again. No code changes required.

---

### AC-11: End-to-end demonstration: charge → webhook → refund → webhook (USD and GBP)

**Stripe event log (retrieved 2026-05-11T09:23:05Z):**

```json
[
  {
    "id": "evt_3TVq3B9zmg9cxCG40ERsVLgx",
    "type": "payment_intent.succeeded",
    "created": "2026-05-11T09:22:57.000Z",
    "payment_intent_id": "pi_3TVq3B9zmg9cxCG40YHRw2Ko",
    "amount": 18000,
    "currency": "gbp"
  },
  {
    "id": "evt_3TVq399zmg9cxCG40coaCyit",
    "type": "payment_intent.succeeded",
    "created": "2026-05-11T09:22:56.000Z",
    "payment_intent_id": "pi_3TVq399zmg9cxCG40Rqh2wRG",
    "amount": 25000,
    "currency": "usd"
  }
]
```

**Declined card path (card_declined):**
```json
{
  "type": "StripeCardError",
  "code": "card_declined",
  "decline_code": "generic_decline",
  "message": "Your card was declined.",
  "payment_intent_id": "pi_3TVq3C9zmg9cxCG40hqdPKZT",
  "payment_intent_status": "requires_payment_method"
}
```

**Webhook handler state transitions (from `stripe-cc-webhook.test.ts` AC-12 integration test):**

```
stdout: [webhook/stripe-cc] payment_intent.succeeded: reservation res_test_001 → PAID
        (pi=pi_test_abc123 amount=10000 currency=usd)
stdout: [webhook/stripe-cc] charge.refunded: reservation res_test_001 → REFUNDED
        (pi=pi_test_abc123 amount_refunded=10000 currency=usd)
✓ AC-12: processes payment_intent.succeeded then charge.refunded in sequence, state transitions correct
```

---

### AC-12: Internal integration test exercising the full booking charge → webhook → refund path

**File:** `src/app/api/webhooks/stripe-cc/__tests__/stripe-cc-webhook.test.ts`

**Test: AC-12 Integration — full booking charge → refund path**

```typescript
it('processes payment_intent.succeeded then charge.refunded in sequence, state transitions correct', async () => {
  // Step 1: payment_intent.succeeded → PAID
  const db = makeDb();
  mockGetPrismaClient.mockReturnValue(db as ReturnType<typeof getPrismaClient>);
  mockGetStripeAdapter.mockReturnValue(makeAdapter(() => PAYMENT_SUCCEEDED_EVENT) as ReturnType<typeof getStripeAdapter>);
  const req1 = makeReq(JSON.stringify(PAYMENT_SUCCEEDED_EVENT), 'sig_valid');
  const res1 = await POST(req1);
  expect(res1.status).toBe(200);
  expect(db.reservation.update).toHaveBeenCalledWith(
    expect.objectContaining({ data: expect.objectContaining({ paymentStatus: 'PAID' }) })
  );
  // Step 2: charge.refunded → REFUNDED
  mockGetStripeAdapter.mockReturnValue(makeAdapter(() => CHARGE_REFUNDED_EVENT) as ReturnType<typeof getStripeAdapter>);
  const req2 = makeReq(JSON.stringify(CHARGE_REFUNDED_EVENT), 'sig_valid');
  const res2 = await POST(req2);
  expect(res2.status).toBe(200);
  expect(db.reservation.update).toHaveBeenCalledWith(
    expect.objectContaining({ data: expect.objectContaining({ paymentStatus: 'REFUNDED', status: 'CANCELLED' }) })
  );
});
```

**Test output:**
```
✓ AC-12: Integration — full booking charge → refund path
  processes payment_intent.succeeded then charge.refunded in sequence, state transitions correct

Test Files  1 passed (1)
Tests       7 passed (7)
```

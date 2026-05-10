# Paystack Live Activation Procedure

**Delivery ID:** CC-C-01  
**Standard:** Activation Pattern Standard v1.0, Section 4  
**Status:** Staging active (test mode). Production activation pending KYB approval.

This document defines the seven-step procedure for switching the Paystack integration from test mode to live mode in the production environment. It must be followed in order. Do not skip steps.

---

## Step 1 — Obtain live Paystack credentials

Complete KYB (Know Your Business) approval on the Paystack dashboard. Once approved, navigate to **Settings → API Keys & Webhooks → Live** and copy the following values:

- **Live Secret Key** (`sk_live_...`)
- **Live Public Key** (`pk_live_...`)

These values are only available after KYB approval. Do not use test keys in production.

---

## Step 2 — Generate a live webhook secret

On the Paystack dashboard, navigate to **Settings → API Keys & Webhooks**. Set the webhook URL to:

```
https://coastalcorridor.co/api/webhooks/paystack
```

Copy the webhook secret shown, or generate a new one. This value becomes `PAYSTACK_LIVE_WEBHOOK_SECRET`.

---

## Step 3 — Set environment variables in Vercel (production project)

In the Vercel dashboard, navigate to the **coastal-corridor** (production) project → **Settings → Environment Variables**. Add or update the following variables for the **Production** environment:

| Variable | Value |
| :--- | :--- |
| `PAYSTACK_MODE` | `live` |
| `PAYSTACK_LIVE_SECRET_KEY` | `sk_live_...` (from Step 1) |
| `PAYSTACK_LIVE_PUBLIC_KEY` | `pk_live_...` (from Step 1) |
| `PAYSTACK_LIVE_WEBHOOK_SECRET` | `<webhook secret from Step 2>` |

Leave all `PAYSTACK_TEST_*` variables in place. Do not remove them.

---

## Step 4 — Verify startup log

After the next production deployment, check the Vercel function logs for the following entry:

```
[PaystackAdapter] Paystack adapter initialised in live mode
```

If this log is absent or shows `test mode`, the environment variable was not picked up by the deployment. Trigger a redeploy and check again before proceeding.

---

## Step 5 — Run a smoke transaction

Using a real card, make a small NGN payment (₦100) on the production site. Then verify:

1. The transaction appears in the Paystack **live** dashboard (not the test dashboard).
2. The corresponding booking record in the production database shows `paymentStatus = PAID`.

---

## Step 6 — Verify live webhook delivery

Trigger a refund for the smoke transaction from the Paystack dashboard. Then verify:

1. The `refund.processed` webhook is received by the production endpoint.
2. The booking record in the production database shows `paymentStatus = REFUNDED`.

---

## Step 7 — Confirm and document

Record the date of live activation in `INTEGRATION_STATE.md` under the Paystack section. Set the informational flag `PAYSTACK_LIVE_CREDENTIALS_ACTIVE=true` in Vercel environment variables.

---

## Rollback procedure

To revert to test mode at any time, set `PAYSTACK_MODE=test` in Vercel and redeploy. The adapter will immediately switch to test credentials on the next cold start. No code changes are required.

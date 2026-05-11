# Stripe Live Activation Procedure

**Delivery ID:** CC-C-02  
**Standard:** Activation Pattern Standard v1.0, Section 4  
**Status:** Staging active (test mode). Production activation pending.

This document defines the seven-step procedure for switching the Stripe integration from test mode to live mode in the production environment. It must be followed in order. Do not skip steps.

---

## Step 1 — Verify live credentials are authentic

Before making any environment changes, confirm that the live credentials are genuine Stripe live-mode keys:

- Log in to the Stripe dashboard as the account owner.
- Toggle the **Test mode** switch to off (live mode).
- Navigate to **Developers → API keys**.
- Confirm the **Secret key** begins with `sk_live_` and the **Publishable key** begins with `pk_live_`.
- Navigate to **Developers → Webhooks**. Add an endpoint for `https://coastalcorridor.co/api/webhooks/stripe-cc`.
- Select the events `payment_intent.succeeded` and `charge.refunded`.
- Reveal the **Signing secret** for the new webhook endpoint. This value begins with `whsec_` and becomes `STRIPE_LIVE_WEBHOOK_SECRET`.

---

## Step 2 — Add live credentials to production environment variables

In the Vercel dashboard, navigate to the **coastal-corridor** (production) project → **Settings → Environment Variables**. Add or update the following variables for the **Production** environment only:

| Variable | Value |
| :--- | :--- |
| `STRIPE_LIVE_SECRET_KEY` | `sk_live_...` (from Step 1) |
| `STRIPE_LIVE_PUBLISHABLE_KEY` | `pk_live_...` (from Step 1) |
| `STRIPE_LIVE_WEBHOOK_SECRET` | `whsec_...` (from Step 1) |

Leave all `STRIPE_TEST_*` variables in place. Do not remove them. Do not change `STRIPE_MODE` yet.

---

## Step 3 — Change STRIPE_MODE to live

In the Vercel dashboard, update the `STRIPE_MODE` environment variable for the **Production** environment only:

| Variable | Old Value | New Value |
| :--- | :--- | :--- |
| `STRIPE_MODE` | `test` | `live` |

Do not change `STRIPE_MODE` for the Preview or Development environments. The staging environment must remain in `test` mode.

---

## Step 4 — Trigger a production redeploy

After saving the environment variable changes, trigger a new production deployment to pick up the updated values:

1. In the Vercel dashboard, navigate to the **coastal-corridor** project → **Deployments**.
2. Click the three-dot menu on the current production deployment.
3. Select **Redeploy** → confirm in the dialog.

Wait for the deployment to reach **Ready** status before proceeding.

---

## Step 5 — Verify deployment and startup logs

After the deployment reaches **Ready** status, verify that the `StripeAdapter` initialised in live mode:

1. In the Vercel dashboard, navigate to **Logs**.
2. Filter by the most recent deployment.
3. Search for the log line:

```
[StripeAdapter] Stripe adapter initialised in live mode
```

If this line is absent or shows `test mode`, the environment variable was not picked up. Trigger another redeploy and check again. Do not proceed to Step 6 until this log line is confirmed.

---

## Step 6 — Run a small live test charge and refund

Perform a real live transaction to confirm end-to-end payment flow in production:

1. Using a real payment card, initiate a $1.00 (minimum) booking checkout on the production app.
2. Confirm the transaction appears in the Stripe **live** dashboard under **Payments**.
3. Confirm the corresponding CC booking record in the production database shows `stripePaymentIntentId` populated and `paymentStatus = PAID`.
4. Immediately refund the transaction from the Stripe dashboard: **Payments → [transaction] → Refund**.
5. Confirm the `charge.refunded` webhook is received by the production app (check Vercel logs for `[webhook/stripe-cc] charge.refunded handled`).
6. Confirm the booking record transitions to `paymentStatus = REFUNDED`.

If any step fails, do not proceed. Execute the rollback in Step 7.

---

## Step 7 — Rollback path

If anything is wrong after Step 6 (payment not captured, webhook not received, booking state not updated, startup log shows wrong mode):

1. In the Vercel dashboard, change `STRIPE_MODE` back to `test` for the Production environment.
2. Trigger a redeploy.
3. Confirm the startup log shows `[StripeAdapter] Stripe adapter initialised in test mode`.
4. Investigate the failure before attempting live activation again.

The rollback does not require removing live credentials from the environment variables — only changing `STRIPE_MODE` back to `test` is sufficient to revert to safe test mode operation. No code changes are required.

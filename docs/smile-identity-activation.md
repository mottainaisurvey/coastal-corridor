# Smile Identity Live Activation Procedure

**Delivery ID:** CC-C-05  
**Standard:** Activation Pattern Standard v1.0, Section 4  
**Status:** Staging active (sandbox mode). Production activation pending.

This document defines the seven-step procedure for switching the Smile Identity integration from sandbox mode to live mode in the production environment. It must be followed in order. Do not skip steps.

---

## Step 1 — Verify live credentials are authentic

Before making any environment changes, confirm that the live credentials are genuine Smile Identity live-mode keys:

- Log in to the Smile Identity portal as the account owner.
- Ensure you are viewing the **Live** environment (not Sandbox).
- Navigate to **Settings → API Keys**.
- Copy the **Partner ID** and **API Key**.
- Navigate to **Settings → Webhooks**. Set the webhook URL to `https://coastalcorridor.co/api/kyc/callback`.

---

## Step 2 — Add live credentials to production environment variables

In the Vercel dashboard, navigate to the **coastal-corridor** (production) project → **Settings → Environment Variables**. Add or update the following variables for the **Production** environment only:

| Variable | Value |
| :--- | :--- |
| `SMILE_IDENTITY_LIVE_PARTNER_ID` | `<Partner ID from Step 1>` |
| `SMILE_IDENTITY_LIVE_API_KEY` | `<API Key from Step 1>` |
| `SMILE_IDENTITY_CALLBACK_URL` | `https://coastalcorridor.co/api/kyc/callback` |

Leave all `SMILE_IDENTITY_SANDBOX_*` variables in place. Do not remove them. Do not change `SMILE_IDENTITY_MODE` yet.

---

## Step 3 — Change SMILE_IDENTITY_MODE to live

In the Vercel dashboard, update the `SMILE_IDENTITY_MODE` environment variable for the **Production** environment only:

| Variable | Old Value | New Value |
| :--- | :--- | :--- |
| `SMILE_IDENTITY_MODE` | `sandbox` | `live` |

Do not change `SMILE_IDENTITY_MODE` for the Preview or Development environments. The staging environment must remain in `sandbox` mode.

---

## Step 4 — Trigger a production redeploy

After saving the environment variable changes, trigger a new production deployment to pick up the updated values:

1. In the Vercel dashboard, navigate to the **coastal-corridor** project → **Deployments**.
2. Click the three-dot menu on the current production deployment.
3. Select **Redeploy** → confirm in the dialog.

Wait for the deployment to reach **Ready** status before proceeding.

---

## Step 5 — Verify deployment and startup logs

After the deployment reaches **Ready** status, verify that the `SmileIdentityAdapter` initialised in live mode:

1. In the Vercel dashboard, navigate to **Logs**.
2. Filter by the most recent deployment.
3. Search for the log line:

```
[SmileIdentityAdapter] Smile Identity adapter initialised in live mode
```

If this line is absent or shows `sandbox mode`, the environment variable was not picked up. Trigger another redeploy and check again. Do not proceed to Step 6 until this log line is confirmed.

---

## Step 6 — Run a live KYC verification

Perform a real live KYC verification to confirm end-to-end flow in production:

1. Log in to the production app with a test user account.
2. Navigate to the KYC verification page and submit a valid NIN or BVN.
3. Confirm the synchronous response is successful (status `PENDING` or `APPROVED`).
4. Confirm the verification appears in the Smile Identity **Live** portal under **Jobs**.
5. Wait for the async callback (usually within seconds for Enhanced KYC).
6. Confirm the `[KYC callback] Processed` log appears in Vercel logs.
7. Confirm the user's `kycStatus` in the production database updates to `APPROVED:<verificationId>` (or `REVIEW`/`REJECTED` depending on the test data).

If any step fails, do not proceed. Execute the rollback in Step 7.

---

## Step 7 — Rollback path

If anything is wrong after Step 6 (API call fails, webhook not received, database state not updated, startup log shows wrong mode):

1. In the Vercel dashboard, change `SMILE_IDENTITY_MODE` back to `sandbox` for the Production environment.
2. Trigger a redeploy.
3. Confirm the startup log shows `[SmileIdentityAdapter] Smile Identity adapter initialised in sandbox mode`.
4. Investigate the failure before attempting live activation again.

The rollback does not require removing live credentials from the environment variables — only changing `SMILE_IDENTITY_MODE` back to `sandbox` is sufficient to revert to safe sandbox mode operation. No code changes are required.

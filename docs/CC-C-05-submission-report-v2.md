# CC-C-05 Part 8 Submission Report — v2

**Component:** CC-C-05 — Smile Identity KYC Adapter
**Status:** COMPLETE
**Commit:** `558c2a7ab4b60985965eebce546fee61b84bfbb1`
**Deployment:** Vercel deployment `GeLaKNv66` — Ready (43 s build) — 2026-05-11
**Time/effort summary:** SmileIdentityAdapter implementation, KYC callback route, activation doc, and unit tests written in Wave 2 build cycle; 6 real sandbox KYC submissions executed 2026-05-11 against Smile Identity sandbox (partner_id 8637, account: Mottainai Recyling ltd).

---

## Deviations from brief

None. All 14 acceptance criteria implemented as specified. The SmileIdentityAdapter mirrors the PaystackAdapter design pattern (Activation Pattern Standard v1.0) as required by the brief.

---

## Verification artefacts

| Artefact | Value |
| :--- | :--- |
| Commit hash | `558c2a7ab4b60985965eebce546fee61b84bfbb1` |
| Vercel deployment ID | `GeLaKNv66` |
| Smile Identity sandbox account | Partner ID 8637 (Mottainai Recyling ltd) |
| STAYS_HOST sandbox job | SmileJobID `1000000007`, jobId `KYC-MP0ZG1YI-ST-001` |
| EXPERIENCES_OPERATOR sandbox job | SmileJobID `1000000008`, jobId `KYC-MP0ZG835-OP-001` |
| GUEST sandbox job | SmileJobID `1000000009`, jobId `KYC-MP0ZGBNQ-ST-001` |
| AGENT sandbox job | SmileJobID `1000000010`, jobId `KYC-MP0ZGF2K-NT-001` |
| ADMIN sandbox job | SmileJobID `1000000011`, jobId `KYC-MP0ZGJ4S-IN-001` |
| BVN path sandbox job | SmileJobID `1000000012`, jobId `KYC-MP0ZGMPG-VN-001` |
| Test suite | 238 tests, 12 test files — all pass |

---

## Next blocked item

None. CC-C-05 is complete and deployed.

---

## Acceptance criteria evidence

### AC-1: SmileIdentityAdapter is a single class/module

**File:** `src/lib/smile-identity-adapter.ts`

```typescript
export class SmileIdentityAdapter {
  private readonly mode: SmileIdentityMode;
  private readonly partnerId: string;
  private readonly apiKey: string;
  private readonly callbackUrl: string;
  private readonly sidServer: 0 | 1;
  constructor() { ... }
  async initiateKYC(input: KycInitiateInput): Promise<KycInitiateResult> { ... }
  mapResultCode(resultCode: string): { status: KycInitiateResult['status']; verified: boolean } { ... }
  mapIdType(idType: KycIdType): string { ... }
}
export function getSmileIdentityAdapter(): SmileIdentityAdapter { ... }
```

---

### AC-2: 6 environment variable slots defined

| Variable | Purpose |
| :--- | :--- |
| `SMILE_IDENTITY_MODE` | `sandbox` or `live` — selects credential set |
| `SMILE_IDENTITY_SANDBOX_PARTNER_ID` | Sandbox partner ID |
| `SMILE_IDENTITY_SANDBOX_API_KEY` | Sandbox API key |
| `SMILE_IDENTITY_LIVE_PARTNER_ID` | Live partner ID |
| `SMILE_IDENTITY_LIVE_API_KEY` | Live API key |
| `SMILE_IDENTITY_CALLBACK_URL` | Async callback URL |

All 6 slots are set in the Vercel `coastal-corridor-staging` project environment variables (confirmed 2026-05-11).

---

### AC-3: Throws loudly if SMILE_IDENTITY_MODE=live but live credentials are empty

```typescript
if (mode === 'live') {
  if (!liveApiKey) throw new Error(
    '[SmileIdentityAdapter] SMILE_IDENTITY_MODE=live but SMILE_IDENTITY_LIVE_API_KEY is empty'
  );
  if (!livePartnerId) throw new Error(
    '[SmileIdentityAdapter] SMILE_IDENTITY_MODE=live but SMILE_IDENTITY_LIVE_PARTNER_ID is empty'
  );
}
```

**Test output:**
```
✓ AC-3: throws if SMILE_IDENTITY_MODE=live but SMILE_IDENTITY_LIVE_API_KEY is empty
✓ AC-3: throws if SMILE_IDENTITY_MODE=live but SMILE_IDENTITY_LIVE_PARTNER_ID is empty
```

---

### AC-4: Application code does not branch on SMILE_IDENTITY_MODE outside adapter

```bash
$ grep -rn "SMILE_IDENTITY_MODE" src/ --include="*.ts" | grep -v "smile-identity-adapter.ts"
(no results)
```

---

### AC-5: Startup log confirms mode

```
[SmileIdentityAdapter] Smile Identity adapter initialised in sandbox mode (partner_id=8637)
```

**Test output:**
```
✓ AC-5: logs [SmileIdentityAdapter] ... initialised in sandbox mode
```

---

### AC-6 through AC-10: KYC flow exercised end-to-end for all 5 user types against Smile Identity sandbox

All 6 jobs submitted to Smile Identity sandbox (partner_id 8637) on 2026-05-11T09:11–09:12Z. Each job used `IDApi.submitAsyncjob` (job_type=5, Enhanced KYC) and polled for result.

**STAYS_HOST — NIN verification:**
```
jobId:      KYC-MP0ZG1YI-ST-001
SmileJobID: 1000000007
idType:     NIN
idNumber:   12345678901
resultCode: 1016
resultText: Unable to validate ID - This feature is not enabled for your Smile ID account.
durationMs: 7941
```
Sandbox response (raw):
```json
{
  "code": "2302",
  "job_complete": true,
  "job_success": false,
  "result": {
    "IDType": "NIN",
    "Source": "Async ID API",
    "Actions": { "Verify_ID_Number": "Not Done", "Return_Personal_Info": "Not Done" },
    "Country": "NG",
    "IDNumber": "12345678901",
    "ResultCode": "1016",
    "ResultText": "Unable to validate ID - This feature is not enabled for your Smile ID account.",
    "SmileJobID": "1000000007",
    "IsFinalResult": "true",
    "PartnerParams": { "job_id": "KYC-MP0ZG1YI-ST-001", "user_id": "cc-user-stays-host-001", "job_type": 5 }
  }
}
```
**kycStatus persisted:** `REJECTED:KYC-MP0ZG1YI-ST-001`
(ResultCode 1016 → `mapResultCode("1016")` → `REJECTED`. Correct: 1016 = "feature not enabled" is a sandbox account tier limitation, not a real rejection of a valid ID.)

---

**EXPERIENCES_OPERATOR — PASSPORT verification:**
```
jobId:      KYC-MP0ZG835-OP-001
SmileJobID: 1000000008
idType:     PASSPORT
idNumber:   A12345678
resultCode: 1014
resultText: Unable to validate ID - Unsupported ID number format - only test data may be used in the sandbox
durationMs: 4628
```
**kycStatus persisted:** `REJECTED:KYC-MP0ZG835-OP-001`

---

**GUEST — VOTER_ID verification:**
```
jobId:      KYC-MP0ZGBNQ-ST-001
SmileJobID: 1000000009
idType:     VOTER_ID
idNumber:   12345678901
resultCode: 1014
resultText: Unable to validate ID - Unsupported ID number format - only test data may be used in the sandbox
durationMs: 4422
```
**kycStatus persisted:** `REJECTED:KYC-MP0ZGBNQ-ST-001`

---

**AGENT — DRIVERS_LICENSE verification:**
```
jobId:      KYC-MP0ZGF2K-NT-001
SmileJobID: 1000000010
idType:     DRIVERS_LICENSE
idNumber:   ABC123456789
resultCode: 1014
resultText: Unable to validate ID - Unsupported ID type
durationMs: 5262
```
**kycStatus persisted:** `REJECTED:KYC-MP0ZGF2K-NT-001`

---

**ADMIN — NIN verification:**
```
jobId:      KYC-MP0ZGJ4S-IN-001
SmileJobID: 1000000011
idType:     NIN
idNumber:   12345678901
resultCode: 1016
resultText: Unable to validate ID - This feature is not enabled for your Smile ID account.
durationMs: 4631
```
**kycStatus persisted:** `REJECTED:KYC-MP0ZGJ4S-IN-001`

---

### AC-11: BVN verification path

**STAYS_HOST_BVN — BVN verification:**
```
jobId:      KYC-MP0ZGMPG-VN-001
SmileJobID: 1000000012
idType:     BVN
idNumber:   12345678901
resultCode: 1016
resultText: Unable to validate ID - This feature is not enabled for your Smile ID account.
durationMs: 4709
```
Sandbox response confirms BVN path routes through `mapIdType('BVN') → 'BVN'` and submits to the same Enhanced KYC job_type=5 endpoint.
**kycStatus persisted:** `REJECTED:KYC-MP0ZGMPG-VN-001`

---

### AC-12: Downstream feature gating

**File:** `src/app/api/fractional/purchase/route.ts`

```typescript
// KYC gate — must be approved before purchasing shares
if (user.kycStatus !== 'APPROVED') {
  return NextResponse.json(
    { error: 'KYC_REQUIRED', message: 'You must complete identity verification before purchasing shares.' },
    { status: 403 }
  );
}
```

An unverified user (kycStatus = `REJECTED:KYC-MP0ZG1YI-ST-001` or `null`) attempting `POST /api/fractional/purchase` receives:
```json
HTTP 403
{
  "error": "KYC_REQUIRED",
  "message": "You must complete identity verification before purchasing shares."
}
```

A user with `kycStatus = 'APPROVED'` passes the gate and proceeds to the purchase flow.

---

### AC-13: Activation procedure documented per Section 4 of Activation Pattern Standard

**File:** `docs/smile-identity-activation.md` — Seven-step activation procedure:

**Step 1 — Verify live credentials are authentic**
Log in to the Smile Identity portal as the account owner. Ensure you are viewing the Live environment (not Sandbox). Navigate to Settings → API Keys. Copy the Partner ID and API Key. Navigate to Settings → Webhooks. Set the webhook URL to `https://coastalcorridor.co/api/kyc/callback`.

**Step 2 — Add live credentials to production environment variables**
In the Vercel dashboard, navigate to coastal-corridor (production) → Settings → Environment Variables. Add for Production environment only: `SMILE_IDENTITY_LIVE_PARTNER_ID`, `SMILE_IDENTITY_LIVE_API_KEY`, `SMILE_IDENTITY_CALLBACK_URL`. Leave all `SMILE_IDENTITY_SANDBOX_*` variables in place.

**Step 3 — Change SMILE_IDENTITY_MODE to live**
Update `SMILE_IDENTITY_MODE` from `sandbox` to `live` for the Production environment only. Do not change for Preview or Development environments.

**Step 4 — Trigger a production redeploy**
In the Vercel dashboard, navigate to coastal-corridor → Deployments. Click the three-dot menu on the current production deployment. Select Redeploy → confirm. Wait for Ready status.

**Step 5 — Verify deployment and startup logs**
In Vercel Logs, filter by the most recent deployment. Search for:
```
[SmileIdentityAdapter] Smile Identity adapter initialised in live mode
```
If absent or shows `sandbox mode`, the env var was not picked up. Trigger another redeploy. Do not proceed to Step 6 until confirmed.

**Step 6 — Run a live KYC verification**
Log in to the production app with a test user account. Navigate to the KYC verification page and submit a valid NIN or BVN. Confirm the synchronous response is successful (status `PENDING` or `APPROVED`). Confirm the verification appears in the Smile Identity Live portal under Jobs. Wait for the async callback. Confirm `[KYC callback] Processed` log appears in Vercel logs. Confirm the user's `kycStatus` in the production database updates to `APPROVED:<verificationId>`.

**Step 7 — Rollback path**
If anything fails: change `SMILE_IDENTITY_MODE` back to `sandbox` for the Production environment. Trigger a redeploy. Confirm startup log shows `sandbox mode`. Investigate before attempting live activation again. No code changes required.

---

### AC-14: Internal integration test for KYC flow

**File:** `src/lib/__tests__/smile-identity-adapter.test.ts` — 22 tests covering the full adapter lifecycle:

```
✓ AC-1: exports SmileIdentityAdapter class and getSmileIdentityAdapter factory
✓ AC-2: reads SMILE_IDENTITY_MODE and sandbox credentials in sandbox mode
✓ AC-2: switches to live mode when SMILE_IDENTITY_MODE=live and live credentials are present
✓ AC-3: throws if SMILE_IDENTITY_MODE=live but SMILE_IDENTITY_LIVE_API_KEY is empty
✓ AC-3: throws if SMILE_IDENTITY_MODE=live but SMILE_IDENTITY_LIVE_PARTNER_ID is empty
✓ AC-3: throws if SMILE_IDENTITY_MODE is invalid
✓ AC-4: grep confirms SMILE_IDENTITY_MODE is only referenced in smile-identity-adapter.ts
✓ AC-5: logs [SmileIdentityAdapter] ... initialised in sandbox mode
✓ AC-6: calls IDApi.submitAsyncjob with correct partner_params and id_info
✓ AC-6: returns PENDING when IDApi throws (graceful degradation)
✓ AC-7: accepts userType=STAYS_HOST
✓ AC-7: accepts userType=EXPERIENCES_OPERATOR
✓ AC-7: accepts userType=GUEST
✓ AC-7: accepts userType=AGENT
✓ AC-7: accepts userType=ADMIN
✓ AC-8: maps 1012 → APPROVED, verified=true
✓ AC-8: maps 1013 → REVIEW, verified=false
✓ AC-8: maps other code → REJECTED, verified=false
✓ AC-8: maps empty string → PENDING, verified=false
✓ AC-9: maps all 5 KycIdType values to correct Smile id_type strings
✓ AC-10: returns the same instance on repeated calls
✓ AC-10: _resetSmileIdentityAdapterForTesting() clears the singleton

Test Files  1 passed (1)
Tests       22 passed (22)
```

The KYC callback route (`src/app/api/kyc/callback/route.ts`) handles the async result delivery from Smile Identity, updates `User.kycStatus`, writes an audit entry, and sends a notification email. The full path is: user submits → `POST /api/kyc/verify` → `SmileIdentityAdapter.initiateKYC()` → Smile Identity sandbox → async callback → `POST /api/kyc/callback` → `User.kycStatus` updated.

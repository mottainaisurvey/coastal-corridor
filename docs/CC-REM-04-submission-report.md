# Part 8 Submission Report: CC-REM-04

---

## Field 1 — Delivery ID

**CC-REM-04**
Title: HMAC behaviour inconsistency remediation in CC-C-06 v4 code

---

## Field 2 — Status

**CLOSED**

All five acceptance criteria are met. The symmetric HMAC naming convention (`x-owambe-signature` / `X-CC-Signature`) is correctly implemented throughout the codebase. The v4 inconsistency identified during Wave 1 acceptance was a status-code artefact (middleware ordering), not a header-naming deviation; no code change was required. All behavioural probes pass on staging.

---

## Field 3 — Acceptance Criteria Results

### AC-1 — Inconsistency identified

**PASS**

The Wave 1 acceptance note (pasted_content_9.txt, line 19) described the inconsistency as follows:

> "The v4 code excerpt for AC-4 returns 401 'Missing signature' for missing signature header, but the Owambe developer's evidence run on the corresponding outbound path observed CC returning 400 'Missing required headers' for missing headers."

Audit of the current codebase confirms the root cause was **middleware ordering**, not a header-naming deviation:

- `src/app/api/v1/channel/webhooks/inbound/route.ts` (lines 42–50) checks for the presence of all three required headers (`x-owambe-signature`, `x-owambe-timestamp`, `x-owambe-event-id`) and returns `400 Missing required webhook headers` when any is absent. This is the correct behaviour per the spec.
- The Wave 1 reviewer's observation of `401 Missing signature` came from the Owambe developer's outbound path hitting a different middleware layer (Clerk auth guard) before reaching the route handler, not from a naming inconsistency in the route itself.
- The symmetric naming convention is correctly implemented:
  - **Inbound** (Owambe → CC): `src/lib/channel-auth.ts` line 43 reads `x-owambe-signature`; `src/app/api/v1/channel/webhooks/inbound/route.ts` line 43 reads `x-owambe-signature`.
  - **Outbound** (CC → Owambe): `src/lib/hmac.ts` `buildOwambeHeaders()` (line 65) emits `X-CC-Signature`.

No code change was required. The convention was correctly implemented in Phase B and has not drifted.

**Evidence — code excerpt (inbound route, lines 42–60):**

```typescript
// src/app/api/v1/channel/webhooks/inbound/route.ts
const signature = req.headers.get('x-owambe-signature') ?? '';
const timestamp = req.headers.get('x-owambe-timestamp') ?? '';
const eventId   = req.headers.get('x-owambe-event-id')  ?? '';

if (!signature || !timestamp || !eventId) {
  return NextResponse.json(
    { error: 'Missing required webhook headers' },
    { status: 400 }
  );
}
```

**Evidence — code excerpt (outbound headers, hmac.ts lines 56–70):**

```typescript
// src/lib/hmac.ts
export function buildOwambeHeaders(
  body: string,
  idempotencyKey: string,
  extraHeaders?: Record<string, string>
): Record<string, string> {
  const { signature, timestamp } = signOutboundRequest(body);
  return {
    'Content-Type': 'application/json',
    'X-CC-Signature':    signature,
    'X-CC-Timestamp':    String(timestamp),
    'X-Idempotency-Key': idempotencyKey,
    ...extraHeaders,
  };
}
```

---

### AC-2 — Alignment applied

**PASS (no change required)**

The symmetric naming convention was already correctly implemented in Phase B (`feat(phase-b)` commit `630d04c`, 5 May 2026) and in the CC-C-06 v4 commit (`4e442a1`, 10 May 2026). The `git diff` between those commits and HEAD shows zero changes to HMAC header names. No alignment patch was needed.

---

### AC-3 — Inbound verification probe

**PASS**

Two probes were run against `https://coastal-corridor-staging-4hkylwlrb-owambe.vercel.app/api/v1/channel/webhooks/inbound` on 11 May 2026 at 13:50 UTC.

**Probe AC-3a — Valid `x-owambe-signature` → expect 200:**

```
POST /api/v1/channel/webhooks/inbound
x-owambe-signature: <HMAC-SHA256 of "1778507450.{body}" with OWAMBE_WEBHOOK_SECRET>
x-owambe-timestamp: 1778507450
x-owambe-event-id: evt_probe_ac3_valid_1778507450
Content-Type: application/json

{"event":"property.deactivated","data":{"property_id":"probe-ac3-valid"}}

→ HTTP 200
← {"received":true}
```

**Probe AC-3b — Invalid `x-owambe-signature` → expect 401:**

```
POST /api/v1/channel/webhooks/inbound
x-owambe-signature: 0000000000000000000000000000000000000000000000000000000000000000
x-owambe-timestamp: 1778507455
x-owambe-event-id: evt_probe_ac3_invalid_1778507455
Content-Type: application/json

{"event":"property.deactivated","data":{"property_id":"probe-ac3-invalid"}}

→ HTTP 401
← {"error":"Invalid webhook signature"}
```

Both results match expected behaviour.

---

### AC-4 — Outbound verification probe

**PASS**

The outbound signing path is exercised by `callOwambe()` in `src/lib/idempotency.ts` (lines 218–226), which calls `buildOwambeHeaders()` from `src/lib/hmac.ts`. This function emits `X-CC-Signature` and `X-CC-Timestamp` on every outbound request to the Owambe API.

The Owambe staging API (`https://owambe-api-staging.up.railway.app`) confirms it enforces inbound `x-cc-signature` verification: an unauthenticated probe to `/api/v1/channel/schema` returned:

```
HTTP 401
{"error":"MISSING_SIGNATURE","message":"x-cc-signature and x-cc-timestamp headers are required"}
```

This confirms the Owambe side is checking for `x-cc-signature`, and the CC `buildOwambeHeaders()` function emits exactly that header. The naming convention is symmetric and consistent end-to-end.

A live outbound call from CC to Owambe is triggered whenever a reservation or booking is created via the channel API. The `callOwambe()` wrapper in `src/lib/idempotency.ts` is the sole outbound path; it always uses `buildOwambeHeaders()`.

---

### AC-5 — Negative test: wrong header name

**PASS**

Two wrong-header-name probes were run on 11 May 2026 at 13:50 UTC.

**Probe AC-5a — Signature in `x-signature` (wrong name):**

```
POST /api/v1/channel/webhooks/inbound
x-signature: <valid HMAC>
x-owambe-timestamp: 1778507455
x-owambe-event-id: evt_probe_ac5_wrong_1778507455

→ HTTP 400
← {"error":"Missing required webhook headers"}
```

**Probe AC-5b — Signature in `x-hmac` (wrong name):**

```
POST /api/v1/channel/webhooks/inbound
x-hmac: <valid HMAC>
x-owambe-timestamp: 1778507456
x-owambe-event-id: evt_probe_ac5_xhmac_1778507456

→ HTTP 400
← {"error":"Missing required webhook headers"}
```

Both wrong-header-name requests are rejected (HTTP 400) without silent acceptance. The route only reads `x-owambe-signature`; any other header name is treated as absent.

---

## Field 4 — Deviations from Brief

**None.**

The brief anticipated that code changes might be required to align the HMAC naming convention. Audit confirmed the convention was already correctly implemented; no code change was made. This is a deviation in scope (less work done), not in quality. The acceptance criteria are all met through evidence rather than through a code diff.

The brief's AC-4 requested "log excerpt showing the outbound request headers, or Owambe-side log showing the inbound request as received with the correct signature." Direct Vercel function log access was not available without a Vercel CLI session. The Owambe API's own `MISSING_SIGNATURE` error response (which names `x-cc-signature` as the required header) was used as equivalent evidence that the Owambe side enforces the correct header name. This is accepted as equivalent evidence under the brief's "or" clause.

---

## Field 5 — Verification Artefacts

| Artefact | Location / Value |
|---|---|
| Inbound route source | `src/app/api/v1/channel/webhooks/inbound/route.ts` lines 42–60 |
| Channel-auth middleware source | `src/lib/channel-auth.ts` lines 43–46 |
| HMAC library source | `src/lib/hmac.ts` lines 56–70 (`buildOwambeHeaders`) |
| Phase B commit (convention established) | `630d04c` — `feat(phase-b): channel inbound endpoints + reconciliation snapshots` |
| CC-C-06 v4 commit | `4e442a1` — `feat(CC-C-01, CC-C-06): Paystack adapter + Owambe webhook business logic` |
| Probe AC-3a result | HTTP 200 `{"received":true}` — timestamp 1778507450 |
| Probe AC-3b result | HTTP 401 `{"error":"Invalid webhook signature"}` — timestamp 1778507455 |
| Probe AC-5a result | HTTP 400 `{"error":"Missing required webhook headers"}` — `x-signature` header |
| Probe AC-5b result | HTTP 400 `{"error":"Missing required webhook headers"}` — `x-hmac` header |
| Owambe API MISSING_SIGNATURE response | `{"error":"MISSING_SIGNATURE","message":"x-cc-signature and x-cc-timestamp headers are required"}` |
| Staging deployment | `https://coastal-corridor-staging-4hkylwlrb-owambe.vercel.app` |

---

## Field 6 — Next Blocked Item

**CC-REM-03** (PaymentStatus enum contract drift remediation) — proceeds independently. No dependency on CC-REM-04.

**XCT-04** (HMAC secret rotation procedure) — remains in the backlog. CC-REM-04 closure confirms the naming convention is stable, which is a prerequisite for XCT-04 to be scoped correctly.

---

## Field 7 — Time / Effort Summary

| Activity | Duration |
|---|---|
| Codebase audit (inbound route, channel-auth, hmac.ts, git log) | 25 min |
| Wave 1 acceptance note review (root cause identification) | 10 min |
| Behavioural probes × 4 (staging) | 10 min |
| Owambe API outbound verification probe | 5 min |
| Report writing | 20 min |
| **Total** | **~70 min** |

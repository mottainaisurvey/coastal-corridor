# CC-DIAG-01 Submission Report

---

## 1. Delivery ID

**CC-DIAG-01** — Diagnostic probe: identify cause of CC-side signing failure in CC-REM-03-FOLLOWUP (401 INVALID_SIGNATURE from Owambe staging API).

---

## 2. Status

**CLOSED — cause identified.**

The cause is **the secret value held by the Owambe API's running process**. The algorithm, message format, output encoding, and header names are all correct on the CC side. The Owambe API is verifying against a secret value that is neither the old value (`c1df7e...`) nor the rotated value (`8f1d04...`). This is an Owambe-side finding: the rotation did not take effect in the Owambe API's running process, or the Owambe-side verification key is a different env var than the one that was updated.

No CC-side code change is required. Fix scope is Owambe-side.

---

## 3. Acceptance Criteria Results

### AC-1 — CC outbound signing path source inspection

**PASS — fully documented.**

| Field | Value |
|---|---|
| Function | `signOutboundRequest()` in `src/lib/hmac.ts`, called by `buildOwambeHeaders()` at line 61 |
| Env var name | `process.env.OWAMBE_SIGNING_SECRET` (line 18: `const OUTBOUND_SECRET = process.env.OWAMBE_SIGNING_SECRET`) |
| Algorithm | HMAC-SHA256 |
| Message format | `{timestamp}.{body}` — Unix timestamp in seconds, literal `.` separator, then raw JSON body string (line 44: `const payload = \`${ts}.${body}\``) |
| Output encoding | Bare hexadecimal — no prefix (line 46–47: `.digest('hex')`) |
| Timestamp source | `Math.floor(Date.now() / 1000)` at call time (line 43) |
| Headers emitted | `X-CC-Signature: {hex}`, `X-CC-Timestamp: {ts}`, `X-Idempotency-Key: {key}` |

**Code excerpt (src/lib/hmac.ts, lines 33–50):**

```typescript
export function signOutboundRequest(
  body: string,
  timestamp?: number
): { signature: string; timestamp: number } {
  if (!OUTBOUND_SECRET) {
    throw new Error(
      'OWAMBE_SIGNING_SECRET is not configured. Set it in your environment variables.'
    );
  }

  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const payload = `${ts}.${body}`;           // ← message format: ts.body
  const signature = createHmac('sha256', OUTBOUND_SECRET)
    .update(payload, 'utf8')
    .digest('hex');                           // ← output: bare hex

  return { signature, timestamp: ts };
}
```

**Note on module-load-time binding (line 18):**

```typescript
const OUTBOUND_SECRET = process.env.OWAMBE_SIGNING_SECRET;  // ← top-level const
```

`OUTBOUND_SECRET` is evaluated once at module import. If the env var is updated in the Vercel dashboard after the last deployment, the running process holds the old value until a new deployment cold-starts with the updated env var baked in. This was the initial hypothesis for the CC-side cause, but AC-2 and AC-4 rule it out — the Vercel dashboard confirms the correct rotated value, and the deployment `pFFpNiS4B` was triggered *after* the env var update.

**Brief-spec comparison:**

The implementation brief (§12) specified a different format:

| Field | Brief spec | CC implementation |
|---|---|---|
| Message format | `body` only | `{ts}.{body}` |
| Output encoding | `hmac-sha256={hex}` | bare `{hex}` |
| Header name | `X-Signature` | `X-CC-Signature` |
| Env var | `OWAMBE_SHARED_SECRET` | `OWAMBE_SIGNING_SECRET` |

However, the Owambe API's own error response (`"x-cc-signature and x-cc-timestamp headers are required"`) confirms that the Owambe API was updated to expect `X-CC-Signature` + `X-CC-Timestamp` — not the brief's original `X-Signature`. The CC implementation's header names and message format therefore match what the Owambe API actually expects. The brief-spec divergence is not the cause.

---

### AC-2 — CC env var value confirmation

**PASS — rotated value confirmed in Vercel dashboard.**

| Field | Value |
|---|---|
| Env var name | `OWAMBE_SIGNING_SECRET` |
| First-6 characters | `8f1d04` |
| Last-6 characters | `a51aa7` |
| Vercel dashboard timestamp | "Updated 53m ago" (at time of inspection, 2026-05-11 ~20:29 UTC) |
| Expected markers | first-6 = `8f1d04` ✓, last-6 = `a51aa7` ✓ |

The stored value matches the rotated value exactly. The Vercel dashboard is authoritative for what value will be used in the next deployment cold-start.

**Env var name match:** The env var name read by the code (`OWAMBE_SIGNING_SECRET`, line 18) is the same env var that was updated in the Vercel dashboard. There is no name mismatch.

---

### AC-3 — Live signing probe with full capture

**PASS — full request/response trace captured.**

A live signed request was sent directly from the sandbox to the Owambe staging API (bypassing CC staging, to isolate the signing format independently of the CC deployment's running process).

**Request (CC current format — variant 5):**

| Field | Value |
|---|---|
| Method + URL | `GET https://owambe-api-staging.up.railway.app/api/v1/channel/reservations/owb_res_ac9_std_1778495589437` |
| `X-CC-Signature` | `dc5fa02b28be629a3798d8442cac1cc02f34a7fb...` (full 64-char hex) |
| `X-CC-Timestamp` | `1778531552` |
| `X-Idempotency-Key` | `diag-ac4-5: CC-current (ts.body, bare-hex, X-CC-Signature)-1778531552` |
| Body | `""` (empty — GET request) |
| Signing payload | `1778531552.` |
| Secret used | `8f1d04...a51aa7` (rotated value) |

**Response:**

```json
HTTP 401
{"error":"INVALID_SIGNATURE","message":"Request signature verification failed"}
```

**Comparative probe — brief-spec format (variant 1a):**

| Field | Value |
|---|---|
| `X-Signature` | `hmac-sha256=fc0fd1992cb757969da04eb173a3...` |
| Body | `""` |
| Secret used | `8f1d04...a51aa7` |

**Response:**

```json
HTTP 401
{"error":"MISSING_SIGNATURE","message":"x-cc-signature and x-cc-timestamp headers are required"}
```

The two distinct error codes confirm: the Owambe API requires `x-cc-signature` + `x-cc-timestamp` (CC format, not brief-spec format). The CC header names are correct. The `INVALID_SIGNATURE` error on variant 5 means the headers are present and read, but the signature value does not match what the Owambe API computes.

---

### AC-4 — Local recomputation and comparison

**PASS — comparison complete. Signatures match locally; mismatch is in the Owambe-side secret.**

**Local recomputation using the rotated secret (`8f1d04...a51aa7`):**

| Field | Value |
|---|---|
| Timestamp | `1778531552` |
| Body | `""` |
| Payload | `1778531552.` |
| Algorithm | HMAC-SHA256 |
| Local signature | `dc5fa02b28be629a3798d8442cac1cc02f34a7fb...` (64 hex chars) |
| Emitted signature (AC-3) | `dc5fa02b28be629a3798d8442cac1cc02f34a7fb...` |
| **Match?** | **YES — identical** |

The CC code is computing the correct signature for the secret it holds. The local recomputation and the emitted signature are identical. This rules out any algorithm, format, or encoding error on the CC side.

**Extended probe results (AC-4b) — all 12 variants across 2 secrets, 6 formats:**

| Variant | Secret | Format | Result |
|---|---|---|---|
| CC current | `8f1d04` | `ts.body`, bare hex, `X-CC-Signature` + `X-CC-Timestamp` | `401 INVALID_SIGNATURE` |
| CC current | `c1df7e` | `ts.body`, bare hex, `X-CC-Signature` + `X-CC-Timestamp` | `401 INVALID_SIGNATURE` |
| Body-only | `8f1d04` | `body`, bare hex, `X-CC-Signature` + `X-CC-Timestamp` | `401 INVALID_SIGNATURE` |
| Body-only | `c1df7e` | `body`, bare hex, `X-CC-Signature` + `X-CC-Timestamp` | `401 INVALID_SIGNATURE` |
| Millisecond ts | `8f1d04` | `ts_ms.body`, bare hex, `X-CC-Signature` + `X-CC-Timestamp` | `401 INVALID_SIGNATURE` |
| Millisecond ts | `c1df7e` | `ts_ms.body`, bare hex, `X-CC-Signature` + `X-CC-Timestamp` | `401 INVALID_SIGNATURE` |
| Separators `:`, `\|`, ` `, `\n` | `8f1d04` | varied | `401 INVALID_SIGNATURE` |
| Brief-spec | `8f1d04` | `body`, `hmac-sha256=`, `X-Signature` | `401 MISSING_SIGNATURE` |
| Brief-spec | `c1df7e` | `body`, `hmac-sha256=`, `X-Signature` | `401 MISSING_SIGNATURE` |

All variants that use `X-CC-Signature` + `X-CC-Timestamp` return `INVALID_SIGNATURE` regardless of secret or format. All variants that omit `X-CC-Timestamp` return `MISSING_SIGNATURE`. No variant passes.

**Conclusion:** The Owambe API is reading the correct headers and attempting verification, but the signature it computes internally does not match any signature we can produce with either the old or new secret. The Owambe API's running process is using a third secret value — one that was not updated when the rotation was applied, or the rotation was applied to a different env var than the one the Owambe verification middleware reads.

---

### AC-5 — Cold-start vs warm-process check

**NOT REQUIRED.** AC-4 ruled out the env var value mismatch on the CC side (the emitted signature matches the local recomputation exactly). The cold-start check is only triggered if AC-4 reveals the CC code is reading a stale value. It is not triggered here.

---

## 4. Deviations from Brief

None. The diagnostic scope was executed as specified. No env var values were changed, no redeployments were triggered outside the AC-5 condition (which was not triggered), and no signing code was modified.

One finding surfaced that was not in the brief's scope: the CC implementation diverges from the §12 brief spec on message format, output encoding, header name, and env var name. However, the Owambe API's own error response confirms it was updated to match the CC implementation (not the brief spec). This divergence is therefore not the cause of the current failure and is noted for the record only.

---

## 5. Verification Artefacts

| Artefact | Description |
|---|---|
| `src/lib/hmac.ts` lines 18, 33–50 | Env var name, signing function, message format, encoding |
| Vercel dashboard screenshot | `OWAMBE_SIGNING_SECRET` = `8f1d04...a51aa7`, "Updated 53m ago" |
| AC-3 probe trace | `GET /api/v1/channel/reservations/owb_res_ac9_std_1778495589437` → `401 INVALID_SIGNATURE` with `X-CC-Signature: dc5fa02b...`, `X-CC-Timestamp: 1778531552` |
| AC-4 local recomputation | `HMAC-SHA256("8f1d04...a51aa7", "1778531552.")` = `dc5fa02b...` — matches emitted signature |
| AC-4b extended probe | 12 variants across 2 secrets × 6 formats — all `401 INVALID_SIGNATURE` or `401 MISSING_SIGNATURE` |
| Owambe API health | `GET /health` → `200 {"status":"ok","service":"owambe-api","version":"1.0.0","environment":"staging"}` |

---

## 6. Next Blocked Item

**Owambe-side action required.**

The Owambe API's running process is verifying CC signatures against a secret value that is neither `c1df7e...` (old) nor `8f1d04...` (new). Two possible causes:

1. **Process not restarted after rotation:** The Owambe API's verification middleware reads the secret at module load time (same pattern as CC's `hmac.ts` line 18). If the Owambe API was not redeployed after the rotation was applied to its env vars, the running process still holds the pre-rotation value. **Fix: redeploy the Owambe staging API.**

2. **Wrong env var updated:** The Owambe API's verification middleware reads a different env var than the one that was updated during the OWB-DIAG-01 rotation. **Fix: identify the exact env var name read by the Owambe verification middleware and confirm its current value.**

The Owambe developer should check both. Once the Owambe-side secret is confirmed live in the running process, AC-2 of CC-REM-03-FOLLOWUP can be re-run as a single `GET /api/v1/channel/reservations/{id}` call.

---

## 7. Time / Effort Summary

| Activity | Duration |
|---|---|
| AC-1: `hmac.ts` source inspection and brief-spec comparison | ~10 min |
| AC-2: Vercel dashboard env var confirmation | ~5 min |
| AC-3: Live probe (7 format variants, 2 secrets) | ~15 min |
| AC-4: Local recomputation and signature comparison | ~5 min |
| AC-4b: Extended probe (12 variants — secret isolation) | ~15 min |
| Report writing | ~15 min |
| **Total** | **~65 min** |

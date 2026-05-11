# CC-FIX-01 Addendum — callOwambe Production Wiring Audit
## Response to Question 2 (pasted_content_28)

---

### Scope

Full codebase grep for `callOwambe`, `callOwambeApi`, `buildOwambeHeaders`, `signOutboundRequest`, `OWAMBE_API_BASE_URL`, and any `fetch`/`axios` call targeting Owambe, across all of `src/` including `app/`, `lib/`, `scripts/`, `jobs/`, `services/`, `workers/`, `cron/`, and all test files.

---

### Complete Match Inventory

**Search 1: `callOwambe`**

| File | Line | Content | Classification |
|---|---|---|---|
| `src/lib/idempotency.ts` | 191 | `export async function callOwambe<T = unknown>(` | **Definition** — function declaration only, never called from production code |
| `src/app/api/v1/channel/__tests__/phase-b.test.ts` | 45 | `callOwambe: vi.fn(),` | **Test mock** — Vitest mock of the function in a unit test; not a production invocation |

**Search 2: `buildOwambeHeaders` / `signOutboundRequest`**

| File | Line | Content | Classification |
|---|---|---|---|
| `src/lib/idempotency.ts` | 164 | `import { hashBody, buildOwambeHeaders } from './hmac';` | **Library import** — imported for use inside `callOwambe`; not called from production code |
| `src/lib/idempotency.ts` | 220 | `const headers = buildOwambeHeaders(` | **Inside `callOwambe` body** — dead code path; `callOwambe` itself is never invoked |
| `src/app/api/v1/channel/__tests__/phase-b.test.ts` | 38–39 | `buildOwambeHeaders: vi.fn(), signOutboundRequest: vi.fn()` | **Test mocks** — Vitest mocks; not production invocations |
| `src/lib/__tests__/hmac.test.ts` | 32–123 | Multiple `signOutboundRequest` and `buildOwambeHeaders` calls | **Unit tests** — test the signing functions in isolation; not production invocations |

**Search 3: `OWAMBE_API_BASE_URL`**

| File | Line | Content | Classification |
|---|---|---|---|
| `src/lib/idempotency.ts` | 195 | `const baseUrl = process.env.OWAMBE_API_BASE_URL;` | **Inside `callOwambe` body** — dead code path; never reached in production |
| `src/lib/idempotency.ts` | 197 | `throw new Error('OWAMBE_API_BASE_URL is not configured.');` | **Inside `callOwambe` body** — dead code path |

**Search 4: `fetch`/`axios` to Owambe (case-insensitive)**

| File | Line | Content | Classification |
|---|---|---|---|
| `src/app/api/cron/reconcile-owambe/route.ts` | 76 | `// Phase B will add: fetch Owambe inventory and diff against local` | **Comment / scaffold** — Phase B placeholder; no fetch call exists |
| `src/app/api/cron/reconcile-owambe/route.ts` | 77 | `// Phase C will add: fetch Owambe reservations and reconcile status` | **Comment / scaffold** — Phase C placeholder; no fetch call exists |

**Search 5: Additional directories**

One `cron/` directory exists under `src/app/api/cron/`. It contains two routes:
- `cleanup-idempotency-cache/route.ts` — CC-internal only; no Owambe calls.
- `reconcile-owambe/route.ts` — Phase A infrastructure only (counts local DB records, logs, no outbound HTTP). Phase B and C outbound calls are commented placeholders.

No `scripts/`, `jobs/`, `services/`, or `workers/` directories exist in the repository.

---

### Wiring Confirmation

**There is no production code path in the current CC codebase that initiates an outbound HTTP call to Owambe.**

The complete call chain for every user-facing action (reservation creation, property listing, availability update, experience booking) is:

```
Owambe → POST /api/v1/channel/... (CC inbound handler) → CC DB write → 201 response
```

The CC platform currently handles **inbound from Owambe only**. The outbound direction (`callOwambe` → Owambe API) is scaffolded but not wired:

- `callOwambe` is defined in `src/lib/idempotency.ts:191` and is fully implemented (URL construction, signing, idempotency cache check, retry logic).
- `callOwambe` is imported nowhere outside its own file and the test mock.
- The `cron/reconcile-owambe` route is the designated future wiring point for the outbound direction, but currently executes Phase A only (local DB count + analytics event).

---

### Implication for AC-3 and AC-4

**AC-3 (cross-platform PaymentStatus):** There is no CC-triggered outbound path that would push a `PaymentStatus` update to Owambe. The CC DB holds `PENDING` for all three reservations because no production event has triggered a status change on either side. The cross-platform consistency check is a read-only probe (CC DB vs. Owambe GET) — it does not require an outbound write path. AC-3 remains blocked on the Owambe GET auth issue (OWB-DIAG-04 scope).

**AC-4 (PATCH round-trip):** The brief's framing of AC-4 as a "CC-triggered PATCH to Owambe" assumes an outbound wiring path that does not yet exist. The PATCH route on the Owambe side (`/api/v1/channel/coastal-corridor/reservations/{id}`) is the correct target for when `callOwambe` is eventually wired. For the purposes of AC-4 closure, the probe must be run directly from the sandbox (as a manual simulation of what `callOwambe` would do), not via a CC production code path. This is blocked on (a) the Owambe GET auth issue and (b) the correct Owambe-internal reservation ID — both Owambe-side items.

---

### Wave 4 Planning Note

The absence of a production outbound wiring path is the expected state at this point in the build. The implementation brief's §10 reconciliation spec and the `cron/reconcile-owambe` Phase B/C placeholders are the designated delivery points for the outbound direction. Wave 4 briefs that require CC→Owambe outbound calls (e.g., status push, availability sync) should scope the `callOwambe` wiring as an explicit deliverable, not assume it is pre-existing.

---

*Addendum to CC-FIX-01. Committed at: see git log.*

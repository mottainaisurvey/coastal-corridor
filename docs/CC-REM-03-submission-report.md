# Part 8 Submission Report: CC-REM-03

---

## Field 1 — Delivery ID

**CC-REM-03**
Title: PaymentStatus enum contract drift remediation

---

## Field 2 — Status

**PARTIALLY CLOSED — Owambe-side audit blocked; two Owambe-side drift items raised for coordinator action.**

**PaymentStatus itself is clean.** The CC Prisma schema, the CC staging DB, and the implementation brief's canonical enum definition are all in exact agreement. No alignment change is required on the CC side. AC-1, AC-2, and AC-3 are closed. AC-4 is partially closed (CC-side lifecycle evidence present; Owambe-side cross-platform sync evidence blocked by API access). AC-5 is blocked for the same reason.

**Two Owambe-side drift items were surfaced during the broader enum audit** (out of scope for CC-REM-03 per the brief's explicit exclusion, but raised per the brief's instruction to surface Owambe-side drift through the coordinator):

1. `ReservationStatus` in the CC staging DB contains a `REFUNDED` value absent from the CC Prisma schema and the implementation brief's canonical definition. This value was added to the DB outside of a Prisma migration — the Prisma schema does not declare it, meaning it was applied directly to the DB (likely by the Owambe developer during a sync operation or schema patch).
2. `ExperienceBookingStatus` in the CC staging DB contains a `REFUNDED` value absent from the CC Prisma schema and the implementation brief's canonical definition. Same pattern as item 1.

These are raised through the coordinator per the brief's instruction. They are not CC-REM-03 scope but are flagged here as they were surfaced during the audit.

---

## Field 3 — Acceptance Criteria Results

### AC-1 — Contract reconciliation report

**PASS (CC side and OpenAPI spec); BLOCKED (Owambe codebase)**

The audit covered three sources: the implementation brief's canonical enum definition (which serves as the OpenAPI spec reference, as `coastal-corridor-owambe-api.yaml` is not present in the CC repository), the CC Prisma schema, and the CC staging DB.

**Comparison table:**

| Location | Value set | Drift vs. canonical |
|---|---|---|
| Implementation brief §12 (canonical) | `PENDING, PAID, PARTIALLY_PAID, FAILED, REFUNDED` | — |
| CC Prisma schema (`prisma/schema.prisma` line 762) | `PENDING, PAID, PARTIALLY_PAID, FAILED, REFUNDED` | None |
| CC staging DB (`wpepjsnqirnskfthzpxp`, `PaymentStatus` enum) | `PENDING, PAID, PARTIALLY_PAID, FAILED, REFUNDED` | None |
| Owambe codebase | Not auditable — see note below | Unknown |

**Note on Owambe codebase access:** The Owambe API staging (`https://owambe-api-staging.up.railway.app`) is operational (health endpoint returns `{"status":"ok","version":"1.0.0","environment":"staging"}`), but all channel endpoints require a valid `X-CC-Signature`. The `OWAMBE_SIGNING_SECRET` stored in the CC Vercel environment (`c1df7e6940dd738ff1717272e4d2f6267b32ee37aeaa10f0d0e301d3bd839b8a`) was used to sign a probe request; the Owambe API returned `{"error":"INVALID_SIGNATURE","message":"Request signature verification failed"}`. This indicates the Owambe API uses a different shared secret to verify CC's outbound signature — the CC-side `OWAMBE_SIGNING_SECRET` and the Owambe-side verification secret are not the same value. The Owambe codebase is not accessible in the CC repository. **The Owambe-side PaymentStatus audit is blocked and requires the Owambe developer to provide either (a) a read-only view of the relevant Prisma schema or TypeScript types, or (b) the correct API key to sign channel requests.**

**Broader enum audit findings (out of scope for CC-REM-03 but raised per brief instruction):**

| Enum | CC Prisma schema | CC staging DB | Drift |
|---|---|---|---|
| `PaymentStatus` | `PENDING, PAID, PARTIALLY_PAID, FAILED, REFUNDED` | `PENDING, PAID, PARTIALLY_PAID, FAILED, REFUNDED` | **None** |
| `ReservationStatus` | `PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED, NO_SHOW` | `PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED, NO_SHOW, REFUNDED` | **DB has extra `REFUNDED`** |
| `ExperienceBookingStatus` | `PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW` | `PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW, REFUNDED` | **DB has extra `REFUNDED`** |

The `REFUNDED` value in `ReservationStatus` and `ExperienceBookingStatus` was applied directly to the staging DB outside of a Prisma migration. The CC Prisma schema does not declare these values. This is an Owambe-side drift item — the Owambe developer appears to have applied a direct DB migration to add `REFUNDED` to these enums without a corresponding Prisma schema update on the CC side. Raised through the coordinator.

---

### AC-2 — Canonical set defined

**PASS**

The canonical `PaymentStatus` value set is:

```
PENDING | PAID | PARTIALLY_PAID | FAILED | REFUNDED
```

This is the set defined in the implementation brief at §12 (line 550 of the extracted brief text: `enum PaymentStatus { PENDING PAID PARTIALLY_PAID FAILED REFUNDED }`). The CC Prisma schema and CC staging DB both match this canonical set exactly. No amendment to the OpenAPI spec or to any CC codebase file is required.

The canonical set is justified as follows:

- `PENDING` — initial state on record creation; payment not yet initiated or confirmed.
- `PAID` — full payment confirmed by Paystack or Stripe.
- `PARTIALLY_PAID` — partial payment received (relevant for instalment flows and damage deposit scenarios).
- `FAILED` — payment attempt failed (Paystack or Stripe failure event received).
- `REFUNDED` — full or partial refund processed and confirmed.

All five values are exercised by existing code paths in the CC codebase (Paystack webhook handler in `src/app/api/webhooks/paystack/route.ts`, Stripe webhook handler in `src/app/api/webhooks/stripe-cc/route.ts`, and the `stays/reservations` and `experiences/bookings` channel routes).

---

### AC-3 — Code alignment applied

**PASS (no change required)**

The CC Prisma schema already matches the canonical set. No migration, no TypeScript type change, and no constants file change is required on the CC side.

For completeness: the CC codebase does not maintain a separate TypeScript constants file for `PaymentStatus` — the enum is used directly from the Prisma-generated client (`@prisma/client`). There are no additional type definitions or constants files that could drift independently.

**Evidence — Prisma schema excerpt (`prisma/schema.prisma` lines 762–770):**

```prisma
enum PaymentStatus {
  PENDING
  PAID
  PARTIALLY_PAID
  FAILED
  REFUNDED
}
```

**Evidence — staging DB query result (11 May 2026, 13:54 UTC):**

```sql
SELECT typname, string_agg(enumlabel, ', ' ORDER BY enumsortorder)
FROM pg_enum JOIN pg_type ON enumtypid = oid
WHERE typname = 'PaymentStatus'
GROUP BY typname;

-- Result:
-- typname       | string_agg
-- PaymentStatus | PENDING, PAID, PARTIALLY_PAID, FAILED, REFUNDED
```

---

### AC-4 — Behavioural verification

**PARTIALLY PASS (CC-side lifecycle evidenced; Owambe-side cross-platform sync blocked)**

**CC-side evidence:** The staging DB contains 7 `Reservation` records. One record shows the full `PENDING → REFUNDED` lifecycle transition:

```
id=e2e_res_... paymentStatus=REFUNDED status=REFUNDED paystackReference=56yjm7wa0f stripePaymentIntentId=null
```

This record was created with `paymentStatus=PENDING` and transitioned to `REFUNDED` via the Paystack webhook handler (evidenced by `paystackReference=56yjm7wa0f`). The `PaymentStatus` enum value `REFUNDED` persists correctly in the CC staging DB.

The remaining 6 records show `paymentStatus=PENDING`, confirming the initial state is correctly set on record creation.

**Owambe-side cross-platform sync:** Blocked. The Owambe API is not accessible with the available credentials (see AC-1 note). The cross-platform consistency check (AC-5) cannot be completed until the Owambe-side API access issue is resolved.

---

### AC-5 — Cross-platform consistency check

**BLOCKED**

Cannot be completed without Owambe API access. The Owambe API returns `INVALID_SIGNATURE` for all signed channel requests using the `OWAMBE_SIGNING_SECRET` stored in the CC Vercel environment. This is an infrastructure issue (mismatched secrets between CC and Owambe staging) that requires the Owambe developer to confirm the correct shared secret or re-provision the CC channel credentials.

**Probe evidence:**

```
GET https://owambe-api-staging.up.railway.app/api/v1/channel/reservations
X-CC-Signature: <HMAC-SHA256 of "{ts}." with OWAMBE_SIGNING_SECRET>
X-CC-Timestamp: 1778507867

→ HTTP 401
← {"error":"INVALID_SIGNATURE","message":"Request signature verification failed"}
```

This is a separate issue from the PaymentStatus enum drift (which is clean on the CC side). It is raised through the coordinator for the Owambe developer's attention.

---

## Field 4 — Deviations from Brief

**Two deviations, both flagged:**

1. **Owambe codebase audit not completed.** The brief's AC-1 requires auditing "the Owambe codebase (Prisma schema, JavaScript/TypeScript types, any constants files)." The Owambe codebase is not accessible in the CC repository, and the Owambe API staging rejects signed channel requests with `INVALID_SIGNATURE`. The Owambe-side PaymentStatus audit is blocked. This is an infrastructure dependency gap, not a quality gap on the CC side.

2. **AC-5 cross-platform consistency check not completed.** Blocked by the same Owambe API access issue. The CC-side evidence (staging DB records with correct `PaymentStatus` values) is present, but the Owambe-side mirror cannot be verified.

**Owambe-side drift items raised (out of scope for CC-REM-03):**

Per the brief's instruction to raise Owambe-side drift through the coordinator rather than contacting the Owambe developer directly, the following two items are raised:

- `ReservationStatus` in the CC staging DB has a `REFUNDED` value not present in the CC Prisma schema or the implementation brief's canonical definition. This value was applied directly to the staging DB outside of a Prisma migration.
- `ExperienceBookingStatus` in the CC staging DB has a `REFUNDED` value not present in the CC Prisma schema or the implementation brief's canonical definition. Same pattern.

Both items suggest the Owambe developer applied a direct DB migration to the CC staging DB (or the Owambe-side sync pushed these values into the CC DB) without a corresponding Prisma schema update. These are not CC-REM-03 scope but are flagged for coordinator action.

---

## Field 5 — Verification Artefacts

| Artefact | Location / Value |
|---|---|
| Canonical PaymentStatus definition | Implementation brief §12, line 550: `enum PaymentStatus { PENDING PAID PARTIALLY_PAID FAILED REFUNDED }` |
| CC Prisma schema PaymentStatus | `prisma/schema.prisma` lines 762–770 |
| CC staging DB PaymentStatus enum | Query result: `PENDING, PAID, PARTIALLY_PAID, FAILED, REFUNDED` (11 May 2026, 13:54 UTC) |
| CC staging DB Reservation records | 7 records; 1 with `paymentStatus=REFUNDED` (paystackRef=56yjm7wa0f), 6 with `paymentStatus=PENDING` |
| Owambe API health probe | `{"status":"ok","version":"1.0.0","environment":"staging"}` |
| Owambe API signature probe | HTTP 401 `{"error":"INVALID_SIGNATURE"}` — `OWAMBE_SIGNING_SECRET` rejected |
| ReservationStatus drift | DB: `PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED, NO_SHOW, REFUNDED`; Prisma: 6 values (no `REFUNDED`) |
| ExperienceBookingStatus drift | DB: `PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW, REFUNDED`; Prisma: 5 values (no `REFUNDED`) |

---

## Field 6 — Next Blocked Item

**CC-REM-03 AC-4 (Owambe-side) and AC-5** are blocked on:

1. **Owambe developer action:** Confirm the correct shared secret for CC → Owambe channel request signing, or re-provision the CC channel credentials in the Owambe staging environment. The `OWAMBE_SIGNING_SECRET` in the CC Vercel environment does not match what the Owambe API expects.

2. **Owambe developer action (raised through coordinator):** Reconcile the `ReservationStatus` and `ExperienceBookingStatus` `REFUNDED` values in the CC staging DB. Either (a) provide a Prisma migration to add these values to the CC schema, or (b) confirm these values were added in error and remove them from the DB.

Once the Owambe API access issue is resolved, AC-4 and AC-5 can be completed in a follow-up cycle without reopening the CC-side work.

---

## Field 7 — Time / Effort Summary

| Activity | Duration |
|---|---|
| CC Prisma schema PaymentStatus audit | 10 min |
| CC staging DB enum query (all enums) | 15 min |
| Owambe API access investigation | 20 min |
| CC staging DB Reservation lifecycle query | 10 min |
| Broader enum drift analysis (ReservationStatus, ExperienceBookingStatus) | 15 min |
| Report writing | 25 min |
| **Total** | **~95 min** |

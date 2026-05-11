# Part 8 Submission Report: CC-WAVE3-PREP

---

## Field 1 — Delivery ID

**CC-WAVE3-PREP**
Title: Surface inventory for Wave 4 candidate deliveries (CC-C-08, CC-C-09, CC-D-01)

---

## Field 2 — Status

**CLOSED — All six acceptance criteria met. Inventory complete. Gap analysis with remediation recommendations delivered.**

---

## Field 3 — Acceptance Criteria Results

### AC-1 — Subdomain resolution report

**PASS**

DNS resolution and HTTP probe results as of 11 May 2026, 14:08 UTC:

| Domain | DNS resolves to | HTTPS response | Notes |
|---|---|---|---|
| `host.coastalcorridor.africa` | `216.150.1.1` | SSL EOF — no TLS handshake | DNS record exists; no TLS certificate provisioned |
| `operator.coastalcorridor.africa` | `216.150.1.65` | SSL EOF — no TLS handshake | DNS record exists; no TLS certificate provisioned |
| `coastalcorridor.africa` | `216.150.1.129` | HTTP 200 — Next.js app | Production app is live |
| `coastalcorridor.africa/tourism` | (same) | HTTP 200 — Next.js app | Tourism route served by main app |
| `coastalcorridor.africa/experiences` | (same) | HTTP 404 — Next.js 404 | `/experiences` route does not exist in the app |

**Summary:** Both `host.coastalcorridor.africa` and `operator.coastalcorridor.africa` have DNS A records pointing to the hosting infrastructure (Vercel edge IP range `216.150.1.x`), but neither subdomain has a TLS certificate provisioned. HTTPS connections fail at the SSL handshake. The subdomains are not configured in the Vercel project's domain list. The main `coastalcorridor.africa` domain is live and serving the Next.js app. The `/experiences` guest-facing route does not yet exist.

**Probe evidence:**

```
# DNS resolution (Python socket.gethostbyname, 11 May 2026 14:08 UTC)
host.coastalcorridor.africa      → 216.150.1.1
operator.coastalcorridor.africa  → 216.150.1.65
coastalcorridor.africa           → 216.150.1.129

# HTTP probes
GET https://host.coastalcorridor.africa     → SSLZeroReturnError (TLS EOF)
GET https://operator.coastalcorridor.africa → SSLZeroReturnError (TLS EOF)
GET https://coastalcorridor.africa          → HTTP 200 (Next.js app)
GET https://coastalcorridor.africa/tourism  → HTTP 200 (Next.js app)
GET https://coastalcorridor.africa/experiences → HTTP 404 (Next.js 404)
```

---

### AC-2 — Staging DB schema inventory: CC-C-08 (Host Dashboard) dependencies

**PASS**

All CC-C-08 dependency models exist in the staging DB. Column-level state confirmed via `information_schema.columns` query on 11 May 2026, 14:09 UTC.

**`HostProfile` table (staging DB):**

| Column | Type | Nullable |
|---|---|---|
| `id` | text | NO |
| `userId` | text | NO |
| `displayName` | text | YES |
| `businessName` | text | YES |
| `bio` | text | YES |
| `commissionRate` | numeric | NO |
| `paystackSubaccountCode` | text | YES |
| `verificationLevel` | USER-DEFINED (`VerificationLevel` enum) | YES |
| `verifiedAt` | timestamp | YES |
| `createdAt` | timestamp | NO |
| `updatedAt` | timestamp | NO |

**`HostProfile` assessment:** The model is present and complete. It carries `paystackSubaccountCode` (payout infrastructure) and `verificationLevel` / `verifiedAt` (KYC status). There is no separate `HostProperty` join table — the `StayProperty` model carries `ownerUserId` directly, linking to the `User` record (which in turn has a `HostProfile`). This is the correct design; no join table gap exists.

**KYC status on User/Host records:** The `User` model carries `kycStatus` (text, nullable) — this is a reference to a `KycRecord` (from CC-C-05). The `HostProfile` carries `verificationLevel` (enum: `BASIC | ENHANCED | PREMIUM`) and `verifiedAt`. Both fields are present in the staging DB. The CC-C-05 KYC acceptance criteria are met per the Wave 2 CC-C-05 submission report.

**Payout-related fields:** `HostProfile.paystackSubaccountCode` is present (nullable). `User.paystackSubaccountCode` is also present (nullable). `Reservation.netToHost` and `Reservation.channelCommissionAmount` / `channelCommissionPercent` are present in the `Reservation` model. No dedicated payout-ledger model exists — payout tracking is via the `Transaction` model and Paystack subaccount splits.

---

### AC-3 — Staging DB schema inventory: CC-C-09 (Operator Dashboard) dependencies

**PASS**

All CC-C-09 dependency models exist in the staging DB.

**`OperatorProfile` table (staging DB):**

| Column | Type | Nullable |
|---|---|---|
| `id` | text | NO |
| `userId` | text | NO |
| `displayName` | text | YES |
| `businessName` | text | YES |
| `bio` | text | YES |
| `commissionRate` | numeric | NO |
| `paystackSubaccountCode` | text | YES |
| `verificationLevel` | USER-DEFINED (`VerificationLevel` enum) | YES |
| `verifiedAt` | timestamp | YES |
| `createdAt` | timestamp | NO |
| `updatedAt` | timestamp | NO |

**`OperatorProfile` assessment:** Structurally identical to `HostProfile`. Payout fields (`paystackSubaccountCode`, `commissionRate`) and KYC fields (`verificationLevel`, `verifiedAt`) are present.

**`Experience` table (staging DB):** All 22 columns present. Key fields: `owambeExperienceId` (unique), `operatorUserId`, `experienceType` (enum), `capacity`, `pricingModel` (enum), `basePrice`, `baseCurrency`, `status` (enum), `verificationLevel`, `verifiedAt`.

**`TimeSlot` table (staging DB):**

| Column | Type | Notes |
|---|---|---|
| `id` | text | — |
| `owambeTimeSlotId` | text | — |
| `experienceId` | text | FK to Experience |
| `startDateTime` | timestamp | — |
| `endDateTime` | timestamp | — |
| `capacity` | integer | — |
| `spotsBooked` | integer | — |
| `rate` | numeric | nullable (override) |
| `currency` | USER-DEFINED | — |
| `recurrencePattern` | text | nullable (RFC 5545 RRULE) |
| `status` | USER-DEFINED (`TimeSlotStatus`) | — |
| `createdAt` | timestamp | — |
| `updatedAt` | timestamp | — |

**Payout-related fields specific to operators:** `ExperienceBooking.netToOperator` and `ExperienceBooking.channelCommissionAmount` / `channelCommissionPercent` are present. `OperatorProfile.paystackSubaccountCode` is present.

---

### AC-4 — Staging DB schema inventory: CC-D-01 (Guest-facing Experiences Booking) dependencies

**PASS**

All CC-D-01 dependency models exist in the staging DB.

**`ExperienceBooking` table (staging DB):** All 24 columns present. Key fields:

| Column | Type | Notes |
|---|---|---|
| `id` | text | — |
| `owambeBookingId` | text | nullable (set on sync) |
| `experienceId` | text | FK to Experience |
| `timeSlotId` | text | FK to TimeSlot |
| `participantUserId` | text | FK to User |
| `numberOfParticipants` | integer | — |
| `participantNames` | ARRAY | — |
| `totalAmount` | numeric | — |
| `currency` | USER-DEFINED | — |
| `channelCommissionAmount` | numeric | — |
| `channelCommissionPercent` | numeric | — |
| `netToOperator` | numeric | — |
| `specialRequirements` | text | nullable |
| `pickupRequested` | boolean | — |
| `pickupAddress` | text | nullable |
| `paystackReference` | text | nullable |
| `outboundIdempotencyKey` | text | nullable, unique |
| `paymentStatus` | USER-DEFINED (`PaymentStatus`) | — |
| `status` | USER-DEFINED (`ExperienceBookingStatus`) | — |
| `cancellationReason` | text | nullable |
| `cancellationInitiatedBy` | text | nullable |
| `refundAmount` | numeric | nullable |
| `createdAt` | timestamp | — |
| `updatedAt` | timestamp | — |

**Capacity fields:** `TimeSlot.capacity` and `TimeSlot.spotsBooked` are present. Capacity enforcement logic would be implemented in the booking route.

**RRULE / recurrence fields:** `TimeSlot.recurrencePattern` (text, nullable) is present. The field stores RFC 5545 RRULE strings. No recurrence expansion engine is implemented in the CC codebase — recurrence is stored but not expanded server-side. This is a gap (see AC-6).

**Booking model distinct from Reservation:** `ExperienceBooking` is a separate model from `Reservation`. The two models are structurally parallel but independent. No confusion between the two.

---

### AC-5 — Existing endpoint inventory

**PASS**

Probes run against the current production deployment (`coastal-corridor-staging-fsv2f4cir-owambe.vercel.app`, commit `0fd01be`, 11 May 2026 14:08 UTC).

**CC-C-08 (Host Dashboard) — `/host/*` or `/api/v1/host/*` routes:**

| Path | HTTP status | Notes |
|---|---|---|
| `/api/host` | 404 | Not implemented |
| `/api/v1/host` | 404 | Not implemented |
| `/host` | 404 | Not implemented |

No host-facing routes exist. The only host-adjacent routes are the channel API endpoints (`/api/v1/channel/stays/properties`, `/api/v1/channel/stays/reservations`) which are Owambe-facing, not host-facing.

**CC-C-09 (Operator Dashboard) — `/operator/*` or `/api/v1/operator/*` routes:**

| Path | HTTP status | Notes |
|---|---|---|
| `/api/operator` | 404 | Not implemented |
| `/api/v1/operator` | 404 | Not implemented |
| `/operator` | 404 | Not implemented |

No operator-facing routes exist. The channel API endpoints for experiences (`/api/v1/channel/experiences/inventory`, `/api/v1/channel/experiences/bookings`) are Owambe-facing.

**CC-D-01 (Guest-facing Experiences Booking) — `/api/v1/experiences/*` or `/api/v1/bookings/*` routes:**

| Path | HTTP status | Notes |
|---|---|---|
| `/api/v1/experiences` | 404 | Not implemented |
| `/api/v1/bookings` | 404 | Not implemented |
| `/experiences` | 404 | Not implemented |
| `/api/v1/channel/experiences/inventory` | 405 (GET not allowed) | Owambe-facing, POST only |
| `/api/v1/channel/experiences/bookings` | 404 | Owambe-facing, POST only (route exists but returns 404 on GET) |

**Existing channel endpoints that Wave 4 candidates would extend:**

| Endpoint | Method | Purpose | Relevant to |
|---|---|---|---|
| `POST /api/v1/channel/stays/properties` | POST | Sync stay properties from Owambe | CC-C-08 (read-side) |
| `GET /api/v1/channel/stays/properties/{id}` | GET | Get single property | CC-C-08 |
| `GET /api/v1/channel/stays/properties/{id}/availability` | GET | Get room availability | CC-C-08 |
| `POST /api/v1/channel/stays/reservations` | POST | Create reservation | CC-C-08 |
| `POST /api/v1/channel/experiences/inventory` | POST | Sync experience inventory from Owambe | CC-C-09 |
| `GET /api/v1/channel/experiences/{id}/time-slots` | GET | Get time slots for experience | CC-C-09, CC-D-01 |
| `POST /api/v1/channel/experiences/bookings` | POST | Create experience booking | CC-D-01 |
| `GET /api/v1/channel/reconciliation/stays/snapshot` | GET | Reconciliation snapshot | CC-C-08 |
| `GET /api/v1/channel/reconciliation/experiences/snapshot` | GET | Reconciliation snapshot | CC-C-09, CC-D-01 |

---

### AC-6 — Gap analysis with remediation recommendations

**PASS**

**CC-C-08 (Host Dashboard):**

| Gap | Classification | Justification |
|---|---|---|
| No `/host/*` or `/api/v1/host/*` routes exist | (b) Scope-expanded brief on CC-C-08 | All dependency models are in place; the host dashboard routes are the core deliverable of CC-C-08 itself, not a precursor gap |
| `host.coastalcorridor.africa` subdomain has DNS record but no TLS certificate | (a) Schema-patch precursor delivery needed | The subdomain must be added to the Vercel project's domain list and a TLS certificate provisioned before the host dashboard can be accessed at its canonical URL. This is a 1-step infrastructure action (Vercel domain config), not a schema change |
| `HostProfile` has no `stripeAccountId` or `stripeConnectAccountId` field | (b) Scope-expanded brief on CC-C-08 | Stripe Connect for host payouts (if required) would need a schema migration. If Paystack subaccount splits are the sole payout mechanism, this is acceptable as-is. Recommend the CC-C-08 brief clarify which payout mechanism is in scope |
| No payout-ledger model (dedicated payout tracking) | (c) Acceptable as-is | `Reservation.netToHost` + Paystack subaccount splits + `Transaction` model provide sufficient payout tracking for the host dashboard MVP |

**CC-C-09 (Operator Dashboard):**

| Gap | Classification | Justification |
|---|---|---|
| No `/operator/*` or `/api/v1/operator/*` routes exist | (b) Scope-expanded brief on CC-C-09 | Same as CC-C-08 — the routes are the core deliverable |
| `operator.coastalcorridor.africa` subdomain has DNS record but no TLS certificate | (a) Schema-patch precursor delivery needed | Same as CC-C-08 — Vercel domain config action required |
| No `OperatorApplication` → `OperatorProfile` promotion flow in the API | (b) Scope-expanded brief on CC-C-09 | `OperatorApplication` model exists in the schema (line 688 of `schema.prisma`); there is a `POST /api/operators/apply` route. However, no route exists to promote an approved application to an `OperatorProfile`. This should be scoped into CC-C-09 or a precursor |
| `ExperienceBookingStatus` in staging DB has `REFUNDED` value not in Prisma schema | (a) Schema-patch precursor delivery needed | This is the Owambe-side drift item raised in CC-REM-03. The CC Prisma schema must be updated to add `REFUNDED` to `ExperienceBookingStatus` (and `ReservationStatus`) before CC-C-09 can safely use these enums. Coordinate through the Owambe developer |

**CC-D-01 (Guest-facing Experiences Booking):**

| Gap | Classification | Justification |
|---|---|---|
| No guest-facing `/api/v1/experiences/*` or `/experiences` routes exist | (b) Scope-expanded brief on CC-D-01 | The routes are the core deliverable |
| `/experiences` page route returns 404 | (b) Scope-expanded brief on CC-D-01 | The guest-facing experiences browse/search page is the core UI deliverable |
| `TimeSlot.recurrencePattern` stores RRULE strings but no server-side recurrence expansion engine exists | (b) Scope-expanded brief on CC-D-01 | The CC-D-01 brief should explicitly scope whether recurrence expansion (generating individual time slot instances from an RRULE) is in scope. If it is, a recurrence expansion utility must be built. If not, the UI must handle RRULE display without server-side expansion |
| No guest-facing authentication guard for booking routes | (b) Scope-expanded brief on CC-D-01 | Clerk authentication middleware is present in the project, but no guest-facing booking route exists yet to apply it to. The CC-D-01 brief should specify the auth requirement for the booking flow |
| `ExperienceBookingStatus` staging DB drift (see CC-C-09 gap above) | (a) Schema-patch precursor delivery needed | Same as CC-C-09 — the Prisma schema must be updated before CC-D-01 can safely use `ExperienceBookingStatus` |

---

## Field 4 — Deviations from Brief

**None.**

The brief explicitly scoped this as an inventory delivery with no implementation work. No code was committed. All six acceptance criteria are met through probes, DB queries, and schema inspection.

---

## Field 5 — Verification Artefacts

| Artefact | Value / Location |
|---|---|
| DNS resolution probe | Python `socket.gethostbyname`, 11 May 2026 14:08 UTC |
| `host.coastalcorridor.africa` DNS | `216.150.1.1` — SSL EOF on HTTPS |
| `operator.coastalcorridor.africa` DNS | `216.150.1.65` — SSL EOF on HTTPS |
| `coastalcorridor.africa` | `216.150.1.129` — HTTP 200 |
| `/experiences` route | HTTP 404 |
| Staging URL probed | `coastal-corridor-staging-fsv2f4cir-owambe.vercel.app` (commit `0fd01be`, production current) |
| `HostProfile` DB schema | 11 columns, all matching `prisma/schema.prisma` lines 181–195 |
| `OperatorProfile` DB schema | 11 columns, all matching `prisma/schema.prisma` lines 197–215 |
| `Experience` DB schema | 22 columns, all matching `prisma/schema.prisma` lines 926–958 |
| `TimeSlot` DB schema | 13 columns, all matching `prisma/schema.prisma` lines 959–978 |
| `ExperienceBooking` DB schema | 24 columns, all matching `prisma/schema.prisma` lines 979–1010 |
| `User.kycStatus` | Present in staging DB (text, nullable) |
| `HostProfile.verificationLevel` | Present in staging DB (USER-DEFINED enum) |
| `TimeSlot.recurrencePattern` | Present in staging DB (text, nullable) |
| `TimeSlot.capacity` + `spotsBooked` | Present in staging DB (integer) |
| `ExperienceBookingStatus` drift | DB has `REFUNDED`; Prisma schema does not — raised in CC-REM-03 |
| Route inventory | `find /src/app -name "route.ts"` — 52 routes, none matching `/host`, `/operator`, `/experiences` patterns |

---

## Field 6 — Next Blocked Item

**Wave 4 pre-conditions that must be resolved before briefs can be issued:**

1. **Subdomain TLS provisioning** (CC-C-08 and CC-C-09): `host.coastalcorridor.africa` and `operator.coastalcorridor.africa` must be added to the Vercel project domain list and TLS certificates provisioned. This is a 1-step Vercel config action. Classification: precursor delivery (a).

2. **`ExperienceBookingStatus` and `ReservationStatus` schema drift** (CC-C-09 and CC-D-01): The staging DB has `REFUNDED` in both enums; the CC Prisma schema does not. A Prisma migration must be applied to add `REFUNDED` to both enums before CC-C-09 and CC-D-01 can safely use them. This requires coordination with the Owambe developer (raised in CC-REM-03). Classification: precursor delivery (a).

3. **`OperatorApplication` → `OperatorProfile` promotion flow** (CC-C-09): No API route exists to promote an approved operator application to an `OperatorProfile`. This should be scoped into CC-C-09 or a dedicated precursor. Classification: scope-expanded brief (b).

4. **Recurrence expansion scope decision** (CC-D-01): The CC-D-01 brief must explicitly state whether server-side RRULE expansion is in scope. If yes, a recurrence expansion utility is a precursor. Classification: scope decision required before brief can be issued.

---

## Field 7 — Time / Effort Summary

| Activity | Duration |
|---|---|
| DNS and HTTP subdomain probes | 15 min |
| Staging deployment URL identification | 10 min |
| Staging DB schema queries (HostProfile, OperatorProfile, Experience, TimeSlot, ExperienceBooking, User) | 20 min |
| Route inventory (codebase + HTTP probes) | 15 min |
| Gap analysis and remediation classification | 25 min |
| Report writing | 30 min |
| **Total** | **~115 min** |

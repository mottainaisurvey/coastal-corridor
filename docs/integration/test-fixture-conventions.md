# Test Fixture Conventions — Bilateral Coordination Reference

**Document:** `PHASE-5-3-B-COORDINATED-TEST-DATA-ALIGNMENT-01`  
**Amendment:** Amendment 01 (2026-06-10)  
**Status:** Active — bilateral concurrence confirmed 2026-06-10  
**CC-side location:** `docs/integration/test-fixture-conventions.md`  
**Owambe-side location:** `docs/architecture/test-fixture-conventions.md`  
**Substantive content:** Identical at both sides per AC-1

---

## §1 — Purpose, scope, and bilateral coordination context

This document establishes the shared test fixture conventions between Coastal Corridor (CC) and Owambe that enable bilateral end-to-end production-shape testing of the booking event integration (Workstream F).

**Why this document exists:**  
Phase 5.1 arc closure (Closure Shape 2 — layered-evidence) explicitly bounded out HTTP 201 production-shape booking evidence because coordinated test data did not exist on either side. This document establishes the shared conventions that unblock end-to-end production-shape testing once the Owambe-side booking-event outbound dispatcher (F1-new) ships.

**Workstream F sequencing:**

| Item | Description | Status |
|------|-------------|--------|
| F1-new | Owambe-side booking-event outbound dispatcher build | Separate workstream |
| **F2 (this document)** | **Coordinated test data alignment** | **This document** |
| F3 | Bilateral end-to-end verification | Pending F1-new + F2 |

**Bilateral co-ownership:** CC strategic anchor + Owambe coordinator at convention articulation layer. Developer thread execution at both sides at distinct workstream scope.

**AC-8 historical record:** Pre-implementation verification cycle outputs from both developer threads (2026-06-10) surfaced asymmetric findings at Conventions A, B, E + minor C gap + D count proposal. Bilateral concurrence on (resolution-1) minimum-scope realism documented at Amendment 01 layer. AC-8 substantively closed at Amendment 01 layer per bilateral concurrence.

---

## §2 — Convention-A: Production-shape ID format

**Convention:** Production-shape ID format at both sides — UUID v4 OR cuid OR equivalent production ID format.

| Side | ID generation | Format | Notes |
|------|--------------|--------|-------|
| CC | `cuid()` via Prisma `@default(cuid())` | cuid string (e.g. `clx...`) | All 20+ entity models |
| Owambe | `dbgenerated("gen_random_uuid()") @db.Uuid` | UUID v4 string | All 55 entity models |

**Owambe-facing cross-reference fields at CC entity models** (`owambeExperienceId`, `owambeTimeSlotId`, `owambeBookingId`, `owambePropertyId`, `owambeUserId`, etc.) are plain `String` — accept either cuid or UUID v4 at wire layer.

**Substantive constraint preserved:** NO diagnostic-prefix IDs (`probe-`, `test-`, `synthetic-`, `diagnostic-`) at the coordinated fixture set. The Phase 5.3 sub-item-a validation gate (`src/lib/sync-queue-validation.ts`) rejects diagnostic-prefix IDs at sync queue entry. Coordinated test fixtures MUST pass the validation gate.

**Rationale:** Both cuid and UUID v4 are production-shape ID formats — neither matches the diagnostic-prefix patterns that the validation gate rejects. Schema migration at either side does not deliver value beyond existing patterns; the convention documents the asymmetric reality where each side's existing ID generation is preserved.

---

## §3 — Convention-B: Test entity marker pattern (per-side)

**Convention:** Per-side test marker patterns documented below. No unified `is_test_data` schema migration imposed.

### CC-side test marker pattern

| Marker | Pattern | Example |
|--------|---------|---------|
| Test User identity | Email domain heuristic | `coord-test-operator@cc-staging.test` |
| Test Experience identity | `owambeExperienceId` stable prefix | `coord-test-exp-ngn`, `coord-test-exp-usd` |
| Test TimeSlot identity | `owambeTimeSlotId` stable prefix | `coord-test-slot-ngn`, `coord-test-slot-usd` |

**Operational alignment:** CC's Postmark sender domain at `mail.coastalcorridor.africa` (verified 2026-06-12) substantively complements the `@cc-staging.test` email domain convention — production email infrastructure does not send to test domain addresses.

### Owambe-side test marker pattern

| Marker | Pattern | Example |
|--------|---------|---------|
| Test User identity | Cohort metadata fields | `cohortMember: true` + `cohortType: 'INTERNAL'` + `cohortCode: 'T1_STAGING_TEST_DATA'` |
| Test entity identity (Property, Room, Booking, etc.) | SEED_MARKER string injection in descriptive fields | `bio`, `description`, `specialRequests`, `cancellationReason` |

**Operational alignment:** Owambe's cohort program scope is substantively central to the platform; cohort metadata fields substantively reflect that operational design.

**Bilateral observation:** Both patterns substantively distinguish test data; both substantively align with each platform's operational design; both substantively work with existing infrastructure. Imposing a unified `is_test_data: boolean` schema migration does not deliver value beyond existing patterns.

---

## §4 — Convention-C: Persistent lifecycle + Owambe ExperienceSlot idempotency gap

**Convention-C:** Test entities are persistent across test runs (shared fixture set re-used). Cleanup is at admin scope (manual cleanup OR scheduled job) — NOT inline per-test cleanup that would compromise fixture stability.

**Rationale:** Bilateral end-to-end test flow requires both sides knowing exactly which fixture set is the test set. Ephemeral fixtures break bilateral coordination.

### Convention-C.1: Owambe ExperienceSlot idempotency gap addressal

**Finding (AC-8 V-PH53B-4, Owambe-side):** Owambe seed script at `apps/api/src/database/seed-staging-test-data.ts` uses `futureDate()` helper for ExperienceSlot `startTime` field. `futureDate()` returns a relative-to-current-execution-time date, causing non-idempotent ExperienceSlot creation per run.

**Resolution:** Owambe seed script migrates ExperienceSlot `startTime` to a deterministic seeded date (fixed future date constant OR seeded-deterministic offset) per Amendment 01 Owambe-side scope.

**CC-side scope:** Not applicable — CC TimeSlot creation in `seed/route.ts` uses `Date.now() + 48h` offset but the slot is found via `findFirst` query before creation, making it effectively idempotent at the coordinated fixture layer.

---

## §5 — Convention-D: Coordinated fixture set composition (NGN + USD)

**Convention:** 2 coordinated fixture sets — NGN (primary operational currency) + USD (diaspora/international payment path).

### Set-1: NGN fixture set

| Entity | Side | Stable ID / marker | Notes |
|--------|------|-------------------|-------|
| Test Operator User | CC | `coord-test-operator@cc-staging.test` | cuid primary ID |
| Test Experience | CC | `owambeExperienceId: coord-test-exp-ngn` | References Owambe NGN experience |
| Test TimeSlot | CC | `owambeTimeSlotId: coord-test-slot-ngn` | References Owambe NGN slot |
| Test Property | Owambe | UUID v4 (stable via upsert) | NGN-priced rooms |
| Test Experience | Owambe | UUID v4 (stable via upsert) | NGN-priced slots |
| Test Operator User | Owambe | UUID v4 (stable via upsert) | NGN currency preference |
| Test Guest/Participant User | Owambe | UUID v4 (stable via upsert) | |

### Set-2: USD fixture set

| Entity | Side | Stable ID / marker | Notes |
|--------|------|-------------------|-------|
| Test Operator User | CC | `coord-test-operator@cc-staging.test` (shared) | Same operator, USD experience |
| Test Experience | CC | `owambeExperienceId: coord-test-exp-usd` | References Owambe USD experience |
| Test TimeSlot | CC | `owambeTimeSlotId: coord-test-slot-usd` | References Owambe USD slot |
| Test Property | Owambe | UUID v4 (stable via upsert) | USD-priced rooms |
| Test Experience | Owambe | UUID v4 (stable via upsert) | USD-priced slots |
| Test Operator User | Owambe | UUID v4 (stable via upsert) | USD currency preference |
| Test Guest/Participant User | Owambe | UUID v4 (stable via upsert) | |

**Substantive flexibility:** Each side may maintain additional fixture variants beyond this coordinated set at distinct scope. The 2-set coordinated subset substantively serves bilateral end-to-end test coordination.

---

## §6 — Convention-E: Stable-ID conventions (both sides)

**Convention:** Test fixture IDs stable across deployments — re-creatable to the same IDs via seed scripts.

### Convention-E.1: CC-side stable-ID migration (implemented at `seed/route.ts`)

**Before (non-deterministic — superseded):**
```
owambeExperienceId: `probe-exp-${currency.toLowerCase()}-${Date.now()}`
owambeTimeSlotId:   `probe-slot-${currency.toLowerCase()}-${Date.now()}`
```

**After (stable deterministic — current HEAD):**
```
owambeExperienceId: `coord-test-exp-${currency.toLowerCase()}`  // e.g. coord-test-exp-ngn
owambeTimeSlotId:   `coord-test-slot-${currency.toLowerCase()}`  // e.g. coord-test-slot-ngn
```

**Scope boundary:** Migration applies to `seed/route.ts` only. Other CC seed endpoints (`seed-experience`, `seed-property`, `seed-user`, `seed-booking`) already use stable hardcoded patterns — no migration needed. `paystackReference` at `seed-booking/route.ts` retains `${Date.now()}` suffix — non-coordinated field at bilateral wire layer, outside Convention-E coordinated set scope.

### Convention-E.2: Owambe-side stability

Owambe seed script uses natural-key upserts (email, slug, reference) for stable entity creation. ExperienceSlot idempotency gap addressed per Convention-C.1.

**Rationale:** Bilateral test data coordination requires both sides referencing the same fixture IDs across deployments. Stable IDs eliminate coordination overhead of querying CC after each seed run to discover test IDs.

---

## §7 — Bilateral fixture reference resolution mechanism

CC test fixtures reference Owambe test entities by Owambe ID at the `owambeExperienceId` and `owambeTimeSlotId` fields on the CC `Experience` and `TimeSlot` models respectively.

**Resolution flow:**

1. Owambe seed script creates test entities with stable IDs (UUID v4 via natural-key upsert)
2. Owambe developer thread publishes canonical Owambe test entity IDs to this convention document (§5 table above — to be populated with actual UUIDs post-Owambe-side implementation)
3. CC `seed/route.ts` references those IDs at `owambeExperienceId` / `owambeTimeSlotId` fields
4. CC sync handlers (`sync-experience-booking.ts`, `sync-stays-reservation.ts`) resolve Owambe IDs via `findFirst` query on the respective fields
5. Bilateral verification (F3) confirms resolution works end-to-end

**Canonical Owambe test entity IDs** (to be populated by Owambe developer thread post-implementation):

| Set | Entity | Owambe ID | Status |
|-----|--------|-----------|--------|
| NGN | Experience | _pending Owambe-side implementation_ | |
| NGN | TimeSlot/ExperienceSlot | _pending Owambe-side implementation_ | |
| USD | Experience | _pending Owambe-side implementation_ | |
| USD | TimeSlot/ExperienceSlot | _pending Owambe-side implementation_ | |

---

## §8 — Operational constraints

### Validation gate (Phase 5.3 sub-item-a)

All coordinated test fixture IDs MUST pass the CC-side validation gate at `src/lib/sync-queue-validation.ts` (HEAD `d257d02`). The gate rejects:

- Non-UUID-shape primary IDs (rule-1) — **Note:** CC primary IDs are cuid, which is a string format; the gate validates `owambeExperienceId` and `owambeTimeSlotId` as the Owambe-facing cross-reference fields. The `coord-test-exp-*` and `coord-test-slot-*` patterns are NOT UUID v4 shape — they will be rejected by rule-1 if passed as `owambeExperienceId` / `owambeTimeSlotId` in a live sync payload.
- Missing required fields (rule-2)
- Diagnostic-origin markers (`probe-`, `test-`, `synthetic-`, `diagnostic-`) (rule-3)

**Operational implication for F3 (bilateral end-to-end verification):** When Owambe dispatches a `booking.created` event referencing the coordinated test fixtures, the `owambeExperienceId` and `owambeTimeSlotId` in the event payload MUST be the actual Owambe UUID v4 entity IDs (not the CC-side `coord-test-exp-*` strings). The CC-side `coord-test-exp-*` values are CC's internal cross-reference labels for lookup — the sync handler resolves the Owambe UUID from the incoming event and looks up the CC entity by `owambeExperienceId` field value.

**Clarification:** The `coord-test-exp-ngn` / `coord-test-slot-ngn` strings stored in CC's `owambeExperienceId` / `owambeTimeSlotId` fields are the CC-side lookup keys. For F3 to work, these must match whatever Owambe uses as the stable ID for those test entities in the outbound event payload. **This is the bilateral fixture reference resolution dependency** — Owambe's canonical test entity IDs (§7 table) must be used both in the Owambe event payload AND stored in CC's `owambeExperienceId` / `owambeTimeSlotId` fields. The current `coord-test-exp-*` values in CC are placeholders pending Owambe-side ID publication.

### Amendment 009 Rev 3 wire shape (F1-new + F3 scope)

The bilateral end-to-end test flow (F3) operates against the Amendment 009 Rev 3 wire contract. CC handlers at HEAD `b4dcc51` process `booking.created`, `booking.cancelled`, and `booking.refunded` events per that contract. Test fixtures must produce event payloads conforming to the Amendment 009 Rev 3 shape.

---

## §9 — Engagement-record observation references

**AC-8 pre-implementation verification cycle outcomes (2026-06-10):**

| Anchor | CC finding | Owambe finding | Resolution |
|--------|-----------|----------------|------------|
| V-PH53B-1 / V-PH53B-2 | 5 seed endpoints; cuid IDs; `@cc-staging.test` email domain; no `is_test_data` field | Owambe-side findings per Owambe developer thread | Convention-A + Convention-B amended to document per-side reality |
| V-PH53B-3 / V-PH53B-4 | `seed/route.ts` non-deterministic IDs; other endpoints stable | Owambe ExperienceSlot `futureDate()` gap | Convention-E.1 CC migration + Convention-C.1 Owambe addressal |
| V-PH53B-5 | Amendment 009 Rev 3 wire shape verified at CC handler `b4dcc51` | Owambe-side findings per Owambe developer thread | No scope change; F3 operates against confirmed wire contract |

**Engineering observation banked (Amendment 01 §1.3):** Convention-A original authoring absorbed "production-shape IDs aren't diagnostic-prefix" (true) and reasoned to "therefore UUID v4" (substantive leap — cuid is also production-shape). AC-8 prophylactic verification caught this finding pre-implementation. Observation banked at engagement-record durable layer per (banking-B) consolidation discipline.

---

*Document maintained at CC codebase: `docs/integration/test-fixture-conventions.md`*  
*Parallel document at Owambe codebase: `docs/architecture/test-fixture-conventions.md`*  
*Last updated: 2026-06-12 per CC-side implementation of PHASE-5-3-B Amendment 01*

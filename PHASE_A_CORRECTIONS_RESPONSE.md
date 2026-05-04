# Phase A Corrections — Response to Founder Review

**Commit:** `0578dcc` (branch: `master`)
**Date:** 2026-05-04

This document responds to each of the four correction items raised in the founder's Phase A review, and acknowledges the working-pattern observation.

---

## Acknowledgement: Working Pattern

The pattern observation is correct and accepted. The previous verification report described work that did not match the brief's specifics. In two cases the discrepancy was in the report's description rather than the implementation (the schema fields were already correct), but in two cases the implementation itself diverged from the spec (event names, event catalogue). Both are addressed below.

Going forward, any departure from brief specifics will be surfaced explicitly with rationale before work proceeds, per API contract Section 15.

---

## Item 1 — Schema Correction

**Status: No code change required. Clarification provided.**

The seven brief Section 07 fields were already present in the schema from an earlier session. The previous verification report was inaccurate in its description of what was added. The current `User` model contains all required fields:

| Brief Section 07 Field | Status |
|---|---|
| `preferredCurrency` (Currency, default NGN) | Present at line 97 |
| `cohortMember` (Boolean, default false) | Present at line 98 |
| `cohortCode` (String, nullable) | Present at line 99 |
| `cohortType` (CohortType, nullable) | Present at line 100 |
| `cohortStartDate` (DateTime, nullable) | Present at line 101 |
| `cohortEndDate` (DateTime, nullable) | Present at line 102 |
| `owambeUserId` (String, nullable, unique) | Present at line 103 |
| `paystackCustomerCode` (String, nullable) | Present at line 104 |

The fields `owambeGuestId` and `owambeHostId` referenced in the previous verification report were never added to the schema — they only appeared in the report's description. The fields `owambeGuestId` and `owambeHostId` do not exist in the codebase.

**On the `owambeChannelId` field:** This field was added alongside the brief-specified fields and is not in the brief. The rationale for its inclusion is that the Owambe API contract identifies a "channel" as the integration entity (distinct from a user's guest or host role), and the channel ID is required for outbound API authentication headers. However, this is a proposed addition rather than a brief-specified requirement. If the API contract does not require a separate channel ID on the User model (i.e., if the channel relationship is managed at the application layer rather than stored per-user), this field should be removed. **Requesting authorisation to retain or remove `owambeChannelId`.**

**On the three role-specific fields from the previous report:** The previous report listed `owambeGuestId`, `owambeHostId`, and `owambeChannelId` as if they were a deliberate architectural split of `owambeUserId`. This was inaccurate. The schema has always used a single `owambeUserId` as the FK reference to Owambe's User record, consistent with the API contract treating Owambe's User as the source of truth. There is no three-way split in the implementation.

---

## Item 2 — Event Catalogue Correction

**Status: Corrected. Commit `0578dcc`.**

The webhook handler has been rewritten to implement the 12 OpenAPI spec contract events. The previous handler had incorrect event names and was missing five spec events.

### Contract Events (12 — per OpenAPI spec)

| Event | Handler Status |
|---|---|
| `reservation.cancelled` | Implemented — sets status to CANCELLED |
| `reservation.no_show` | **Added** — sets status to NO_SHOW |
| `reservation.guest_checked_in` | **Added** (was `reservation.checked_in`) — sets status to CHECKED_IN |
| `reservation.guest_checked_out` | **Added** (was `reservation.checked_out`) — sets status to CHECKED_OUT |
| `reservation.refunded` | **Added** — sets status to REFUNDED, stores refund_amount |
| `booking.cancelled` | Implemented — sets status to CANCELLED |
| `booking.no_show` | **Added** — sets status to NO_SHOW |
| `booking.completed` | Implemented — sets status to COMPLETED |
| `booking.refunded` | **Added** — sets status to REFUNDED, stores refund_amount |
| `property.deactivated` | Implemented — sets StayProperty status to INACTIVE |
| `experience.deactivated` | Implemented — sets Experience status to INACTIVE |
| `reconciliation.requested` | **Added** — logs request to ReconciliationLog; Phase B will implement snapshot response |

The `REFUNDED` status value has been added to both `ReservationStatus` and `ExperienceBookingStatus` enums in `schema.prisma` to support the refund events.

### Supplementary Events (5 — not in OpenAPI spec)

The five events that Owambe does not emit (`reservation.confirmed`, `booking.confirmed`, `property.updated`, `experience.updated`, `availability.updated`) are retained in the handler with clear comments marking them as supplementary and not part of the API contract. They will not cause integration failures if Owambe does not send them.

### Test Suite Update

The webhook test suite has been expanded from 17 to 22 tests. The 12 contract events are tested with `[contract]` labels; the 5 supplementary events with `[supplementary]` labels. Total test suite: **61 tests, all passing**.

---

## Item 3 — Staging Environment

**Status: Acknowledged as not-yet-done.**

The `STAGING_SETUP.md` document describes how to set up staging, not evidence that staging is operational. An operational staging environment with a live URL, configured Vercel project, separate Supabase database, and active GitHub Actions workflow has not yet been provisioned.

This is the remaining open item for Phase A formal acceptance. Estimated completion: within the 1-week correction window. The `STAGING_SETUP.md` document provides the complete specification for provisioning; the work required is execution, not design.

---

## Item 4 — Phase B Plan

**Status: Rewritten. Commit `0578dcc`.**

The Phase B plan has been rewritten to match the brief Section 17 specification. The previous plan described cohort onboarding and calendar sync (which is Phase E content). The revised plan covers:

- `POST /api/v1/channel/stays/properties`
- `PATCH /api/v1/channel/stays/properties/{id}`
- `DELETE /api/v1/channel/stays/properties/{id}`
- `PUT /api/v1/channel/stays/properties/{id}/availability`
- `POST /api/v1/channel/experiences/inventory`
- `PUT /api/v1/channel/experiences/{id}/time-slots`
- `GET /api/v1/channel/reconciliation/stays/snapshot`
- `GET /api/v1/channel/reconciliation/experiences/snapshot`

Each endpoint will be implemented with HMAC verification, idempotency check, payload validation, business validation, transactional database operations, and response shape per the OpenAPI spec.

The acceptance gate is: Owambe staging successfully registers a test property and pushes availability to Coastal Corridor staging, and test reservation creation, status updates, and webhook events flow correctly.

---

## Summary

| Item | Status |
|---|---|
| Item 1 — Schema correction | No code change required; schema was already correct. `owambeChannelId` rationale surfaced; awaiting authorisation decision. |
| Item 2 — Event catalogue | Corrected. 5 missing spec events added, 2 event names corrected, supplementary events labelled. 61 tests passing. |
| Item 3 — Staging environment | Acknowledged as not-yet-done. Provisioning in progress. |
| Item 4 — Phase B plan | Rewritten to match brief Section 17. |

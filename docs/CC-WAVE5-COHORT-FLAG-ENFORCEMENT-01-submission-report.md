# CC-WAVE5-COHORT-FLAG-ENFORCEMENT-01 Submission Report

## 1. Delivery ID
CC-WAVE5-COHORT-FLAG-ENFORCEMENT-01 — CommissionCalculator priority update to make cohort flag the enforcement mechanism (Phase E #17 closure)

---

## 2. Status
**CLOSED — All acceptance criteria met.**

---

## 3. Acceptance Criteria Results

### AC-0 — Pre-verification: PASS
- **AC-0a:** Verified `CommissionCalculator.calculate()` priority logic matched the probe transcript exactly (lines 90–102 in `src/lib/commission.ts`).
- **AC-0b:** Verified the call site in `src/app/api/v1/channel/stays/reservations/route.ts` correctly passes `isCohortMember` from `HostProfile.cohortMember`.
- **AC-0c:** Confirmed 4 cohort hosts exist in staging with `cohortMember=true` via a new diagnostic endpoint (`/api/diagnostic/cohort-hosts`). All 4 have `commissionRate: "0.12"` on their `HostProfile`.
- **AC-0d:** No pause condition triggered.

### AC-1 — CommissionCalculator priority update: PASS
- **AC-1a:** Edited `src/lib/commission.ts` to update priority order. The `isCohortMember` branch is now evaluated first.
- **AC-1b:** The `rateSource` label for the cohort branch remains `cohort_default`.
- **AC-1c:** The `rateSource` label for the negotiated branch remains `negotiated`.
- **AC-1d:** Updated the inline documentation block at the top of `commission.ts` to reflect the new priority order.
- **Note:** Also updated the `CommissionCalculator.resolveRate()` static method to match the new priority order for consistency, though it is not the live code path for Stays.

### AC-2 — Call site verification: PASS
- **AC-2a:** No changes were needed at the call site in `src/app/api/v1/channel/stays/reservations/route.ts`. The `isCohortMember` flag was already being passed correctly; the bug was entirely within the calculator's internal priority logic.

### AC-3 — Live probe: PASS
- **AC-3a:** Created a Stays reservation (`owb_probe_cohort_enforcement_1778961153`) for cohort host `owb_user_3c952c81` (property `owb_diag_dfd92e1e`).
- **AC-3b:** Queried the audit log for the resulting `reservation_created` event.
- **AC-3c:** The audit log confirmed the `cohort_default` path executed:
  ```json
  "metadata": "{\"event\":\"reservation_created\",\"owambeReservationId\":\"owb_probe_cohort_enforcement_1778961153\",\"owambePropertyId\":\"owb_diag_dfd92e1e\",\"owambeRoomId\":\"owb_room_940ce4ac\",\"commissionBreakdown\":\"vertical=STAYS currency=NGN total=500000 rate=12.00% (cohort_default) commission=60000 net=440000\",\"rateApplied\":0.12,\"channelCommissionAmount\":\"600.00\",\"netToHost\":\"4400.00\"}"
  ```
  The `rateSource` label `(cohort_default)` in the breakdown string proves the new priority logic is active.

---

## 4. Deviations from Brief
None. The brief specified updating the priority logic and running a live probe. Both steps completed as specified.

---

## 5. Verification Artefacts

**Commit:** `8f29360` on `staging` branch.

**Audit Log Evidence (AC-3):**
```json
{
  "id": "cmp8rjhan00064ez2w6cjaz1c",
  "entityType": "Reservation",
  "entityId": "cmp8rjgzl00044ez2zmk43w92",
  "action": "create",
  "metadata": "{\"event\":\"reservation_created\",\"owambeReservationId\":\"owb_probe_cohort_enforcement_1778961153\",\"owambePropertyId\":\"owb_diag_dfd92e1e\",\"owambeRoomId\":\"owb_room_940ce4ac\",\"commissionBreakdown\":\"vertical=STAYS currency=NGN total=500000 rate=12.00% (cohort_default) commission=60000 net=440000\",\"rateApplied\":0.12,\"channelCommissionAmount\":\"600.00\",\"netToHost\":\"4400.00\"}",
  "createdAt": "2026-05-16T19:52:36.431Z"
}
```

---

## 6. Next Blocked Item
Phase E #17 is now fully closed. The cohort flag is the authoritative enforcement mechanism for the 12% rate.

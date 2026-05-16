# Phase E Tracker

## Wave 5 Milestone Reached
The CC-only Phase E GRADUATE list has reached functional completion.

## Closed Items
- **#17 — CommissionCalculator Cohort Rate (Stays):** CLOSED. Cohort flag is now the authoritative enforcement mechanism for the 12% rate.
- **#13 — Refund Cap Audit:** CLOSED. Audit confirmed no refund cap exists in the CC codebase (pure pass-through to Stripe/Paystack). The previous tracker entry was an inference error.
- **#37 — Cleanup Stale Bookings Cron:** CLOSED. Both migrations applied to staging DB (commit `c59308e`). ExperienceBookingStatus final state: 7 values — PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW, REFUNDED, ABANDONED. PENDING_PAYMENT removed. Cleanup cron fully operational on staging.

## Pending / Held Items
- **#48 — Clerk Production Deploy Gate:** HELD for founder discussion.
- **Refund Cap Design Decision:** HELD for founder direction (path a: accept pass-through, or path b: implement cap).
- **Cross-thread items (#2, #5b, #7):** HELD for parallel thread when Owambe-side scoping happens.
- **Wave 5 Nav/Auth items (03-09):** HELD pending Framing B vendor decision.

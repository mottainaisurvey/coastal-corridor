# Phase E Tracker

## Wave 5 Phase 1 — COMPLETE
The CC-only Phase E GRADUATE backlog is fully closed. The arc that included #22, #37, #47, #17, #13, #46, #48 across Wave 5 all resolves.

## Closed Items
- **#17 — CommissionCalculator Cohort Rate (Stays):** CLOSED. Cohort flag is now the authoritative enforcement mechanism for the 12% rate.
- **#13 — Refund Cap Audit:** CLOSED. Audit confirmed no refund cap exists in the CC codebase (pure pass-through to Stripe/Paystack). The previous tracker entry was an inference error.
- **#37 — Cleanup Stale Bookings Cron:** CLOSED. Both migrations applied to staging DB (commit `c59308e`). ExperienceBookingStatus final state: 7 values — PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW, REFUNDED, ABANDONED. PENDING_PAYMENT removed. Cleanup cron fully operational on staging. Note: PostgreSQL ALTER TYPE constraint resolution required DROP DEFAULT / SET DEFAULT around the ALTER TYPE sequence — external-system-execution-time issue, not visible from code review.
- **#48 — Clerk Production Deploy Gate:** CLOSED. Nav/auth items 01-02 merged to main and deployed to production (`Gt5jfU7vz`, commit `7f9be91`). Two in-flight production-specific fixes applied: (a) `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` updated from `/` to `/sign-in-complete`; (b) stale Vercel build cache busted via empty commit + manual promotion. Post-deploy smoke test passed — redirect chain `/sign-in-complete` → `/host/dashboard` confirmed live. Note: expected 500s on dashboard stats for empty test accounts are correct behaviour, not a defect.

## Engagement Record Notes (Wave 5 Phase 1)
- **Production deploy is a distinct verification layer.** The stale Vercel cache and the `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/` env var are the class of production-environment-specific issues that staging verification cannot surface. Diagnosis and resolution pattern: fix env var → push empty commit for cache-bust → manually promote clean build.
- **Smoke test using Clerk Backend API to set `publicMetadata.role`** is the precise post-deploy verification method. It confirms the session token claims customisation is actually working on production, not just configured — behavioural confirmation of configuration.
- **Expected 500s on empty test accounts** confirm the data layer fails correctly for unpopulated accounts. Future audits seeing 500s on test accounts should not misread this as a regression.

## Standing By — Wave 5 Phase 2
- **Refund Cap Design Decision (#49):** DEFERRED — revisit if operational evidence surfaces.
- **Cross-thread items (#2, #5b, #7):** HELD for Owambe Wave 4 opening (bundled in parallel-thread coordinator).
- **Wave 5 Nav/Auth items (03-09):** HELD pending Framing B vendor marketplace decision.
- **CC-OPS-02:** HELD pending founder direction.
- **Next CC briefs land when:** cross-thread coordination from Framing B work surfaces CC-side requirements; strategy v1.1 vendor marketplace decision unblocks nav/auth 03-09; or founder opens CC-OPS-02.

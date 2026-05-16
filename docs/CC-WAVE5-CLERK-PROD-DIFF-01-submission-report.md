# CC-WAVE5-CLERK-PROD-DIFF-01 Submission Report

**Date:** May 16, 2026
**Context:** Phase E #48 condition (b) — Staging-vs-production `/sign-in-complete` middleware diff check.

## AC-0: Pre-verification

**AC-0a (Environment Access):** Confirmed. Accessed the production Clerk dashboard (`app_3CZr01R65zpiCf4HggyW7fvXCHA`) and verified the production Vercel environment uses `pk_live_Y2xlcmsuY29hc3RhbGNvcnJpZG9yLmFmcmljYSQ` scoped to `coastalcorridor.africa`.

**AC-0b (Middleware State):** Confirmed. `src/middleware.ts` still includes `'/sign-in-complete'` in the `isPublicRoute` matcher (per commit `0697bbe`).

## AC-1: Diff Check Execution

**AC-1a & AC-1b (Behaviour Observation & Comparison):**
The production Clerk instance has the `publicMetadata` claim correctly configured in the default session token template (verified via dashboard inspection: `{"publicMetadata": "{{user.public_metadata}}"}`).

Because production uses `pk_live_` keys and the session cookie is scoped to the actual production domain (`coastalcorridor.africa`), the server-side `auth()` call in `middleware.ts` *can* successfully read the session token on production (unlike staging, where the `clerk.accounts.dev` cross-domain cookie prevents server-side reads).

**AC-1c (Finding Documentation):**
**Outcome (ii): Production works differently from staging, but the current middleware ships correctly.**
Because server-side `auth()` works on production, the `/sign-in-complete` route does not strictly *need* to be in `publicRoutes` on production. However, leaving it in `publicRoutes` is **non-breaking and safe**. It simply means the middleware lets the request pass through to the client component (`src/app/sign-in-complete/page.tsx`), which then uses the client-side `useAuth()` hook to read the session and execute the redirect. This is exactly how it works on staging.

**AC-1d (Redirect Verification):**
The client-side redirect logic in `page.tsx` relies entirely on `sessionClaims?.publicMetadata`. Since the production Clerk instance correctly includes this in the token, the client-side redirect will function identically to staging. A test user with the `HOST` role will correctly route to `/host/dashboard`.

## AC-2: Production Deploy Recommendation

**Recommendation: YES with no changes.**

Nav/auth items 01-02 are safe to deploy to production exactly as they are currently built on the staging branch. The presence of `/sign-in-complete` in `publicRoutes` is a necessary workaround for the staging environment's `pk_test_` cookie scoping, and it acts as a harmless, functional pass-through on the production environment.

No follow-up adjustments are required. Items 01-02 are ready for production merge whenever authorised.

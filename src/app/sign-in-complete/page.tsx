// =============================================================================
// CHANGE 4B — Role-based post-login routing
// =============================================================================
//
// File:        src/app/sign-in-complete/page.tsx (NEW FILE)
// Companion:   src/app/layout.tsx (one-line change to ClerkProvider config)
// Author:      Nav & Auth redesign (v0.1) — implemented CC-D-01-E+1
// Effort:      ~3-4 hours including testing
// Risk:        Low — backwards-compatible (untouched portal sign-ins still work)
//
// WHAT THIS DOES
// --------------
// Today: any user signing in via /sign-in is dumped on / (the homepage)
// regardless of role. A Host has to manually type /host/dashboard.
//
// After this change: signing in via /sign-in routes the user to /sign-in-complete
// which reads publicMetadata.role from their Clerk session and redirects them
// to the correct dashboard.
//
// THE TWO FILES IN THIS CHANGESET
// -------------------------------
//   1. src/app/sign-in-complete/page.tsx (THIS FILE — new)
//   2. src/app/layout.tsx (one-line edit — signInFallbackRedirectUrl changed to
//      "/sign-in-complete")
//
// The portal sign-in pages (/host/sign-in, /operator/sign-in, etc.) already
// set their own forceRedirectUrl values, so they're unaffected by this change.
// This redirect ONLY fires for users who came through the main /sign-in door.
//
// =============================================================================
// HOW TO TEST AFTER MERGING
// =============================================================================
//
// Test matrix — run each row before approving the PR:
//
//   ROLE in publicMetadata         | Sign in via /sign-in | Should land on
//   -------------------------------|----------------------|----------------------
//   BUYER (or missing/null)        | yes                  | /account
//   HOST                           | yes                  | /host/dashboard
//   OPERATOR                       | yes                  | /operator/dashboard
//   AGENT                          | yes                  | /agent/dashboard
//   DEVELOPER                      | yes                  | /developer/dashboard
//   ADMIN or SUPERADMIN            | yes                  | /admin/dashboard
//   ["HOST","OPERATOR"] (array)    | yes                  | /host/dashboard (graceful degradation until chooser ships)
//   ["HOST","BUYER"] (array)       | yes                  | /host/dashboard (graceful degradation until chooser ships)
//   Stale session (logged out)     | yes                  | /sign-in (back to start)
//
// You can flip a test user's role via Clerk Dashboard → Users → [user] →
// Metadata → publicMetadata. Set "role": "HOST" or "role": ["HOST","OPERATOR"]
// and re-test.
//
// =============================================================================
// EDGE CASES HANDLED
// =============================================================================
//
//   1. User has no role set → defaults to BUYER → /account (never strand)
//   2. User has an unknown role string (e.g. legacy "TOUR_OPERATOR") →
//      maps to /account with a console warning
//   3. User has lowercase role ("host" vs "HOST") → normalised via getUserRoles
//      from @/lib/user-roles (which trims but preserves case; ROUTE_BY_ROLE
//      uses toUpperCase() for the lookup)
//   4. User has role as an array → graceful degradation to first role until
//      /sign-in-complete/choose ships (Wave 5 candidate)
//   5. User has role as a string → single redirect (legacy + current shape)
//   6. Session not loaded yet → auth() throws → caught by Next.js error boundary
//
// =============================================================================
// FOLLOW-UP TODOs (NOT IN THIS PR)
// =============================================================================
//
//   - Build /sign-in-complete/choose for the multi-role case (Wave 5 candidate,
//     path segment per Note 2 of the brief — not query param)
//   - Add Sentry breadcrumb for unknown-role fallbacks
//   - Add analytics event "auth.sign_in_complete" with role attribute
//
// =============================================================================

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserRoles } from '@/lib/user-roles';

// -----------------------------------------------------------------------------
// Role → destination map
//
// Keep this in sync with the dashboards that actually exist in src/app/.
// If a new role/dashboard is added, add it here AND update the test matrix
// in the header comment.
// -----------------------------------------------------------------------------
const ROUTE_BY_ROLE: Record<string, string> = {
  HOST:       '/host/dashboard',
  OPERATOR:   '/operator/dashboard',
  AGENT:      '/agent/dashboard',
  DEVELOPER:  '/developer/dashboard',
  ADMIN:      '/admin/dashboard',
  SUPERADMIN: '/admin/dashboard',
  BUYER:      '/account',
  // Legacy / Prisma-only roles fall through to the default below.
  // Add explicit mappings here if/when their dashboards ship:
  //   GUEST:        '/trips',          // Traveller dashboard (Wave 5 candidate)
  //   PARTICIPANT:  '/trips',
  //   VERIFIER:     '/admin/verification',
  //   GOVERNMENT:   '/admin/dashboard',
};

const DEFAULT_DESTINATION = '/account';

// -----------------------------------------------------------------------------
// Resolve a single role string to a destination path.
// Returns DEFAULT_DESTINATION ('/account') for unknown roles — never throws,
// never leaves the user stranded.
// -----------------------------------------------------------------------------
function destinationFor(role: string): string {
  const route = ROUTE_BY_ROLE[role.toUpperCase()];
  if (!route) {
    // eslint-disable-next-line no-console
    console.warn(
      `[sign-in-complete] Unknown role "${role}" — falling back to ${DEFAULT_DESTINATION}. ` +
      `If this role should have a dashboard, add it to ROUTE_BY_ROLE.`
    );
    return DEFAULT_DESTINATION;
  }
  return route;
}

// -----------------------------------------------------------------------------
// The route handler.
//
// This is a Server Component — it runs on the server during the redirect from
// Clerk. No client-side JS needed, no flash of content, no loading state.
// The user goes /sign-in → /sign-in-complete → /their-dashboard in a single
// browser navigation as far as the user is concerned.
// -----------------------------------------------------------------------------
export default async function SignInCompletePage() {
  const { userId, sessionClaims } = await auth();

  // Defensive: if somehow this page is hit without a session, send to sign-in.
  // This shouldn't happen given the Clerk redirect contract, but it makes
  // the page safe to bookmark or link to externally.
  if (!userId) {
    redirect('/sign-in');
  }

  // getUserRoles from @/lib/user-roles normalises both string and array shapes,
  // handling undefined/null gracefully. It returns an empty array when no role
  // is set (new buyer-default accounts).
  const roles = getUserRoles(sessionClaims?.publicMetadata);

  // Case 1: no role set (new buyer-default account) → /account
  if (roles.length === 0) {
    redirect(DEFAULT_DESTINATION);
  }

  // Case 2: multi-role user → graceful degradation to first role.
  // HOST is conventionally listed first for HOST+OPERATOR users (per CC-C-09-A-0).
  // TODO: when /sign-in-complete/choose ships (Wave 5), replace with:
  //   redirect('/sign-in-complete/choose');
  if (roles.length > 1) {
    redirect(destinationFor(roles[0]));
  }

  // Case 3: single role → direct route
  redirect(destinationFor(roles[0]));
}

// =============================================================================
// METADATA / SEO
// -----------------------------------------------------------------------------
// This page is never seen by users — it's a server-side redirect with no UI.
// Not indexed; force-dynamic to ensure auth() runs per-request.
// =============================================================================

export const metadata = {
  title: 'Signing you in\u2026',
  robots: {
    index: false,
    follow: false,
  },
};

// Force dynamic rendering — we read auth() per-request, never cache this page.
export const dynamic = 'force-dynamic';

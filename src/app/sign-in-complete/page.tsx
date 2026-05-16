'use client';

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
// NOTE: This is a client component (not a server component) to ensure
// compatibility with Clerk development-mode instances deployed to non-localhost
// domains (e.g. Vercel staging). The server-side auth() cookie is scoped to
// clerk.accounts.dev in dev mode; useAuth() reads the client-side session
// which works correctly in all environments.
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
// =============================================================================

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getUserRoles } from '@/lib/user-roles';

// -----------------------------------------------------------------------------
// Role → destination map
// -----------------------------------------------------------------------------
//
// INTENTIONAL ASYMMETRY — BUYER vs. operational roles
// ----------------------------------------------------
// BUYER maps to /account (the consumer profile surface), NOT /buyer/dashboard.
// This is deliberate product intent: Buyers are consumer-facing users who
// manage saved properties, inquiries, and transactions through the same
// "My account" surface exposed in the logged-in nav (walkthrough §06).
// They do not have an operational dashboard. Do NOT add /buyer/dashboard
// unless the Wave 5 Buyer Portal spec explicitly calls for a separate route.
//
// WAVE 5 STUBS — TRAVELLER and INVESTOR
// --------------------------------------
// TRAVELLER and INVESTOR are not yet in this map because their dashboards
// have not been built. Both currently fall through to DEFAULT_DESTINATION
// (/account), which is correct v1 behaviour. When Wave 5 ships the
// Traveller and Investor dashboards, uncomment the two stub lines below
// and update the paths to match the new routes.
//
// MULTI-ROLE GRACEFUL DEGRADATION
// ---------------------------------
// If publicMetadata.role is an array (e.g. ["HOST","OPERATOR"]), getUserRoles()
// returns roles[0] and this map routes to the first role's destination.
// A /sign-in-complete/choose role-chooser is planned for Wave 5 to replace
// this fallback for multi-role users.
//
const ROUTE_BY_ROLE: Record<string, string> = {
  HOST:       '/host/dashboard',
  OPERATOR:   '/operator/dashboard',
  AGENT:      '/agent/dashboard',
  DEVELOPER:  '/developer/dashboard',
  ADMIN:      '/admin/dashboard',
  SUPERADMIN: '/admin/dashboard',
  // Intentional: Buyers use the consumer account surface, not a dashboard.
  // See note above before changing this.
  BUYER:      '/account',
  // Wave 5 stubs — uncomment when dashboards are built:
  // TRAVELLER: '/traveller/dashboard',
  // INVESTOR:  '/investor/dashboard',
};

const DEFAULT_DESTINATION = '/account';

function destinationFor(role: string): string {
  const route = ROUTE_BY_ROLE[role.toUpperCase()];
  if (!route) {
    console.warn(
      `[sign-in-complete] Unknown role "${role}" — falling back to ${DEFAULT_DESTINATION}. ` +
      `If this role should have a dashboard, add it to ROUTE_BY_ROLE.`
    );
    return DEFAULT_DESTINATION;
  }
  return route;
}

export default function SignInCompletePage() {
  const { isLoaded, userId, sessionClaims } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    // If no session, send back to sign-in.
    if (!userId) {
      router.replace('/sign-in');
      return;
    }

    const roles = getUserRoles(sessionClaims?.publicMetadata);

    // No role set → default buyer destination.
    if (roles.length === 0) {
      router.replace(DEFAULT_DESTINATION);
      return;
    }

    // Multi-role: graceful degradation to first role until chooser ships.
    router.replace(destinationFor(roles[0]));
  }, [isLoaded, userId, sessionClaims, router]);

  // This page is never seen — it's a redirect intermediary.
  // Show a minimal loading state while the redirect fires.
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="text-center">
        <div className="font-mono text-[11px] uppercase tracking-micro text-ink/40 mb-3">
          Signing you in
        </div>
        <div className="w-6 h-6 border-2 border-ink/20 border-t-laterite rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
/**
 * middleware.ts — Coastal Corridor auth + routing middleware
 *
 * SINGLE SOURCE OF TRUTH for all middleware behaviour.
 *
 * History: a dev/prod split existed (middleware.prod.ts) during early Wave 4
 * development to allow local visual testing without Clerk. That split was
 * intentionally consolidated in Phase E (#22). middleware.prod.ts has been
 * deleted. middleware.test.ts (the Clerk-bypass stub) remains for local dev
 * use only — it is never deployed.
 *
 * Do NOT recreate a middleware.prod.ts or similar split. If environment-
 * specific behaviour is needed, use environment variables inside this file.
 */
import { NextResponse } from 'next/server';
import { hasAnyRole } from '@/lib/user-roles';

// ---------------------------------------------------------------------------
// Role arrays
// ---------------------------------------------------------------------------
const ADMIN_ROLES = ['admin', 'superadmin', 'ADMIN'];
const AGENT_ROLES = ['agent', 'AGENT', 'admin', 'superadmin', 'ADMIN'];
const DEVELOPER_ROLES = ['developer', 'DEVELOPER', 'admin', 'superadmin', 'ADMIN'];
const OPERATOR_ROLES = ['operator', 'OPERATOR', 'admin', 'superadmin', 'ADMIN'];
const HOST_ROLES = ['host', 'HOST', 'admin', 'superadmin', 'ADMIN'];

// ---------------------------------------------------------------------------
// Public routes — Clerk processes these but does NOT redirect unauthenticated
// users away. Sign-in/sign-up pages MUST be here so Clerk can complete the
// auth flow and set the session cookie after a successful sign-in.
// ---------------------------------------------------------------------------
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-in-complete',
  '/sign-up(.*)',
  '/admin/sign-in(.*)',
  '/agent/sign-in(.*)',
  '/agent/sign-up(.*)',
  '/developer/sign-in(.*)',
  '/developer/sign-up(.*)',
  '/operator/sign-in(.*)',
  '/operator/sign-up(.*)',
  '/host/sign-in(.*)',
  '/host/sign-up(.*)',
  '/',
  '/map',
  '/about',
  '/contact',
  '/agent',
  '/professional',
  '/unauthorized',
  '/listings(.*)',
  '/destinations(.*)',
  '/agents(.*)',
  '/tourism(.*)',
  '/diaspora(.*)',
  '/how-verification-works',
  '/for-agents',
  '/for-developers',
  '/fractional',
  '/press',
  '/careers',
  '/legal',
  '/terms',
  '/privacy',
  '/cookies',
  '/api/listings(.*)',
  '/api/destinations(.*)',
  '/api/inquiries(.*)',
  '/api/admin/migrate(.*)',
  '/api/health',
  '/api/v1/channel/webhooks/(.*)',
  '/api/webhooks/(.*)',
  // Phase B — channel inbound endpoints (HMAC-protected, not Clerk-protected)
  '/api/v1/channel/stays/(.*)',
  '/api/v1/channel/experiences/(.*)',
  '/api/v1/channel/reconciliation/(.*)',
]);

// Protected route matchers
const isAdminRoute = createRouteMatcher(['/admin/((?!sign-in).*)']);
const isAgentDashboardRoute = createRouteMatcher(['/agent/dashboard(.*)', '/agent/listings(.*)']);
const isDeveloperRoute = createRouteMatcher([
  '/developer/dashboard(.*)',
  '/developer/projects(.*)',
  '/developer/profile(.*)',
]);
const isOperatorRoute = createRouteMatcher(['/operator/dashboard(.*)']);
const isHostRoute = createRouteMatcher(['/host/dashboard(.*)']);

// ---------------------------------------------------------------------------
// Main auth middleware
//
// KEY DESIGN DECISIONS:
// 1. clerkMiddleware (v5+) does NOT show a blank interstitial page when a JWT
//    token is expired — this permanently fixes the blank page bug.
//    clerkMiddleware handles token refresh transparently without a blank flash.
//
// 2. Public routes are defined via createRouteMatcher — Clerk processes them
//    but does NOT redirect unauthenticated users away.
//
// 3. Protected routes explicitly redirect to the correct sign-in page.
//
// 4. Role-based access is enforced via sessionClaims.publicMetadata.role.
//    CC-C-09-A-0: role can be a string (legacy) or array (new multi-role).
//    hasAnyRole() from @/lib/user-roles normalizes both forms.
// ---------------------------------------------------------------------------
export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl.clone();

  // Allow all public routes without any auth check
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // For protected routes, get auth state
  const { userId, sessionClaims } = await auth();
  // CC-C-09-A-0: publicMetadata passed to hasAnyRole — handles string and array forms
  const publicMetadata = sessionClaims?.publicMetadata;

  // ---- Admin routes (/admin/*) — protect all except sign-in page --------
  if (isAdminRoute(req)) {
    if (!userId) {
      url.pathname = '/admin/sign-in';
      return NextResponse.redirect(url);
    }
    if (publicMetadata && !hasAnyRole(publicMetadata, ADMIN_ROLES)) {
      url.pathname = '/unauthorized';
      url.searchParams.set('required', 'admin');
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ---- Agent dashboard/listings — protect --------
  if (isAgentDashboardRoute(req)) {
    if (!userId) {
      url.pathname = '/agent/sign-in';
      return NextResponse.redirect(url);
    }
    if (publicMetadata && !hasAnyRole(publicMetadata, AGENT_ROLES)) {
      url.pathname = '/unauthorized';
      url.searchParams.set('required', 'agent');
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ---- Developer dashboard — protect --------
  if (isDeveloperRoute(req)) {
    if (!userId) {
      url.pathname = '/developer/sign-in';
      return NextResponse.redirect(url);
    }
    if (publicMetadata && !hasAnyRole(publicMetadata, DEVELOPER_ROLES)) {
      url.pathname = '/unauthorized';
      url.searchParams.set('required', 'developer');
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ---- Operator dashboard — protect --------
  if (isOperatorRoute(req)) {
    if (!userId) {
      url.pathname = '/operator/sign-in';
      return NextResponse.redirect(url);
    }
    // CC-C-09-A-0: hasAnyRole handles both string "OPERATOR" and array ["HOST","OPERATOR"]
    if (publicMetadata && !hasAnyRole(publicMetadata, OPERATOR_ROLES)) {
      url.pathname = '/unauthorized';
      url.searchParams.set('required', 'operator');
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ---- Host dashboard — protect --------
  if (isHostRoute(req)) {
    if (!userId) {
      url.pathname = '/host/sign-in';
      return NextResponse.redirect(url);
    }
    // CC-C-09-A-0: hasAnyRole handles both string "HOST" and array ["HOST","OPERATOR"]
    if (publicMetadata && !hasAnyRole(publicMetadata, HOST_ROLES)) {
      url.pathname = '/unauthorized';
      url.searchParams.set('required', 'host');
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

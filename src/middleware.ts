import { authMiddleware } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Role arrays
// ---------------------------------------------------------------------------
const ADMIN_ROLES = ['admin', 'superadmin', 'ADMIN'];
const AGENT_ROLES = ['agent', 'AGENT', 'admin', 'superadmin', 'ADMIN'];
const DEVELOPER_ROLES = ['developer', 'DEVELOPER', 'admin', 'superadmin', 'ADMIN'];
const OPERATOR_ROLES = ['operator', 'OPERATOR', 'admin', 'superadmin', 'ADMIN'];
const HOST_ROLES = ['host', 'HOST', 'admin', 'superadmin', 'ADMIN'];

// ---------------------------------------------------------------------------
// Main auth middleware
//
// KEY DESIGN DECISIONS:
// 1. Sign-in/sign-up routes MUST be in publicRoutes (NOT ignoredRoutes).
//    ignoredRoutes bypasses Clerk entirely — Clerk cannot establish a session
//    after authentication if the sign-in route is ignored. This causes the
//    "stuck on factor-two" bug where auth completes but the redirect never fires.
//
// 2. ignoredRoutes is reserved for truly static/public pages that never need
//    any Clerk session handling (marketing pages, static assets, public APIs).
//
// 3. Clerk v4 uses micromatch glob patterns (NOT regex).
//    Use '/path/:path*' for wildcards, NOT '/path(.*)'.
// ---------------------------------------------------------------------------
export default authMiddleware({
  // skipInterstitial: prevents Clerk from showing the blank interstitial page
  // when a JWT token is expired/refreshed. Without this, publicRoutes show a
  // blank page while Clerk refreshes the token. This is safe because our
  // afterAuth callback handles all role-based redirects explicitly.
  skipInterstitial: true,
  // publicRoutes: Clerk processes these but does NOT redirect unauthenticated users.
  // Sign-in/sign-up pages MUST be here so Clerk can complete the auth flow and
  // set the session cookie after a successful sign-in.
  publicRoutes: [
    // Sign-in / sign-up pages for all portals
    '/sign-in',
    '/sign-in/:path*',
    '/sign-up',
    '/sign-up/:path*',
    '/admin/sign-in',
    '/admin/sign-in/:path*',
    '/agent/sign-in',
    '/agent/sign-in/:path*',
    '/agent/sign-up',
    '/agent/sign-up/:path*',
    '/developer/sign-in',
    '/developer/sign-in/:path*',
    '/developer/sign-up',
    '/developer/sign-up/:path*',
    '/operator/sign-in',
    '/operator/sign-in/:path*',
    '/operator/sign-up',
    '/operator/sign-up/:path*',
    '/host/sign-in',
    '/host/sign-in/:path*',
    '/host/sign-up',
    '/host/sign-up/:path*',
    // Public marketing/content pages
    '/',
    '/map',
    '/about',
    '/contact',
    '/agent',
    '/professional',
    '/unauthorized',
    '/listings',
    '/listings/:path*',
    '/destinations',
    '/destinations/:path*',
    '/agents',
    '/agents/:path*',
    '/tourism',
    '/tourism/:path*',
    '/diaspora',
    '/diaspora/:path*',
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
    '/api/listings',
    '/api/listings/:path*',
    '/api/destinations',
    '/api/destinations/:path*',
    '/api/inquiries',
    '/api/inquiries/:path*',
    '/api/admin/migrate',
    '/api/admin/migrate/:path*',
  ],

  // afterAuth: enforce role-based access for protected routes
  afterAuth: (auth, req) => {
    const { userId, sessionClaims } = auth;
    const url = req.nextUrl.clone();
    const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;

    // ---- Admin routes (/admin/*) — protect all except sign-in page --------
    if (url.pathname.startsWith('/admin') && !url.pathname.startsWith('/admin/sign-in')) {
      if (userId && role && !ADMIN_ROLES.includes(role)) {
        url.pathname = '/unauthorized';
        url.searchParams.set('required', 'admin');
        return NextResponse.redirect(url);
      }
    }

    // ---- Agent dashboard/listings — protect --------
    if (url.pathname.startsWith('/agent/dashboard') || url.pathname.startsWith('/agent/listings')) {
      if (userId && role && !AGENT_ROLES.includes(role)) {
        url.pathname = '/unauthorized';
        url.searchParams.set('required', 'agent');
        return NextResponse.redirect(url);
      }
    }

    // ---- Developer dashboard — protect --------
    if (
      url.pathname.startsWith('/developer/dashboard') ||
      url.pathname.startsWith('/developer/projects') ||
      url.pathname.startsWith('/developer/profile')
    ) {
      if (userId && role && !DEVELOPER_ROLES.includes(role)) {
        url.pathname = '/unauthorized';
        url.searchParams.set('required', 'developer');
        return NextResponse.redirect(url);
      }
    }

    // ---- Operator dashboard — protect --------
    if (url.pathname.startsWith('/operator/dashboard')) {
      if (userId && role && !OPERATOR_ROLES.includes(role)) {
        url.pathname = '/unauthorized';
        url.searchParams.set('required', 'operator');
        return NextResponse.redirect(url);
      }
    }

    // ---- Host dashboard — protect --------
    if (url.pathname.startsWith('/host/dashboard')) {
      if (userId && role && !HOST_ROLES.includes(role)) {
        url.pathname = '/unauthorized';
        url.searchParams.set('required', 'host');
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};

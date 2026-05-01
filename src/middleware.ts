import { authMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Role constants — stored in Clerk publicMetadata.role
// ---------------------------------------------------------------------------
const ADMIN_ROLES = ['admin', 'superadmin', 'ADMIN'];
const AGENT_ROLES = ['agent', 'AGENT', 'admin', 'superadmin', 'ADMIN'];
const DEVELOPER_ROLES = ['developer', 'DEVELOPER', 'admin', 'superadmin', 'ADMIN'];
const OPERATOR_ROLES = ['operator', 'OPERATOR', 'admin', 'superadmin', 'ADMIN'];
const HOST_ROLES = ['host', 'HOST', 'admin', 'superadmin', 'ADMIN'];

// ---------------------------------------------------------------------------
// Main auth middleware — subdomain routing is handled in next.config.js rewrites
// NOTE: Clerk v4 authMiddleware uses micromatch glob patterns (NOT regex).
//       Use '/path/:path*' for wildcards, NOT '/path(.*)'.
// ---------------------------------------------------------------------------
export default authMiddleware({
  // publicRoutes: Clerk processes these but doesn't redirect unauthenticated users
  publicRoutes: [
    '/',
    '/map',
    '/about',
    '/contact',
    '/sign-in',
    '/sign-in/:path*',
    '/sign-up',
    '/sign-up/:path*',
    '/agent',
    '/agent/sign-in',
    '/agent/sign-in/:path*',
    '/agent/sign-up',
    '/agent/sign-up/:path*',
    '/admin/sign-in',
    '/admin/sign-in/:path*',
    '/developer/sign-up',
    '/developer/sign-up/:path*',
    '/developer/sign-in',
    '/developer/sign-in/:path*',
    '/operator/sign-in',
    '/operator/sign-in/:path*',
    '/operator/sign-up',
    '/operator/sign-up/:path*',
    '/host/sign-in',
    '/host/sign-in/:path*',
    '/host/sign-up',
    '/host/sign-up/:path*',
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

    // ---- Authenticated agent on the marketing landing page → dashboard ----
    if (url.pathname === '/agent' && userId && role && AGENT_ROLES.includes(role)) {
      url.pathname = '/agent/dashboard';
      return NextResponse.redirect(url);
    }
    // ---- Authenticated developer on the sign-up page → dashboard ----
    if (url.pathname === '/developer/sign-up' && userId && role && DEVELOPER_ROLES.includes(role)) {
      url.pathname = '/developer/dashboard';
      return NextResponse.redirect(url);
    }
    // ---- Authenticated admin on the sign-in page → dashboard ----
    if (url.pathname === '/admin/sign-in' && userId && role && ADMIN_ROLES.includes(role)) {
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }
    // ---- Admin routes (/admin/*) — protect all except sign-in page --------
    if (url.pathname.startsWith('/admin') && !url.pathname.startsWith('/admin/sign-in')) {
      if (userId && (!role || !ADMIN_ROLES.includes(role))) {
        url.pathname = '/unauthorized';
        url.searchParams.set('required', 'admin');
        return NextResponse.redirect(url);
      }
    }
    // ---- Agent dashboard/listings — protect --------
    if (url.pathname.startsWith('/agent/dashboard') || url.pathname.startsWith('/agent/listings')) {
      if (userId && (!role || !AGENT_ROLES.includes(role))) {
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
      if (userId && (!role || !DEVELOPER_ROLES.includes(role))) {
        url.pathname = '/unauthorized';
        url.searchParams.set('required', 'developer');
        return NextResponse.redirect(url);
      }
    }
    // ---- Operator dashboard — protect --------
    if (url.pathname.startsWith('/operator/dashboard')) {
      if (userId && (!role || !OPERATOR_ROLES.includes(role))) {
        url.pathname = '/unauthorized';
        url.searchParams.set('required', 'operator');
        return NextResponse.redirect(url);
      }
    }
    // ---- Host dashboard — protect --------
    if (url.pathname.startsWith('/host/dashboard')) {
      if (userId && (!role || !HOST_ROLES.includes(role))) {
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

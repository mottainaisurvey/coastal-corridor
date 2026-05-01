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
// ---------------------------------------------------------------------------
export default authMiddleware({
  // ignoredRoutes: Clerk skips these entirely — no interstitial, no auth check
  ignoredRoutes: [
    '/((?!api|trpc)(_next|.+\\.[\\w]+$))',
    '/',
    '/map',
    '/about',
    '/contact',
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
    '/unauthorized',
    '/professional',
    '/api/listings(.*)',
    '/api/destinations(.*)',
    '/api/inquiries(.*)',
    '/api/admin/migrate(.*)',
  ],
  // publicRoutes: Clerk processes these but doesn't redirect unauthenticated users
  publicRoutes: [
    '/sign-in',
    '/sign-in/(.*)',
    '/sign-up',
    '/sign-up/(.*)',
    '/agent',
    '/agent/sign-up',
    '/agent/sign-up/(.*)',
    '/agent/sign-in',
    '/agent/sign-in/(.*)',
    '/admin/sign-in',
    '/admin/sign-in/(.*)',
    '/developer/sign-up',
    '/developer/sign-up/(.*)',
    '/developer/sign-in',
    '/developer/sign-in/(.*)',
    '/professional',
    '/operator/sign-up',
    '/operator/sign-up/(.*)',
    '/operator/sign-in',
    '/operator/sign-in/(.*)',
    '/host/sign-up',
    '/host/sign-up/(.*)',
    '/host/sign-in',
    '/host/sign-in/(.*)',
  ],
  // afterAuth: enforce role-based access
  afterAuth: (auth, req) => {
    const { userId, sessionClaims } = auth;
    const url = req.nextUrl.clone();

    // ---- Authenticated agent on the marketing landing page → dashboard ----
    if (url.pathname === '/agent' && userId) {
      const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;
      if (role && AGENT_ROLES.includes(role)) {
        url.pathname = '/agent/dashboard';
        return NextResponse.redirect(url);
      }
    }
    // ---- Authenticated developer on the sign-up page → dashboard ----
    if (url.pathname === '/developer/sign-up' && userId) {
      const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;
      if (role && DEVELOPER_ROLES.includes(role)) {
        url.pathname = '/developer/dashboard';
        return NextResponse.redirect(url);
      }
    }
    // ---- Authenticated admin on the sign-in page → dashboard ----
    if (url.pathname === '/admin/sign-in' && userId) {
      const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;
      if (role && ADMIN_ROLES.includes(role)) {
        url.pathname = '/admin/dashboard';
        return NextResponse.redirect(url);
      }
    }
    // ---- Admin routes (/admin/*) — protect all except sign-in page --------
    if (url.pathname.startsWith('/admin') && !url.pathname.startsWith('/admin/sign-in')) {
      if (userId) {
        const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;
        if (!role || !ADMIN_ROLES.includes(role)) {
          url.pathname = '/unauthorized';
          url.searchParams.set('required', 'admin');
          return NextResponse.redirect(url);
        }
      }
    }
    // ---- Agent routes (/agent/*) — protect dashboard/listings only --------
    if (
      url.pathname.startsWith('/agent/dashboard') ||
      url.pathname.startsWith('/agent/listings')
    ) {
      if (userId) {
        const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;
        if (!role || !AGENT_ROLES.includes(role)) {
          url.pathname = '/unauthorized';
          url.searchParams.set('required', 'agent');
          return NextResponse.redirect(url);
        }
      }
    }
    // ---- Developer routes (/developer/*) — protect dashboard and sub-pages --
    if (
      url.pathname.startsWith('/developer/dashboard') ||
      url.pathname.startsWith('/developer/projects') ||
      url.pathname.startsWith('/developer/profile')
    ) {
      if (userId) {
        const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;
        if (!role || !DEVELOPER_ROLES.includes(role)) {
          url.pathname = '/unauthorized';
          url.searchParams.set('required', 'developer');
          return NextResponse.redirect(url);
        }
      }
    }
    // ---- Operator routes (/operator/*) — protect dashboard and sub-pages ----
    if (url.pathname.startsWith('/operator/dashboard')) {
      if (userId) {
        const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;
        if (!role || !OPERATOR_ROLES.includes(role)) {
          url.pathname = '/unauthorized';
          url.searchParams.set('required', 'operator');
          return NextResponse.redirect(url);
        }
      }
    }
    // ---- Host routes (/host/*) — protect dashboard and sub-pages ------------
    if (url.pathname.startsWith('/host/dashboard')) {
      if (userId) {
        const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;
        if (!role || !HOST_ROLES.includes(role)) {
          url.pathname = '/unauthorized';
          url.searchParams.set('required', 'host');
          return NextResponse.redirect(url);
        }
      }
    }
    return NextResponse.next();
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};

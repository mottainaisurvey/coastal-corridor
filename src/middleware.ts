import { authMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Subdomain routing
// ---------------------------------------------------------------------------
function subdomainRewrite(request: NextRequest): NextResponse | null {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  const subdomain = hostname.split('.')[0];

  if (subdomain === 'admin' && url.pathname === '/') {
    url.pathname = '/admin/sign-in';
    return NextResponse.rewrite(url);
  }
  if (subdomain === 'agent' && url.pathname === '/') {
    url.pathname = '/agent';
    return NextResponse.rewrite(url);
  }
  if (subdomain === 'developer' && url.pathname === '/') {
    url.pathname = '/developer/sign-up';
    return NextResponse.rewrite(url);
  }
  if (subdomain === 'map' && url.pathname === '/') {
    url.pathname = '/map';
    return NextResponse.rewrite(url);
  }
  if (subdomain === 'operator' && url.pathname === '/') {
    url.pathname = '/operator/sign-in';
    return NextResponse.rewrite(url);
  }
  if (subdomain === 'host' && url.pathname === '/') {
    url.pathname = '/host/sign-in';
    return NextResponse.rewrite(url);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Role constants — stored in Clerk publicMetadata.role
// ---------------------------------------------------------------------------
const ADMIN_ROLES = ['admin', 'superadmin', 'ADMIN'];
const AGENT_ROLES = ['agent', 'AGENT', 'admin', 'superadmin', 'ADMIN'];
const DEVELOPER_ROLES = ['developer', 'DEVELOPER', 'admin', 'superadmin', 'ADMIN'];
const OPERATOR_ROLES = ['operator', 'OPERATOR', 'admin', 'superadmin', 'ADMIN'];
const HOST_ROLES = ['host', 'HOST', 'admin', 'superadmin', 'ADMIN'];

// ---------------------------------------------------------------------------
// Main auth middleware
// ---------------------------------------------------------------------------
export default authMiddleware({
  // ignoredRoutes: Clerk completely skips these — no interstitial, no cookie check
  // Use for fully public pages that never need auth context
  ignoredRoutes: [
    '/',
    '/properties',
    '/properties/(.*)',
    '/destinations',
    '/destinations/(.*)',
    '/agents',
    '/tourism',
    '/invest',
    '/map',
    '/how-verification-works',
    '/unauthorized',
    '/about',
    '/press',
    '/careers',
    '/contact',
    '/legal',
    '/terms',
    '/privacy',
    '/cookies',
    '/for-agents',
    '/for-agents/(.*)',
    '/for-developers',
    '/for-developers/(.*)',
    '/for-operators',
    '/for-operators/(.*)',
    '/fractional',
    '/diaspora',
    // Public API routes
    '/api/properties(.*)',
    '/api/destinations(.*)',
    '/api/search(.*)',
    '/api/health(.*)',
    '/api/inquiries(.*)',
    '/api/admin/migrate(.*)',
  ],

  // publicRoutes: Clerk processes these (for auth context) but doesn't redirect
  // Use for auth pages and pages that behave differently when logged in
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

  // Run subdomain rewriting before auth
  beforeAuth: (req) => {
    const rewrite = subdomainRewrite(req);
    if (rewrite) return rewrite;
  },

  // After auth: enforce role-based access + redirect authenticated users on
  // landing pages to their correct dashboards
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

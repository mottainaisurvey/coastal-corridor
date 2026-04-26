import { authMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Subdomain routing
// ---------------------------------------------------------------------------
// admin.coastalcorridor.africa:
//   - unauthenticated "/" → /admin/sign-in  (branded sign-in page)
//   - all other paths pass through (so /admin/dashboard, /admin/sign-in work)
//
// agent.coastalcorridor.africa:
//   - unauthenticated "/" → /agent          (marketing landing page)
//   - authenticated "/" → /agent/dashboard  (handled in afterAuth)
//
// developer.coastalcorridor.africa:
//   - unauthenticated "/" → /developer/sign-up  (developer sign-up page)
//   - authenticated "/" → /developer/dashboard  (handled in afterAuth)
//
// map.coastalcorridor.africa:
//   - "/" → /map  (always public)
// ---------------------------------------------------------------------------
function subdomainRewrite(request: NextRequest): NextResponse | null {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  const subdomain = hostname.split('.')[0];

  if (subdomain === 'admin' && url.pathname === '/') {
    // Show branded sign-in for unauthenticated; afterAuth handles auth'd users
    url.pathname = '/admin/sign-in';
    return NextResponse.rewrite(url);
  }

  if (subdomain === 'agent' && url.pathname === '/') {
    // Show marketing landing page; afterAuth redirects auth'd agents to dashboard
    url.pathname = '/agent';
    return NextResponse.rewrite(url);
  }

  if (subdomain === 'developer' && url.pathname === '/') {
    // Show developer sign-up for unauthenticated; afterAuth redirects auth'd developers to dashboard
    url.pathname = '/developer/sign-up';
    return NextResponse.rewrite(url);
  }

  if (subdomain === 'map' && url.pathname === '/') {
    url.pathname = '/map';
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
  // Routes accessible without authentication
  publicRoutes: [
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
    // Auth pages — must be public so unauthenticated users can reach them
    '/sign-in',
    '/sign-in/(.*)',
    '/sign-up',
    '/sign-up/(.*)',
    '/agent',                  // agent marketing landing page
    '/agent/sign-up',          // agent sign-up page
    '/agent/sign-up/(.*)',
    '/agent/sign-in',          // agent sign-in page
    '/agent/sign-in/(.*)',
    '/admin/sign-in',          // branded admin sign-in page
    '/admin/sign-in/(.*)',
    '/developer/sign-up',      // developer sign-up page
    '/developer/sign-up/(.*)',
    '/developer/sign-in',      // developer sign-in page
    '/developer/sign-in/(.*)',
    '/for-developers',         // developer marketing landing page
    '/for-developers/(.*)',
    '/professional',             // professional category selection page
    '/operator/sign-up',         // operator sign-up page
    '/operator/sign-up/(.*)',
    '/operator/sign-in',         // operator sign-in page
    '/operator/sign-in/(.*)',
    '/host/sign-up',             // host sign-up page
    '/host/sign-up/(.*)',
    '/host/sign-in',             // host sign-in page
    '/host/sign-in/(.*)',
    '/for-operators',            // operator/host marketing landing page
    '/for-operators/(.*)',
    // Public API routes
    '/api/properties(.*)',
    '/api/destinations(.*)',
    '/api/search(.*)',
    '/api/health(.*)',
    '/api/inquiries(.*)',
    '/api/admin/migrate(.*)',
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
      // Not logged in → Clerk's default auth handling redirects to sign-in
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
      // Not logged in → Clerk's default auth handling redirects to sign-in
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
      // Not logged in → Clerk's default auth handling redirects to sign-in
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

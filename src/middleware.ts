import { authMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Subdomain routing: rewrite "/" on known subdomains to the correct path
// ---------------------------------------------------------------------------
function subdomainRewrite(request: NextRequest): NextResponse | null {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  const subdomain = hostname.split('.')[0];

  if (subdomain === 'admin' && url.pathname === '/') {
    url.pathname = '/admin/dashboard';
    return NextResponse.rewrite(url);
  }
  if (subdomain === 'agent' && url.pathname === '/') {
    url.pathname = '/agent/dashboard';
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
    '/api/properties(.*)',
    '/api/destinations(.*)',
    '/api/search(.*)',
    '/api/health(.*)',
    '/api/inquiries(.*)',
    '/api/admin/migrate(.*)',
  ],

  // Run subdomain rewriting before auth so the rewritten path is protected
  beforeAuth: (req) => {
    const rewrite = subdomainRewrite(req);
    if (rewrite) return rewrite;
  },

  // After auth: enforce role-based access on admin and agent routes
  afterAuth: (auth, req) => {
    const { userId, sessionClaims } = auth;
    const url = req.nextUrl.clone();

    // ---- Admin routes (/admin/*) ----------------------------------------
    if (url.pathname.startsWith('/admin')) {
      if (userId) {
        const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;
        if (!role || !ADMIN_ROLES.includes(role)) {
          url.pathname = '/unauthorized';
          url.searchParams.set('required', 'admin');
          return NextResponse.redirect(url);
        }
      }
      // If not logged in, Clerk's default auth handling redirects to sign-in
    }

    // ---- Agent routes (/agent/*) ----------------------------------------
    if (url.pathname.startsWith('/agent')) {
      if (userId) {
        const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;
        if (!role || !AGENT_ROLES.includes(role)) {
          url.pathname = '/unauthorized';
          url.searchParams.set('required', 'agent');
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

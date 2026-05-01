import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
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
// Public routes — no auth required, no interstitial
// ---------------------------------------------------------------------------
const isPublicRoute = createRouteMatcher([
  '/',
  '/properties(.*)',
  '/destinations(.*)',
  '/agents(.*)',
  '/tourism(.*)',
  '/invest(.*)',
  '/map(.*)',
  '/how-verification-works(.*)',
  '/unauthorized(.*)',
  '/about(.*)',
  '/press(.*)',
  '/careers(.*)',
  '/contact(.*)',
  '/legal(.*)',
  '/terms(.*)',
  '/privacy(.*)',
  '/cookies(.*)',
  '/for-agents(.*)',
  '/for-developers(.*)',
  '/for-operators(.*)',
  '/fractional(.*)',
  '/diaspora(.*)',
  // Auth pages
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/agent/sign-in(.*)',
  '/agent/sign-up(.*)',
  '/admin/sign-in(.*)',
  '/developer/sign-in(.*)',
  '/developer/sign-up(.*)',
  '/operator/sign-in(.*)',
  '/operator/sign-up(.*)',
  '/host/sign-in(.*)',
  '/host/sign-up(.*)',
  '/professional(.*)',
  '/agent',
  // Public API routes
  '/api/properties(.*)',
  '/api/destinations(.*)',
  '/api/search(.*)',
  '/api/health(.*)',
  '/api/inquiries(.*)',
  '/api/admin/migrate(.*)',
]);

// ---------------------------------------------------------------------------
// Main middleware using clerkMiddleware (no interstitial on public routes)
// ---------------------------------------------------------------------------
export default clerkMiddleware(async (auth, req: NextRequest) => {
  // 1. Subdomain rewriting (runs before auth check)
  const rewrite = subdomainRewrite(req);
  if (rewrite) return rewrite;

  const url = req.nextUrl.clone();

  // 2. Public routes — skip auth entirely
  if (isPublicRoute(req)) {
    // Still handle authenticated user redirects on landing pages
    const { userId, sessionClaims } = await auth();
    if (userId) {
      const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;

      // Authenticated admin on sign-in page → dashboard
      if (url.pathname === '/admin/sign-in' && role && ADMIN_ROLES.includes(role)) {
        url.pathname = '/admin/dashboard';
        return NextResponse.redirect(url);
      }
      // Authenticated agent on marketing page → dashboard
      if (url.pathname === '/agent' && role && AGENT_ROLES.includes(role)) {
        url.pathname = '/agent/dashboard';
        return NextResponse.redirect(url);
      }
      // Authenticated developer on sign-up page → dashboard
      if (url.pathname === '/developer/sign-up' && role && DEVELOPER_ROLES.includes(role)) {
        url.pathname = '/developer/dashboard';
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  }

  // 3. Protected routes — require authentication
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    // Not logged in — redirect to appropriate sign-in page
    if (url.pathname.startsWith('/admin')) {
      url.pathname = '/admin/sign-in';
      return NextResponse.redirect(url);
    }
    if (url.pathname.startsWith('/agent/dashboard') || url.pathname.startsWith('/agent/listings')) {
      url.pathname = '/agent/sign-in';
      return NextResponse.redirect(url);
    }
    if (url.pathname.startsWith('/developer/dashboard') || url.pathname.startsWith('/developer/projects')) {
      url.pathname = '/developer/sign-in';
      return NextResponse.redirect(url);
    }
    if (url.pathname.startsWith('/operator/dashboard')) {
      url.pathname = '/operator/sign-in';
      return NextResponse.redirect(url);
    }
    if (url.pathname.startsWith('/host/dashboard')) {
      url.pathname = '/host/sign-in';
      return NextResponse.redirect(url);
    }
    // Default: let Clerk handle it
    return NextResponse.next();
  }

  const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;

  // 4. Role-based access control for protected routes
  if (url.pathname.startsWith('/admin') && !url.pathname.startsWith('/admin/sign-in')) {
    if (!role || !ADMIN_ROLES.includes(role)) {
      url.pathname = '/unauthorized';
      url.searchParams.set('required', 'admin');
      return NextResponse.redirect(url);
    }
  }

  if (url.pathname.startsWith('/agent/dashboard') || url.pathname.startsWith('/agent/listings')) {
    if (!role || !AGENT_ROLES.includes(role)) {
      url.pathname = '/unauthorized';
      url.searchParams.set('required', 'agent');
      return NextResponse.redirect(url);
    }
  }

  if (
    url.pathname.startsWith('/developer/dashboard') ||
    url.pathname.startsWith('/developer/projects') ||
    url.pathname.startsWith('/developer/profile')
  ) {
    if (!role || !DEVELOPER_ROLES.includes(role)) {
      url.pathname = '/unauthorized';
      url.searchParams.set('required', 'developer');
      return NextResponse.redirect(url);
    }
  }

  if (url.pathname.startsWith('/operator/dashboard')) {
    if (!role || !OPERATOR_ROLES.includes(role)) {
      url.pathname = '/unauthorized';
      url.searchParams.set('required', 'operator');
      return NextResponse.redirect(url);
    }
  }

  if (url.pathname.startsWith('/host/dashboard')) {
    if (!role || !HOST_ROLES.includes(role)) {
      url.pathname = '/unauthorized';
      url.searchParams.set('required', 'host');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};

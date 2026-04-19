import { authMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Subdomain routing: rewrite requests from subdomains to the correct path
function subdomainRewrite(request: NextRequest): NextResponse | null {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // Extract subdomain (e.g. "admin" from "admin.coastalcorridor.africa")
  const subdomain = hostname.split('.')[0];

  // Only rewrite for known subdomains (not www, not the apex domain)
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

export default authMiddleware({
  // Public routes that don't require authentication
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
    '/api/properties(.*)',
    '/api/destinations(.*)',
    '/api/search(.*)',
    '/api/health(.*)',
    '/api/inquiries(.*)',
    '/api/admin/migrate(.*)',
  ],
  beforeAuth: (req) => {
    const rewrite = subdomainRewrite(req);
    if (rewrite) return rewrite;
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};

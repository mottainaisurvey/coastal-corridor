import { authMiddleware } from '@clerk/nextjs';
import { NextResponse, type NextRequest } from 'next/server';

export default authMiddleware({
  publicRoutes: [
    '/',
    '/properties',
    '/properties/(.*)',
    '/destinations',
    '/destinations/(.*)',
    '/agents',
    '/map',
    '/tourism',
    '/invest',
    '/how-verification-works',
    '/api/properties',
    '/api/destinations',
    '/api/search',
    '/api/health',
  ],
  ignoredRoutes: [
    '/api/webhooks(.*)',
    '/api/clerk(.*)',
  ],
});

export const config = {
  matcher: ['/((?!_next|static|favicon.ico).*)'],
};

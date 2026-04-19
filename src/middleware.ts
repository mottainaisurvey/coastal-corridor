import { authMiddleware } from '@clerk/nextjs/server';

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
    '/api/properties(.*)',
    '/api/destinations(.*)',
    '/api/search(.*)',
    '/api/health(.*)',
    '/api/inquiries(.*)',
    '/api/admin/migrate(.*)',
  ],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};

import { authMiddleware } from '@clerk/nextjs/server';

// Minimal middleware — subdomain routing handled by next.config.js rewrites
export default authMiddleware({
  publicRoutes: [
    '/',
    '/map',
    '/about',
    '/contact',
    '/sign-in',
    '/sign-up',
    '/agent',
    '/agent/sign-in',
    '/agent/sign-up',
    '/admin/sign-in',
    '/developer/sign-up',
    '/developer/sign-in',
    '/operator/sign-in',
    '/operator/sign-up',
    '/host/sign-in',
    '/host/sign-up',
    '/professional',
    '/unauthorized',
    '/listings',
    '/destinations',
    '/agents',
    '/tourism',
    '/diaspora',
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
    '/api/destinations',
    '/api/inquiries',
    '/api/admin/migrate',
  ],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};

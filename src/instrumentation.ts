/**
 * Next.js Instrumentation — Phase A
 *
 * Initialises Sentry for error tracking and performance monitoring.
 * This file is loaded once at server startup by Next.js.
 *
 * Spec reference: Implementation Brief §12 (Observability)
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { init } = await import('@sentry/nextjs');

    init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
      release: process.env.VERCEL_GIT_COMMIT_SHA,

      // Capture 10% of transactions for performance monitoring in production
      // Capture 100% in staging for full visibility
      tracesSampleRate:
        process.env.VERCEL_ENV === 'production' ? 0.1 : 1.0,

      // Only send errors in production and staging — not in local dev
      enabled: process.env.NODE_ENV !== 'development' || !!process.env.SENTRY_DSN,

      // Ignore common noise
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        'Network request failed',
      ],

      beforeSend(event) {
        // Scrub sensitive fields from error payloads
        if (event.request?.cookies) {
          event.request.cookies = {};
        }
        return event;
      },
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const { init } = await import('@sentry/nextjs');

    init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.VERCEL_ENV ?? 'development',
      tracesSampleRate: process.env.VERCEL_ENV === 'production' ? 0.1 : 1.0,
      enabled: !!process.env.SENTRY_DSN,
    });
  }
}

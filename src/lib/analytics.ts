/**
 * PostHog Analytics — Phase A
 *
 * Provides server-side and client-side analytics event tracking.
 *
 * Server-side: Used in API routes and server components for backend events
 *   (reservation created, booking confirmed, payment processed, etc.)
 *
 * Client-side: PostHogProvider wraps the app in layout.tsx for
 *   page views, feature flag evaluation, and user identification.
 *
 * Spec reference: Implementation Brief §12 (Observability)
 */

// ─── Server-side PostHog client ───────────────────────────────────────────────

let _serverClient: import('posthog-node').PostHog | null = null;

/**
 * Returns the server-side PostHog client (singleton).
 * Safe to call from API routes and server components.
 */
export async function getPostHogServer(): Promise<import('posthog-node').PostHog | null> {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;

  if (!_serverClient) {
    const { PostHog } = await import('posthog-node');
    _serverClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
      flushAt: 20,
      flushInterval: 10_000,
    });
  }

  return _serverClient;
}

// ─── Typed event catalogue ────────────────────────────────────────────────────

export type AnalyticsEvent =
  // Stays
  | 'stay_property_viewed'
  | 'stay_reservation_initiated'
  | 'stay_reservation_confirmed'
  | 'stay_reservation_cancelled'
  | 'stay_payment_completed'
  // Experiences
  | 'experience_viewed'
  | 'experience_booking_initiated'
  | 'experience_booking_confirmed'
  | 'experience_booking_cancelled'
  | 'experience_payment_completed'
  // Real estate (existing — do not modify)
  | 'property_viewed'
  | 'property_enquiry_sent'
  | 'fractional_interest_expressed'
  // Cohort / Operator
  | 'operator_application_submitted'
  | 'cohort_code_generated'
  | 'host_onboarded'
  // Integration
  | 'owambe_webhook_received'
  | 'owambe_api_call_made'
  | 'idempotency_cache_hit'
  | 'reconciliation_run_completed';

/**
 * Captures a server-side analytics event.
 * Fire-and-forget — never throws.
 */
export async function captureServerEvent(
  distinctId: string,
  event: AnalyticsEvent,
  properties?: Record<string, unknown>
): Promise<void> {
  try {
    const client = await getPostHogServer();
    if (!client) return;

    client.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        $lib: 'coastal-corridor-server',
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
      },
    });
  } catch {
    // Analytics must never block the main flow
  }
}

/**
 * Identifies a user on the server side (e.g., after sign-in).
 */
export async function identifyUser(
  userId: string,
  traits: Record<string, unknown>
): Promise<void> {
  try {
    const client = await getPostHogServer();
    if (!client) return;

    client.identify({
      distinctId: userId,
      properties: traits,
    });
  } catch {
    // Silently ignore
  }
}

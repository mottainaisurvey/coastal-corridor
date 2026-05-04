'use client';

/**
 * PostHog Client-Side Provider — Phase A
 *
 * Wraps the app to enable:
 *   - Automatic page view tracking
 *   - Feature flag evaluation
 *   - User identification after Clerk sign-in
 *
 * Usage: Add <PostHogProvider> inside ClerkProvider in layout.tsx
 *
 * Spec reference: Implementation Brief §12 (Observability)
 */

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import posthog from 'posthog-js';

let _initialized = false;

function initPostHog() {
  if (_initialized) return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  if (typeof window === 'undefined') return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    capture_pageview: false, // We handle this manually below
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
    // Respect DNT headers
    respect_dnt: true,
  });

  _initialized = true;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();

  // Initialise PostHog on first render
  useEffect(() => {
    initPostHog();
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (!_initialized) return;

    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    posthog.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams]);

  // Identify user after Clerk sign-in
  useEffect(() => {
    if (!_initialized || !isLoaded) return;

    if (user) {
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        created_at: user.createdAt,
      });
    } else {
      posthog.reset();
    }
  }, [user, isLoaded]);

  return <>{children}</>;
}

/**
 * Convenience hook for capturing client-side events.
 */
export function useAnalytics() {
  return {
    capture: (event: string, properties?: Record<string, unknown>) => {
      if (_initialized) {
        posthog.capture(event, properties);
      }
    },
    isFeatureEnabled: (flag: string) => {
      if (!_initialized) return false;
      return posthog.isFeatureEnabled(flag) ?? false;
    },
  };
}

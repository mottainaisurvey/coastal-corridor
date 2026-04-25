import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
export const ONBOARDING_KEY = 'cc_onboarding_seen_v1';

// Secure token cache for Clerk — clearToken required by @clerk/clerk-expo v2+
const tokenCache = {
  async getToken(key: string) {
    try { return await SecureStore.getItemAsync(key); } catch { return null; }
  },
  async saveToken(key: string, value: string) {
    try { await SecureStore.setItemAsync(key, value); } catch {}
  },
  async clearToken(key: string) {
    try { await SecureStore.deleteItemAsync(key); } catch {}
  },
};

function AuthGuard() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);
  // Prevent multiple simultaneous navigations
  const isNavigating = useRef(false);

  // Check onboarding flag on mount
  useEffect(() => {
    SecureStore.getItemAsync(ONBOARDING_KEY)
      .then(val => setOnboardingSeen(val === '1'))
      .catch(() => setOnboardingSeen(false));
  }, []);

  useEffect(() => {
    // Wait for everything to be ready
    if (!isLoaded || onboardingSeen === null || segments.length === 0) return;
    if (isNavigating.current) return;

    const currentSegment = segments[0] as string | undefined;
    const inOnboarding = currentSegment === '(onboarding)';
    const inAuthGroup = currentSegment === '(auth)';

    // User hasn't seen onboarding yet → show onboarding
    if (!onboardingSeen) {
      if (!inOnboarding) {
        isNavigating.current = true;
        router.replace('/(onboarding)/');
        // Reset flag after a short delay to allow future navigations
        setTimeout(() => { isNavigating.current = false; }, 1000);
      }
      return;
    }

    // Onboarding done, not signed in → sign in page
    if (!isSignedIn) {
      if (!inAuthGroup) {
        isNavigating.current = true;
        router.replace('/(auth)/sign-in');
        setTimeout(() => { isNavigating.current = false; }, 1000);
      }
      return;
    }

    // Signed in but in auth or onboarding → go to app
    if (isSignedIn && (inAuthGroup || inOnboarding)) {
      isNavigating.current = true;
      router.replace('/(tabs)/');
      setTimeout(() => { isNavigating.current = false; }, 1000);
    }
  }, [isLoaded, isSignedIn, onboardingSeen, segments]);

  // Show loading while Clerk or onboarding state is not ready
  if (!isLoaded || onboardingSeen === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0e12' }}>
        <ActivityIndicator color="#d4a24c" size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0e12' },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="(onboarding)" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen
        name="property/[slug]"
        options={{
          headerShown: false,
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0e12', padding: 24 }}>
        <ActivityIndicator color="#d4a24c" size="large" />
      </View>
    );
  }
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <AuthGuard />
    </ClerkProvider>
  );
}

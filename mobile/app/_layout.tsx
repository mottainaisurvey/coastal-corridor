import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
const ONBOARDING_KEY = 'cc_onboarding_seen_v1';

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

  // Check onboarding flag on mount
  useEffect(() => {
    SecureStore.getItemAsync(ONBOARDING_KEY)
      .then(val => setOnboardingSeen(val === '1'))
      .catch(() => setOnboardingSeen(false));
  }, []);

  useEffect(() => {
    if (!isLoaded || onboardingSeen === null) return;
    if (segments.length === 0) return;

    const inOnboarding = segments[0] === '(onboarding)';
    const inAuthGroup = segments[0] === '(auth)';
    const inProtectedGroup = segments[0] === '(tabs)';
    const inProperty = segments[0] === 'property';

    // Not seen onboarding yet → go to onboarding
    if (!onboardingSeen && !inOnboarding) {
      router.replace('/(onboarding)/');
      return;
    }

    // Seen onboarding, not signed in, not in auth → go to sign in
    if (onboardingSeen && !isSignedIn && !inAuthGroup && !inOnboarding) {
      router.replace('/(auth)/sign-in');
      return;
    }

    // Signed in but in auth or onboarding → go to tabs
    if (isSignedIn && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)/');
      return;
    }
  }, [isLoaded, isSignedIn, segments, onboardingSeen]);

  // Show loading while Clerk or onboarding state is not ready
  if (!isLoaded || onboardingSeen === null || segments.length === 0) {
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
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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

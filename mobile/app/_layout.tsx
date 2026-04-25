import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
export const ONBOARDING_KEY = 'cc_onboarding_seen_v1';

// Secure token cache for Clerk
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
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(ONBOARDING_KEY)
      .then(val => {
        const seen = val === '1';
        console.log('[AuthGuard] onboarding flag loaded:', seen);
        setOnboardingSeen(seen);
      })
      .catch(err => {
        console.warn('[AuthGuard] SecureStore error, defaulting to false:', err);
        setOnboardingSeen(false);
      });
  }, []);

  // Show splash/loader until both Clerk and SecureStore are ready
  if (!isLoaded || onboardingSeen === null) {
    console.log('[AuthGuard] waiting — isLoaded:', isLoaded, 'onboardingSeen:', onboardingSeen);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0e12' }}>
        <ActivityIndicator color="#d4a24c" size="large" />
      </View>
    );
  }

  console.log('[AuthGuard] routing — isSignedIn:', isSignedIn, 'onboardingSeen:', onboardingSeen);

  // Decision tree rendered as JSX — no imperative router.replace() calls
  // Expo Router processes <Redirect /> synchronously before painting any screen

  // New user: show onboarding first
  if (!onboardingSeen) {
    console.log('[AuthGuard] → redirecting to onboarding');
    return (
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0e12' } }}>
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="property/[slug]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Redirect href="/(onboarding)/" />
      </Stack>
    );
  }

  // Onboarding done, not signed in: go to sign-in
  if (!isSignedIn) {
    console.log('[AuthGuard] → redirecting to sign-in');
    return (
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0e12' } }}>
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="property/[slug]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Redirect href="/(auth)/sign-in" />
      </Stack>
    );
  }

  // Signed in: go to main app
  console.log('[AuthGuard] → user signed in, rendering tabs');
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0e12' } }}>
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="property/[slug]" options={{ headerShown: false, animation: 'slide_from_right' }} />
    </Stack>
  );
}

export default function RootLayout() {
  if (!CLERK_PUBLISHABLE_KEY) {
    console.error('[RootLayout] EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set!');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0e12' }}>
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

import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

// Keep the splash screen visible until we are ready
SplashScreen.preventAutoHideAsync().catch(() => {});

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

// Shared Stack screen list — defined once to avoid duplication
function AppStack({ children }: { children?: React.ReactNode }) {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0e12' } }}>
      <Stack.Screen name="(onboarding)" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(legal)" options={{ headerShown: false }} />
      <Stack.Screen name="property/[slug]" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="kyc/index" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="sso-callback" options={{ headerShown: false }} />
      {children}
    </Stack>
  );
}

function AuthGuard() {
  const { isLoaded, isSignedIn } = useAuth();
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);
  const [splashReady, setSplashReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Minimum splash display: 2 seconds
        const [val] = await Promise.all([
          SecureStore.getItemAsync(ONBOARDING_KEY),
          new Promise(resolve => setTimeout(resolve, 2000)),
        ]);
        const seen = val === '1';
        console.log('[AuthGuard] onboarding flag loaded:', seen);
        setOnboardingSeen(seen);
      } catch (err) {
        console.warn('[AuthGuard] SecureStore error, defaulting to false:', err);
        setOnboardingSeen(false);
      } finally {
        setSplashReady(true);
      }
    };
    init();
  }, []);

  // Hide the native splash screen once both Clerk and our state are ready
  useEffect(() => {
    if (isLoaded && splashReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoaded, splashReady]);

  // Show loading indicator until both Clerk and SecureStore are ready
  if (!isLoaded || onboardingSeen === null || !splashReady) {
    console.log('[AuthGuard] waiting — isLoaded:', isLoaded, 'onboardingSeen:', onboardingSeen, 'splashReady:', splashReady);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0e12' }}>
        <ActivityIndicator color="#d4a24c" size="large" />
      </View>
    );
  }

  console.log('[AuthGuard] routing — isSignedIn:', isSignedIn, 'onboardingSeen:', onboardingSeen);

  // New user: show onboarding first
  if (!onboardingSeen) {
    console.log('[AuthGuard] → redirecting to onboarding');
    return (
      <AppStack>
        <Redirect href="/(onboarding)/" />
      </AppStack>
    );
  }

  // Onboarding done, not signed in: go to sign-in
  if (!isSignedIn) {
    console.log('[AuthGuard] → redirecting to sign-in');
    return (
      <AppStack>
        <Redirect href="/(auth)/sign-in" />
      </AppStack>
    );
  }

  // Signed in: render the main app
  console.log('[AuthGuard] → user signed in, rendering tabs');
  return <AppStack />;
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

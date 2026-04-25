/**
 * sso-callback.tsx
 *
 * This screen catches the deep link `coastalcorridor://sso-callback` that Clerk
 * fires after a successful Google (or any OAuth) sign-in on Android.
 *
 * On iOS, ASWebAuthenticationSession closes the browser before Expo Router sees
 * the URL, so this screen is never rendered on iOS. On Android, the custom scheme
 * deep link is delivered to the app and Expo Router tries to match it as a route —
 * without this file it shows "Unmatched Route".
 *
 * What this screen does:
 *  1. Calls WebBrowser.maybeCompleteAuthSession() to signal the OAuth session is done.
 *  2. Waits briefly for Clerk to finish processing the session token.
 *  3. Navigates to the main tabs once isSignedIn becomes true.
 */

import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// Complete any pending auth session — required for the OAuth redirect to resolve
WebBrowser.maybeCompleteAuthSession();

export default function SSOCallbackScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      // Session is active — go to the main app
      router.replace('/(tabs)/');
    } else {
      // Session not yet active — wait a moment and check again
      // (Clerk may still be processing the token)
      const timer = setTimeout(() => {
        if (isSignedIn) {
          router.replace('/(tabs)/');
        } else {
          // Something went wrong — fall back to sign-in
          router.replace('/(auth)/sign-in');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, isSignedIn]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#d4a24c" size="large" />
      <Text style={styles.text}>Completing sign in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e12',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    color: '#9ca3af',
    fontSize: 14,
  },
});

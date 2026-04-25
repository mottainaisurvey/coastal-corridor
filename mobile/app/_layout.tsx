import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, Text, ScrollView } from 'react-native';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

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
  const [logs, setLogs] = useState<string[]>([`[INIT] key=${CLERK_PUBLISHABLE_KEY ? CLERK_PUBLISHABLE_KEY.slice(0,20)+'...' : 'MISSING'}`]);
  const renderCount = useRef(0);

  const addLog = (msg: string) => {
    const ts = new Date().toISOString().slice(11, 23);
    setLogs(prev => [...prev.slice(-30), `[${ts}] ${msg}`]);
  };

  // Log every render
  renderCount.current += 1;
  useEffect(() => {
    addLog(`render#${renderCount.current} isLoaded=${isLoaded} isSignedIn=${isSignedIn} segs=[${segments.join(',')}]`);
  });

  useEffect(() => {
    addLog(`AUTH_EFFECT isLoaded=${isLoaded} isSignedIn=${isSignedIn} segs=[${segments.join(',')}]`);

    if (!isLoaded) {
      addLog('WAITING: Clerk not loaded yet');
      return;
    }
    if (segments.length === 0) {
      addLog('WAITING: segments empty (router not ready)');
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inProtectedGroup = segments[0] === '(tabs)';
    addLog(`inAuth=${inAuthGroup} inTabs=${inProtectedGroup}`);

    if (!isSignedIn && inProtectedGroup) {
      addLog('REDIRECT -> sign-in (not signed in, in tabs)');
      router.replace('/(auth)/sign-in');
    } else if (!isSignedIn && !inAuthGroup) {
      addLog('REDIRECT -> sign-in (not signed in, not in auth)');
      router.replace('/(auth)/sign-in');
    } else if (isSignedIn && inAuthGroup) {
      addLog('REDIRECT -> tabs (signed in, in auth)');
      router.replace('/(tabs)/');
    } else {
      addLog('NO_REDIRECT: already in correct group');
    }
  }, [isLoaded, isSignedIn, segments]);

  // Always show debug overlay — shows Slot underneath once loaded
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0e12' }}>
      {/* Debug overlay — fixed at top */}
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.85)', padding: 8, maxHeight: 220,
      }}>
        <Text style={{ color: '#d4a24c', fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>
          🐛 DEBUG — isLoaded:{String(isLoaded)} signedIn:{String(isSignedIn)} segs:{segments.join('/')||'none'}
        </Text>
        <ScrollView style={{ maxHeight: 180 }}>
          {logs.map((l, i) => (
            <Text key={i} style={{ color: '#9ca3af', fontSize: 9, fontFamily: 'monospace' }}>{l}</Text>
          ))}
        </ScrollView>
      </View>

      {/* Loading spinner while Clerk initialises */}
      {(!isLoaded || segments.length === 0) ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 220 }}>
          <ActivityIndicator color="#d4a24c" size="large" />
          <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 12 }}>
            {!isLoaded ? 'Initialising Clerk...' : 'Resolving route...'}
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1, marginTop: 220 }}>
          <Slot />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0e12', padding: 24 }}>
        <Text style={{ color: '#d4a24c', fontSize: 16, textAlign: 'center' }}>
          ❌ Configuration error: EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is missing.
        </Text>
      </View>
    );
  }
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <AuthGuard />
    </ClerkProvider>
  );
}

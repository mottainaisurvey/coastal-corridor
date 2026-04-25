import { useSignIn, useSSO, useAuth } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// Required for OAuth redirect handling — must be called before any OAuth flow
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const { isSignedIn, signOut } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  // Block the UI until any stale session has been fully cleared
  const [clearing, setClearing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const clearStaleSession = async () => {
      try {
        if (isSignedIn) {
          console.log('[SignIn] stale session detected — signing out before rendering');
          await signOut();
          console.log('[SignIn] stale session cleared');
        }
      } catch (err) {
        console.warn('[SignIn] signOut error (ignored):', err);
      } finally {
        if (!cancelled) setClearing(false);
      }
    };
    // Only run once Clerk has loaded its state
    if (isLoaded) {
      clearStaleSession();
    }
    return () => { cancelled = true; };
  }, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignIn = async () => {
    if (!isLoaded) return;
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const result = await signIn.create({ identifier: email.trim(), password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)/');
      } else if (
        result.status === 'needs_first_factor' ||
        result.status === 'needs_second_factor' ||
        result.status === 'needs_identifier'
      ) {
        // Account may have been created via Google/Apple — no password set
        Alert.alert(
          'Sign in incomplete',
          'This account may use Google or Apple Sign-In. Please tap the relevant button instead, or reset your password.',
        );
      } else {
        Alert.alert('Sign in incomplete', 'Additional verification required. Please try again.');
      }
    } catch (err: unknown) {
      // Detect Clerk error codes for OAuth-only accounts
      const clerkErr = err as { errors?: { code?: string; message?: string }[] };
      const code = clerkErr?.errors?.[0]?.code ?? '';
      const rawMsg = clerkErr?.errors?.[0]?.message ?? (err instanceof Error ? err.message : '');
      console.error('[SignIn] email sign-in error:', code, rawMsg);

      if (
        code === 'strategy_for_user_invalid' ||
        code === 'form_password_incorrect' ||
        rawMsg.toLowerCase().includes('google') ||
        rawMsg.toLowerCase().includes('apple') ||
        rawMsg.toLowerCase().includes('oauth') ||
        rawMsg.toLowerCase().includes('social')
      ) {
        Alert.alert(
          'Sign in failed',
          'This account was created with a social provider. Please tap "Continue with Google" or "Continue with Apple" to sign in.',
        );
      } else if (code === 'form_identifier_not_found' || rawMsg.toLowerCase().includes('identifier')) {
        Alert.alert('Sign in failed', 'No account found with this email address. Please sign up first.');
      } else {
        const msg = rawMsg || 'Sign in failed. Please check your credentials.';
        Alert.alert('Sign in failed', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      console.log('[SignIn] starting Google SSO flow');
      const result = await startSSOFlow({ strategy: 'oauth_google' });
      console.log('[SignIn] Google SSO result:', JSON.stringify({
        createdSessionId: result.createdSessionId,
        hasSetActive: !!result.setActive,
      }));

      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId });
        router.replace('/(tabs)/');
      } else if (result.signIn?.status === 'complete') {
        router.replace('/(tabs)/');
      } else {
        console.warn('[SignIn] Google SSO flow returned no session:', result);
        Alert.alert('Google sign in', 'Sign in was cancelled or did not complete. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign in failed';
      console.error('[SignIn] Google SSO error:', msg);
      if (!msg.includes('cancel') && !msg.includes('dismiss')) {
        Alert.alert('Google sign in failed', msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      console.log('[SignIn] starting Apple SSO flow');
      const result = await startSSOFlow({ strategy: 'oauth_apple' });
      console.log('[SignIn] Apple SSO result:', JSON.stringify({
        createdSessionId: result.createdSessionId,
        hasSetActive: !!result.setActive,
      }));

      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId });
        router.replace('/(tabs)/');
      } else if (result.signIn?.status === 'complete') {
        router.replace('/(tabs)/');
      } else {
        console.warn('[SignIn] Apple SSO flow returned no session:', result);
        Alert.alert('Apple sign in', 'Sign in was cancelled or did not complete. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Apple sign in failed';
      console.error('[SignIn] Apple SSO error:', msg);
      if (!msg.includes('cancel') && !msg.includes('dismiss')) {
        Alert.alert('Apple sign in failed', msg);
      }
    } finally {
      setAppleLoading(false);
    }
  };

  // Show a full-screen loader while we await the signOut (prevents "already signed in" error)
  if (clearing || !isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#d4a24c" size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoArea}>
          <Text style={styles.logoText}>Coastal Corridor</Text>
          <Text style={styles.logoSub}>Lagos ⟶ Calabar</Text>
        </View>

        <Text style={styles.heading}>Sign in</Text>

        {/* Google SSO button */}
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleGoogleSignIn}
          disabled={googleLoading || appleLoading}
          activeOpacity={0.75}
        >
          {googleLoading ? (
            <ActivityIndicator color="#f5f0e8" size="small" />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Apple SSO button */}
        <TouchableOpacity
          style={styles.appleBtn}
          onPress={handleAppleSignIn}
          disabled={googleLoading || appleLoading}
          activeOpacity={0.75}
        >
          {appleLoading ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <>
              <Text style={styles.appleIcon}></Text>
              <Text style={styles.appleBtnText}>Continue with Apple</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#6b7280"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#6b7280"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
        />

        {/* Forgot password */}
        <TouchableOpacity
          style={styles.forgotBtn}
          onPress={() => router.push('/(auth)/forgot-password')}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btn}
          onPress={handleSignIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Sign in</Text>
          }
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account? </Text>
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.link}>Create one</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0e12' },
  container: { flex: 1, backgroundColor: '#0a0e12' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  logoArea: { alignItems: 'center', marginBottom: 48 },
  logoText: { color: '#f5f0e8', fontSize: 26, fontWeight: '300', letterSpacing: 1 },
  logoSub: { color: '#d4a24c', fontSize: 12, fontFamily: 'monospace', marginTop: 4, letterSpacing: 2 },
  heading: { color: '#f5f0e8', fontSize: 28, fontWeight: '300', marginBottom: 24 },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1e2530',
    borderWidth: 1,
    borderColor: '#2a3040',
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 12,
  },
  googleIcon: { color: '#4285F4', fontSize: 17, fontWeight: '700' },
  googleBtnText: { color: '#f5f0e8', fontSize: 15, fontWeight: '500' },
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#f5f0e8',
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 20,
  },
  appleIcon: { color: '#000', fontSize: 17 },
  appleBtnText: { color: '#000', fontSize: 15, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2a3040' },
  dividerText: { color: '#6b7280', fontSize: 12 },
  input: {
    backgroundColor: '#161b22', borderWidth: 1, borderColor: '#2a3040',
    borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14,
    color: '#f5f0e8', fontSize: 15, marginBottom: 14,
  },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 16, marginTop: -4 },
  forgotText: { color: '#d4a24c', fontSize: 13 },
  btn: {
    backgroundColor: '#c96a3f', borderRadius: 8, paddingVertical: 15,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#9ca3af', fontSize: 14 },
  link: { color: '#d4a24c', fontSize: 14, fontWeight: '500' },
});

import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// Required for OAuth redirect handling on Android
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignIn = async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)/');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      Alert.alert('Sign in failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive: oauthSetActive } = await startOAuthFlow();
      if (createdSessionId && oauthSetActive) {
        await oauthSetActive({ session: createdSessionId });
        router.replace('/(tabs)/');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign in failed';
      Alert.alert('Google sign in failed', msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        {/* Logo / wordmark */}
        <View style={styles.logoArea}>
          <Text style={styles.logoText}>Coastal Corridor</Text>
          <Text style={styles.logoSub}>Lagos ⟶ Calabar</Text>
        </View>

        <Text style={styles.heading}>Sign in</Text>

        {/* Google OAuth button */}
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleGoogleSignIn}
          disabled={googleLoading}
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
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#6b7280"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        {/* Forgot password */}
        <TouchableOpacity
          style={styles.forgotBtn}
          onPress={() => router.push('/(auth)/forgot-password')}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btn}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Sign in</Text>
          }
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account? </Text>
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Create one</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 20,
  },
  googleIcon: {
    color: '#4285F4',
    fontSize: 17,
    fontWeight: '700',
  },
  googleBtnText: { color: '#f5f0e8', fontSize: 15, fontWeight: '500' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
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

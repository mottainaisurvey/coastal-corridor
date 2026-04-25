import { useSignUp, useSSO, useAuth } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startSSOFlow } = useSSO();
  const { isSignedIn, signOut } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  // Block the UI until any stale session has been fully cleared
  const [clearing, setClearing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const clearStaleSession = async () => {
      try {
        if (isSignedIn) {
          console.log('[SignUp] stale session detected — signing out before rendering');
          await signOut();
          console.log('[SignUp] stale session cleared');
        }
      } catch (err) {
        console.warn('[SignUp] signOut error (ignored):', err);
      } finally {
        if (!cancelled) setClearing(false);
      }
    };
    if (isLoaded) {
      clearStaleSession();
    }
    return () => { cancelled = true; };
  }, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignUp = async () => {
    if (!isLoaded) return;
    if (!agreedToTerms) {
      Alert.alert('Agreement required', 'Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    if (!firstName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password too short', 'Your password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await signUp.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        emailAddress: email.trim(),
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[SignUp] create error:', msg);
      Alert.alert('Sign up failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)/');
      } else {
        Alert.alert('Verification incomplete', 'Please check the code and try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid code';
      console.error('[SignUp] verify error:', msg);
      Alert.alert('Verification failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!agreedToTerms) {
      Alert.alert('Agreement required', 'Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    setGoogleLoading(true);
    try {
      console.log('[SignUp] starting Google SSO flow');
      const result = await startSSOFlow({ strategy: 'oauth_google' });
      console.log('[SignUp] SSO result:', JSON.stringify({
        createdSessionId: result.createdSessionId,
        hasSetActive: !!result.setActive,
      }));

      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId });
        router.replace('/(tabs)/');
      } else if (result.signUp?.status === 'complete') {
        router.replace('/(tabs)/');
      } else {
        console.warn('[SignUp] SSO flow returned no session:', result);
        Alert.alert('Google sign up', 'Sign up was cancelled or did not complete. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[SignUp] Google SSO error:', msg);
      if (!msg.includes('cancel') && !msg.includes('dismiss')) {
        Alert.alert('Google sign up failed', msg);
      }
    } finally {
      setGoogleLoading(false);
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

  // Email verification step
  if (pendingVerification) {
    return (
      <View style={styles.container}>
        <View style={styles.inner}>
          <View style={styles.logoArea}>
            <Text style={styles.logoText}>Coastal Corridor</Text>
          </View>
          <Text style={styles.heading}>Verify your email</Text>
          <Text style={styles.sub}>We sent a 6-digit code to {email}</Text>
          <TextInput
            style={styles.input}
            placeholder="Verification code"
            placeholderTextColor="#6b7280"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
          />
          <TouchableOpacity style={styles.btn} onPress={handleVerify} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify email</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => setPendingVerification(false)} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.logoArea}>
          <Text style={styles.logoText}>Coastal Corridor</Text>
          <Text style={styles.logoSub}>Create your account</Text>
        </View>

        <Text style={styles.heading}>Get started</Text>

        {/* Google SSO */}
        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignUp} disabled={googleLoading} activeOpacity={0.75}>
          {googleLoading ? (
            <ActivityIndicator color="#f5f0e8" size="small" />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="First name"
            placeholderTextColor="#6b7280"
            value={firstName}
            onChangeText={setFirstName}
            textContentType="givenName"
          />
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="Last name"
            placeholderTextColor="#6b7280"
            value={lastName}
            onChangeText={setLastName}
            textContentType="familyName"
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#6b7280"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 8 characters)"
          placeholderTextColor="#6b7280"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
        />

        {/* Terms agreement */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreedToTerms(v => !v)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
            {agreedToTerms && <Ionicons name="checkmark" size={13} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>
            I agree to the{' '}
            <Text style={styles.checkboxLink} onPress={() => router.push('/(legal)/terms')}>
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text style={styles.checkboxLink} onPress={() => router.push('/(legal)/privacy')}>
              Privacy Policy
            </Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, !agreedToTerms && styles.btnDisabled]}
          onPress={handleSignUp}
          disabled={loading || !agreedToTerms}
          activeOpacity={0.8}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create account</Text>}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.link}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0e12' },
  container: { flex: 1, backgroundColor: '#0a0e12' },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },
  logoArea: { alignItems: 'center', marginBottom: 40 },
  logoText: { color: '#f5f0e8', fontSize: 26, fontWeight: '300', letterSpacing: 1 },
  logoSub: { color: '#d4a24c', fontSize: 12, fontFamily: 'monospace', marginTop: 4, letterSpacing: 2 },
  heading: { color: '#f5f0e8', fontSize: 28, fontWeight: '300', marginBottom: 24 },
  sub: { color: '#9ca3af', fontSize: 14, marginBottom: 24 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#1e2530', borderWidth: 1, borderColor: '#2a3040',
    borderRadius: 8, paddingVertical: 14, marginBottom: 20,
  },
  googleIcon: { color: '#4285F4', fontSize: 17, fontWeight: '700' },
  googleBtnText: { color: '#f5f0e8', fontSize: 15, fontWeight: '500' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2a3040' },
  dividerText: { color: '#6b7280', fontSize: 12 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  input: {
    backgroundColor: '#161b22', borderWidth: 1, borderColor: '#2a3040',
    borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14,
    color: '#f5f0e8', fontSize: 15, marginBottom: 14,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 20, marginTop: 4 },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1.5,
    borderColor: '#2a3040', backgroundColor: '#161b22',
    justifyContent: 'center', alignItems: 'center', marginTop: 1,
  },
  checkboxChecked: { backgroundColor: '#c96a3f', borderColor: '#c96a3f' },
  checkboxLabel: { flex: 1, color: '#9ca3af', fontSize: 13, lineHeight: 20 },
  checkboxLink: { color: '#d4a24c', fontWeight: '500' },
  btn: { backgroundColor: '#c96a3f', borderRadius: 8, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  btnDisabled: { backgroundColor: '#c96a3f60' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  backBtn: { alignItems: 'center', marginTop: 16 },
  backBtnText: { color: '#d4a24c', fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#9ca3af', fontSize: 14 },
  link: { color: '#d4a24c', fontSize: 14, fontWeight: '500' },
});

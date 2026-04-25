import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Step = 'email' | 'code';

export default function ForgotPasswordScreen() {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!isLoaded || !email) return;
    setLoading(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setStep('code');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!isLoaded || !code || !newPassword) return;
    if (newPassword.length < 8) {
      Alert.alert('Password too short', 'Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword,
      });
      if (result.status === 'complete') {
        Alert.alert('Password reset', 'Your password has been updated. Please sign in.', [
          { text: 'Sign in', onPress: () => router.replace('/(auth)/sign-in') },
        ]);
      }
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#f5f0e8" />
          <Text style={styles.backText}>Back to sign in</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>
          {step === 'email' ? 'Reset password' : 'Enter code'}
        </Text>
        <Text style={styles.sub}>
          {step === 'email'
            ? "Enter your email and we'll send a reset code."
            : `We sent a code to ${email}. Enter it below along with your new password.`}
        </Text>

        {step === 'email' ? (
          <>
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
            <TouchableOpacity style={styles.btn} onPress={handleSendCode} disabled={loading || !email}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Send reset code</Text>
              }
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="6-digit code"
              placeholderTextColor="#6b7280"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="New password (min 8 characters)"
              placeholderTextColor="#6b7280"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TouchableOpacity style={styles.btn} onPress={handleReset} disabled={loading || !code || !newPassword}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Reset password</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={styles.resendBtn} onPress={handleSendCode} disabled={loading}>
              <Text style={styles.resendText}>Resend code</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e12' },
  inner: { flex: 1, paddingHorizontal: 28, paddingTop: 60 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 40 },
  backText: { color: '#f5f0e8', fontSize: 14 },
  heading: { color: '#f5f0e8', fontSize: 28, fontWeight: '300', marginBottom: 10 },
  sub: { color: '#9ca3af', fontSize: 14, lineHeight: 22, marginBottom: 28 },
  input: {
    backgroundColor: '#161b22', borderWidth: 1, borderColor: '#2a3040',
    borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14,
    color: '#f5f0e8', fontSize: 15, marginBottom: 14,
  },
  btn: {
    backgroundColor: '#c96a3f', borderRadius: 8, paddingVertical: 15,
    alignItems: 'center', marginTop: 4,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  resendBtn: { alignItems: 'center', marginTop: 16 },
  resendText: { color: '#d4a24c', fontSize: 14 },
});

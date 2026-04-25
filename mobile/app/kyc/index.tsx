import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';

const API_BASE = 'https://coastalcorridor.africa';

const STEPS = ['Personal Info', 'Identity Document', 'Review & Submit'];

interface FormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  nin: string;
  bvn: string;
  idType: 'NIN_SLIP' | 'DRIVERS_LICENCE' | 'INTERNATIONAL_PASSPORT' | 'VOTERS_CARD';
  idNumber: string;
  address: string;
}

const ID_TYPES = [
  { value: 'NIN_SLIP', label: 'NIN Slip' },
  { value: 'DRIVERS_LICENCE', label: "Driver's Licence" },
  { value: 'INTERNATIONAL_PASSPORT', label: 'International Passport' },
  { value: 'VOTERS_CARD', label: "Voter's Card" },
] as const;

export default function KYCScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: 'Nigerian',
    nin: '',
    bvn: '',
    idType: 'NIN_SLIP',
    idNumber: '',
    address: '',
  });

  const set = (key: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const validateStep0 = () => {
    if (!form.firstName.trim()) { Alert.alert('Required', 'Please enter your first name'); return false; }
    if (!form.lastName.trim()) { Alert.alert('Required', 'Please enter your last name'); return false; }
    if (!form.dateOfBirth.trim()) { Alert.alert('Required', 'Please enter your date of birth (DD/MM/YYYY)'); return false; }
    if (!form.address.trim()) { Alert.alert('Required', 'Please enter your residential address'); return false; }
    return true;
  };

  const validateStep1 = () => {
    if (!form.idNumber.trim()) { Alert.alert('Required', 'Please enter your ID number'); return false; }
    if (!form.nin.trim() && !form.bvn.trim()) { Alert.alert('Required', 'Please enter your NIN or BVN'); return false; }
    return true;
  };

  const handleNext = () => {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    if (step < STEPS.length - 1) setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = await getToken();
      const r = await fetch(`${API_BASE}/api/buyer/kyc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (r.ok) {
        Alert.alert(
          'Submitted',
          'Your identity verification has been submitted. We will review your information within 1–2 business days and notify you by email.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        const data = await r.json().catch(() => ({}));
        Alert.alert('Submission failed', data.error ?? 'Please try again or contact support@coastalcorridor.africa');
      }
    } catch {
      Alert.alert('Error', 'Network error — please check your connection and try again');
    }
    setSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step > 0 ? setStep(s => s - 1) : router.back())} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={20} color="#f5f0e8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Identity Verification</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressRow}>
        {STEPS.map((label, i) => (
          <View key={i} style={styles.progressStep}>
            <View style={[styles.progressDot, i <= step ? styles.progressDotActive : styles.progressDotInactive]}>
              {i < step
                ? <Ionicons name="checkmark" size={12} color="#fff" />
                : <Text style={[styles.progressDotText, i === step ? { color: '#fff' } : {}]}>{i + 1}</Text>
              }
            </View>
            <Text style={[styles.progressLabel, i === step ? styles.progressLabelActive : {}]}>{label}</Text>
            {i < STEPS.length - 1 && (
              <View style={[styles.progressLine, i < step ? styles.progressLineActive : {}]} />
            )}
          </View>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── STEP 0: Personal Info ── */}
        {step === 0 && (
          <View>
            <Text style={styles.stepTitle}>Personal Information</Text>
            <Text style={styles.stepSub}>This must match your government-issued ID exactly.</Text>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>First Name</Text>
                <TextInput style={styles.input} value={form.firstName} onChangeText={v => set('firstName', v)} placeholder="As on ID" placeholderTextColor="#4b5563" />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Last Name</Text>
                <TextInput style={styles.input} value={form.lastName} onChangeText={v => set('lastName', v)} placeholder="As on ID" placeholderTextColor="#4b5563" />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Date of Birth</Text>
              <TextInput style={styles.input} value={form.dateOfBirth} onChangeText={v => set('dateOfBirth', v)} placeholder="DD/MM/YYYY" placeholderTextColor="#4b5563" keyboardType="numbers-and-punctuation" />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nationality</Text>
              <TextInput style={styles.input} value={form.nationality} onChangeText={v => set('nationality', v)} placeholder="e.g. Nigerian" placeholderTextColor="#4b5563" />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Residential Address</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={form.address}
                onChangeText={v => set('address', v)}
                placeholder="Full address including city and state"
                placeholderTextColor="#4b5563"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        )}

        {/* ── STEP 1: Identity Document ── */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Identity Document</Text>
            <Text style={styles.stepSub}>Select your ID type and enter the document number.</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>ID Type</Text>
              <View style={styles.idTypeGrid}>
                {ID_TYPES.map(t => (
                  <TouchableOpacity
                    key={t.value}
                    style={[styles.idTypeBtn, form.idType === t.value && styles.idTypeBtnActive]}
                    onPress={() => set('idType', t.value)}
                  >
                    <Text style={[styles.idTypeBtnText, form.idType === t.value && styles.idTypeBtnTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>ID Number</Text>
              <TextInput style={styles.input} value={form.idNumber} onChangeText={v => set('idNumber', v)} placeholder="Enter document number" placeholderTextColor="#4b5563" autoCapitalize="characters" />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>NIN (National Identification Number)</Text>
              <TextInput style={styles.input} value={form.nin} onChangeText={v => set('nin', v)} placeholder="11-digit NIN" placeholderTextColor="#4b5563" keyboardType="number-pad" maxLength={11} />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>BVN (Bank Verification Number)</Text>
              <TextInput style={styles.input} value={form.bvn} onChangeText={v => set('bvn', v)} placeholder="11-digit BVN" placeholderTextColor="#4b5563" keyboardType="number-pad" maxLength={11} />
              <Text style={styles.fieldHint}>At least one of NIN or BVN is required.</Text>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="lock-closed-outline" size={16} color="#8aa876" />
              <Text style={styles.infoText}>Your documents are encrypted and processed in compliance with NDPR and FCCPC regulations. We do not share your identity data with third parties except as required for KYC compliance.</Text>
            </View>
          </View>
        )}

        {/* ── STEP 2: Review ── */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Review & Submit</Text>
            <Text style={styles.stepSub}>Please confirm your details before submitting.</Text>

            <View style={styles.reviewCard}>
              {[
                { label: 'Full Name', value: `${form.firstName} ${form.lastName}` },
                { label: 'Date of Birth', value: form.dateOfBirth },
                { label: 'Nationality', value: form.nationality },
                { label: 'Address', value: form.address },
                { label: 'ID Type', value: ID_TYPES.find(t => t.value === form.idType)?.label ?? form.idType },
                { label: 'ID Number', value: form.idNumber },
                { label: 'NIN', value: form.nin || '—' },
                { label: 'BVN', value: form.bvn || '—' },
              ].map((item, i) => (
                <View key={i} style={[styles.reviewRow, i > 0 && styles.reviewRowBorder]}>
                  <Text style={styles.reviewLabel}>{item.label}</Text>
                  <Text style={styles.reviewValue}>{item.value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.declarationCard}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#d4a24c" />
              <Text style={styles.declarationText}>
                By submitting, I declare that the information provided is accurate and complete. I consent to Coastal Corridor Africa Ltd processing my personal data for identity verification purposes in accordance with the Privacy Policy.
              </Text>
            </View>
          </View>
        )}

        {/* Navigation buttons */}
        <View style={styles.btnRow}>
          {step > 0 && (
            <TouchableOpacity style={styles.backStepBtn} onPress={() => setStep(s => s - 1)}>
              <Text style={styles.backStepText}>Back</Text>
            </TouchableOpacity>
          )}
          {step < STEPS.length - 1 ? (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>Submit Verification</Text>
                </>
              }
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0e12' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e2530' },
  headerTitle: { color: '#f5f0e8', fontSize: 16, fontWeight: '500' },
  progressRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1e2530' },
  progressStep: { flex: 1, alignItems: 'center', position: 'relative' },
  progressDot: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  progressDotActive: { backgroundColor: '#c96a3f' },
  progressDotInactive: { backgroundColor: '#2a3040' },
  progressDotText: { color: '#6b7280', fontSize: 11, fontWeight: '600' },
  progressLabel: { color: '#6b7280', fontSize: 10, textAlign: 'center' },
  progressLabelActive: { color: '#f5f0e8' },
  progressLine: { position: 'absolute', top: 12, right: -'50%' as any, width: '100%', height: 1, backgroundColor: '#2a3040' },
  progressLineActive: { backgroundColor: '#c96a3f' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 24 },
  stepTitle: { color: '#f5f0e8', fontSize: 20, fontWeight: '300', marginBottom: 6 },
  stepSub: { color: '#6b7280', fontSize: 13, marginBottom: 24 },
  row: { flexDirection: 'row', gap: 12 },
  field: { marginBottom: 16 },
  fieldLabel: { color: '#9ca3af', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  fieldHint: { color: '#4b5563', fontSize: 11, marginTop: 4 },
  input: { backgroundColor: '#161b22', borderWidth: 1, borderColor: '#2a3040', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 13, color: '#f5f0e8', fontSize: 14 },
  textarea: { height: 80, textAlignVertical: 'top' },
  idTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  idTypeBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: '#2a3040', backgroundColor: '#161b22' },
  idTypeBtnActive: { borderColor: '#c96a3f', backgroundColor: '#c96a3f20' },
  idTypeBtnText: { color: '#6b7280', fontSize: 13 },
  idTypeBtnTextActive: { color: '#f5f0e8', fontWeight: '500' },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#8aa87612', borderWidth: 1, borderColor: '#8aa87640', borderRadius: 10, padding: 14, marginTop: 8 },
  infoText: { flex: 1, color: '#9ca3af', fontSize: 12, lineHeight: 18 },
  reviewCard: { backgroundColor: '#161b22', borderRadius: 12, borderWidth: 1, borderColor: '#2a3040', marginBottom: 16 },
  reviewRow: { paddingHorizontal: 16, paddingVertical: 12 },
  reviewRowBorder: { borderTopWidth: 1, borderTopColor: '#2a3040' },
  reviewLabel: { color: '#6b7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  reviewValue: { color: '#f5f0e8', fontSize: 14 },
  declarationCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#d4a24c10', borderWidth: 1, borderColor: '#d4a24c30', borderRadius: 10, padding: 14, marginBottom: 24 },
  declarationText: { flex: 1, color: '#9ca3af', fontSize: 12, lineHeight: 18 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  backStepBtn: { flex: 1, borderWidth: 1, borderColor: '#2a3040', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  backStepText: { color: '#9ca3af', fontSize: 14 },
  nextBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#c96a3f', borderRadius: 10, paddingVertical: 14 },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  submitBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#8aa876', borderRadius: 10, paddingVertical: 14 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

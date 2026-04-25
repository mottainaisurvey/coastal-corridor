import { useRouter } from 'expo-router';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e12" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={20} color="#f5f0e8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Last updated: 25 April 2026</Text>

        <Text style={styles.section}>1. Introduction</Text>
        <Text style={styles.body}>Coastal Corridor Africa Ltd ("we", "us", or "our") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and share your data when you use the Coastal Corridor mobile application.</Text>

        <Text style={styles.section}>2. Information We Collect</Text>
        <Text style={styles.body}>We collect the following categories of personal data:{'\n\n'}
          <Text style={styles.bold}>Account data:</Text> Name, email address, phone number, and password (stored encrypted via Clerk authentication).{'\n\n'}
          <Text style={styles.bold}>Identity verification data:</Text> Government-issued ID, date of birth, NIN/BVN, and facial biometric data collected during KYC verification.{'\n\n'}
          <Text style={styles.bold}>Transaction data:</Text> Property inquiries, purchase history, fractional investment records, and escrow transaction references.{'\n\n'}
          <Text style={styles.bold}>Usage data:</Text> App interactions, search queries, properties viewed, and device information (OS version, device model).{'\n\n'}
          <Text style={styles.bold}>Location data:</Text> Approximate location (if permission granted) used to show nearby properties.
        </Text>

        <Text style={styles.section}>3. How We Use Your Information</Text>
        <Text style={styles.body}>We use your personal data to:{'\n'}
          • Provide and improve the App and its features{'\n'}
          • Process property inquiries and transactions{'\n'}
          • Verify your identity for KYC compliance{'\n'}
          • Facilitate escrow and fractional investment services{'\n'}
          • Send transactional notifications and service updates{'\n'}
          • Comply with legal and regulatory obligations{'\n'}
          • Prevent fraud and ensure platform security
        </Text>

        <Text style={styles.section}>4. Data Sharing</Text>
        <Text style={styles.body}>We do not sell your personal data. We may share your data with:{'\n\n'}
          <Text style={styles.bold}>Property agents and developers:</Text> Only the information necessary to process your inquiry or transaction.{'\n\n'}
          <Text style={styles.bold}>Escrow providers:</Text> Transaction details required to hold and release funds securely.{'\n\n'}
          <Text style={styles.bold}>KYC/AML service providers:</Text> Identity documents for regulatory compliance verification.{'\n\n'}
          <Text style={styles.bold}>Legal authorities:</Text> Where required by Nigerian law or court order.{'\n\n'}
          <Text style={styles.bold}>Technology partners:</Text> Clerk (authentication), Expo (app infrastructure), and cloud hosting providers, all under strict data processing agreements.
        </Text>

        <Text style={styles.section}>5. Data Retention</Text>
        <Text style={styles.body}>We retain your personal data for as long as your account is active or as required by law. KYC documents are retained for a minimum of 7 years in compliance with Nigerian anti-money laundering regulations. You may request deletion of your account and associated data by contacting privacy@coastalcorridor.africa.</Text>

        <Text style={styles.section}>6. Your Rights</Text>
        <Text style={styles.body}>Under applicable data protection law, you have the right to:{'\n'}
          • Access the personal data we hold about you{'\n'}
          • Correct inaccurate or incomplete data{'\n'}
          • Request deletion of your data (subject to legal retention requirements){'\n'}
          • Object to or restrict certain processing{'\n'}
          • Data portability (receive your data in a structured format){'\n\n'}
          To exercise these rights, contact privacy@coastalcorridor.africa.
        </Text>

        <Text style={styles.section}>7. Security</Text>
        <Text style={styles.body}>We implement industry-standard security measures including encryption in transit (TLS 1.3), encrypted storage, access controls, and regular security audits. However, no system is completely secure and we cannot guarantee absolute security.</Text>

        <Text style={styles.section}>8. Children's Privacy</Text>
        <Text style={styles.body}>The App is not directed at children under 18. We do not knowingly collect personal data from minors. If you believe a minor has provided us with personal data, please contact us immediately.</Text>

        <Text style={styles.section}>9. International Transfers</Text>
        <Text style={styles.body}>Your data may be processed in countries outside Nigeria, including the United Kingdom and United States, where our technology partners operate. All international transfers are subject to appropriate safeguards.</Text>

        <Text style={styles.section}>10. Changes to This Policy</Text>
        <Text style={styles.body}>We may update this Privacy Policy from time to time. We will notify you of significant changes via the App. Continued use after changes constitutes acceptance of the updated policy.</Text>

        <Text style={styles.section}>11. Contact</Text>
        <Text style={styles.body}>For privacy-related queries, contact our Data Protection Officer at privacy@coastalcorridor.africa or write to: Coastal Corridor Africa Ltd, Victoria Island, Lagos, Nigeria.</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0e12' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1e2530',
  },
  backBtn: { width: 32, alignItems: 'flex-start' },
  headerTitle: { color: '#f5f0e8', fontSize: 16, fontWeight: '500' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  updated: { color: '#6b7280', fontSize: 11, fontFamily: 'monospace', marginBottom: 24 },
  section: { color: '#d4a24c', fontSize: 13, fontWeight: '600', marginTop: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  body: { color: '#9ca3af', fontSize: 14, lineHeight: 22 },
  bold: { color: '#f5f0e8', fontWeight: '600' },
});

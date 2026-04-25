import { useRouter } from 'expo-router';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function TermsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e12" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={20} color="#f5f0e8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Last updated: 25 April 2026</Text>

        <Text style={styles.section}>1. Acceptance of Terms</Text>
        <Text style={styles.body}>By accessing or using the Coastal Corridor mobile application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App. These Terms constitute a legally binding agreement between you and Coastal Corridor Africa Ltd ("Company", "we", "us", or "our").</Text>

        <Text style={styles.section}>2. Description of Service</Text>
        <Text style={styles.body}>Coastal Corridor is a premium land and property marketplace operating along Nigeria's 700km Atlantic coastline from Lagos to Calabar. The App provides property listings, destination information, fractional ownership opportunities, and related services to buyers, investors, and diaspora clients.</Text>

        <Text style={styles.section}>3. Eligibility</Text>
        <Text style={styles.body}>You must be at least 18 years of age to use the App. By using the App, you represent and warrant that you meet this requirement and have the legal capacity to enter into a binding contract.</Text>

        <Text style={styles.section}>4. Property Listings & Information</Text>
        <Text style={styles.body}>All property listings on the App are provided for informational purposes only. While we endeavour to ensure accuracy, Coastal Corridor does not guarantee the completeness, accuracy, or availability of any listing. Property prices, availability, and details are subject to change without notice. All transactions are subject to independent legal due diligence.</Text>

        <Text style={styles.section}>5. Title Verification</Text>
        <Text style={styles.body}>Coastal Corridor conducts title verification through Lagos State LandWeb and other relevant state registries. However, we strongly recommend that all buyers engage independent legal counsel before completing any property transaction. Our verification is a preliminary check and does not constitute legal advice or a guarantee of title.</Text>

        <Text style={styles.section}>6. Escrow Services</Text>
        <Text style={styles.body}>All property transactions facilitated through the App are processed through a regulated escrow account held by a licensed escrow provider. Funds are only released to sellers upon completion of all agreed conditions and confirmation of title transfer. Coastal Corridor does not hold client funds directly.</Text>

        <Text style={styles.section}>7. Fractional Ownership</Text>
        <Text style={styles.body}>Fractional ownership opportunities presented on the App are investment products subject to regulatory oversight. Minimum investment is ₦500,000. Past performance is not indicative of future returns. All fractional investments carry risk, including the risk of loss of principal. You should seek independent financial advice before investing.</Text>

        <Text style={styles.section}>8. User Accounts</Text>
        <Text style={styles.body}>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorised use of your account. We reserve the right to suspend or terminate accounts that violate these Terms.</Text>

        <Text style={styles.section}>9. Identity Verification (KYC)</Text>
        <Text style={styles.body}>To complete property transactions or access fractional investment features, you must complete our Know Your Customer (KYC) identity verification process. This includes providing government-issued identification and may include biometric verification. Your data is processed in accordance with our Privacy Policy.</Text>

        <Text style={styles.section}>10. Prohibited Conduct</Text>
        <Text style={styles.body}>You agree not to: (a) use the App for any unlawful purpose; (b) submit false or misleading information; (c) attempt to circumvent security measures; (d) engage in money laundering or other financial crimes; (e) harass or harm other users or agents.</Text>

        <Text style={styles.section}>11. Limitation of Liability</Text>
        <Text style={styles.body}>To the fullest extent permitted by law, Coastal Corridor shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App or any property transaction. Our total liability shall not exceed the fees paid by you to us in the preceding 12 months.</Text>

        <Text style={styles.section}>12. Governing Law</Text>
        <Text style={styles.body}>These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be subject to the exclusive jurisdiction of the courts of Lagos State, Nigeria.</Text>

        <Text style={styles.section}>13. Changes to Terms</Text>
        <Text style={styles.body}>We reserve the right to modify these Terms at any time. We will notify you of material changes via the App or email. Continued use of the App after changes constitutes acceptance of the revised Terms.</Text>

        <Text style={styles.section}>14. Contact</Text>
        <Text style={styles.body}>For questions about these Terms, please contact us at legal@coastalcorridor.africa or write to: Coastal Corridor Africa Ltd, Victoria Island, Lagos, Nigeria.</Text>

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
});

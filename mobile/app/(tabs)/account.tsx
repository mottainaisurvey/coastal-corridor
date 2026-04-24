import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = 'https://coastalcorridor.africa';

interface Summary {
  savedCount: number;
  inquiryCount: number;
  transactionCount: number;
  kycStatus: string;
}

const KYC_CONFIG: Record<string, { label: string; color: string }> = {
  APPROVED: { label: 'Verified', color: '#8aa876' },
  PENDING: { label: 'Pending Review', color: '#d4a24c' },
  REVIEW: { label: 'Under Review', color: '#d4a24c' },
  REJECTED: { label: 'Rejected', color: '#c96a3f' },
  NOT_STARTED: { label: 'Not Started', color: '#6b7280' },
};

export default function AccountScreen() {
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        const r = await fetch(`${API_BASE}/api/buyer/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) setSummary(await r.json());
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const kyc = KYC_CONFIG[summary?.kycStatus ?? 'NOT_STARTED'];

  const menuItems = [
    { icon: 'bookmark-outline', label: 'Saved Properties', sub: `${summary?.savedCount ?? 0} saved`, route: null },
    { icon: 'chatbubble-outline', label: 'My Inquiries', sub: `${summary?.inquiryCount ?? 0} inquiries`, route: null },
    { icon: 'receipt-outline', label: 'Transactions', sub: `${summary?.transactionCount ?? 0} transactions`, route: null },
    { icon: 'document-text-outline', label: 'Documents', sub: 'Upload and manage files', route: null },
    { icon: 'pie-chart-outline', label: 'My Portfolio', sub: 'Fractional holdings', route: null },
    { icon: 'shield-checkmark-outline', label: 'Identity Verification', sub: kyc.label, route: null },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.emailAddresses?.[0]?.emailAddress ?? 'Account'}
          </Text>
          <Text style={styles.profileEmail}>{user?.emailAddresses?.[0]?.emailAddress}</Text>
        </View>
      </View>

      {/* KYC status banner */}
      {summary && (
        <View style={[styles.kycBanner, { borderColor: kyc.color + '40' }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color={kyc.color} />
          <Text style={[styles.kycText, { color: kyc.color }]}>Identity: {kyc.label}</Text>
        </View>
      )}

      {/* Stats */}
      {loading
        ? <ActivityIndicator color="#d4a24c" style={{ marginVertical: 24 }} />
        : (
          <View style={styles.statsRow}>
            {[
              { label: 'Saved', value: summary?.savedCount ?? 0 },
              { label: 'Inquiries', value: summary?.inquiryCount ?? 0 },
              { label: 'Transactions', value: summary?.transactionCount ?? 0 },
            ].map(s => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )
      }

      {/* Menu */}
      <View style={styles.menu}>
        {menuItems.map((item, i) => (
          <TouchableOpacity key={i} style={[styles.menuRow, i < menuItems.length - 1 && styles.menuRowBorder]}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color="#d4a24c" />
              </View>
              <View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#6b7280" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={18} color="#c96a3f" />
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Coastal Corridor v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e12' },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', paddingTop: 28, paddingBottom: 20 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#c96a3f', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '500' },
  profileInfo: { flex: 1 },
  profileName: { color: '#f5f0e8', fontSize: 18, fontWeight: '400' },
  profileEmail: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  kycBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16 },
  kycText: { fontSize: 13, fontWeight: '500' },
  statsRow: { flexDirection: 'row', backgroundColor: '#161b22', borderRadius: 12, borderWidth: 1, borderColor: '#2a3040', marginBottom: 20 },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statValue: { color: '#d4a24c', fontSize: 22, fontWeight: '300' },
  statLabel: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  menu: { backgroundColor: '#161b22', borderRadius: 12, borderWidth: 1, borderColor: '#2a3040', marginBottom: 16 },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: '#2a3040' },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#d4a24c15', justifyContent: 'center', alignItems: 'center' },
  menuLabel: { color: '#f5f0e8', fontSize: 14, fontWeight: '400' },
  menuSub: { color: '#6b7280', fontSize: 11, marginTop: 1 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: '#c96a3f15', borderRadius: 10, borderWidth: 1, borderColor: '#c96a3f30', marginBottom: 20 },
  signOutText: { color: '#c96a3f', fontSize: 14, fontWeight: '500' },
  version: { color: '#374151', fontSize: 11, textAlign: 'center', fontFamily: 'monospace' },
});

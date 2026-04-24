import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

const API_BASE = 'https://coastalcorridor.africa';

interface Scheme {
  id: string;
  name: string;
  destination: string;
  totalShares: number;
  availableShares: number;
  pricePerShareKobo: number;
  projectedYieldPct: number;
  lockupMonths: number;
  status: string;
}

function formatKobo(kobo: number): string {
  const naira = kobo / 100;
  if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(2)}M`;
  return `₦${naira.toLocaleString()}`;
}

export default function FractionalScreen() {
  const { getToken } = useAuth();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const load = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/fractional/schemes`);
      const data = await r.json();
      setSchemes(data.data ?? []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const handlePurchase = async (scheme: Scheme) => {
    Alert.alert(
      'Purchase shares',
      `Buy 1 share in ${scheme.name} for ${formatKobo(scheme.pricePerShareKobo)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setPurchasing(scheme.id);
            try {
              const token = await getToken();
              const r = await fetch(`${API_BASE}/api/fractional/purchase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ schemeId: scheme.id, quantity: 1 }),
              });
              const data = await r.json();
              if (r.ok) {
                Alert.alert('Success', `Purchase confirmed. Reference: ${data.reference}`);
                load();
              } else {
                Alert.alert('Failed', data.error ?? 'Purchase failed');
              }
            } catch {
              Alert.alert('Error', 'Network error — please try again');
            }
            setPurchasing(null);
          },
        },
      ]
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#d4a24c" size="large" /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#d4a24c" />}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Fractional Ownership</Text>
        <Text style={styles.title}>Own a share of the corridor</Text>
        <Text style={styles.sub}>Invest from as little as ₦500,000 in curated coastal real estate schemes</Text>
      </View>

      {schemes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No active schemes at this time</Text>
          <Text style={styles.emptySub}>Check back soon — new schemes are added regularly</Text>
        </View>
      ) : (
        schemes.map(scheme => {
          const soldPct = Math.round(((scheme.totalShares - scheme.availableShares) / scheme.totalShares) * 100);
          const isSoldOut = scheme.availableShares === 0;
          return (
            <View key={scheme.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.statusPill, { backgroundColor: isSoldOut ? '#6b728022' : '#8aa87622' }]}>
                  <Text style={[styles.statusText, { color: isSoldOut ? '#6b7280' : '#8aa876' }]}>
                    {isSoldOut ? 'SOLD OUT' : 'OPEN'}
                  </Text>
                </View>
                <Text style={styles.yield}>{scheme.projectedYieldPct}% p.a.</Text>
              </View>

              <Text style={styles.schemeName}>{scheme.name}</Text>
              <Text style={styles.destination}>{scheme.destination}</Text>

              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${soldPct}%` }]} />
              </View>
              <Text style={styles.progressLabel}>{soldPct}% subscribed · {scheme.availableShares.toLocaleString()} shares remaining</Text>

              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{formatKobo(scheme.pricePerShareKobo)}</Text>
                  <Text style={styles.metricLabel}>per share</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{scheme.lockupMonths}mo</Text>
                  <Text style={styles.metricLabel}>lock-up</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{scheme.totalShares.toLocaleString()}</Text>
                  <Text style={styles.metricLabel}>total shares</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.btn, isSoldOut && styles.btnDisabled]}
                onPress={() => !isSoldOut && handlePurchase(scheme)}
                disabled={isSoldOut || purchasing === scheme.id}
              >
                {purchasing === scheme.id
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.btnText}>{isSoldOut ? 'Sold out' : 'Purchase shares'}</Text>
                }
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e12' },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0e12' },
  header: { paddingTop: 28, paddingBottom: 20 },
  eyebrow: { color: '#d4a24c', fontSize: 11, fontFamily: 'monospace', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  title: { color: '#f5f0e8', fontSize: 26, fontWeight: '300', marginBottom: 8 },
  sub: { color: '#9ca3af', fontSize: 13, lineHeight: 19 },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { color: '#f5f0e8', fontSize: 16, fontWeight: '300' },
  emptySub: { color: '#6b7280', fontSize: 13, marginTop: 8, textAlign: 'center' },
  card: { backgroundColor: '#161b22', borderWidth: 1, borderColor: '#2a3040', borderRadius: 12, padding: 18, marginBottom: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusPill: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  yield: { color: '#8aa876', fontSize: 15, fontWeight: '600' },
  schemeName: { color: '#f5f0e8', fontSize: 18, fontWeight: '400', marginBottom: 4 },
  destination: { color: '#9ca3af', fontSize: 12, marginBottom: 14 },
  progressBar: { height: 4, backgroundColor: '#2a3040', borderRadius: 2, marginBottom: 6, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: '#d4a24c', borderRadius: 2 },
  progressLabel: { color: '#6b7280', fontSize: 11, fontFamily: 'monospace', marginBottom: 14 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  metric: { alignItems: 'center' },
  metricValue: { color: '#f5f0e8', fontSize: 15, fontWeight: '500' },
  metricLabel: { color: '#6b7280', fontSize: 10, marginTop: 2 },
  btn: { backgroundColor: '#c96a3f', borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#2a3040' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

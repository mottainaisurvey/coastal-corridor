import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, ActivityIndicator, FlatList
} from 'react-native';
import { useRouter } from 'expo-router';

const API_BASE = 'https://coastalcorridor.africa';

interface Destination {
  id: string;
  name: string;
  state: string;
  type: string;
  corridorKm: number;
  slug: string;
}

const TYPE_COLORS: Record<string, string> = {
  INFRASTRUCTURE: '#4db3b3',
  MIXED_USE: '#d4a24c',
  REAL_ESTATE: '#c96a3f',
  TOURISM: '#8aa876',
};

const TYPE_LABELS: Record<string, string> = {
  INFRASTRUCTURE: 'Infrastructure',
  MIXED_USE: 'Mixed Use',
  REAL_ESTATE: 'Real Estate',
  TOURISM: 'Tourism',
};

export default function ExploreScreen() {
  const router = useRouter();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ properties: unknown[]; destinations: unknown[] } | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/destinations`)
      .then(r => r.json())
      .then(data => setDestinations(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (query.length < 2) { setSearchResults(null); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}&limit=5`);
        const data = await r.json();
        setSearchResults(data);
      } catch {}
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>700 km · Lagos to Calabar</Text>
        <Text style={styles.heroTitle}>The Coastal Corridor</Text>
        <Text style={styles.heroSub}>Nigeria&apos;s most important real estate opportunity</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search properties, destinations, agents…"
          placeholderTextColor="#6b7280"
          value={query}
          onChangeText={setQuery}
        />
        {searching && <ActivityIndicator style={styles.searchSpinner} color="#d4a24c" size="small" />}
      </View>

      {/* Search results */}
      {searchResults && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search results</Text>
          {(searchResults.properties as Array<{ id: string; title: string; slug: string }>).map((p) => (
            <TouchableOpacity key={p.id} style={styles.resultRow} onPress={() => router.push(`/property/${p.slug}`)}>
              <Text style={styles.resultText}>{p.title}</Text>
            </TouchableOpacity>
          ))}
          {(searchResults.destinations as Array<{ id: string; name: string; slug: string }>).map((d) => (
            <TouchableOpacity key={d.id} style={styles.resultRow}>
              <Text style={styles.resultText}>{d.name}</Text>
              <Text style={styles.resultSub}>Destination</Text>
            </TouchableOpacity>
          ))}
          {(searchResults.properties as unknown[]).length === 0 && (searchResults.destinations as unknown[]).length === 0 && (
            <Text style={styles.emptyText}>No results found</Text>
          )}
        </View>
      )}

      {/* Destinations */}
      {!searchResults && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Corridor destinations</Text>
          {loading
            ? <ActivityIndicator color="#d4a24c" style={{ marginTop: 20 }} />
            : destinations.map((d) => (
              <View key={d.id} style={styles.destCard}>
                <View style={[styles.destTypePill, { backgroundColor: TYPE_COLORS[d.type] + '22' }]}>
                  <Text style={[styles.destTypeText, { color: TYPE_COLORS[d.type] }]}>
                    {TYPE_LABELS[d.type] ?? d.type}
                  </Text>
                </View>
                <Text style={styles.destName}>{d.name}</Text>
                <Text style={styles.destMeta}>{d.state} · KM {d.corridorKm}</Text>
              </View>
            ))
          }
        </View>
      )}

      {/* Stats strip */}
      <View style={styles.statsRow}>
        {[
          { label: 'Destinations', value: '12' },
          { label: 'Corridor km', value: '700' },
          { label: 'States', value: '6' },
        ].map(s => (
          <View key={s.label} style={styles.statItem}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e12' },
  content: { paddingBottom: 40 },
  hero: { backgroundColor: '#161b22', padding: 24, paddingTop: 32 },
  heroEyebrow: { color: '#d4a24c', fontSize: 11, fontFamily: 'monospace', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  heroTitle: { color: '#f5f0e8', fontSize: 32, fontWeight: '300', letterSpacing: 0.5, marginBottom: 6 },
  heroSub: { color: '#9ca3af', fontSize: 14, lineHeight: 20 },
  searchWrap: { margin: 16, position: 'relative' },
  searchInput: {
    backgroundColor: '#161b22', borderWidth: 1, borderColor: '#2a3040',
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13,
    color: '#f5f0e8', fontSize: 14
  },
  searchSpinner: { position: 'absolute', right: 14, top: 14 },
  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { color: '#f5f0e8', fontSize: 16, fontWeight: '500', marginBottom: 12 },
  destCard: {
    backgroundColor: '#161b22', borderWidth: 1, borderColor: '#2a3040',
    borderRadius: 10, padding: 16, marginBottom: 10
  },
  destTypePill: { alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  destTypeText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  destName: { color: '#f5f0e8', fontSize: 16, fontWeight: '400', marginBottom: 4 },
  destMeta: { color: '#6b7280', fontSize: 12, fontFamily: 'monospace' },
  resultRow: { backgroundColor: '#161b22', borderRadius: 8, padding: 14, marginBottom: 8 },
  resultText: { color: '#f5f0e8', fontSize: 14 },
  resultSub: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  emptyText: { color: '#6b7280', fontSize: 14, textAlign: 'center', marginTop: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#161b22', marginTop: 24, paddingVertical: 20 },
  statItem: { alignItems: 'center' },
  statValue: { color: '#d4a24c', fontSize: 24, fontWeight: '300' },
  statLabel: { color: '#6b7280', fontSize: 11, marginTop: 2 },
});

import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = 'https://coastalcorridor.africa';

interface Destination {
  id: string;
  name: string;
  state: string;
  type: string;
  corridorKm: number;
  slug: string;
}

interface SearchProperty {
  id: string;
  title: string;
  slug: string;
}

interface SearchDestination {
  id: string;
  name: string;
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
  const [searchResults, setSearchResults] = useState<{
    properties: SearchProperty[];
    destinations: SearchDestination[];
  } | null>(null);
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
        const json = await r.json();
        // API returns { data: { properties, destinations, agents, total }, pagination }
        const inner = json.data ?? json;
        setSearchResults({
          properties: inner.properties ?? [],
          destinations: inner.destinations ?? [],
        });
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
        <Ionicons name="search-outline" size={16} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search properties, destinations, agents…"
          placeholderTextColor="#6b7280"
          value={query}
          onChangeText={setQuery}
        />
        {searching && <ActivityIndicator style={styles.searchSpinner} color="#d4a24c" size="small" />}
        {query.length > 0 && !searching && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={16} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search results */}
      {searchResults && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search results</Text>
          {searchResults.properties.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.resultRow}
              onPress={() => router.push({ pathname: '/property/[slug]', params: { slug: p.slug } })}
              activeOpacity={0.7}
            >
              <Ionicons name="home-outline" size={14} color="#d4a24c" style={{ marginRight: 8 }} />
              <Text style={styles.resultText}>{p.title}</Text>
              <Ionicons name="chevron-forward" size={14} color="#6b7280" />
            </TouchableOpacity>
          ))}
          {searchResults.destinations.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={styles.resultRow}
              onPress={() => router.push(`/(tabs)/properties?destination=${d.slug}`)}
              activeOpacity={0.7}
            >
              <Ionicons name="location-outline" size={14} color="#4db3b3" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.resultText}>{d.name}</Text>
                <Text style={styles.resultSub}>Destination</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#6b7280" />
            </TouchableOpacity>
          ))}
          {searchResults.properties.length === 0 && searchResults.destinations.length === 0 && (
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
              <TouchableOpacity
                key={d.id}
                style={styles.destCard}
                onPress={() => router.push(`/(tabs)/properties?destination=${d.slug}`)}
                activeOpacity={0.75}
              >
                <View style={styles.destCardInner}>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.destTypePill, { backgroundColor: (TYPE_COLORS[d.type] ?? '#6b7280') + '22' }]}>
                      <Text style={[styles.destTypeText, { color: TYPE_COLORS[d.type] ?? '#6b7280' }]}>
                        {TYPE_LABELS[d.type] ?? d.type}
                      </Text>
                    </View>
                    <Text style={styles.destName}>{d.name}</Text>
                    <Text style={styles.destMeta}>{d.state} · KM {d.corridorKm}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#6b7280" />
                </View>
              </TouchableOpacity>
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
  searchWrap: {
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#2a3040',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 13,
    color: '#f5f0e8',
    fontSize: 14,
  },
  searchSpinner: { marginLeft: 8 },
  clearBtn: { padding: 4 },
  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { color: '#f5f0e8', fontSize: 16, fontWeight: '500', marginBottom: 12 },
  destCard: {
    backgroundColor: '#161b22', borderWidth: 1, borderColor: '#2a3040',
    borderRadius: 10, padding: 16, marginBottom: 10,
  },
  destCardInner: { flexDirection: 'row', alignItems: 'center' },
  destTypePill: { alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  destTypeText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  destName: { color: '#f5f0e8', fontSize: 16, fontWeight: '400', marginBottom: 4 },
  destMeta: { color: '#6b7280', fontSize: 12, fontFamily: 'monospace' },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161b22',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  resultText: { flex: 1, color: '#f5f0e8', fontSize: 14 },
  resultSub: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  emptyText: { color: '#6b7280', fontSize: 14, textAlign: 'center', marginTop: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#161b22', marginTop: 24, paddingVertical: 20 },
  statItem: { alignItems: 'center' },
  statValue: { color: '#d4a24c', fontSize: 24, fontWeight: '300' },
  statLabel: { color: '#6b7280', fontSize: 11, marginTop: 2 },
});

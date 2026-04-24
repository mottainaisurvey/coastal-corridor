import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';

const API_BASE = 'https://coastalcorridor.africa';

interface Property {
  id: string;
  title: string;
  slug: string;
  type: string;
  destination: string;
  priceKobo: number;
  areaSqm: number;
  plotId: string;
  status: string;
}

function formatKobo(kobo: number): string {
  const naira = kobo / 100;
  if (naira >= 1_000_000_000) return `₦${(naira / 1_000_000_000).toFixed(1)}B`;
  if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(1)}M`;
  return `₦${naira.toLocaleString()}`;
}

const TYPE_LABELS: Record<string, string> = {
  LAND_ONLY: 'Land',
  RESIDENTIAL: 'Residential',
  COMMERCIAL: 'Commercial',
  MIXED_USE: 'Mixed Use',
  HOSPITALITY: 'Hospitality',
  INDUSTRIAL: 'Industrial',
};

export default function PropertiesScreen() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = async (reset = false) => {
    const p = reset ? 1 : page;
    try {
      const r = await fetch(`${API_BASE}/api/properties?page=${p}&limit=20`);
      const data = await r.json();
      const items: Property[] = (data.data ?? []).map((item: {
        id: string; title: string; slug: string; type: string;
        destination?: { name: string }; listing?: { askingPriceKobo: number };
        plot?: { areaSqm: number; plotNumber: string }; status: string;
      }) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        type: item.type,
        destination: item.destination?.name ?? '',
        priceKobo: item.listing?.askingPriceKobo ?? 0,
        areaSqm: item.plot?.areaSqm ?? 0,
        plotId: item.plot?.plotNumber ?? '',
        status: item.status,
      }));
      if (reset) {
        setProperties(items);
        setPage(2);
      } else {
        setProperties(prev => [...prev, ...items]);
        setPage(p + 1);
      }
      setHasMore(items.length === 20);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(true); }, []);

  const renderItem = ({ item }: { item: Property }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/property/${item.slug}`)}>
      <View style={styles.cardHeader}>
        <View style={styles.typePill}>
          <Text style={styles.typeText}>{TYPE_LABELS[item.type] ?? item.type}</Text>
        </View>
        <Text style={styles.plotId}>{item.plotId}</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.destination}>{item.destination}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.price}>{formatKobo(item.priceKobo)}</Text>
        <Text style={styles.area}>{item.areaSqm.toLocaleString()} sqm</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#d4a24c" size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={properties}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      onEndReached={() => { if (hasMore) load(); }}
      onEndReachedThreshold={0.3}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(true); }}
          tintColor="#d4a24c"
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Properties</Text>
          <Text style={styles.headerSub}>{properties.length} listings along the corridor</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>No properties found</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e12' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0e12', paddingTop: 60 },
  header: { paddingTop: 24, paddingBottom: 16 },
  headerTitle: { color: '#f5f0e8', fontSize: 26, fontWeight: '300' },
  headerSub: { color: '#6b7280', fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: '#161b22', borderWidth: 1, borderColor: '#2a3040',
    borderRadius: 12, padding: 16, marginBottom: 12
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typePill: { backgroundColor: '#c96a3f22', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  typeText: { color: '#c96a3f', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  plotId: { color: '#6b7280', fontSize: 11, fontFamily: 'monospace' },
  title: { color: '#f5f0e8', fontSize: 16, fontWeight: '400', lineHeight: 22, marginBottom: 4 },
  destination: { color: '#9ca3af', fontSize: 12, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { color: '#d4a24c', fontSize: 18, fontWeight: '500' },
  area: { color: '#6b7280', fontSize: 12, fontFamily: 'monospace' },
  emptyText: { color: '#6b7280', fontSize: 14 },
});

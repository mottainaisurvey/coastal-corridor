import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = 'https://coastalcorridor.africa';

// Flat API shape (matches /api/properties list items)
interface Property {
  id: string;
  title: string;
  slug: string;
  type: string;
  destinationId: string;
  destinationName: string;
  state: string;
  priceKobo: number;
  areaSqm: number;
  plotId: string;
  listingStatus: string;
  featured: boolean;
}

function formatKobo(kobo: number): string {
  if (!kobo) return '₦0';
  const naira = kobo / 100;
  if (naira >= 1_000_000_000) return `₦${(naira / 1_000_000_000).toFixed(1)}B`;
  if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(1)}M`;
  return `₦${naira.toLocaleString()}`;
}

const TYPE_LABELS: Record<string, string> = {
  LAND: 'Land',
  APARTMENT: 'Apartment',
  HOUSE: 'House',
  COMMERCIAL: 'Commercial',
  MIXED_USE: 'Mixed Use',
  HOSPITALITY: 'Hospitality',
  INDUSTRIAL: 'Industrial',
  LAND_ONLY: 'Land',
  RESIDENTIAL: 'Residential',
};

const TYPE_COLORS: Record<string, string> = {
  LAND: '#d4a24c',
  APARTMENT: '#4db3b3',
  HOUSE: '#8aa876',
  COMMERCIAL: '#c96a3f',
  MIXED_USE: '#a78bfa',
  HOSPITALITY: '#f59e0b',
  INDUSTRIAL: '#6b7280',
  LAND_ONLY: '#d4a24c',
  RESIDENTIAL: '#8aa876',
};

export default function PropertiesScreen() {
  const router = useRouter();
  // destinationId and destinationName are passed as params when navigating from a destination tap
  const { destinationId, destinationName } = useLocalSearchParams<{
    destinationId?: string;
    destinationName?: string;
  }>();
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      // Fetch all properties — the backend does not support destination filtering,
      // so we fetch everything and filter client-side.
      const r = await fetch(`${API_BASE}/api/properties?page=1&limit=100`);
      const data = await r.json();
      const items: Property[] = (data.data ?? []).map((item: Record<string, unknown>) => ({
        id: item.id as string,
        title: item.title as string,
        slug: item.slug as string,
        type: item.type as string,
        destinationId: (item.destinationId as string) ?? '',
        destinationName: (item.destinationName as string) ?? '',
        state: (item.state as string) ?? '',
        priceKobo: (item.priceKobo as number) ?? 0,
        areaSqm: (item.areaSqm as number) ?? 0,
        plotId: (item.plotId as string) ?? '',
        listingStatus: (item.listingStatus as string) ?? '',
        featured: (item.featured as boolean) ?? false,
      }));
      setAllProperties(items);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, []);

  // Client-side filter: if a destinationId param is present, show only matching properties
  const properties = destinationId
    ? allProperties.filter(p => p.destinationId === destinationId)
    : allProperties;

  const renderItem = ({ item }: { item: Property }) => {
    const typeColor = TYPE_COLORS[item.type] ?? '#6b7280';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push({ pathname: '/property/[slug]', params: { slug: item.slug } })}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.typePill, { backgroundColor: typeColor + '22' }]}>
            <Text style={[styles.typeText, { color: typeColor }]}>
              {TYPE_LABELS[item.type] ?? item.type}
            </Text>
          </View>
          {item.featured && (
            <View style={styles.featuredPill}>
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
        </View>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.destination}>
          {item.destinationName}{item.state ? `, ${item.state}` : ''}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.price}>{formatKobo(item.priceKobo)}</Text>
          <Text style={styles.area}>
            {item.areaSqm ? `${item.areaSqm.toLocaleString()} sqm` : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#d4a24c" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.list}
        data={properties}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor="#d4a24c"
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Back button — only shown when filtering by destination */}
            {destinationId ? (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => router.back()}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={20} color="#d4a24c" />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            ) : null}
            <Text style={styles.headerTitle}>Properties</Text>
            <Text style={styles.headerSub}>
              {destinationName
                ? `Listings in ${destinationName}`
                : `${allProperties.length} listings along the corridor`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              {destinationId
                ? `No properties found in ${destinationName ?? 'this destination'}`
                : 'No properties found'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0a0e12' },
  container: { flex: 1, backgroundColor: '#0a0e12' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0e12', paddingTop: 60 },
  header: { paddingTop: 16, paddingBottom: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backText: { color: '#d4a24c', fontSize: 14, fontWeight: '500' },
  headerTitle: { color: '#f5f0e8', fontSize: 26, fontWeight: '300' },
  headerSub: { color: '#6b7280', fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: '#161b22', borderWidth: 1, borderColor: '#2a3040',
    borderRadius: 12, padding: 16, marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  typePill: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  typeText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  featuredPill: { backgroundColor: '#d4a24c22', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  featuredText: { color: '#d4a24c', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { color: '#f5f0e8', fontSize: 16, fontWeight: '400', lineHeight: 22, marginBottom: 4 },
  destination: { color: '#9ca3af', fontSize: 12, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { color: '#d4a24c', fontSize: 18, fontWeight: '500' },
  area: { color: '#6b7280', fontSize: 12, fontFamily: 'monospace' },
  emptyText: { color: '#6b7280', fontSize: 14 },
});

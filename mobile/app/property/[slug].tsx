import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, Alert,
  KeyboardAvoidingView, Platform, Linking, Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';

const API_BASE = 'https://coastalcorridor.africa';

interface RiskScores {
  floodRisk?: number;
  erosionRisk?: number;
  disputeRisk?: number;
  accessibilityScore?: number;
}

interface PropertyDetail {
  id: string;
  title: string;
  slug: string;
  type: string;
  description: string;
  destination: { name: string; state: string };
  plot: {
    plotNumber: string;
    areaSqm: number;
    titleStatus: string;
    titleType?: string;
    titleDocumentUrl?: string;
    floodRisk?: number;
    erosionRisk?: number;
    disputeRisk?: number;
    accessibilityScore?: number;
  };
  listing: { id: string; askingPriceKobo: number; currency: string; isNegotiable: boolean };
  agent?: {
    profile?: { firstName: string; lastName: string };
    agentProfile?: { licenceNumber: string; verified?: boolean };
  };
  amenities: string[];
  bedrooms?: number;
  bathrooms?: number;
  virtualTourUrl?: string;
  floorPlanUrl?: string;
}

function formatKobo(kobo: number, currency = 'NGN'): string {
  const naira = kobo / 100;
  if (currency === 'NGN') {
    if (naira >= 1_000_000_000) return `₦${(naira / 1_000_000_000).toFixed(2)}B`;
    if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(2)}M`;
    return `₦${naira.toLocaleString()}`;
  }
  return `${currency} ${(naira / 100).toLocaleString()}`;
}

const TITLE_STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  VERIFIED: { label: 'Title Verified', color: '#8aa876', icon: 'shield-checkmark' },
  PENDING_VERIFICATION: { label: 'Verification Pending', color: '#d4a24c', icon: 'shield-outline' },
  UNVERIFIED: { label: 'Unverified', color: '#c96a3f', icon: 'warning-outline' },
  DISPUTED: { label: 'Title Disputed', color: '#ef4444', icon: 'alert-circle-outline' },
};

function RiskBar({ label, value, inverse = false }: { label: string; value?: number; inverse?: boolean }) {
  if (value === undefined || value === null) return null;
  // value 0–10: for risk (flood/erosion/dispute) lower is better; for accessibility higher is better
  const pct = Math.min(100, Math.max(0, (value / 10) * 100));
  const effectivePct = inverse ? pct : pct;
  const color = inverse
    ? (value >= 7 ? '#8aa876' : value >= 4 ? '#d4a24c' : '#c96a3f')
    : (value <= 3 ? '#8aa876' : value <= 6 ? '#d4a24c' : '#ef4444');
  return (
    <View style={riskStyles.row}>
      <Text style={riskStyles.label}>{label}</Text>
      <View style={riskStyles.barBg}>
        <View style={[riskStyles.barFill, { width: `${effectivePct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[riskStyles.value, { color }]}>{value.toFixed(1)}</Text>
    </View>
  );
}

const riskStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label: { color: '#9ca3af', fontSize: 11, width: 110, textTransform: 'uppercase', letterSpacing: 0.3 },
  barBg: { flex: 1, height: 4, backgroundColor: '#2a3040', borderRadius: 2, marginHorizontal: 10, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
  value: { fontSize: 11, fontFamily: 'monospace', width: 28, textAlign: 'right' },
});

export default function PropertyDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { getToken, userId } = useAuth();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInquiry, setShowInquiry] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [vrVisible, setVrVisible] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/properties/${slug}`)
      .then(r => r.json())
      .then(data => setProperty(data.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleInquiry = async () => {
    if (!form.name || !form.email || !form.message) {
      Alert.alert('Missing fields', 'Please fill in name, email, and message');
      return;
    }
    setSubmitting(true);
    try {
      const token = userId ? await getToken() : null;
      const r = await fetch(`${API_BASE}/api/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          listingId: property?.listing?.id ?? '',
          buyerName: form.name,
          buyerEmail: form.email,
          buyerPhone: form.phone,
          message: form.message,
        }),
      });
      if (r.ok) {
        Alert.alert('Inquiry sent', 'Your inquiry has been submitted. The agent will be in touch shortly.');
        setShowInquiry(false);
        setForm({ name: '', email: '', phone: '', message: '' });
      } else {
        const data = await r.json();
        Alert.alert('Failed', data.error ?? 'Could not send inquiry');
      }
    } catch {
      Alert.alert('Error', 'Network error — please try again');
    }
    setSubmitting(false);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#d4a24c" size="large" /></View>;
  }

  if (!property) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Property not found</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>Go back</Text></TouchableOpacity>
      </View>
    );
  }

  const titleCfg = TITLE_STATUS_CONFIG[property.plot?.titleStatus ?? 'UNVERIFIED'] ?? TITLE_STATUS_CONFIG.UNVERIFIED;
  const hasRiskData = property.plot?.floodRisk !== undefined || property.plot?.erosionRisk !== undefined;
  const hasVirtualTour = !!property.virtualTourUrl;
  const hasFloorPlan = !!property.floorPlanUrl;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={18} color="#f5f0e8" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Type + Plot */}
        <View style={styles.meta}>
          <View style={styles.typePill}><Text style={styles.typeText}>{property.type.replace(/_/g, ' ')}</Text></View>
          <Text style={styles.plotId}>{property.plot?.plotNumber}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{property.title}</Text>
        <Text style={styles.destination}>{property.destination?.name}, {property.destination?.state}</Text>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatKobo(property.listing?.askingPriceKobo ?? 0, property.listing?.currency)}</Text>
          {property.listing?.isNegotiable && <Text style={styles.negotiable}>Negotiable</Text>}
        </View>

        {/* ── TITLE VERIFICATION BADGE ── */}
        <View style={[styles.titleBadge, { borderColor: titleCfg.color + '40', backgroundColor: titleCfg.color + '12' }]}>
          <Ionicons name={titleCfg.icon as any} size={16} color={titleCfg.color} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.titleBadgeLabel, { color: titleCfg.color }]}>{titleCfg.label}</Text>
            {property.plot?.titleType && (
              <Text style={styles.titleBadgeSub}>{property.plot.titleType.replace(/_/g, ' ')}</Text>
            )}
          </View>
          {property.plot?.titleDocumentUrl && (
            <TouchableOpacity onPress={() => Linking.openURL(property.plot.titleDocumentUrl!)} style={styles.titleDocBtn}>
              <Ionicons name="document-outline" size={14} color="#d4a24c" />
              <Text style={styles.titleDocText}>View doc</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── 3D / VR BUTTONS ── */}
        {(hasVirtualTour || hasFloorPlan) && (
          <View style={styles.mediaRow}>
            {hasVirtualTour && (
              <TouchableOpacity style={styles.mediaBtn} onPress={() => setVrVisible(true)}>
                <Ionicons name="cube-outline" size={16} color="#d4a24c" />
                <Text style={styles.mediaBtnText}>3D / VR Tour</Text>
              </TouchableOpacity>
            )}
            {hasFloorPlan && (
              <TouchableOpacity style={styles.mediaBtn} onPress={() => Linking.openURL(property.floorPlanUrl!)}>
                <Ionicons name="grid-outline" size={16} color="#d4a24c" />
                <Text style={styles.mediaBtnText}>Floor Plan</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Key facts */}
        <View style={styles.factsGrid}>
          {[
            { label: 'Area', value: property.plot?.areaSqm ? `${property.plot.areaSqm.toLocaleString()} sqm` : undefined },
            { label: 'Title', value: property.plot?.titleStatus?.replace(/_/g, ' ') },
            ...(property.bedrooms ? [{ label: 'Bedrooms', value: String(property.bedrooms) }] : []),
            ...(property.bathrooms ? [{ label: 'Bathrooms', value: String(property.bathrooms) }] : []),
          ].filter(f => f.value).map(f => (
            <View key={f.label} style={styles.factItem}>
              <Text style={styles.factLabel}>{f.label}</Text>
              <Text style={styles.factValue}>{f.value}</Text>
            </View>
          ))}
        </View>

        {/* ── RISK SCORES ── */}
        {hasRiskData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Risk & Site Assessment</Text>
            <View style={styles.riskCard}>
              <RiskBar label="Flood Risk" value={property.plot?.floodRisk} />
              <RiskBar label="Erosion Risk" value={property.plot?.erosionRisk} />
              <RiskBar label="Dispute Risk" value={property.plot?.disputeRisk} />
              <RiskBar label="Accessibility" value={property.plot?.accessibilityScore} inverse />
              <Text style={styles.riskNote}>Scores 0–10. For risk: lower is better. For accessibility: higher is better.</Text>
            </View>
          </View>
        )}

        {/* Description */}
        {property.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this property</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>
        )}

        {/* Amenities */}
        {property.amenities?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesWrap}>
              {property.amenities.map((a, i) => (
                <View key={i} style={styles.amenityPill}>
                  <Text style={styles.amenityText}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── AGENT CARD ── */}
        {property.agent && (
          <View style={styles.agentCard}>
            <View style={styles.agentAvatar}>
              <Text style={styles.agentAvatarText}>
                {property.agent.profile?.firstName?.[0] ?? 'A'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.agentName}>
                  {property.agent.profile?.firstName} {property.agent.profile?.lastName}
                </Text>
                {property.agent.agentProfile?.verified && (
                  <Ionicons name="shield-checkmark" size={14} color="#8aa876" />
                )}
              </View>
              {property.agent.agentProfile?.licenceNumber && (
                <Text style={styles.agentLicence}>Lic: {property.agent.agentProfile.licenceNumber}</Text>
              )}
            </View>
          </View>
        )}

        {/* ── ESCROW NOTICE ── */}
        <View style={styles.escrowCard}>
          <Ionicons name="lock-closed-outline" size={18} color="#8aa876" />
          <View style={{ flex: 1 }}>
            <Text style={styles.escrowTitle}>Escrow-Protected Transaction</Text>
            <Text style={styles.escrowBody}>
              All payments are held in a regulated escrow account and only released to the seller upon confirmed title transfer. Your funds are protected at every stage.
            </Text>
          </View>
        </View>

        {/* Inquiry form */}
        {!showInquiry ? (
          <TouchableOpacity style={styles.inquiryBtn} onPress={() => setShowInquiry(true)}>
            <Ionicons name="chatbubble-outline" size={18} color="#fff" />
            <Text style={styles.inquiryBtnText}>Send inquiry</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.inquiryForm}>
            <Text style={styles.sectionTitle}>Send an inquiry</Text>
            {[
              { key: 'name', placeholder: 'Your full name', keyboard: 'default' as const },
              { key: 'email', placeholder: 'Email address', keyboard: 'email-address' as const },
              { key: 'phone', placeholder: 'Phone number (optional)', keyboard: 'phone-pad' as const },
            ].map(f => (
              <TextInput
                key={f.key}
                style={styles.input}
                placeholder={f.placeholder}
                placeholderTextColor="#6b7280"
                value={form[f.key as keyof typeof form]}
                onChangeText={v => setForm(prev => ({ ...prev, [f.key]: v }))}
                keyboardType={f.keyboard}
                autoCapitalize={f.key === 'email' ? 'none' : 'words'}
              />
            ))}
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Your message"
              placeholderTextColor="#6b7280"
              value={form.message}
              onChangeText={v => setForm(prev => ({ ...prev, message: v }))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.inquiryActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowInquiry(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleInquiry} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.submitText}>Send</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── VR / 3D TOUR MODAL ── */}
      {hasVirtualTour && (
        <Modal visible={vrVisible} animationType="slide" onRequestClose={() => setVrVisible(false)}>
          <View style={styles.vrContainer}>
            <View style={styles.vrHeader}>
              <Text style={styles.vrTitle}>3D / VR Tour</Text>
              <TouchableOpacity onPress={() => setVrVisible(false)} style={styles.vrClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={22} color="#f5f0e8" />
              </TouchableOpacity>
            </View>
            <WebView
              source={{ uri: property.virtualTourUrl! }}
              style={{ flex: 1 }}
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              onError={() => {
                setVrVisible(false);
                Linking.openURL(property.virtualTourUrl!);
              }}
            />
            <View style={styles.vrFooter}>
              <TouchableOpacity style={styles.vrExternalBtn} onPress={() => Linking.openURL(property.virtualTourUrl!)}>
                <Ionicons name="open-outline" size={14} color="#d4a24c" />
                <Text style={styles.vrExternalText}>Open in browser for full VR experience</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e12' },
  content: { paddingHorizontal: 16, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0e12' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 16, paddingBottom: 20 },
  backText: { color: '#f5f0e8', fontSize: 14 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typePill: { backgroundColor: '#c96a3f22', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  typeText: { color: '#c96a3f', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  plotId: { color: '#6b7280', fontSize: 11, fontFamily: 'monospace' },
  title: { color: '#f5f0e8', fontSize: 24, fontWeight: '300', lineHeight: 30, marginBottom: 6 },
  destination: { color: '#9ca3af', fontSize: 13, marginBottom: 16 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  price: { color: '#d4a24c', fontSize: 26, fontWeight: '400' },
  negotiable: { color: '#8aa876', fontSize: 11, fontFamily: 'monospace', backgroundColor: '#8aa87620', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  // Title badge
  titleBadge: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },
  titleBadgeLabel: { fontSize: 13, fontWeight: '600' },
  titleBadgeSub: { color: '#6b7280', fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },
  titleDocBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#d4a24c15', borderRadius: 6 },
  titleDocText: { color: '#d4a24c', fontSize: 11 },
  // Media buttons
  mediaRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  mediaBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#161b22', borderWidth: 1, borderColor: '#d4a24c40', borderRadius: 8, paddingVertical: 12 },
  mediaBtnText: { color: '#d4a24c', fontSize: 13, fontWeight: '500' },
  // Facts
  factsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  factItem: { backgroundColor: '#161b22', borderRadius: 8, borderWidth: 1, borderColor: '#2a3040', paddingHorizontal: 14, paddingVertical: 10, minWidth: '45%' },
  factLabel: { color: '#6b7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  factValue: { color: '#f5f0e8', fontSize: 14, fontWeight: '400' },
  // Risk
  section: { marginBottom: 20 },
  sectionTitle: { color: '#f5f0e8', fontSize: 15, fontWeight: '500', marginBottom: 10 },
  riskCard: { backgroundColor: '#161b22', borderRadius: 10, borderWidth: 1, borderColor: '#2a3040', padding: 14 },
  riskNote: { color: '#4b5563', fontSize: 10, marginTop: 8, lineHeight: 14 },
  description: { color: '#9ca3af', fontSize: 14, lineHeight: 22 },
  amenitiesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityPill: { backgroundColor: '#2a3040', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  amenityText: { color: '#d4a24c', fontSize: 12 },
  // Agent
  agentCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#161b22', borderRadius: 10, borderWidth: 1, borderColor: '#2a3040', padding: 14, marginBottom: 16 },
  agentAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#c96a3f', justifyContent: 'center', alignItems: 'center' },
  agentAvatarText: { color: '#fff', fontSize: 18, fontWeight: '500' },
  agentName: { color: '#f5f0e8', fontSize: 14, fontWeight: '400' },
  agentLicence: { color: '#6b7280', fontSize: 11, fontFamily: 'monospace', marginTop: 2 },
  // Escrow
  escrowCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#8aa87612', borderWidth: 1, borderColor: '#8aa87640', borderRadius: 10, padding: 14, marginBottom: 20 },
  escrowTitle: { color: '#8aa876', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  escrowBody: { color: '#9ca3af', fontSize: 12, lineHeight: 18 },
  // Inquiry
  inquiryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#c96a3f', borderRadius: 10, paddingVertical: 15, marginBottom: 20 },
  inquiryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  inquiryForm: { backgroundColor: '#161b22', borderRadius: 12, borderWidth: 1, borderColor: '#2a3040', padding: 16, marginBottom: 20 },
  input: { backgroundColor: '#0a0e12', borderWidth: 1, borderColor: '#2a3040', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, color: '#f5f0e8', fontSize: 14, marginBottom: 10 },
  textarea: { height: 100 },
  inquiryActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#2a3040', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  cancelText: { color: '#9ca3af', fontSize: 14 },
  submitBtn: { flex: 2, backgroundColor: '#c96a3f', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  errorText: { color: '#f5f0e8', fontSize: 16, marginBottom: 12 },
  link: { color: '#d4a24c', fontSize: 14 },
  // VR Modal
  vrContainer: { flex: 1, backgroundColor: '#0a0e12' },
  vrHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1e2530' },
  vrTitle: { color: '#f5f0e8', fontSize: 16, fontWeight: '500' },
  vrClose: { padding: 4 },
  vrFooter: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#1e2530' },
  vrExternalBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  vrExternalText: { color: '#d4a24c', fontSize: 12 },
});

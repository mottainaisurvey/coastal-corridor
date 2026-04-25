import { useRouter } from 'expo-router';
import { useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, FlatList, ImageBackground, StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');
export const ONBOARDING_KEY = 'cc_onboarding_seen_v1';

const SLIDES = [
  {
    id: '1',
    image: require('../../assets/onboarding1.png'),
    eyebrow: '700 KM · LAGOS TO CALABAR',
    title: "Africa's Greatest\nCoastal Opportunity",
    body: "Nigeria's 700km Atlantic coastline is opening up. Be among the first to own a piece of the most strategically positioned land corridor on the continent.",
    cta: null,
  },
  {
    id: '2',
    image: require('../../assets/onboarding2.png'),
    eyebrow: 'PREMIUM PROPERTIES',
    title: 'Luxury Living\nMeets Smart Investment',
    body: "From beachfront villas to mixed-use developments — browse verified listings across 12 corridor destinations, each with full title documentation.",
    cta: null,
  },
  {
    id: '3',
    image: require('../../assets/onboarding3.png'),
    eyebrow: 'VERIFIED · SECURE · YOURS',
    title: 'Own Your Share\nof the Corridor',
    body: "Every title verified through Lagos State LandWeb. Fractional ownership from ₦500K. Your investment, protected.",
    cta: 'Explore the Corridor',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const navigating = useRef(false);

  const markSeenAndNavigate = useCallback(async () => {
    if (navigating.current) {
      console.log('[Onboarding] markSeenAndNavigate called but already navigating, skipping');
      return;
    }
    navigating.current = true;
    console.log('[Onboarding] marking onboarding as seen and navigating to sign-in');
    try {
      await SecureStore.setItemAsync(ONBOARDING_KEY, '1');
      console.log('[Onboarding] SecureStore flag set successfully');
    } catch (err) {
      console.warn('[Onboarding] SecureStore setItem failed:', err);
    }
    console.log('[Onboarding] calling router.replace to /(auth)/sign-in');
    router.replace('/(auth)/sign-in');
  }, [router]);

  const handleSkip = useCallback(() => {
    console.log('[Onboarding] Skip pressed on slide', activeIndex);
    markSeenAndNavigate();
  }, [markSeenAndNavigate, activeIndex]);

  const handleNext = useCallback(() => {
    console.log('[Onboarding] Next pressed on slide', activeIndex);
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      markSeenAndNavigate();
    }
  }, [activeIndex, markSeenAndNavigate]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
        console.log('[Onboarding] slide changed to', viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <ImageBackground source={item.image} style={styles.slide} resizeMode="cover">
            <View style={styles.overlay} />
            <SafeAreaView style={styles.slideContent} edges={['top', 'bottom']}>
              <View style={styles.topBar}>
                <View />
                <TouchableOpacity
                  onPress={handleSkip}
                  style={styles.skipBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                >
                  <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.bottomContent}>
                <Text style={styles.eyebrow}>{item.eyebrow}</Text>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
                <View style={styles.dotsRow}>
                  {SLIDES.map((_, i) => (
                    <View key={i} style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]} />
                  ))}
                </View>
                {item.cta ? (
                  <TouchableOpacity
                    style={styles.ctaBtn}
                    onPress={markSeenAndNavigate}
                    activeOpacity={0.8}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Text style={styles.ctaBtnText}>{item.cta}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.nextBtn}
                    onPress={handleNext}
                    activeOpacity={0.7}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Text style={styles.nextBtnText}>Next →</Text>
                  </TouchableOpacity>
                )}
              </View>
            </SafeAreaView>
          </ImageBackground>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e12' },
  slide: { width, height },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 14, 18, 0.55)' },
  slideContent: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
  },
  skipText: { color: '#f5f0e8', fontSize: 13, fontWeight: '500' },
  bottomContent: { paddingHorizontal: 28, paddingBottom: 40 },
  eyebrow: {
    color: '#d4a24c', fontSize: 10, fontFamily: 'monospace',
    letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14,
  },
  title: {
    color: '#f5f0e8', fontSize: 34, fontWeight: '300',
    lineHeight: 42, letterSpacing: 0.3, marginBottom: 16,
  },
  body: { color: 'rgba(245, 240, 232, 0.80)', fontSize: 15, lineHeight: 24, marginBottom: 32 },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  dot: { height: 4, borderRadius: 2 },
  dotActive: { width: 28, backgroundColor: '#d4a24c' },
  dotInactive: { width: 8, backgroundColor: 'rgba(255,255,255,0.30)' },
  ctaBtn: {
    backgroundColor: '#c96a3f', borderRadius: 12,
    paddingVertical: 17, alignItems: 'center',
  },
  ctaBtnText: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 0.3 },
  nextBtn: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.30)',
    borderRadius: 12, paddingVertical: 17, alignItems: 'center',
  },
  nextBtnText: { color: '#f5f0e8', fontSize: 15, fontWeight: '500' },
});

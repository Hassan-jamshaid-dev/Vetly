import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SplashDecor } from '@/components/decor/SplashDecor';
import { VMark } from '@/components/VMark';
import { DEMO_ALWAYS_SHOW_ONBOARDING, DEMO_FORCE_FIRST_RUN } from '@/config/demo';
import { getGoal } from '@/storage/goalStorage';
import { colors } from '@/theme/colors';
import { motion } from '@/theme/motion';
import { fonts } from '@/theme/typography';

const MIN_SPLASH_MS = 900;
const ENTRANCE_MS = motion.base;
const FADE_OUT_MS = motion.base;

const BAR_WIDTH = 140;
const BAR_HEIGHT = 4;

// Screen 1: Splash. Shows the brand briefly, then fades to Onboarding or Home.
// TEMPORARY: DEMO_ALWAYS_SHOW_ONBOARDING keeps Splash → Get Started even when a
// goal is already saved (goals are not wiped). DEMO_FORCE_FIRST_RUN still resets
// the whole demo session when on — leave it false unless you need a clean slate.
export default function SplashScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Whole-screen opacity, animated 1 -> 0 right before we leave.
  const screenOpacity = useRef(new Animated.Value(1)).current;
  // Brand block entrance: opacity only (no rise, no spring).
  const brandOpacity = useRef(new Animated.Value(0)).current;
  // Progress fill slides in from the left over the full splash duration.
  const progress = useRef(new Animated.Value(-BAR_WIDTH)).current;

  useEffect(() => {
    let cancelled = false;

    const nativeDriver = process.env.EXPO_OS !== 'web';

    Animated.parallel([
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: ENTRANCE_MS,
        useNativeDriver: nativeDriver,
      }),
      Animated.timing(progress, {
        toValue: 0,
        duration: MIN_SPLASH_MS,
        useNativeDriver: nativeDriver,
      }),
    ]).start();

    const minimumWait = new Promise<void>((resolve) => setTimeout(resolve, MIN_SPLASH_MS));
    const isSplashRoute = (route: string) => route === '/' || route === '/index';

    // Wait for the timer. Demo reset must NOT run when Splash is only mounted
    // under another route (web /signup, /paywall, /goal?mode=edit) or it wipes
    // Premium and the session behind the current screen.
    Promise.all([minimumWait, getGoal()])
      .then(async ([, savedGoal]) => {
        if (cancelled) return;
        if (!isSplashRoute(pathnameRef.current)) return;

        if (DEMO_FORCE_FIRST_RUN) {
          const { resetDemoSession } = await import('@/demo/resetDemoSession');
          await resetDemoSession();
        }
        if (cancelled || !isSplashRoute(pathnameRef.current)) return;

        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: FADE_OUT_MS,
          useNativeDriver: nativeDriver,
        }).start(() => {
          if (cancelled) return;
          if (!isSplashRoute(pathnameRef.current)) return;
          // TEMPORARY: DEMO_ALWAYS_SHOW_ONBOARDING forces Get Started. Revert by
          // setting it false in src/config/demo.ts so a saved goal skips to Home.
          if (!DEMO_FORCE_FIRST_RUN && !DEMO_ALWAYS_SHOW_ONBOARDING && savedGoal) {
            router.replace('/(tabs)/home');
          } else {
            router.replace('/onboarding');
          }
        });
      })
      .catch(() => {
        if (cancelled || !isSplashRoute(pathnameRef.current)) return;
        router.replace('/onboarding');
      });

    return () => {
      cancelled = true;
    };
  }, [brandOpacity, progress, router, screenOpacity]);

  return (
    <Animated.View style={[styles.screen, { opacity: screenOpacity }]}>
      <SplashDecor width={width} height={height} />

      <Animated.View style={[styles.brand, { opacity: brandOpacity }]}>
        <VMark size={128} />
        <Text style={styles.wordmark} maxFontSizeMultiplier={1.2}>
          Vetly
        </Text>
        <Text style={styles.tagline} maxFontSizeMultiplier={1.2}>
          Know before you go.
        </Text>
      </Animated.View>

      <View style={[styles.track, { bottom: insets.bottom + 48 }]}>
        <Animated.View style={[styles.fill, { transform: [{ translateX: progress }] }]}>
          <LinearGradient
            colors={colors.gradient}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.fill}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    alignItems: 'center',
  },
  wordmark: {
    // The mark's SVG box has ~13% of empty space below the glyph, so a small
    // margin here yields a visual gap of roughly 22-30px.
    marginTop: 4,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: 0.2,
  },
  tagline: {
    marginTop: 8,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  track: {
    position: 'absolute',
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: colors.progressTrack,
    overflow: 'hidden',
  },
  fill: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
  },
});

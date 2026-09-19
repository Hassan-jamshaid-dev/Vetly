import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientButton } from '@/components/GradientButton';
import { OnboardingDecor } from '@/components/decor/OnboardingDecor';
import { VMark } from '@/components/VMark';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

const MARK_SIZE = 190;
const HEADING_LINE_HEIGHT = 48;

// Vertical space the copy + CTA need below the hero, so the hero can shrink on
// short screens instead of overlapping the text.
const TEXT_BLOCK_HEIGHT = HEADING_LINE_HEIGHT * 3 + 16 + 26;
const CTA_GROUP_HEIGHT = 56 + 8 + 18 + 16 + 20;
const MIN_TEXT_TO_CTA_GAP = 24;

// Screen 2: Onboarding. Soft illustration with the V mark up top, the value
// proposition below, and a single "Get Started" call to action.
export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const bottomPadding = Math.max(24, insets.bottom + 12);
  const reserved = TEXT_BLOCK_HEIGHT + MIN_TEXT_TO_CTA_GAP + CTA_GROUP_HEIGHT + bottomPadding;
  // Hero is ~56% of the screen on phones with room to spare; smaller ones shrink it.
  const heroHeight = Math.max(MARK_SIZE, Math.min(height * 0.56, height - reserved));
  // Mark sits ~32% down the screen (57% of the hero) and scales with the hero.
  const markCenterY = heroHeight * 0.57;

  return (
    <View style={styles.screen}>
      <OnboardingDecor width={width} heroHeight={heroHeight} markCenterY={markCenterY} />

      {/* Hero: the mark, centred on the orbit. */}
      <View style={{ height: heroHeight }}>
        <VMark
          size={MARK_SIZE}
          style={[
            styles.mark,
            { top: markCenterY - MARK_SIZE / 2, left: (width - MARK_SIZE) / 2 },
          ]}
        />
      </View>

      {/* Copy */}
      <View style={styles.copy}>
        <Text style={styles.heading} maxFontSizeMultiplier={1.2}>
          Your goals.{'\n'}Your profile.
        </Text>
        <GradientHeadingLine text="Your next move." />
        <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
          Know before you go.
        </Text>
      </View>

      <View style={styles.spacer} />

      {/* CTA group */}
      <View style={[styles.cta, { paddingBottom: bottomPadding }]}>
        <GradientButton
          label="Get Started"
          onPress={() => router.push('/goal')}
          trailingIcon={<Ionicons name="arrow-forward" size={18} color={colors.white} />}
        />
        <Text style={styles.guestHint} maxFontSizeMultiplier={1.3}>
          No account needed.
        </Text>

        <View style={styles.loginRow}>
          <Pressable
            onPress={() => router.push('/signup')}
            hitSlop={8}
            accessibilityRole="link"
            accessibilityLabel="Demo sign-in, not real accounts"
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.loginLink} maxFontSizeMultiplier={1.3}>
              Demo sign-in (not real accounts)
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** One heading line filled with the brand gradient (text acts as a mask). */
function GradientHeadingLine({ text }: { text: string }) {
  return (
    <MaskedView
      style={styles.gradientLine}
      maskElement={
        <Text style={[styles.heading, styles.maskText]} maxFontSizeMultiplier={1.2}>
          {text}
        </Text>
      }
    >
      <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}>
        {/* Invisible copy of the text gives the gradient its exact size. */}
        <Text style={[styles.heading, styles.sizer]} maxFontSizeMultiplier={1.2}>
          {text}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
  },

  // --- Hero ---
  mark: {
    position: 'absolute',
  },

  // --- Copy ---
  copy: {
    paddingHorizontal: 24,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 40,
    lineHeight: HEADING_LINE_HEIGHT,
    letterSpacing: -0.5,
    color: colors.textPrimary,
    includeFontPadding: false,
  },
  gradientLine: {
    alignSelf: 'flex-start',
  },
  maskText: {
    // Any opaque colour works: the mask only uses alpha.
    color: colors.textPrimary,
  },
  sizer: {
    opacity: 0,
  },
  subtitle: {
    marginTop: 16,
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 26,
    color: colors.textSecondary,
  },
  spacer: {
    flex: 1,
    minHeight: MIN_TEXT_TO_CTA_GAP,
  },

  // --- CTA ---
  cta: {
    paddingHorizontal: 24,
  },
  guestHint: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    minHeight: 20,
  },
  loginLink: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.purple,
  },
  pressed: {
    opacity: 0.6,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { GuidanceCard } from '@/components/GuidanceCard';
import { InsightRow } from '@/components/InsightRow';
import { LockedCard } from '@/components/LockedCard';
import { ScoreRing } from '@/components/ScoreRing';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colorForScore } from '@/services/score';
import { getIsPremium } from '@/storage/premiumStorage';
import { getCurrentEvaluation, wasOpenedFromEvaluate } from '@/store/evaluationStore';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import type { Evaluation } from '@/types/evaluation';

// Screen 5: Results. Score, insights, and premium guidance for the evaluation
// currently in evaluationStore (from Evaluate, History, or Home).
export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Re-read on focus so a recycled Results screen picks up a new evaluation,
  // and an empty store (deep link / hot reload) cannot sit as a blank dead end.
  const [evaluation, setEvaluation] = useState<Evaluation | null>(() => getCurrentEvaluation());
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const current = getCurrentEvaluation();
      setEvaluation(current);
      if (!current) {
        router.replace('/(tabs)/home');
        return;
      }
      getIsPremium().then((value) => {
        if (!cancelled) setIsPremium(value);
      });
      return () => {
        cancelled = true;
      };
    }, [router]),
  );

  if (!evaluation) return null;

  const scoreColor = colorForScore(evaluation.score);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScreenHeader
        onBack={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/(tabs)/home');
        }}
        title="Results"
        withSafeArea
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Opportunity title + source */}
        <FadeIn index={0}>
          <Text style={styles.title} numberOfLines={2}>
            {evaluation.title}
          </Text>
          <View style={styles.sourceRow}>
            <Ionicons name={sourceIcon(evaluation.source)} size={14} color={colors.textSecondary} />
            <Text style={styles.source} numberOfLines={1}>
              {evaluation.source}
            </Text>
          </View>
        </FadeIn>

        {/* Score */}
        <FadeIn index={1}>
          <Card style={styles.scoreCard}>
            <ScoreRing score={evaluation.score} />
            <View style={[styles.badge, { backgroundColor: `${scoreColor}1F` }]}>
              <Ionicons name={labelIcon(evaluation.score)} size={16} color={scoreColor} />
              <Text style={[styles.badgeText, { color: scoreColor }]}>{evaluation.label}</Text>
            </View>
          </Card>
        </FadeIn>

        {/* Key insights */}
        <FadeIn index={2}>
          <Text style={styles.sectionHeading}>Key insights</Text>
          <Card padding={16} style={styles.insightsCard}>
            {evaluation.insights.map((insight, i) => (
              <InsightRow
                key={`insight-${i}`}
                insight={insight}
                isLast={i === evaluation.insights.length - 1}
              />
            ))}
          </Card>
        </FadeIn>

        {/* Preparation guidance: locked for free, full copy for Premium. */}
        <FadeIn index={3}>
          <View style={styles.lockedWrap}>
            {isPremium === true ? (
              <>
                <GuidanceCard guidance={evaluation.guidance} />
                {evaluation.hasApplication ? (
                  <Pressable
                    onPress={() => router.push('/application-help')}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.helpBtn, pressed && styles.pressed]}
                  >
                    <Ionicons name="create-outline" size={16} color={colors.purple} />
                    <Text style={styles.helpBtnLabel}>How to fill this form</Text>
                  </Pressable>
                ) : null}
              </>
            ) : isPremium === false ? (
              <LockedCard onUnlock={() => router.push('/paywall')} />
            ) : (
              <View style={styles.guidanceSkeleton} />
            )}
          </View>
        </FadeIn>

        <FadeIn index={4}>
          <Pressable
            onPress={() => {
              if (wasOpenedFromEvaluate() && router.canGoBack()) router.back();
              else router.replace('/evaluate');
            }}
            hitSlop={8}
            accessibilityRole="button"
            style={({ pressed }) => [styles.again, pressed && styles.pressed]}
          >
            <Text style={styles.againText}>Evaluate another</Text>
          </Pressable>
        </FadeIn>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function sourceIcon(source: string): IoniconName {
  if (source === 'Screenshot') return 'image-outline';
  if (source === 'Pasted text') return 'document-text-outline';
  return 'link-outline';
}

function labelIcon(score: number): IoniconName {
  if (score >= 8) return 'checkmark-circle';
  if (score >= 5) return 'remove-circle';
  return 'alert-circle';
}

const FADE_DURATION = 180;
const FADE_STAGGER = 40;

/** Fades and rises its children in on mount, delayed by `index * 60ms`. */
function FadeIn({ index, children }: { index: number; children: ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_DURATION,
        delay: index * FADE_STAGGER,
        easing: Easing.out(Easing.quad),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: FADE_DURATION,
        delay: index * FADE_STAGGER,
        easing: Easing.out(Easing.quad),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [index, opacity, translateY]);

  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  sourceRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  source: {
    marginLeft: 6,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  scoreCard: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 24,
  },
  badge: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    marginLeft: 6,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  sectionHeading: {
    marginTop: 28,
    marginBottom: 12,
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  insightsCard: {
    paddingVertical: 4,
  },
  lockedWrap: {
    marginTop: 20,
  },
  guidanceSkeleton: {
    height: 180,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: colors.skeleton,
    opacity: 0.5,
  },
  helpBtn: {
    marginTop: 14,
    alignSelf: 'center',
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.purpleBorder,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpBtnLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.purple,
  },
  again: {
    marginVertical: 16,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.6,
  },
  againText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.purple,
  },
});

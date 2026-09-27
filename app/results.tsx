import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { GuidanceCard } from '@/components/GuidanceCard';
import { InsightRow } from '@/components/InsightRow';
import { LockedCard } from '@/components/LockedCard';
import { ScoreRing } from '@/components/ScoreRing';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { SoftSkeleton } from '@/components/SoftSkeleton';
import { colorForScore } from '@/services/score';
import { getIsPremium } from '@/storage/premiumStorage';
import { getCurrentEvaluation, wasOpenedFromEvaluate } from '@/store/evaluationStore';
import { colors } from '@/theme/colors';
import { fonts, type } from '@/theme/typography';
import type { Evaluation } from '@/types/evaluation';

// Screen 5: Results. Score, insights, and premium guidance for the evaluation
// currently in evaluationStore (from Evaluate, History, or Home).
export default function ResultsScreen() {
  const router = useRouter();

  // Re-read on focus so a recycled Results screen picks up a new evaluation,
  // and an empty store (deep link / hot reload) cannot sit as a blank dead end.
  const [evaluation, setEvaluation] = useState<Evaluation | null>(() => getCurrentEvaluation());
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };

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

  if (!evaluation) {
    return (
      <ScreenWrapper title="Results" onBack={goBack} contentContainerStyle={styles.content}>
        <SoftSkeleton height={28} style={styles.titleSkeleton} />
        <SoftSkeleton height={16} style={styles.sourceSkeleton} />
        <SoftSkeleton height={248} style={styles.scoreSkeleton} />
        <SoftSkeleton height={160} style={styles.blockSkeleton} />
      </ScreenWrapper>
    );
  }

  const scoreColor = colorForScore(evaluation.score);

  return (
    <ScreenWrapper title="Results" onBack={goBack} contentContainerStyle={styles.content}>
      <FadeIn>
        <Text style={styles.title} selectable>
          {evaluation.title}
        </Text>
        <View style={styles.sourceRow}>
          <Ionicons name={sourceIcon(evaluation.source)} size={14} color={colors.textSecondary} />
          <Text style={styles.source} numberOfLines={1}>
            {evaluation.source}
          </Text>
        </View>

        <Card style={styles.scoreCard}>
          <ScoreRing score={evaluation.score} />
          <View style={[styles.badge, { backgroundColor: `${scoreColor}1F` }]}>
            <Ionicons name={labelIcon(evaluation.score)} size={16} color={scoreColor} />
            <Text style={[styles.badgeText, { color: scoreColor }]}>{evaluation.label}</Text>
          </View>
        </Card>

        <Text style={styles.sectionHeading}>Key insights</Text>
        <Card padding={20} style={styles.insightsCard}>
          {evaluation.insights.map((insight, i) => (
            <InsightRow
              key={`insight-${i}`}
              insight={insight}
              isLast={i === evaluation.insights.length - 1}
            />
          ))}
        </Card>

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
            <SoftSkeleton height={196} style={styles.guidanceSkeleton} />
          )}
        </View>

        <Pressable
          onPress={() => {
            if (wasOpenedFromEvaluate() && router.canGoBack()) router.back();
            else router.replace('/evaluate');
          }}
          accessibilityRole="button"
          style={({ pressed }) => [styles.again, pressed && styles.pressed]}
        >
          <Text style={styles.againText}>Evaluate another</Text>
        </Pressable>
      </FadeIn>
    </ScreenWrapper>
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

const FADE_DURATION = 200;

/** Opacity-only enter so the score is the first thing that reads. */
function FadeIn({ children }: { children: ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_DURATION,
      easing: Easing.out(Easing.quad),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  titleSkeleton: {
    width: '72%',
  },
  sourceSkeleton: {
    width: '40%',
    marginTop: 10,
  },
  scoreSkeleton: {
    marginTop: 24,
    borderRadius: 20,
  },
  blockSkeleton: {
    marginTop: 28,
    borderRadius: 20,
  },
  title: {
    ...type.h2,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
  },
  sourceRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  source: {
    marginLeft: 6,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  scoreCard: {
    marginTop: 28,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  badge: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeText: {
    marginLeft: 6,
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHeading: {
    ...type.label,
    marginTop: 32,
    marginBottom: 14,
    fontFamily: fonts.semibold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  insightsCard: {
    paddingVertical: 8,
  },
  lockedWrap: {
    marginTop: 28,
  },
  guidanceSkeleton: {
    borderRadius: 20,
  },
  helpBtn: {
    marginTop: 16,
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
    lineHeight: 18,
    color: colors.purple,
  },
  again: {
    marginTop: 12,
    marginBottom: 8,
    alignSelf: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  againText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.purple,
  },
});

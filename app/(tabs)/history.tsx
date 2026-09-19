import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { GradientButton } from '@/components/GradientButton';
import { SoftSkeleton } from '@/components/SoftSkeleton';
import { analyzeProfileCoherence, type CoherenceResult } from '@/services/coherence';
import { fetchRemoteEvaluations } from '@/services/evaluationCloud';
import { colorForScore } from '@/services/score';
import { getHistory, mergeRemoteHistory } from '@/storage/historyStorage';
import { getIsPremium } from '@/storage/premiumStorage';
import { getProfile } from '@/storage/profileStorage';
import { setCurrentEvaluation } from '@/store/evaluationStore';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { relativeTime } from '@/utils/relativeTime';
import type { Evaluation } from '@/types/evaluation';

const TAB_BAR_SPACER = 64 + 16;

// History tab. Free: locked teaser. Premium: on-device list (newest first).
export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [items, setItems] = useState<Evaluation[]>([]);
  const [pattern, setPattern] = useState<CoherenceResult | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const premium = await getIsPremium();
        if (cancelled) return;
        if (!premium) {
          setItems([]);
          setPattern(null);
          setIsPremium(false);
          return;
        }
        const [history, profile] = await Promise.all([getHistory(), getProfile()]);
        if (cancelled) return;
        setItems(history);
        setPattern(history.length >= 1 ? analyzeProfileCoherence(history, profile) : null);
        setIsPremium(true);
        const remote = await fetchRemoteEvaluations();
        if (cancelled || !remote) return;
        const merged = await mergeRemoteHistory(remote);
        if (cancelled) return;
        setItems(merged);
        setPattern(merged.length >= 1 ? analyzeProfileCoherence(merged, profile) : null);
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const openItem = (evaluation: Evaluation) => {
    setCurrentEvaluation(evaluation);
    router.push('/results');
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <Text style={[styles.title, { paddingTop: insets.top + 12 }]}>History</Text>

      {isPremium === null ? (
        <View style={styles.loading}>
          <SoftSkeleton height={72} />
          <SoftSkeleton height={88} style={styles.loadingGap} />
          <SoftSkeleton height={88} />
        </View>
      ) : null}

      {isPremium === false ? <LockedState onUpgrade={() => router.push('/paywall')} /> : null}

      {isPremium === true && items.length === 0 ? <EmptyState /> : null}

      {isPremium === true && items.length > 0 ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: TAB_BAR_SPACER }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          windowSize={7}
          ListHeaderComponent={
            pattern ? <PatternCard result={pattern} thin={items.length < 2} /> : null
          }
          renderItem={({ item }) => <HistoryRow evaluation={item} onPress={() => openItem(item)} />}
        />
      ) : null}
    </View>
  );
}

function LockedState({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <View style={styles.center}>
      <View style={styles.lockCircle}>
        <Ionicons name="lock-closed" size={30} color={colors.purple} />
      </View>
      <Text style={styles.heading}>Your history unlocks with Premium</Text>
      <Text style={styles.body}>Every evaluation saved, plus how your profile is taking shape.</Text>
      <View style={styles.buttonWrap}>
        <GradientButton label="Upgrade to Premium" onPress={onUpgrade} />
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.center}>
      <View style={styles.lockCircle}>
        <Ionicons name="time-outline" size={30} color={colors.purple} />
      </View>
      <Text style={styles.heading}>No evaluations yet</Text>
      <Text style={styles.body}>Analyze an opportunity and it will show up here.</Text>
    </View>
  );
}

function PatternCard({ result, thin }: { result: CoherenceResult; thin: boolean }) {
  const icon =
    result.status === 'coherent'
      ? 'sparkles-outline'
      : result.status === 'drifting'
        ? 'git-branch-outline'
        : 'shuffle-outline';
  return (
    <Card radius={16} style={styles.patternCard}>
      <View style={styles.patternHeader}>
        <View style={styles.patternIcon}>
          <Ionicons name={icon} size={18} color={colors.purple} />
        </View>
        <Text style={styles.patternHeadline}>{result.headline}</Text>
      </View>
      {thin ? null : <Text style={styles.patternDetail}>{result.detail}</Text>}
    </Card>
  );
}

function HistoryRow({
  evaluation,
  onPress,
}: {
  evaluation: Evaluation;
  onPress: () => void;
}) {
  const tint = colorForScore(evaluation.score);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ marginBottom: 12 }}>
      {({ pressed }) => (
        <Card style={pressed ? styles.rowPressed : undefined}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {evaluation.title}
              </Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {evaluation.score}/10 · {evaluation.label} · {relativeTime(evaluation.createdAt)}
              </Text>
            </View>
            <Text style={[styles.rowScore, { color: tint }]}>{evaluation.score}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
          </View>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
  },
  title: {
    paddingHorizontal: 24,
    marginBottom: 12,
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 36,
    color: colors.textPrimary,
  },
  loading: {
    paddingHorizontal: 20,
    gap: 12,
  },
  loadingGap: {
    marginTop: 4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  lockCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    marginTop: 20,
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  buttonWrap: {
    marginTop: 24,
    width: '100%',
    maxWidth: 320,
  },
  patternCard: {
    marginBottom: 16,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  patternIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternHeadline: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  patternDetail: {
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowText: {
    flex: 1,
    marginRight: 8,
  },
  rowTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  rowMeta: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  rowScore: {
    fontFamily: fonts.bold,
    fontSize: 18,
    marginRight: 4,
  },
});

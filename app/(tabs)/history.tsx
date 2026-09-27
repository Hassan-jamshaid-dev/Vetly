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

const TAB_BAR_SPACER = 24;

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
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>History</Text>
      </View>

      {isPremium === null ? (
        <View style={styles.loading}>
          <SoftSkeleton height={72} />
          <SoftSkeleton height={88} />
          <SoftSkeleton height={88} />
        </View>
      ) : null}

      {isPremium === false ? <LockedState onUpgrade={() => router.push('/paywall')} /> : null}

      {isPremium === true && items.length === 0 ? <EmptyState /> : null}

      {isPremium === true && items.length > 0 ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
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
        <Ionicons name="lock-closed" size={22} color={colors.purple} />
      </View>
      <Text style={styles.heading}>History unlocks with Premium</Text>
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
      <Text style={styles.heading}>Nothing here yet</Text>
      <Text style={styles.body}>
        Evaluate an opportunity from Home and it will show up here with its score and date.
      </Text>
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
          <Ionicons name={icon} size={16} color={colors.purple} />
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
  const when = relativeTime(evaluation.createdAt);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${evaluation.title}, ${evaluation.score} out of 10, ${when}`}
      style={styles.rowWrap}
    >
      {({ pressed }) => (
        <Card radius={16} style={pressed ? styles.rowPressed : undefined}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {evaluation.title}
              </Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {when}
                {evaluation.label ? ` · ${evaluation.label}` : ''}
              </Text>
            </View>
            <Text style={[styles.rowScore, { color: tint }]}>{evaluation.score}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.chevron} />
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
  header: {
    paddingHorizontal: 20,
    minHeight: 44,
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 36,
    color: colors.textPrimary,
  },
  loading: {
    paddingHorizontal: 20,
    gap: 12,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: TAB_BAR_SPACER,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  lockCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heading: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 24,
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
    maxWidth: 320,
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
    width: 28,
    height: 28,
    borderRadius: 8,
    borderCurve: 'continuous',
    backgroundColor: colors.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternHeadline: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  patternDetail: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  rowWrap: {
    marginBottom: 10,
  },
  rowPressed: {
    backgroundColor: colors.backgroundSoft,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    gap: 8,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  rowMeta: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  rowScore: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 22,
    fontVariant: ['tabular-nums'],
    minWidth: 22,
    textAlign: 'right',
  },
});

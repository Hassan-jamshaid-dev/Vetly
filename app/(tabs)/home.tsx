import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { GradientButton } from '@/components/GradientButton';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { SoftSkeleton } from '@/components/SoftSkeleton';
import { VMark } from '@/components/VMark';
import { fetchRemoteEvaluations } from '@/services/evaluationCloud';
import { colorForScore } from '@/services/score';
import { firstNameOf, getAccount, getIsSignedIn } from '@/storage/authStorage';
import { getHistory, mergeRemoteHistory } from '@/storage/historyStorage';
import { getIsPremium } from '@/storage/premiumStorage';
import { setCurrentEvaluation } from '@/store/evaluationStore';
import { colors } from '@/theme/colors';
import { fonts, type } from '@/theme/typography';
import { relativeTime } from '@/utils/relativeTime';
import type { Evaluation } from '@/types/evaluation';

const TAB_BAR_SPACER = 24;

function timeOfDayGreeting(): 'Good morning' | 'Good afternoon' | 'Good evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Dashboard Home. Evaluate lives on the stack at /evaluate so this tab can stay a hub.
export default function HomeScreen() {
  const router = useRouter();
  const greeting = timeOfDayGreeting();

  const [hydrated, setHydrated] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [recent, setRecent] = useState<Evaluation[]>([]);
  const [recentReady, setRecentReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [premium, signedIn, account, history] = await Promise.all([
          getIsPremium(),
          getIsSignedIn(),
          getAccount(),
          getHistory(),
        ]);
        if (cancelled) return;
        setIsPremium(premium);
        setFirstName(signedIn && account ? firstNameOf(account.name) : null);
        setHydrated(true);
        if (!premium) {
          setRecent([]);
          setRecentReady(true);
          return;
        }
        setRecent(history.slice(0, 3));
        if (history.length > 0) setRecentReady(true);
        else setRecentReady(false);
        const remote = await fetchRemoteEvaluations();
        if (cancelled || !remote) {
          if (!cancelled) setRecentReady(true);
          return;
        }
        const merged = await mergeRemoteHistory(remote);
        if (!cancelled) {
          setRecent(merged.slice(0, 3));
          setRecentReady(true);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const openEvaluation = (evaluation: Evaluation) => {
    setCurrentEvaluation(evaluation);
    router.push('/results');
  };

  const showRecentSkeleton = isPremium === null || (isPremium === true && !recentReady);

  return (
    <ScreenWrapper
      contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_SPACER }]}
    >
      <View style={styles.headerRow}>
        <VMark size={28} />
        <View style={styles.headerActions}>
          {isPremium === false ? (
            <Pressable
              onPress={() => router.push('/paywall')}
              accessibilityRole="button"
              accessibilityLabel="Upgrade"
              hitSlop={8}
              style={({ pressed }) => [styles.upgradeChip, pressed && styles.pressed]}
            >
              <Text style={styles.upgradeChipLabel}>Upgrade</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            style={({ pressed }) => [styles.settingsBtn, pressed && styles.pressed]}
          >
            <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.hero}>
        {!hydrated ? (
          <SoftSkeleton height={36} style={styles.greetingSkeleton} />
        ) : (
          <>
            {firstName ? (
              <Text style={styles.hi}>
                {greeting}, {firstName}.
              </Text>
            ) : null}
            <Text style={[styles.headline, firstName ? styles.headlineAfterHi : null]}>
              Know before you go.
            </Text>
          </>
        )}
      </View>

      <View style={styles.primary}>
        <GradientButton
          label="Evaluate an opportunity"
          onPress={() => router.push('/evaluate')}
        />
        <Text style={styles.ctaHint}>Paste a listing and see if it fits your goal.</Text>
      </View>

      <Pressable
        onPress={() => router.navigate('/(tabs)/profile')}
        accessibilityRole="button"
        accessibilityLabel="Your profile"
        style={({ pressed }) => [styles.profileLink, pressed && styles.pressed]}
      >
        <Text style={styles.profileLinkText}>Your profile</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
      </Pressable>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>Recent evaluations</Text>
      </View>
      {showRecentSkeleton ? (
        <View style={styles.skeletonStack}>
          <SoftSkeleton height={88} />
          <SoftSkeleton height={88} />
        </View>
      ) : null}
      {isPremium === true && recentReady && recent.length > 0 ? (
        <View style={styles.recentList}>
          {recent.map((item) => (
            <RecentRow key={item.id} evaluation={item} onPress={() => openEvaluation(item)} />
          ))}
        </View>
      ) : null}
      {isPremium === true && recentReady && recent.length === 0 ? (
        <Card radius={20} padding={24}>
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptyBody}>
            Evaluate an opportunity and it will show up here.
          </Text>
        </Card>
      ) : null}
      {isPremium === false ? (
        <Text style={styles.lockedQuiet}>History on Premium</Text>
      ) : null}
    </ScreenWrapper>
  );
}

function RecentRow({
  evaluation,
  onPress,
}: {
  evaluation: Evaluation;
  onPress: () => void;
}) {
  const tint = colorForScore(evaluation.score);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={evaluation.title}>
      {({ pressed }) => (
        <Card radius={16} style={pressed ? styles.rowPressed : undefined}>
          <View style={styles.recentRow}>
            <View style={styles.recentText}>
              <Text style={styles.recentTitle} numberOfLines={1}>
                {evaluation.title}
              </Text>
              <Text style={styles.recentMeta} numberOfLines={1}>
                {evaluation.score}/10 · {relativeTime(evaluation.createdAt)}
              </Text>
            </View>
            <Text style={[styles.recentScore, { color: tint }]}>{evaluation.score}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
          </View>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  headerRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upgradeChip: {
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeChipLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.purple,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  hero: {
    marginTop: 20,
    minHeight: 56,
  },
  greetingSkeleton: {
    width: '62%',
  },
  hi: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  headline: {
    ...type.h2,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
  },
  headlineAfterHi: {
    marginTop: 6,
  },
  primary: {
    marginTop: 28,
  },
  ctaHint: {
    ...type.bodySmall,
    marginTop: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  profileLink: {
    marginTop: 8,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
  },
  profileLinkText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  sectionHeaderRow: {
    marginTop: 28,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeading: {
    ...type.label,
    fontFamily: fonts.semibold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  lockedQuiet: {
    ...type.bodySmall,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  skeletonStack: {
    gap: 12,
  },
  recentList: {
    gap: 12,
  },
  emptyTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  emptyBody: {
    ...type.bodySmall,
    marginTop: 6,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  rowPressed: {
    opacity: 0.85,
  },
  recentRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentText: {
    flex: 1,
    marginRight: 12,
  },
  recentTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  recentMeta: {
    ...type.caption,
    marginTop: 4,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  recentScore: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 22,
    marginRight: 6,
    fontVariant: ['tabular-nums'],
  },
});

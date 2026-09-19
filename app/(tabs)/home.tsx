import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { GradientButton } from '@/components/GradientButton';
import { SoftSkeleton } from '@/components/SoftSkeleton';
import { VMark } from '@/components/VMark';
import { fetchRemoteEvaluations } from '@/services/evaluationCloud';
import { colorForScore } from '@/services/score';
import { firstNameOf, getAccount, getIsSignedIn } from '@/storage/authStorage';
import { getHistory, mergeRemoteHistory } from '@/storage/historyStorage';
import { getIsPremium } from '@/storage/premiumStorage';
import { setCurrentEvaluation } from '@/store/evaluationStore';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { relativeTime } from '@/utils/relativeTime';
import type { Evaluation } from '@/types/evaluation';

const TAB_BAR_SPACER = 64 + 16;

function timeOfDayGreeting(): 'Good morning' | 'Good afternoon' | 'Good evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Dashboard Home. Evaluate lives on the stack at /evaluate so this tab can stay a hub.
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const greeting = timeOfDayGreeting();

  const [firstName, setFirstName] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [recent, setRecent] = useState<Evaluation[]>([]);

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
        setRecent(premium ? history.slice(0, 3) : []);
        if (!premium) return;
        const remote = await fetchRemoteEvaluations();
        if (cancelled || !remote) return;
        const merged = await mergeRemoteHistory(remote);
        if (!cancelled) setRecent(merged.slice(0, 3));
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

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: TAB_BAR_SPACER },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <VMark size={28} />
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>

        {firstName ? (
          <Text style={styles.hi}>
            {greeting}, {firstName}.
          </Text>
        ) : null}
        <Text style={[styles.greeting, firstName ? styles.greetingAfterHi : null]}>
          Know before you go.
        </Text>

        <View style={styles.actions}>
          <QuickAction
            icon="sparkles-outline"
            title="Evaluate opportunity"
            subtitle="Paste a listing and see if it fits your goal"
            onPress={() => router.push('/evaluate')}
          />
          <QuickAction
            icon="person-outline"
            title="Your profile"
            subtitle="Goal, activities, and the story you are building"
            onPress={() => router.navigate('/(tabs)/profile')}
          />
        </View>

        <Text style={styles.sectionHeading}>Recent evaluations</Text>
        {isPremium === null ? <SoftSkeleton height={96} /> : null}
        {isPremium === true && recent.length > 0
          ? recent.map((item) => (
              <RecentRow key={item.id} evaluation={item} onPress={() => openEvaluation(item)} />
            ))
          : null}
        {isPremium === true && recent.length === 0 ? (
          <Card radius={16} padding={20}>
            <Text style={styles.emptyRecent}>Analyze an opportunity and it will show up here.</Text>
          </Card>
        ) : null}
        {isPremium === false ? (
          <Card radius={16} padding={20} style={styles.lockedCard}>
            <View style={styles.lockedRow}>
              <View style={styles.lockCircle}>
                <Ionicons name="lock-closed" size={18} color={colors.purple} />
              </View>
              <Text style={styles.lockedCopy}>History unlocks with Premium.</Text>
            </View>
            <GradientButton label="Upgrade" onPress={() => router.push('/paywall')} />
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
      {({ pressed }) => (
        <Card radius={18} style={pressed ? styles.actionPressed : undefined}>
          <View style={styles.actionRow}>
            <View style={styles.actionIcon}>
              <Ionicons name={icon} size={22} color={colors.purple} />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>{title}</Text>
              <Text style={styles.actionSubtitle}>{subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
          </View>
        </Card>
      )}
    </Pressable>
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
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.recentWrap}>
      {({ pressed }) => (
        <Card radius={16} style={pressed ? styles.actionPressed : undefined}>
          <View style={styles.recentRow}>
            <View style={styles.actionText}>
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
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  headerRow: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: {
    opacity: 0.6,
  },
  hi: {
    marginTop: 16,
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.purple,
  },
  greeting: {
    marginTop: 20,
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 36,
    color: colors.textPrimary,
  },
  greetingAfterHi: {
    marginTop: 6,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  actionPressed: {
    opacity: 0.85,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    marginRight: 8,
  },
  actionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  actionSubtitle: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  sectionHeading: {
    marginTop: 28,
    marginBottom: 12,
    fontFamily: fonts.semibold,
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  emptyRecent: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  lockedCard: {
    gap: 16,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lockCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedCopy: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  recentWrap: {
    marginBottom: 12,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  recentMeta: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  recentScore: {
    fontFamily: fonts.bold,
    fontSize: 18,
    marginRight: 4,
  },
});

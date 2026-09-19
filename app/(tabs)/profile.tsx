import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { GradientButton } from '@/components/GradientButton';
import { SoftSkeleton } from '@/components/SoftSkeleton';
import { getAccount, getIsSignedIn, type Account } from '@/storage/authStorage';
import { getGoal } from '@/storage/goalStorage';
import { getIsPremium } from '@/storage/premiumStorage';
import {
  getProfile,
  hasProfileContent,
  type StudentProfile,
} from '@/storage/profileStorage';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

const TAB_BAR_SPACER = 64 + 16;
const GOAL_PREVIEW = 120;

function activityLines(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  const byLine = trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (byLine.length > 1) return byLine;
  const byBullet = trimmed.split(/\s*[•\-\u2013]\s+/).map((part) => part.trim()).filter(Boolean);
  if (byBullet.length > 1) return byBullet;
  return [trimmed];
}

function previewGoal(goal: string | null): string {
  if (!goal) return '';
  if (goal.length <= GOAL_PREVIEW) return goal;
  return `${goal.slice(0, GOAL_PREVIEW).trimEnd()}…`;
}

// Profile tab: the person page. Settings live on /settings (gear).
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [account, setAccount] = useState<Account | null>(null);
  const [profile, setProfileState] = useState<StudentProfile | null>(null);
  const [goal, setGoalState] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [ready, setReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [signedIn, savedAccount, savedProfile, savedGoal, premium] = await Promise.all([
          getIsSignedIn(),
          getAccount(),
          getProfile(),
          getGoal(),
          getIsPremium(),
        ]);
        if (cancelled) return;
        setAccount(signedIn ? savedAccount : null);
        setProfileState(savedProfile);
        setGoalState(savedGoal);
        setIsPremium(premium);
        setReady(true);
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const showFull = Boolean(account) || hasProfileContent(profile);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: TAB_BAR_SPACER,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Profile</Text>
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

        {!ready ? (
          <View style={styles.loading}>
            <SoftSkeleton height={120} />
            <SoftSkeleton height={88} />
            <SoftSkeleton height={88} />
          </View>
        ) : showFull ? (
          <FullProfile
            account={account}
            profile={profile}
            goal={goal}
            isPremium={isPremium}
            onEdit={() => router.push({ pathname: '/premium-onboarding', params: { mode: 'edit' } })}
            onResume={() => router.push({ pathname: '/resume', params: { mode: 'edit' } })}
          />
        ) : (
          <GuestProfile
            goal={goal}
            onEditGoal={() => router.push({ pathname: '/goal', params: { mode: 'edit' } })}
            onLogin={() => router.push('/signup')}
          />
        )}
      </ScrollView>
    </View>
  );
}

function FullProfile({
  account,
  profile,
  goal,
  isPremium,
  onEdit,
  onResume,
}: {
  account: Account | null;
  profile: StudentProfile | null;
  goal: string | null;
  isPremium: boolean;
  onEdit: () => void;
  onResume: () => void;
}) {
  const displayName = account?.name?.trim() || 'Your profile';
  const initial = displayName.charAt(0).toUpperCase();
  const subtitle = profile?.gradeLevel.trim() || 'Student';
  const chips = [
    ...(profile?.gradeLevel.trim() ? [profile.gradeLevel.trim()] : []),
    ...(profile?.universities ?? []),
    ...(profile?.dreamCareer.trim() ? [profile.dreamCareer.trim()] : []),
  ];
  const activities = activityLines(profile?.activities ?? '');
  const goalPreview = previewGoal(goal ?? profile?.situation ?? null);
  const resumeName = profile?.resumeName?.trim() || null;

  return (
    <View>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{initial}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          style={({ pressed }) => [styles.editPill, pressed && styles.pressed]}
        >
          <Ionicons name="create-outline" size={16} color={colors.purple} />
          <Text style={styles.editPillLabel}>Edit Profile</Text>
        </Pressable>
      </View>

      {chips.length > 0 ? (
        <View style={styles.chips}>
          {chips.map((chip, index) => (
            <View key={`${index}-${chip}`} style={styles.chip}>
              <Text style={styles.chipLabel}>{chip}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {goalPreview ? (
        <Card radius={16} style={styles.block}>
          <Text style={styles.cardLabel}>Goal</Text>
          <Text style={styles.goalText}>{goalPreview}</Text>
        </Card>
      ) : null}

      {activities.length > 0 ? (
        <Card radius={16} style={styles.block}>
          <Text style={styles.cardLabel}>Experience</Text>
          {activities.map((line, index) => (
            <View
              key={`${index}-${line.slice(0, 24)}`}
              style={[styles.activityRow, index === activities.length - 1 && styles.activityLast]}
            >
              <View style={styles.activityDot} />
              <Text style={styles.activityText}>{line}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      {resumeName ? (
        <Pressable onPress={onResume} accessibilityRole="button" style={styles.block}>
          {({ pressed }) => (
            <Card radius={16} style={pressed ? styles.pressed : undefined}>
              <View style={styles.resumeRow}>
                <View style={styles.resumeIcon}>
                  <Ionicons name="document-text-outline" size={20} color={colors.purple} />
                </View>
                <View style={styles.resumeText}>
                  <Text style={styles.resumeLabel}>Resume</Text>
                  <Text style={styles.resumeName} numberOfLines={1}>
                    {resumeName}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
              </View>
            </Card>
          )}
        </Pressable>
      ) : isPremium ? (
        <Card radius={16} style={styles.block}>
          <Text style={styles.cardLabel}>Resume</Text>
          <Text style={styles.goalText}>
          You skipped this during setup. Add a PDF or image anytime.
          </Text>
          <Pressable
            onPress={onResume}
            accessibilityRole="button"
            style={({ pressed }) => [styles.addResumeBtn, pressed && styles.pressed]}
          >
            <Ionicons name="cloud-upload-outline" size={16} color={colors.purple} />
            <Text style={styles.addResumeLabel}>Add resume</Text>
          </Pressable>
        </Card>
      ) : null}
    </View>
  );
}

function GuestProfile({
  goal,
  onEditGoal,
  onLogin,
}: {
  goal: string | null;
  onEditGoal: () => void;
  onLogin: () => void;
}) {
  const preview = previewGoal(goal);

  return (
    <View>
      <Card radius={16} style={styles.block}>
        <Text style={styles.cardLabel}>Your goal</Text>
        <Text style={styles.goalText}>
          {preview || 'Write a short goal so Vetly can evaluate opportunities for you.'}
        </Text>
      </Card>
      <View style={styles.guestActions}>
        <GradientButton label="Edit your goal" onPress={onEditGoal} />
        <Pressable
          onPress={onLogin}
          accessibilityRole="button"
          accessibilityLabel="Demo sign-in, not real accounts"
          style={({ pressed }) => [styles.login, pressed && styles.pressed]}
        >
          <Text style={styles.loginLabel}>Demo sign-in</Text>
        </Pressable>
      </View>
    </View>
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
  headerRow: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 36,
    color: colors.textPrimary,
  },
  loading: {
    marginTop: 20,
    gap: 12,
  },
  pressed: {
    opacity: 0.6,
  },
  hero: {
    marginTop: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.purple,
  },
  name: {
    marginTop: 14,
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
  editPill: {
    marginTop: 14,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.purpleBorder,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editPillLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.purple,
  },
  chips: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.purpleTint,
  },
  chipLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.purple,
  },
  block: {
    marginTop: 16,
  },
  cardLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  goalText: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  activityRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  activityLast: {
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.purple,
    marginTop: 7,
    marginRight: 12,
  },
  activityText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  resumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resumeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  resumeLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  resumeName: {
    marginTop: 2,
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  addResumeBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.purpleBorder,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addResumeLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.purple,
  },
  guestActions: {
    marginTop: 24,
  },
  login: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginLabel: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.purple,
  },
});

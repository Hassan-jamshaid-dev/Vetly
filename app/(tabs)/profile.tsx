import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { GradientButton } from '@/components/GradientButton';
import { ScreenWrapper } from '@/components/ScreenWrapper';
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

const TAB_BAR_SPACER = 24;

function activityLines(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  const byLine = trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (byLine.length > 1) return byLine;
  const byBullet = trimmed.split(/\s*[•\-\u2013]\s+/).map((part) => part.trim()).filter(Boolean);
  if (byBullet.length > 1) return byBullet;
  return [trimmed];
}

function displayGoal(raw: string | null): string | null {
  if (!raw) return null;
  const normalized = raw.replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized : null;
}

// Profile tab: the person page. Settings live on /settings (gear).
export default function ProfileScreen() {
  const router = useRouter();
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
    <ScreenWrapper
      chrome={
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            Profile
          </Text>
          <Pressable
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
      }
      contentContainerStyle={styles.content}
    >
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
          onEdit={() =>
            router.push(
              isPremium
                ? { pathname: '/premium-onboarding', params: { mode: 'edit' } }
                : { pathname: '/goal', params: { mode: 'edit' } },
            )
          }
          onResume={() => router.push({ pathname: '/resume', params: { mode: 'edit' } })}
        />
      ) : (
        <GuestProfile
          goal={goal}
          onEditGoal={() => router.push({ pathname: '/goal', params: { mode: 'edit' } })}
          onLogin={() => router.push('/signup')}
        />
      )}
    </ScreenWrapper>
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
  const goalDisplay = displayGoal(goal ?? profile?.situation ?? null);
  const resumeName = profile?.resumeName?.trim() || null;

  return (
    <View style={styles.stack}>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{initial}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
          <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={isPremium ? 'Edit profile' : 'Edit your goal'}
          style={({ pressed }) => [styles.editPill, pressed && styles.pressed]}
        >
          <Text style={styles.editPillLabel}>{isPremium ? 'Edit profile' : 'Edit your goal'}</Text>
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

      <Card radius={16} style={styles.block}>
        <Text style={styles.cardLabel}>Goal</Text>
        {goalDisplay ? (
          <Text style={styles.goalText} numberOfLines={4} ellipsizeMode="tail">
            {goalDisplay}
          </Text>
        ) : (
          <Text style={styles.goalEmpty}>
            Add a short goal so evaluations have something to work with.
          </Text>
        )}
      </Card>

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
        <Pressable
          onPress={onResume}
          accessibilityRole="button"
          accessibilityLabel={`Resume, ${resumeName}`}
          style={styles.block}
        >
          {({ pressed }) => (
            <Card radius={16} style={pressed ? styles.rowPressed : undefined}>
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
            accessibilityLabel="Add resume"
            style={({ pressed }) => [styles.addResumeBtn, pressed && styles.pressed]}
          >
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
  const preview = displayGoal(goal);

  return (
    <View style={styles.stack}>
      <Card radius={16} style={styles.block}>
        <Text style={styles.cardLabel}>Your goal</Text>
        {preview ? (
          <Text style={styles.goalText} numberOfLines={4} ellipsizeMode="tail">
            {preview}
          </Text>
        ) : (
          <Text style={styles.goalEmpty}>
            Write a short goal so Vetly can evaluate opportunities for you.
          </Text>
        )}
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: TAB_BAR_SPACER,
  },
  headerRow: {
    minHeight: 44,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 36,
    color: colors.textPrimary,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    marginTop: 20,
    gap: 12,
  },
  stack: {
    gap: 16,
  },
  pressed: {
    opacity: 0.6,
  },
  rowPressed: {
    backgroundColor: colors.backgroundSoft,
  },
  hero: {
    marginTop: 8,
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
    marginTop: 12,
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  editPill: {
    marginTop: 14,
    minHeight: 44,
    borderRadius: 22,
    borderCurve: 'continuous',
    backgroundColor: colors.purpleTint,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPillLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.purple,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.purpleTint,
  },
  chipLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.purple,
  },
  block: {
    marginTop: 0,
  },
  cardLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  goalText: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
    flexShrink: 1,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  goalEmpty: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  activityRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  activityLast: {
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.purple,
    opacity: 0.45,
    marginTop: 8,
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
    minHeight: 44,
  },
  resumeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderCurve: 'continuous',
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
    marginTop: 12,
    alignSelf: 'flex-start',
    minHeight: 44,
    borderRadius: 22,
    borderCurve: 'continuous',
    backgroundColor: colors.purpleTint,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addResumeLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.purple,
  },
  guestActions: {
    gap: 4,
  },
  login: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  loginLabel: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.purple,
  },
});

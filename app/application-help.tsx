import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { ScreenHeader } from '@/components/ScreenHeader';
import { getIsPremium } from '@/storage/premiumStorage';
import { getProfile, hasResumeFile } from '@/storage/profileStorage';
import { getCurrentEvaluation } from '@/store/evaluationStore';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { showAlert } from '@/utils/dialog';
import type { Evaluation } from '@/types/evaluation';

function uniqueLines(groups: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const group of groups) {
    for (const line of group) {
      const trimmed = line.trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      out.push(trimmed);
    }
  }
  return out;
}

// Premium-only form-filling help. Results only opens this when the opportunity
// is an application; anything else stays on the evaluation.
export default function ApplicationHelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(() => getCurrentEvaluation());
  const [missingResume, setMissingResume] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const current = getCurrentEvaluation();
      setEvaluation(current);
      if (!current) {
        router.replace('/(tabs)/home');
        return;
      }
      if (current.hasApplication !== true) {
        router.replace('/results');
        return;
      }
      Promise.all([getIsPremium(), getProfile()]).then(([premium, profile]) => {
        if (cancelled) return;
        if (!premium) {
          router.replace('/paywall');
          return;
        }
        setMissingResume(!hasResumeFile(profile));
      });
      return () => {
        cancelled = true;
      };
    }, [router]),
  );

  if (!evaluation || evaluation.hasApplication !== true) return null;

  const formHelp = evaluation.formHelp.filter((line) => line.trim().length > 0);
  const highlight = uniqueLines([evaluation.helps, evaluation.fills]);
  const careful = uniqueLines([evaluation.hurts, evaluation.doesNotFill]);

  const copyStarter = async () => {
    try {
      await Clipboard.setStringAsync(evaluation.guidance);
      showAlert('Copied', 'Starter paragraph copied.');
    } catch {
      showAlert('Copy this text', 'Select the paragraph below and copy it.');
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScreenHeader
        onBack={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/results');
        }}
        title="How to fill this form"
        withSafeArea
      />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{evaluation.title}</Text>
        <Text style={styles.lede}>
          Fill this from your profile and goal. Answer what they asked — this is not extra homework
          on top of the evaluation.
        </Text>

        <Text style={styles.sectionHeading}>How to fill this form</Text>
        <Card radius={16} padding={16}>
          {formHelp.length > 0 ? (
            formHelp.map((line, index) => (
              <StepRow
                key={`step-${index}`}
                index={index + 1}
                text={line}
                isLast={index === formHelp.length - 1}
              />
            ))
          ) : (
            <Text style={styles.empty}>
              Use your saved profile: year, goal, and one specific activity. Keep answers inside
              their word limit.
            </Text>
          )}
        </Card>

        {missingResume ? (
          <Pressable
            onPress={() => router.push({ pathname: '/resume', params: { mode: 'edit' } })}
            accessibilityRole="button"
            style={styles.resumeCta}
          >
            {({ pressed }) => (
              <Card radius={16} style={pressed ? styles.pressed : undefined}>
                <View style={styles.resumeRow}>
                  <View style={styles.resumeIcon}>
                    <Ionicons name="document-text-outline" size={20} color={colors.purple} />
                  </View>
                  <View style={styles.resumeText}>
                    <Text style={styles.resumeTitle}>Add your resume</Text>
                    <Text style={styles.resumeHint}>
                      You skipped this earlier. Attach it here so the form is not missing a file.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
                </View>
              </Card>
            )}
          </Pressable>
        ) : null}

        <Text style={styles.sectionHeading}>What to highlight</Text>
        <Card radius={16} padding={16}>
          {highlight.length > 0 ? (
            highlight.map((line, index) => (
              <BulletRow key={`h-${index}`} text={line} tone="positive" isLast={index === highlight.length - 1} />
            ))
          ) : (
            <Text style={styles.empty}>Nothing extra to highlight beyond your existing story.</Text>
          )}
        </Card>

        <Text style={styles.sectionHeading}>What to be careful of</Text>
        <Card radius={16} padding={16}>
          {careful.length > 0 ? (
            careful.map((line, index) => (
              <BulletRow key={`c-${index}`} text={line} tone="negative" isLast={index === careful.length - 1} />
            ))
          ) : (
            <Text style={styles.empty}>No major risks called out for this one.</Text>
          )}
        </Card>

        <Text style={styles.sectionHeading}>Starter paragraph</Text>
        <Card radius={16}>
          <Text selectable style={styles.letter}>
            {evaluation.guidance}
          </Text>
          <Pressable
            onPress={() => {
              void copyStarter();
            }}
            accessibilityRole="button"
            style={({ pressed }) => [styles.copyBtn, pressed && styles.pressed]}
          >
            <Ionicons name="copy-outline" size={16} color={colors.purple} />
            <Text style={styles.copyLabel}>Copy</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </View>
  );
}

function StepRow({ index, text, isLast }: { index: number; text: string; isLast: boolean }) {
  return (
    <View style={[styles.bulletRow, !isLast && styles.bulletSep]}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepNum}>{index}</Text>
      </View>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function BulletRow({
  text,
  tone,
  isLast,
}: {
  text: string;
  tone: 'positive' | 'negative';
  isLast: boolean;
}) {
  return (
    <View style={[styles.bulletRow, !isLast && styles.bulletSep]}>
      <View
        style={[
          styles.dot,
          { backgroundColor: tone === 'positive' ? colors.success : colors.danger },
        ]}
      />
      <Text style={styles.bulletText}>{text}</Text>
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
  lede: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  sectionHeading: {
    marginTop: 24,
    marginBottom: 12,
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  letter: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  copyBtn: {
    marginTop: 16,
    alignSelf: 'flex-start',
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.purpleBorder,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.purple,
  },
  pressed: {
    opacity: 0.6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  bulletSep: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
    marginRight: 12,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginTop: 1,
    marginRight: 12,
    backgroundColor: colors.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.purple,
  },
  bulletText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  resumeCta: {
    marginTop: 16,
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
  resumeTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  resumeHint: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});

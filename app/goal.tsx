import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, Keyboard, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { MultilineField } from '@/components/MultilineField';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { StickyBottomButton } from '@/components/StickyBottomButton';
import { WordCounter, countWords } from '@/components/WordCounter';
import { firstQueryParam } from '@/navigation/queryParam';
import { useResetToHome } from '@/navigation/useResetToHome';
import { getGoal, setGoal } from '@/storage/goalStorage';
import { getIsPremium } from '@/storage/premiumStorage';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

/** Premium still uses a word floor; free uses characters only. */
const PREMIUM_MIN_WORDS = 20;
const PREMIUM_MAX_WORDS = 2000;
/** Generous paste cap so Premium cannot dump a novel (~10 chars per word). */
const PREMIUM_MAX_CHARS = PREMIUM_MAX_WORDS * 10;
/** Free tier: character floor/ceiling (a single long token is one "word"). */
const FREE_MIN_CHARS = 300;
const FREE_MAX_CHARS = 1000;

const PLACEHOLDER_TEXT =
  'Example: I am a Grade 11 student aiming for top universities like Waterloo and MIT. I want to study Computer Engineering and eventually found a tech startup. Right now I am building my profile through extracurriculars and self-learning programming and AI. I care more about shipping projects I can show than collecting certificates, and I want to know which opportunities actually move that story forward.';

// Screen 3: Goal. Free onboarding + "Edit your goal" (Profile / Settings).
// Free: 300–1000 characters. Premium: 20–2000 words. Not premium-onboarding.
export default function GoalScreen() {
  const router = useRouter();
  const resetToHome = useResetToHome();
  const { mode } = useLocalSearchParams<{ mode?: string | string[] }>();
  const isEdit = firstQueryParam(mode) === 'edit';

  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [tierReady, setTierReady] = useState(false);
  // Guards against a second tap landing while the first save is still running.
  const savingRef = useRef(false);
  const goalInputRef = useRef<TextInput>(null);

  // Until Premium is known, use the larger cap so a stored 2000-word goal is
  // not truncated by TextInput maxLength={1000} on the first paint after Upgrade.
  const inputMaxLength = isPremium || !tierReady ? PREMIUM_MAX_CHARS : FREE_MAX_CHARS;

  // Re-read Premium on focus so Edit your goal picks up 2000 words right after Upgrade.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getIsPremium().then((value) => {
        if (cancelled) return;
        setIsPremium(value);
        setTierReady(true);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  // Native only: delayed programmatic focus after Get Started. On web that
  // focus() runs outside the user-gesture window, so the IME never opens and
  // the next tap looks "dead". Web relies on a real tap on the textarea.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') return;
      let cancelled = false;
      const task = InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => {
          if (!cancelled) goalInputRef.current?.focus();
        });
      });
      return () => {
        cancelled = true;
        task.cancel();
      };
    }, []),
  );

  // Prefill after the Premium cap is known so maxLength cannot clip a long
  // Premium goal. Also prefill on first-run when a goal was kept across launches.
  useEffect(() => {
    if (!tierReady) return;
    let cancelled = false;
    getGoal().then((saved) => {
      if (!cancelled && saved) setText(saved);
    });
    return () => {
      cancelled = true;
    };
  }, [tierReady]);

  const words = useMemo(() => countWords(text), [text]);
  const chars = text.length;
  const trimmedChars = text.trim().length;
  // Free: 300–1000 characters. Premium: 20–2000 words (no 1000-char cap).
  const overLimit = !tierReady
    ? false
    : isPremium
      ? words > PREMIUM_MAX_WORDS
      : trimmedChars > FREE_MAX_CHARS;
  const underMin = !tierReady
    ? false
    : isPremium
      ? words < PREMIUM_MIN_WORDS
      : trimmedChars < FREE_MIN_CHARS;
  const canContinue = tierReady && !underMin && !overLimit && !saving;
  const freeCounterColor =
    trimmedChars > FREE_MAX_CHARS
      ? colors.danger
      : trimmedChars >= FREE_MIN_CHARS
        ? colors.success
        : colors.muted;
  const hintText = !tierReady
    ? `At least ${FREE_MIN_CHARS} characters.`
    : isPremium
      ? overLimit
        ? `Please trim to ${PREMIUM_MAX_WORDS} words.`
        : `At least ${PREMIUM_MIN_WORDS} words.`
      : overLimit
        ? `Please trim to ${FREE_MAX_CHARS} characters.`
        : `At least ${FREE_MIN_CHARS} characters.`;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (isEdit) {
      router.replace('/(tabs)/profile');
      return;
    }
    router.replace('/onboarding');
  };

  const handleSave = async () => {
    if (savingRef.current || !canContinue) return;
    savingRef.current = true;
    setSaving(true);
    Keyboard.dismiss();
    try {
      const premium = await getIsPremium();
      const trimmed = text.trim();
      if (premium) {
        const wordCount = countWords(trimmed);
        if (wordCount < PREMIUM_MIN_WORDS || wordCount > PREMIUM_MAX_WORDS) {
          setIsPremium(true);
          return;
        }
      } else if (trimmed.length < FREE_MIN_CHARS || trimmed.length > FREE_MAX_CHARS) {
        setIsPremium(false);
        return;
      }
      setIsPremium(premium);
      await setGoal(trimmed);
      if (isEdit) {
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)/profile');
      } else {
        resetToHome();
      }
    } catch {
      // Storage failed; let the user try again.
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper
      keyboard
      onBack={handleBack}
      contentContainerStyle={styles.body}
      footer={
        <StickyBottomButton
          label={saving ? 'Saving...' : isEdit ? 'Save' : 'Continue'}
          onPress={handleSave}
          disabled={!canContinue}
        />
      }
    >
      <Text style={styles.heading}>{isEdit ? 'Edit your goal' : 'Tell us about yourself'}</Text>
      <Text style={styles.subheading}>
        Where you are now, and where you want to go. Vetly scores every opportunity against this.
      </Text>

      <View style={styles.field}>
        <Text style={[styles.limitCaption, overLimit && styles.hintError]}>
          {!tierReady || !isPremium
            ? `${FREE_MIN_CHARS}–${FREE_MAX_CHARS} characters`
            : `${PREMIUM_MIN_WORDS}–${PREMIUM_MAX_WORDS} words`}
        </Text>
        <MultilineField
          ref={goalInputRef}
          value={text}
          onChangeText={setText}
          maxLength={inputMaxLength}
          minHeight={220}
          placeholder={PLACEHOLDER_TEXT}
          autoCorrect
          autoCapitalize="sentences"
          accessibilityLabel="Describe your goals"
          hint={
            <Text style={[styles.hint, overLimit && styles.hintError]}>{hintText}</Text>
          }
          counter={
            !tierReady ? null : isPremium ? (
              <WordCounter count={words} min={PREMIUM_MIN_WORDS} max={PREMIUM_MAX_WORDS} />
            ) : (
              <Text style={[styles.charCounter, { color: freeCounterColor }]}>
                {chars} / {FREE_MAX_CHARS}
              </Text>
            )
          }
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  subheading: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  field: {
    marginTop: 28,
  },
  limitCaption: {
    marginBottom: 10,
    marginLeft: 2,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  charCounter: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
  },
  hint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.muted,
  },
  hintError: {
    color: colors.danger,
  },
});

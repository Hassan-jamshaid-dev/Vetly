import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { GradientButton } from '@/components/GradientButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { WordCounter, countWords } from '@/components/WordCounter';
import { firstQueryParam } from '@/navigation/queryParam';
import { useResetToHome } from '@/navigation/useResetToHome';
import { getGoal, setGoal } from '@/storage/goalStorage';
import { getIsPremium } from '@/storage/premiumStorage';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

const MIN_WORDS = 20;
/** Free tier: a single long token is one "word", so cap by characters. */
const FREE_MAX_CHARS = 500;
const PREMIUM_MAX_WORDS = 2000;
/** Generous paste cap so Premium cannot dump a novel (~10 chars per word). */
const PREMIUM_MAX_CHARS = PREMIUM_MAX_WORDS * 10;

const PLACEHOLDER_TEXT =
  'Example: I am a Grade 11 student aiming for top universities like Waterloo and MIT. I want to study Computer Engineering and eventually found a tech startup. Right now I am building my profile through extracurriculars and self learning programming and AI.';

// Screen 3: Goal. The user describes who they are and what they are aiming for.
// Vetly evaluates every opportunity against this text.
// Also used as "Edit your goal" (from Settings) via /goal?mode=edit.
export default function GoalScreen() {
  const router = useRouter();
  const resetToHome = useResetToHome();
  const insets = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode?: string | string[] }>();
  const isEdit = firstQueryParam(mode) === 'edit';

  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [tierReady, setTierReady] = useState(false);
  // Guards against a second tap landing while the first save is still running.
  const savingRef = useRef(false);

  // Until Premium is known, use the larger cap so a stored 2000-word goal is
  // not truncated by TextInput maxLength={500} on the first paint after Upgrade.
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

  // Load the saved goal only after the Premium cap is known, so TextInput
  // maxLength cannot clip a long Premium goal down to 500 characters.
  useEffect(() => {
    if (!isEdit || !tierReady) return;
    let cancelled = false;
    getGoal().then((saved) => {
      if (!cancelled && saved) setText(saved);
    });
    return () => {
      cancelled = true;
    };
  }, [isEdit, tierReady]);

  const words = useMemo(() => countWords(text), [text]);
  const chars = text.length;
  // Free: 500 characters. Premium: 2000 words (no 500-char cap).
  const overLimit = !tierReady
    ? false
    : isPremium
      ? words > PREMIUM_MAX_WORDS
      : chars > FREE_MAX_CHARS;
  const canContinue = tierReady && words >= MIN_WORDS && !overLimit && !saving;
  const freeCounterColor =
    chars > FREE_MAX_CHARS
      ? colors.danger
      : words >= MIN_WORDS
        ? colors.success
        : colors.textSecondary;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (isEdit) {
      router.replace('/settings');
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
      const wordCount = countWords(trimmed);
      if (wordCount < MIN_WORDS) return;
      if (premium) {
        if (wordCount > PREMIUM_MAX_WORDS) {
          setIsPremium(true);
          return;
        }
      } else if (trimmed.length > FREE_MAX_CHARS) {
        setIsPremium(false);
        return;
      }
      setIsPremium(premium);
      await setGoal(trimmed);
      if (isEdit) {
        if (router.canGoBack()) router.back();
        else router.replace('/settings');
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
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Tapping any empty space closes the keyboard. */}
          <Pressable style={styles.flex} onPress={Keyboard.dismiss} accessible={false}>
            <ScreenHeader onBack={handleBack} withSafeArea />

            <View style={styles.body}>
              <Text style={styles.heading}>{isEdit ? 'Edit your goal' : 'Tell us about yourself'}</Text>
              <Text style={styles.subheading}>
                Where you are now, and where you want to go. Vetly scores every opportunity against
                this.
              </Text>

              <Card style={styles.card}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  multiline
                  maxLength={inputMaxLength}
                  textAlignVertical="top"
                  placeholder={PLACEHOLDER_TEXT}
                  placeholderTextColor={colors.placeholder}
                  style={styles.input}
                  autoCorrect
                  autoCapitalize="sentences"
                  accessibilityLabel="Describe your goals"
                />
                <View style={styles.counterRow}>
                  {!tierReady ? null : isPremium ? (
                    <WordCounter count={words} min={MIN_WORDS} max={PREMIUM_MAX_WORDS} />
                  ) : (
                    <Text style={[styles.charCounter, { color: freeCounterColor }]}>
                      {chars} / {FREE_MAX_CHARS} characters
                    </Text>
                  )}
                </View>
              </Card>

              <Text style={[styles.helper, overLimit && styles.helperError]}>
                {!tierReady
                  ? `At least ${MIN_WORDS} words.`
                  : isPremium
                    ? overLimit
                      ? `Please trim to ${PREMIUM_MAX_WORDS} words.`
                      : `At least ${MIN_WORDS} words.`
                    : overLimit
                      ? `Please trim to ${FREE_MAX_CHARS} characters.`
                      : `At least ${MIN_WORDS} words.`}
              </Text>
            </View>
          </Pressable>
        </ScrollView>

        {/* Pinned above the keyboard / bottom safe area. */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <GradientButton
            label={saving ? 'Saving...' : isEdit ? 'Save' : 'Continue'}
            onPress={handleSave}
            disabled={!canContinue}
          />
        </View>
      </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 36,
    color: colors.textPrimary,
  },
  subheading: {
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  card: {
    marginTop: 24,
  },
  input: {
    minHeight: 200,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
    padding: 0,
  },
  counterRow: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  charCounter: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  helper: {
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  helperError: {
    color: colors.danger,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: colors.backgroundSoft,
  },
});

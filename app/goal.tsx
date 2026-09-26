import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  InteractionManager,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollView,
} from 'react-native';

import { Card } from '@/components/Card';
import { MultilineField } from '@/components/MultilineField';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { StickyBottomButton } from '@/components/StickyBottomButton';
import { firstQueryParam } from '@/navigation/queryParam';
import { useResetToHome } from '@/navigation/useResetToHome';
import { getGoal, setGoal } from '@/storage/goalStorage';
import { getDisplayName, setDisplayName } from '@/storage/nameStorage';
import { getIsPremium } from '@/storage/premiumStorage';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

/** Free tier: character floor/ceiling. */
const FREE_MIN_CHARS = 300;
const FREE_MAX_CHARS = 1000;
const NAME_MAX = 80;

const PLACEHOLDER_TEXT =
  'Example: I am a Grade 11 student aiming for top universities like Waterloo and MIT. I want to study Computer Engineering and eventually found a tech startup. Right now I am building my profile through extracurriculars and self-learning programming and AI. I care more about shipping projects I can show than collecting certificates, and I want to know which opportunities actually move that story forward.';

// Screen 3: Goal. Free onboarding + "Edit your goal" (Profile / Settings).
// Free: 300–1000 characters. Premium users are redirected to premium-onboarding.
export default function GoalScreen() {
  const router = useRouter();
  const resetToHome = useResetToHome();
  const { mode } = useLocalSearchParams<{ mode?: string | string[] }>();
  const isEdit = firstQueryParam(mode) === 'edit';

  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [tierReady, setTierReady] = useState(false);
  const [keyboardPad, setKeyboardPad] = useState(0);
  // Guards against a second tap landing while the first save is still running.
  const savingRef = useRef(false);
  const nameInputRef = useRef<TextInput>(null);
  const goalInputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const goalBlockY = useRef(0);

  // Premium users edit the structured profile, not this free goal screen.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getIsPremium().then((premium) => {
        if (cancelled) return;
        if (premium) {
          router.replace({ pathname: '/premium-onboarding', params: { mode: 'edit' } });
          return;
        }
        setTierReady(true);
      });
      return () => {
        cancelled = true;
      };
    }, [router]),
  );

  // Prefill name + goal once we know this is the free path.
  useEffect(() => {
    if (!tierReady) return;
    let cancelled = false;
    Promise.all([getGoal(), getDisplayName()]).then(([savedGoal, savedName]) => {
      if (cancelled) return;
      if (savedGoal) setText(savedGoal);
      if (savedName) setName(savedName);
    });
    return () => {
      cancelled = true;
    };
  }, [tierReady]);

  // Keep the focused goal field (and caret) above the keyboard.
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvent, (event) => {
      const height = event.endCoordinates?.height ?? 0;
      // Android already resizes the window; only add scroll padding on iOS.
      if (Platform.OS === 'ios') setKeyboardPad(height);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          y: Math.max(0, goalBlockY.current - 12),
          animated: true,
        });
      });
    });
    const onHide = Keyboard.addListener(hideEvent, () => setKeyboardPad(0));
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  // Native only: focus the name field once after Get Started. Web relies on a
  // real tap so the IME opens inside a user gesture.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web' || !tierReady) return;
      let cancelled = false;
      const task = InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => {
          if (!cancelled) nameInputRef.current?.focus();
        });
      });
      return () => {
        cancelled = true;
        task.cancel();
      };
    }, [tierReady]),
  );

  const chars = text.length;
  const trimmedChars = text.trim().length;
  const nameOk = name.trim().length > 0;
  const overLimit = tierReady && trimmedChars > FREE_MAX_CHARS;
  const underMin = tierReady && trimmedChars < FREE_MIN_CHARS;
  const canContinue = tierReady && nameOk && !underMin && !overLimit && !saving;
  const freeCounterColor =
    trimmedChars > FREE_MAX_CHARS
      ? colors.danger
      : trimmedChars >= FREE_MIN_CHARS
        ? colors.success
        : colors.muted;
  const hintText = !tierReady
    ? `At least ${FREE_MIN_CHARS} characters.`
    : overLimit
      ? `Please trim to ${FREE_MAX_CHARS} characters.`
      : `At least ${FREE_MIN_CHARS} characters.`;

  const scrollGoalIntoView = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, goalBlockY.current - 12),
        animated: true,
      });
    });
  };

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
      const trimmed = text.trim();
      const trimmedName = name.trim();
      if (!trimmedName || trimmed.length < FREE_MIN_CHARS || trimmed.length > FREE_MAX_CHARS) {
        return;
      }
      await setDisplayName(trimmedName);
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
      scrollRef={scrollRef}
      contentContainerStyle={[styles.body, { paddingBottom: 24 + keyboardPad }]}
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

      <Text style={styles.nameLabel}>Your name</Text>
      <Card radius={20} padding={0} style={styles.nameCard}>
        <TextInput
          ref={nameInputRef}
          value={name}
          onChangeText={(value) => setName(value.slice(0, NAME_MAX))}
          placeholder="First name or nickname"
          placeholderTextColor={colors.placeholder}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={NAME_MAX}
          returnKeyType="next"
          onSubmitEditing={() => goalInputRef.current?.focus()}
          style={styles.nameInput}
          accessibilityLabel="Your name"
        />
      </Card>

      <View
        style={styles.field}
        onLayout={(event) => {
          goalBlockY.current = event.nativeEvent.layout.y;
        }}
      >
        <Text style={[styles.limitCaption, overLimit && styles.hintError]}>
          {FREE_MIN_CHARS}–{FREE_MAX_CHARS} characters
        </Text>
        <MultilineField
          ref={goalInputRef}
          value={text}
          onChangeText={setText}
          maxLength={FREE_MAX_CHARS}
          minHeight={220}
          placeholder={PLACEHOLDER_TEXT}
          autoCorrect
          autoCapitalize="sentences"
          accessibilityLabel="Describe your goals"
          onFocus={scrollGoalIntoView}
          hint={
            <Text style={[styles.hint, overLimit && styles.hintError]}>{hintText}</Text>
          }
          counter={
            tierReady ? (
              <Text style={[styles.charCounter, { color: freeCounterColor }]}>
                {chars} / {FREE_MAX_CHARS}
              </Text>
            ) : null
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
  nameLabel: {
    marginTop: 28,
    marginBottom: 10,
    marginLeft: 2,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  nameCard: {
    overflow: 'hidden',
  },
  nameInput: {
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
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

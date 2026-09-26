import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ScrollView,
} from 'react-native';

import { ExampleCard } from '@/components/ExampleCard';
import { MultilineField } from '@/components/MultilineField';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { StickyBottomButton } from '@/components/StickyBottomButton';
import { evaluateOpportunity } from '@/services/evaluation';
import { saveEvaluationRemote } from '@/services/evaluationCloud';
import { getGoal } from '@/storage/goalStorage';
import { appendHistory } from '@/storage/historyStorage';
import { getIsPremium } from '@/storage/premiumStorage';
import { getDisplayName } from '@/storage/nameStorage';
import { getProfile } from '@/storage/profileStorage';
import { consumeOne, getRemainingToday } from '@/storage/usageStorage';
import { setCurrentEvaluation } from '@/store/evaluationStore';
import { colors } from '@/theme/colors';
import { fonts, type } from '@/theme/typography';
import { showAlert } from '@/utils/dialog';
import { isUrlOnlySubmission, URL_ONLY_MESSAGE } from '@/utils/urlOnly';

const MAX_CHARS = 2000;

const INPUT_PLACEHOLDER =
  'Paste the listing text, or describe the internship, hackathon, MUN, or society.';

// Example opportunities users can tap to fill the textarea.
const EXAMPLES = [
  {
    icon: 'code-slash-outline',
    title: 'Hack Club Hackathon',
    url: 'https://hackclub.com',
    description:
      'Hack Club Hackathon: a high-school weekend hackathon where you ship a project with other student builders. Open to any teenager; you leave with a demo, teammates, and something you can actually show.',
  },
  {
    icon: 'globe-outline',
    title: 'Model United Nations Conference',
    url: 'https://www.harvardmun.org',
    description:
      'Model United Nations Conference: a weekend of debate, writing, and negotiation with students from other schools. Strong for communication and leadership; less direct if your goal is CS or engineering.',
  },
  {
    icon: 'leaf-outline',
    title: 'Youth Climate Summit',
    url: 'https://www.youthclimatesummit.org/apply',
    description:
      'Youth Climate Summit: a three-day gathering of student climate advocates with panels, workshops, and a youth declaration on climate action.',
  },
] as const;

// Stack screen: evaluate an opportunity. Lives above the tabs so Home stays a dashboard.
export default function EvaluateScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  // Blocks a second Analyze tap while the first is still running.
  const analyzingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const premium = await getIsPremium();
        if (cancelled) return;
        setIsPremium(premium);
        if (premium) {
          setRemaining(null);
          return;
        }
        const value = await getRemainingToday();
        if (!cancelled) setRemaining(value);
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const trimmed = text.trim();
  const canAnalyze = (trimmed.length > 0 || imageUri !== null) && !isAnalyzing;

  const goHome = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };

  const handleAnalyze = async () => {
    if (analyzingRef.current || !canAnalyze) return;

    if (trimmed && isUrlOnlySubmission(trimmed) && !imageUri) {
      showAlert('Paste the listing', URL_ONLY_MESSAGE);
      return;
    }

    analyzingRef.current = true;
    Keyboard.dismiss();

    try {
      const premium = await getIsPremium();
      setIsPremium(premium);

      if (!premium) {
        const left = await getRemainingToday();
        setRemaining(left);
        if (left <= 0) {
          router.push('/paywall');
          return;
        }
      }

      setIsAnalyzing(true);
      const [goal, profile, displayName] = await Promise.all([
        getGoal(),
        getProfile(),
        getDisplayName(),
      ]);
      // Free: name + goal. Premium: also profile fields (no resume bytes).
      const evaluation = await evaluateOpportunity(
        { text: trimmed, imageUri },
        goal ?? '',
        premium ? profile : null,
        displayName,
      );

      if (premium) {
        await appendHistory(evaluation);
      } else {
        const leftAfter = await consumeOne();
        setRemaining(leftAfter);
      }
      // Free plan: every analyze is stored under this device id. Local History
      // stays Premium-only.
      void saveEvaluationRemote(evaluation);
      setCurrentEvaluation(evaluation, { fromEvaluate: true });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
        /* Haptics are a nicety; ignore devices without them. */
      });
      router.push('/results');
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : 'Please try again.';
      showAlert('Could not score this', message);
    } finally {
      analyzingRef.current = false;
      setIsAnalyzing(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showAlert(
          'Photo access needed',
          'To upload a screenshot, allow Vetly to access your photos in your device Settings.',
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      showAlert('Could not open photos', 'Please try again.');
    }
  };

  const handleExample = (description: string) => {
    Keyboard.dismiss();
    // Examples fill listing text only — never a bare URL (URLs are not fetched).
    setText(description);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <ScreenWrapper
      keyboard
      title="Evaluate"
      onBack={goHome}
      scrollRef={scrollRef}
      contentContainerStyle={styles.content}
      footer={
        <StickyBottomButton
          label={isAnalyzing ? 'Analyzing...' : 'Analyze'}
          onPress={handleAnalyze}
          disabled={!canAnalyze}
          icon={
            isAnalyzing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : undefined
          }
          style={styles.footerBar}
        >
          {isPremium ? (
            <Text style={styles.quota} maxFontSizeMultiplier={1.3}>
              Unlimited evaluations
            </Text>
          ) : remaining !== null ? (
            <Text
              style={[styles.quota, remaining === 0 && styles.quotaWarning]}
              maxFontSizeMultiplier={1.3}
            >
              {remaining === 0
                ? 'No free evaluations left today'
                : `${remaining} free evaluation${remaining === 1 ? '' : 's'} left today`}
            </Text>
          ) : null}
        </StickyBottomButton>
      }
    >
      <View>
        <Text style={styles.headline}>What are you considering?</Text>

        <Text style={styles.fieldLabel}>Opportunity</Text>
        <MultilineField
          value={text}
          onChangeText={setText}
          maxLength={MAX_CHARS}
          minHeight={148}
          placeholder={INPUT_PLACEHOLDER}
          editable={!isAnalyzing}
          accessibilityLabel="Opportunity description"
          onFocus={() => {
            requestAnimationFrame(() => {
              scrollRef.current?.scrollTo({ y: 0, animated: true });
            });
          }}
          counter={
            <Text style={styles.charCounter}>
              {text.length} / {MAX_CHARS}
            </Text>
          }
        />

        <View style={styles.uploadRow}>
          <Pressable
            onPress={handlePickImage}
            disabled={isAnalyzing}
            accessibilityRole="button"
            accessibilityLabel="Upload screenshot"
            style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
          >
            <Ionicons name="image-outline" size={18} color={colors.purple} />
            <Text style={styles.pillLabel}>Screenshot</Text>
          </Pressable>

          {imageUri ? (
            <View style={styles.thumbWrap}>
              <Image source={{ uri: imageUri }} style={styles.thumb} />
              <Pressable
                onPress={() => setImageUri(null)}
                hitSlop={14}
                accessibilityRole="button"
                accessibilityLabel="Remove screenshot"
                style={styles.removeBadge}
              >
                <Ionicons name="close" size={12} color={colors.white} />
              </Pressable>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionHeading}>Examples</Text>
        <View style={styles.examples}>
          {EXAMPLES.map((example) => (
            <ExampleCard
              key={example.title}
              icon={example.icon}
              title={example.title}
              url={example.url}
              onPress={() => handleExample(example.description)}
            />
          ))}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  pressed: {
    opacity: 0.6,
  },
  headline: {
    marginTop: 12,
    ...type.h2,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
  },
  fieldLabel: {
    ...type.label,
    marginTop: 28,
    marginBottom: 10,
    fontFamily: fonts.semibold,
    letterSpacing: 0.4,
  },
  charCounter: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  uploadRow: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  pill: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.purpleBorder,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillLabel: {
    marginLeft: 8,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 18,
    color: colors.purple,
  },
  thumbWrap: {
    width: 64,
    height: 64,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: colors.backgroundSoft,
  },
  removeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  sectionHeading: {
    ...type.label,
    marginTop: 36,
    marginBottom: 14,
    fontFamily: fonts.semibold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  examples: {
    gap: 12,
  },
  footerBar: {
    paddingHorizontal: 20,
  },
  quota: {
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  quotaWarning: {
    color: colors.warning,
  },
});

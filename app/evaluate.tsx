import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { ExampleCard } from '@/components/ExampleCard';
import { GradientButton } from '@/components/GradientButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { evaluateOpportunity } from '@/services/evaluation';
import { saveEvaluationRemote } from '@/services/evaluationCloud';
import { getGoal } from '@/storage/goalStorage';
import { appendHistory } from '@/storage/historyStorage';
import { getIsPremium } from '@/storage/premiumStorage';
import { getProfile } from '@/storage/profileStorage';
import { consumeOne, getRemainingToday } from '@/storage/usageStorage';
import { setCurrentEvaluation } from '@/store/evaluationStore';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { showAlert } from '@/utils/dialog';

const MAX_CHARS = 2000;

const INPUT_PLACEHOLDER =
  'Paste a link or describe the internship, hackathon, MUN, or society.';

// The three example opportunities. Descriptions are written so the mock
// evaluation engine recognises them by title.
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
  const insets = useSafeAreaInsets();
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
      const [goal, profile] = await Promise.all([getGoal(), getProfile()]);
      const evaluation = await evaluateOpportunity(
        { text: trimmed, imageUri },
        goal ?? '',
        profile,
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
    } catch {
      showAlert('Something went wrong', 'Please try again.');
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

  const handleExample = (description: string, url: string) => {
    Keyboard.dismiss();
    setText(`${description}\n${url}`);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScreenHeader onBack={goHome} title="Evaluate" withSafeArea />
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={Keyboard.dismiss} accessible={false}>
          <Text style={styles.greeting}>What are you considering?</Text>

          <Card padding={18} style={styles.inputCard}>
            <Text style={styles.cardHeading}>Paste or describe it</Text>
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              maxLength={MAX_CHARS}
              textAlignVertical="top"
              placeholder={INPUT_PLACEHOLDER}
              placeholderTextColor={colors.placeholder}
              style={styles.input}
              editable={!isAnalyzing}
              accessibilityLabel="Opportunity description"
            />
            {text.length > 0 ? (
              <Text style={styles.charCounter}>
                {text.length} / {MAX_CHARS} characters
              </Text>
            ) : null}

            <View style={styles.uploadRow}>
              <Pressable
                onPress={handlePickImage}
                disabled={isAnalyzing}
                accessibilityRole="button"
                style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
              >
                <Ionicons name="image-outline" size={18} color={colors.purple} />
                <Text style={styles.pillLabel}>Upload screenshot</Text>
              </Pressable>

              {imageUri ? (
                <View style={styles.thumbWrap}>
                  <Image source={{ uri: imageUri }} style={styles.thumb} />
                  <Pressable
                    onPress={() => setImageUri(null)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Remove screenshot"
                    style={styles.removeBadge}
                  >
                    <Ionicons name="close" size={12} color={colors.white} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          </Card>

          <View style={styles.analyzeWrap}>
            <GradientButton
              label={isAnalyzing ? 'Analyzing...' : 'Analyze'}
              onPress={handleAnalyze}
              disabled={!canAnalyze}
              icon={
                isAnalyzing ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Ionicons name="sparkles" size={18} color={colors.white} />
                )
              }
            />
          </View>

          <Text style={styles.sectionHeading}>Examples</Text>
          <View style={styles.examples}>
            {EXAMPLES.map((example) => (
              <ExampleCard
                key={example.title}
                icon={example.icon}
                title={example.title}
                url={example.url}
                onPress={() => handleExample(example.description, example.url)}
              />
            ))}
          </View>
        </Pressable>
      </ScrollView>
      {isPremium ? (
        <Text style={[styles.footer, { paddingBottom: insets.bottom + 10 }]} maxFontSizeMultiplier={1.3}>
          Unlimited evaluations
        </Text>
      ) : remaining !== null ? (
        <Text
          style={[styles.footer, remaining === 0 && styles.footerWarning, { paddingBottom: insets.bottom + 10 }]}
          maxFontSizeMultiplier={1.3}
        >
          {remaining === 0
            ? 'No free evaluations left today'
            : `${remaining} free evaluation${remaining === 1 ? '' : 's'} left today`}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  pressed: {
    opacity: 0.6,
  },
  greeting: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 34,
    color: colors.textPrimary,
  },
  inputCard: {
    marginTop: 20,
  },
  cardHeading: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  input: {
    marginTop: 10,
    minHeight: 120,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
    padding: 0,
  },
  charCounter: {
    marginTop: 8,
    alignSelf: 'flex-end',
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  uploadRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.purpleBorder,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillLabel: {
    marginLeft: 8,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.purple,
  },
  thumbWrap: {
    marginLeft: 12,
    width: 64,
    height: 64,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.backgroundSoft,
  },
  removeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  analyzeWrap: {
    marginTop: 16,
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
  examples: {
    gap: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    backgroundColor: colors.backgroundSoft,
  },
  footerWarning: {
    color: colors.warning,
  },
});

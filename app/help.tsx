import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { StickyBottomButton } from '@/components/StickyBottomButton';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

const STEPS = [
  {
    icon: 'create-outline' as const,
    title: 'Write your goal',
    body: 'Who you are now and where you want to go. Free: 300–1000 characters. Premium: 500–5000 characters with grade, universities, and career. Vetly scores every opportunity against this.',
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'Evaluate an opportunity',
    body: 'Paste a listing or upload a screenshot. The more detail you add, the more useful the score.',
  },
  {
    icon: 'analytics-outline' as const,
    title: 'Read the score',
    body: 'A 1–10 match against your goal — know before you spend the weekend applying.',
  },
  {
    icon: 'lock-closed-outline' as const,
    title: 'What Premium adds',
    body: 'Unlimited evaluations, saved History, and application guidance. Free is 3 evaluations per day; History stays locked.',
  },
];

export default function HelpScreen() {
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };

  return (
    <ScreenWrapper
      title="How to use Vetly"
      onBack={goBack}
      contentContainerStyle={styles.body}
      footer={
        <StickyBottomButton
          label="Evaluate an opportunity"
          onPress={() => router.push('/evaluate')}
          trailingIcon={<Ionicons name="arrow-forward" size={18} color={colors.white} />}
        />
      }
    >
      <Text style={styles.lede}>
        Reverse discovery: you bring an opportunity you already found. Vetly tells you if it fits
        your goal.
      </Text>

      {STEPS.map((step) => (
        <Card key={step.title} radius={16} style={styles.card}>
          <View style={styles.row}>
            <View style={styles.icon}>
              <Ionicons name={step.icon} size={18} color={colors.purple} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{step.title}</Text>
              <Text style={styles.bodyText}>{step.body}</Text>
            </View>
          </View>
        </Card>
      ))}

      <Pressable
        onPress={() => router.push({ pathname: '/goal', params: { mode: 'edit' } })}
        accessibilityRole="button"
        accessibilityLabel="Edit your goal"
        style={({ pressed }) => [styles.goalLink, pressed && styles.pressed]}
      >
        <Text style={styles.goalLinkLabel}>Edit your goal</Text>
      </Pressable>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  lede: {
    marginBottom: 8,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  card: {
    marginTop: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  bodyText: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  goalLink: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  goalLinkLabel: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.purple,
  },
  pressed: {
    opacity: 0.6,
  },
});

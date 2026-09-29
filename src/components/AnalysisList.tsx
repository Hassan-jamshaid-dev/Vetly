import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { colors } from '@/theme/colors';
import { fonts, type } from '@/theme/typography';

type Tone = 'positive' | 'negative' | 'neutral';

type AnalysisListProps = {
  /** Section label above the card (e.g. "How it helps"). */
  heading: string;
  items: string[];
  tone?: Tone;
};

const TONE_COLOR: Record<Tone, string> = {
  positive: colors.success,
  negative: colors.danger,
  neutral: colors.tabInactive,
};

/**
 * Results analysis block: heading + bullet list. Skips render when empty so
 * short AI answers never leave blank cards.
 */
export function AnalysisList({ heading, items, tone = 'neutral' }: AnalysisListProps) {
  const lines = items.map((item) => item.trim()).filter((item) => item.length > 0);
  if (lines.length === 0) return null;

  const dotColor = TONE_COLOR[tone];

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>{heading}</Text>
      <Card padding={20} style={styles.card}>
        {lines.map((line, index) => (
          <View
            key={`${heading}-${index}`}
            style={[styles.row, index < lines.length - 1 && styles.separator]}
          >
            <View style={[styles.dot, { backgroundColor: dotColor }]} />
            <Text style={styles.body} selectable>
              {line}
            </Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 28,
  },
  heading: {
    ...type.label,
    marginBottom: 14,
    fontFamily: fonts.semibold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  card: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    gap: 12,
  },
  separator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
    flexShrink: 0,
  },
  body: {
    ...type.bodySmall,
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.regular,
    color: colors.textPrimary,
  },
});

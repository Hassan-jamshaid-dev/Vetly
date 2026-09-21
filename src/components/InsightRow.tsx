import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { fonts, type } from '@/theme/typography';
import type { Insight, Sentiment } from '@/types/evaluation';

type InsightRowProps = {
  insight: Insight;
  /** Hide the hairline under the last row. */
  isLast?: boolean;
};

const SENTIMENT_TITLE: Record<Sentiment, string> = {
  positive: 'Fits',
  negative: 'Gap',
  neutral: 'Note',
};

/** One insight: coloured dot, a short title, and a single supporting line. */
export function InsightRow({ insight, isLast = false }: InsightRowProps) {
  const dotColor =
    insight.sentiment === 'positive'
      ? colors.success
      : insight.sentiment === 'negative'
        ? colors.danger
        : colors.tabInactive;

  return (
    <View style={[styles.row, !isLast && styles.separator]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View style={styles.copy}>
        <Text style={styles.title}>{SENTIMENT_TITLE[insight.sentiment]}</Text>
        <Text style={styles.body} selectable>
          {insight.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
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
    marginTop: 6,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
    color: colors.textPrimary,
  },
  body: {
    ...type.bodySmall,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
});

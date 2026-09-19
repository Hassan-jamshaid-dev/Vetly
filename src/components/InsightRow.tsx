import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import type { Insight } from '@/types/evaluation';

type InsightRowProps = {
  insight: Insight;
  /** Hide the hairline under the last row. */
  isLast?: boolean;
};

/** One "Key Insight": a small coloured dot and a sentence of text. */
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
      <Text style={styles.text}>{insight.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  separator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    // Nudge so the dot sits on the first text line's centre (lineHeight 22).
    marginTop: 7,
    marginRight: 12,
  },
  text: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  },
});

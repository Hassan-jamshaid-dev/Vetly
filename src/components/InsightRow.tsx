import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { fonts, type } from '@/theme/typography';
import type { Insight } from '@/types/evaluation';

type InsightRowProps = {
  insight: Insight;
  /** Hide the hairline under the last row. */
  isLast?: boolean;
};

/** One “why” line: sentiment-coloured dot + full AI text (no clipping). */
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
      <Text style={styles.body} selectable>
        {insight.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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

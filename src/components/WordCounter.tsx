import { StyleSheet, Text } from 'react-native';

import { colors } from '@/theme/colors';
import { fonts, type } from '@/theme/typography';

type WordCounterProps = {
  /** Current word count. */
  count: number;
  /** Lower bound of the "good" range (inclusive). */
  min: number;
  /** Upper bound (inclusive). Going above this turns the counter red. */
  max: number;
};

/** Counts words the same way everywhere: split on whitespace, drop empties. */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** "n / max words" in grey, green when inside the allowed range, red when over. */
export function WordCounter({ count, min, max }: WordCounterProps) {
  const color =
    count > max ? colors.danger : count >= min ? colors.success : colors.textPrimary;

  return (
    <Text style={[styles.text, { color }]}>
      {count} / {max} words
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    ...type.caption,
    fontFamily: fonts.medium,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
});

import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/Card';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

type GuidanceCardProps = {
  guidance: string;
};

/** Unlocked Preparation Guidance on Results, shown only after simulated Premium. */
export function GuidanceCard({ guidance }: GuidanceCardProps) {
  return (
    <Card>
      <Text style={styles.heading}>Preparation Guidance</Text>
      <Text style={styles.body}>{guidance}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  body: {
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  },
});

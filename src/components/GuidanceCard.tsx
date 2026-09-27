import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/Card';
import { fonts, type } from '@/theme/typography';

type GuidanceCardProps = {
  guidance: string;
};

/** Unlocked Preparation Guidance on Results, shown only after simulated Premium. */
export function GuidanceCard({ guidance }: GuidanceCardProps) {
  return (
    <Card padding={24}>
      <Text style={styles.kicker}>Preparation</Text>
      <Text style={styles.body} selectable>
        {guidance}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  kicker: {
    ...type.label,
    fontFamily: fonts.semibold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  body: {
    ...type.body,
    marginTop: 12,
  },
});

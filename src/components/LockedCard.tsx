import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { GradientButton } from '@/components/GradientButton';
import { colors } from '@/theme/colors';
import { fonts, type } from '@/theme/typography';

type LockedCardProps = {
  onUnlock: () => void;
};

/**
 * Honest Premium teaser on Results: what is behind the lock, then a single CTA.
 */
export function LockedCard({ onUnlock }: LockedCardProps) {
  return (
    <Card padding={24} style={styles.card}>
      <View style={styles.lockCircle}>
        <Ionicons name="lock-closed" size={20} color={colors.purple} />
      </View>
      <Text style={styles.heading}>Preparation</Text>
      <Text style={styles.subtext}>
        How to approach this, what to highlight, and a cover-letter angle — included with Premium.
      </Text>
      <View style={styles.buttonWrap}>
        <GradientButton label="Unlock with Premium" onPress={onUnlock} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
  },
  lockCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    marginTop: 16,
    fontFamily: fonts.bold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtext: {
    ...type.bodySmall,
    marginTop: 8,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  buttonWrap: {
    width: '100%',
    marginTop: 20,
  },
});

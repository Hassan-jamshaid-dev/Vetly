import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { GradientButton } from '@/components/GradientButton';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

type LockedCardProps = {
  onUnlock: () => void;
};

/**
 * The premium teaser on Results. Faded placeholder content sits underneath;
 * a lock, a short pitch and an "Unlock" button sit on top.
 */
export function LockedCard({ onUnlock }: LockedCardProps) {
  return (
    <Card style={styles.card}>
      {/* Faded "there is content here" placeholder, drawn behind the overlay. */}
      <View style={styles.ghost} pointerEvents="none" accessibilityElementsHidden>
        <View style={[styles.ghostBar, styles.ghostHeading]} />
        <View style={[styles.ghostBar, { width: '92%' }]} />
        <View style={[styles.ghostBar, { width: '84%' }]} />
        <View style={[styles.ghostBar, { width: '70%' }]} />
        <View style={[styles.ghostBar, styles.ghostButton]} />
      </View>

      {/* Overlay with the real call to action. */}
      <View style={styles.overlay}>
        <View style={styles.lockCircle}>
          <Ionicons name="lock-closed" size={22} color={colors.purple} />
        </View>
        <Text style={styles.heading}>Preparation Guidance</Text>
        <Text style={styles.subtext}>
          How to approach this, what to highlight, and a cover-letter angle.
        </Text>
        <View style={styles.buttonWrap}>
          <GradientButton label="Unlock with Premium" onPress={onUnlock} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  ghost: {
    // Fills the card behind the overlay; the overlay (in normal flow) sets the card's height.
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    opacity: 0.35,
  },
  ghostBar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.skeleton,
    marginBottom: 12,
  },
  ghostHeading: {
    width: '55%',
    height: 18,
    borderRadius: 8,
    marginBottom: 16,
  },
  ghostButton: {
    width: '100%',
    height: 44,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 0,
  },
  overlay: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 12,
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtext: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  buttonWrap: {
    width: '100%',
    marginTop: 16,
  },
});

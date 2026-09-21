import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { type } from '@/theme/typography';

type ScreenHeaderProps = {
  /** Called when the back arrow is pressed. Omit to hide the arrow (side slot stays). */
  onBack?: () => void;
  /** Optional title, centred between the side slots. */
  title?: string;
  /** Optional right-side control (e.g. VMark). Width matches the back slot. */
  right?: ReactNode;
};

const HEADER_HEIGHT = 56;
const SIDE = 48;

/**
 * Header row with a back slot, a centred single-line title, and a matching
 * right slot so the title never collides with the chevron.
 * Safe-area inset belongs on ScreenWrapper, not here — avoids a second nav.
 */
export function ScreenHeader({ onBack, title, right }: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
        {title ?? ''}
      </Text>

      <View style={styles.side}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  side: {
    width: SIDE,
    minHeight: HEADER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    width: SIDE,
    height: HEADER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
  title: {
    ...type.button,
    flex: 1,
    paddingHorizontal: spacing.sm,
    textAlign: 'center',
    color: colors.textPrimary,
  },
});

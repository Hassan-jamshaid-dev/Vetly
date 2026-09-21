import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { colors } from '@/theme/colors';
import { motion } from '@/theme/motion';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { type } from '@/theme/typography';

export type GradientButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Optional icon rendered to the LEFT of the label. */
  icon?: ReactNode;
  /** Optional icon rendered to the RIGHT of the label (e.g. an arrow). */
  trailingIcon?: ReactNode;
  /** Extra styling for the outer pressable (margins, width overrides...). */
  style?: StyleProp<ViewStyle>;
};

const HEIGHT = 56;
const PRESS_OPACITY = 0.9;
const PRESS_SCALE = 0.98;

/** Full-width pill button filled with the brand gradient. */
export function GradientButton({
  label,
  onPress,
  disabled = false,
  icon,
  trailingIcon,
  style,
}: GradientButtonProps) {
  const content = (
    <>
      {icon ? <View style={styles.leadingIcon}>{icon}</View> : null}
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {trailingIcon ? <View style={styles.trailingIcon}>{trailingIcon}</View> : null}
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[styles.pressable, style]}
    >
      {({ pressed }) => {
        const active = !disabled && pressed;
        return (
          <Animated.View
            style={[
              styles.shell,
              !disabled && styles.shadow,
              {
                opacity: disabled ? 0.45 : active ? PRESS_OPACITY : 1,
                transform: [{ scale: active ? PRESS_SCALE : 1 }],
                transitionProperty: ['opacity', 'transform'],
                transitionDuration: motion.fast,
                transitionTimingFunction: motion.easing.easeOut,
              },
            ]}
          >
            {disabled ? (
              <View style={[styles.surface, styles.flatDisabled]}>{content}</View>
            ) : (
              <LinearGradient
                colors={colors.gradient}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.surface}
              >
                {content}
              </LinearGradient>
            )}
          </Animated.View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    minHeight: HEIGHT,
    borderRadius: radius.full,
  },
  shell: {
    width: '100%',
    minHeight: HEIGHT,
    borderRadius: radius.full,
  },
  shadow: {
    boxShadow: shadows.raised,
  },
  surface: {
    minHeight: HEIGHT,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  flatDisabled: {
    backgroundColor: colors.buttonDisabled,
  },
  label: {
    ...type.button,
  },
  leadingIcon: {
    marginRight: spacing.sm,
  },
  trailingIcon: {
    marginLeft: spacing.sm,
  },
});

import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { shadows } from '@/theme/shadows';
import { fonts } from '@/theme/typography';

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
const RADIUS = HEIGHT / 2;

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
      style={({ pressed }) => [
        styles.pressable,
        disabled ? styles.disabled : styles.shadow,
        pressed && !disabled && styles.pressed,
        style,
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    borderRadius: RADIUS,
  },
  shadow: {
    boxShadow: shadows.button,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.4,
  },
  surface: {
    minHeight: HEIGHT,
    borderRadius: RADIUS,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  flatDisabled: {
    backgroundColor: colors.buttonDisabled,
  },
  label: {
    color: colors.white,
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 22,
  },
  leadingIcon: {
    marginRight: 8,
  },
  trailingIcon: {
    marginLeft: 8,
  },
});

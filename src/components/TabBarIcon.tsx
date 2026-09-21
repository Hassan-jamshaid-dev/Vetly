import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View, type ColorValue } from 'react-native';

import { fonts } from '@/theme/typography';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type IconColor = ComponentProps<typeof Ionicons>['color'];

export const TAB_ICON_SIZE = 22;
const ICON_BOX = 24;

type TabBarIconProps = {
  /** Icon shown when the tab is selected, e.g. "home". */
  filled: IoniconName;
  /** Icon shown when the tab is not selected, e.g. "home-outline". */
  outline: IoniconName;
  focused: boolean;
  /** Tint supplied by the tab navigator (string or PlatformColor). */
  color: ColorValue;
  size?: number;
};

/** Swaps between a filled and an outlined Ionicon depending on whether the tab is active. */
export function TabBarIcon({
  filled,
  outline,
  focused,
  color,
  size = TAB_ICON_SIZE,
}: TabBarIconProps) {
  // Fixed box so filled vs outline glyphs don't shift the tab bar vertically.
  return (
    <View
      accessible={false}
      importantForAccessibility="no"
      style={styles.iconBox}
    >
      <Ionicons name={focused ? filled : outline} size={size} color={color as IconColor} />
    </View>
  );
}

type TabBarLabelProps = {
  label: string;
  focused: boolean;
  color: ColorValue;
};

/** Tab label: medium at rest, semibold when selected. Stays inside the 56px bar. */
export function TabBarLabel({ label, focused, color }: TabBarLabelProps) {
  return (
    <Text
      numberOfLines={1}
      maxFontSizeMultiplier={1.25}
      style={[styles.label, focused ? styles.labelFocused : null, { color }]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.15,
    includeFontPadding: false,
  },
  labelFocused: {
    fontFamily: fonts.semibold,
  },
});

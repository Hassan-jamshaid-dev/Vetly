import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View, type ColorValue } from 'react-native';

import { colors } from '@/theme/colors';
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
  /** Small lock badge (History is Premium). */
  locked?: boolean;
};

/** Swaps between a filled and an outlined Ionicon depending on whether the tab is active. */
export function TabBarIcon({
  filled,
  outline,
  focused,
  color,
  size = TAB_ICON_SIZE,
  locked = false,
}: TabBarIconProps) {
  // Fixed box so filled vs outline glyphs don't shift the tab bar vertically.
  return (
    <View
      accessible={false}
      importantForAccessibility="no"
      style={styles.iconBox}
    >
      <Ionicons name={focused ? filled : outline} size={size} color={color as IconColor} />
      {locked ? (
        <View style={styles.lockBadge}>
          <Ionicons name="lock-closed" size={8} color={colors.white} />
        </View>
      ) : null}
    </View>
  );
}

type TabBarLabelProps = {
  label: string;
  focused: boolean;
  color: ColorValue;
};

/** Tab label: medium at rest, semibold when selected, short underline when active. */
export function TabBarLabel({ label, focused, color }: TabBarLabelProps) {
  return (
    <View style={styles.labelCol}>
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.25}
        style={[styles.label, focused ? styles.labelFocused : null, { color }]}
      >
        {label}
      </Text>
      <View
        style={[styles.underline, focused ? styles.underlineOn : styles.underlineOff]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute',
    right: -6,
    top: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  labelCol: {
    alignItems: 'center',
    minWidth: 44,
  },
  label: {
    marginTop: 0,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.15,
    includeFontPadding: false,
  },
  labelFocused: {
    fontFamily: fonts.semibold,
  },
  underline: {
    marginTop: 3,
    width: 18,
    height: 3,
    borderRadius: 2,
  },
  underlineOn: {
    backgroundColor: colors.purple,
  },
  underlineOff: {
    backgroundColor: 'transparent',
  },
});

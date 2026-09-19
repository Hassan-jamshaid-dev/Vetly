import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type IconColor = ComponentProps<typeof Ionicons>['color'];

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
export function TabBarIcon({ filled, outline, focused, color, size = 24 }: TabBarIconProps) {
  // Ionicons types its colour as string | OpaqueColorValue, which is what ColorValue is made of.
  return <Ionicons name={focused ? filled : outline} size={size} color={color as IconColor} />;
}

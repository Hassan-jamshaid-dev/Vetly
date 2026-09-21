import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { radius as radiusTokens } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';

type CardProps = {
  children: ReactNode;
  /** Corner radius. Defaults to radius.xl (20). */
  radius?: number;
  /** Inner padding. Defaults to spacing.gutter (20). */
  padding?: number;
  style?: StyleProp<ViewStyle>;
};

/** A soft white surface with a gentle shadow. Most content on Vetly sits inside one of these. */
export function Card({
  children,
  radius = radiusTokens.xl,
  padding = spacing.gutter,
  style,
}: CardProps) {
  return (
    <View style={[styles.card, { borderRadius: radius, borderCurve: 'continuous', padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    boxShadow: shadows.card,
  },
});

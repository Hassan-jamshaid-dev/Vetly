import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';

type SoftSkeletonProps = {
  height?: number;
  style?: StyleProp<ViewStyle>;
};

/** Quiet loading placeholder. Use instead of an empty gap while storage loads. */
export function SoftSkeleton({ height = 88, style }: SoftSkeletonProps) {
  return <View style={[styles.block, { height }, style]} />;
}

const styles = StyleSheet.create({
  block: {
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.skeleton,
    opacity: 0.55,
  },
});

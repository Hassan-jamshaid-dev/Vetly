import { StyleSheet, View } from 'react-native';

import { Blob } from '@/components/decor/Blob';
import { colors } from '@/theme/colors';

export type SplashDecorProps = {
  width: number;
  height: number;
};

/**
 * Quiet field behind the splash mark: two soft pastels, no sparkles or hairlines.
 */
export function SplashDecor({ width: w, height: h }: SplashDecorProps) {
  return (
    <View style={styles.layer} pointerEvents="none" importantForAccessibility="no-hide-descendants">
      <Blob
        cx={-0.06 * w}
        cy={0.14 * h}
        width={0.58 * w}
        color={colors.decor.periwinkle}
        opacity={0.5}
      />
      <Blob
        cx={1.04 * w}
        cy={0.82 * h}
        width={0.52 * w}
        color={colors.decor.mist}
        opacity={0.45}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
});

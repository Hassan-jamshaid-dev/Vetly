import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Blob } from '@/components/decor/Blob';
import { Sparkle } from '@/components/decor/Sparkle';
import { colors } from '@/theme/colors';

export type SplashDecorProps = {
  width: number;
  height: number;
};

/**
 * Background layer for the Splash screen: four soft pastel shapes tucked into
 * the corners plus two hairline details (a vertical rule with a sparkle on the
 * right, a quarter-arc with a dot at the bottom-left).
 */
export function SplashDecor({ width: w, height: h }: SplashDecorProps) {
  // Bottom-left quarter arc: an ellipse quadrant that bulges up and to the right.
  const arcW = w * 0.36;
  const arcH = h * 0.42;
  // Dot sits on the arc, ~40 degrees around from its top end.
  const dotAngle = (40 * Math.PI) / 180;
  const dotX = arcW * Math.sin(dotAngle);
  const dotY = arcH - arcH * Math.cos(dotAngle);

  // Right-hand hairline rule with a sparkle resting on it.
  const lineX = w * 0.91;
  const lineTop = h * 0.04;
  const lineBottom = h * 0.45;
  const sparkleY = h * 0.2;

  return (
    <View style={styles.layer}>
      {/* Pastel shapes */}
      <Blob cx={-0.1 * w} cy={0.08 * h} width={0.55 * w} color={colors.decor.periwinkle} opacity={0.7} />
      <Blob cx={0.05 * w} cy={0.88 * h} width={0.5 * w} height={0.62 * w} color={colors.decor.lavender} />
      <Blob
        cx={0.96 * w}
        cy={0.45 * h}
        width={0.28 * w}
        height={0.4 * h}
        color={colors.decor.ice}
        radius={0.14 * w}
      />
      <Blob cx={0.95 * w} cy={0.92 * h} width={0.45 * w} color={colors.decor.mist} />

      {/* Vertical hairline + sparkle */}
      <View
        style={[
          styles.rule,
          { left: lineX, top: lineTop, height: lineBottom - lineTop, backgroundColor: colors.decor.line },
        ]}
      />
      <Sparkle cx={lineX + 0.5} cy={sparkleY} size={14} color={colors.decor.sparkle} />

      {/* Bottom-left quarter arc + dot */}
      <Svg
        width={arcW + 8}
        height={arcH + 8}
        viewBox={`-4 -4 ${arcW + 8} ${arcH + 8}`}
        style={styles.arc}
      >
        <Path
          d={`M 0 0 A ${arcW} ${arcH} 0 0 1 ${arcW} ${arcH}`}
          stroke={colors.decor.line}
          strokeWidth={1}
          fill="none"
        />
        <Circle cx={dotX} cy={dotY} r={5} fill={colors.decor.dot} />
      </Svg>
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
    pointerEvents: 'none',
  },
  rule: {
    position: 'absolute',
    width: 1,
  },
  arc: {
    position: 'absolute',
    left: -4,
    bottom: -4,
  },
});

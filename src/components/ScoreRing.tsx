import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Stop } from 'react-native-svg';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

type ScoreRingProps = {
  /** Integer 1-10. */
  score: number;
  /** Outer diameter in px. Defaults to 168. */
  size?: number;
  /** Ring thickness in px. Defaults to 12. */
  strokeWidth?: number;
  /** How long the fill-in animation takes. Defaults to 900ms. */
  duration?: number;
};

/**
 * A circular progress ring that animates from empty to `score / 10` on mount,
 * with the score printed in the middle.
 *
 * Uses requestAnimationFrame instead of Animated.createAnimatedComponent(Circle)
 * because RN Animated injects invalid SVG DOM props on web (error toast overlays
 * the Results screen and blocks taps).
 */
export function ScoreRing({ score, size = 168, strokeWidth = 12, duration = 520 }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const centre = size / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = Math.min(1, Math.max(0, score / 10));

  // 1 = hidden (full dash offset), 0 = fully drawn. Animate 1 -> 1 - fraction.
  const [dashOffset, setDashOffset] = useState(circumference);

  useEffect(() => {
    const start = Date.now();
    let frame = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDashOffset(circumference * (1 - fraction * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [circumference, duration, fraction]);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="vetlyRing" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.purple} />
            <Stop offset="1" stopColor={colors.blue} />
          </LinearGradient>
        </Defs>

        {/* Grey track */}
        <Circle cx={centre} cy={centre} r={radius} stroke={colors.hairline} strokeWidth={strokeWidth} fill="none" />

        {/* Gradient progress, starting from 12 o'clock. */}
        <G transform={`rotate(-90 ${centre} ${centre})`}>
          <Circle
            cx={centre}
            cy={centre}
            r={radius}
            stroke="url(#vetlyRing)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
          />
        </G>
      </Svg>

      {/* Score in the centre */}
      <View style={[styles.centre, { pointerEvents: 'none' }]}>
        <View style={styles.scoreRow}>
          <Text style={styles.score}>{score}</Text>
          <Text style={styles.outOf}>/10</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centre: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  score: {
    fontFamily: fonts.bold,
    fontSize: 44,
    lineHeight: 52,
    color: colors.textPrimary,
    includeFontPadding: false,
  },
  outOf: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 2,
  },
});

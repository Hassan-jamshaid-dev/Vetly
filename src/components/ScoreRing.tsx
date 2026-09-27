import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Stop } from 'react-native-svg';

import { colors } from '@/theme/colors';
import { motion } from '@/theme/motion';
import { fonts } from '@/theme/typography';

type ScoreRingProps = {
  /** Integer 1-10. */
  score: number;
  /** Outer diameter in px. Defaults to 184. */
  size?: number;
  /** Ring thickness in px. Defaults to 9. */
  strokeWidth?: number;
  /** Opacity fade-in duration. Defaults to motion.base (250ms). */
  duration?: number;
};

/**
 * A circular progress ring filled to `score / 10`, with the score in the middle.
 * Enters with a short opacity fade — no dash-chase, so it reads as an instrument.
 */
export function ScoreRing({
  score,
  size = 184,
  strokeWidth = 9,
  duration = motion.base,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const centre = size / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = Math.min(1, Math.max(0, score / 10));
  const dashOffset = circumference * (1 - fraction);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [duration, opacity, score]);

  return (
    <Animated.View
      style={{ width: size, height: size, opacity }}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${score} out of 10`}
    >
      <Svg width={size} height={size} accessibilityElementsHidden>
        <Defs>
          <LinearGradient id="vetlyRing" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.purple} />
            <Stop offset="1" stopColor={colors.blue} />
          </LinearGradient>
        </Defs>

        <Circle
          cx={centre}
          cy={centre}
          r={radius}
          stroke={colors.progressTrack}
          strokeWidth={strokeWidth}
          fill="none"
        />

        <G transform={`rotate(-90 ${centre} ${centre})`}>
          <Circle
            cx={centre}
            cy={centre}
            r={radius}
            stroke="url(#vetlyRing)"
            strokeWidth={strokeWidth}
            strokeLinecap={fraction >= 0.999 ? 'butt' : 'round'}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
          />
        </G>
      </Svg>

      <View style={[styles.centre, { pointerEvents: 'none' }]}>
        <Text style={styles.score}>{score}</Text>
        <Text style={styles.outOf}>out of 10</Text>
      </View>
    </Animated.View>
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
  score: {
    fontFamily: fonts.bold,
    fontSize: 52,
    lineHeight: 58,
    color: colors.textPrimary,
    includeFontPadding: false,
    fontVariant: ['tabular-nums'],
  },
  outOf: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.4,
    color: colors.textSecondary,
  },
});

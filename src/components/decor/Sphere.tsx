import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

export type SphereProps = {
  /** Centre of the sphere, in px from the top-left of the parent. */
  cx: number;
  cy: number;
  size: number;
  /** Flat fill. Ignored when `gradient` is provided. */
  color?: string;
  /** Diagonal gradient fill (top-left -> bottom-right). */
  gradient?: readonly [string, string];
  opacity?: number;
};

/** A small round "planet" dot, flat or gradient-filled. Decorative only. */
export function Sphere({ cx, cy, size, color, gradient, opacity = 1 }: SphereProps) {
  const style = {
    position: 'absolute' as const,
    left: cx - size / 2,
    top: cy - size / 2,
    width: size,
    height: size,
    borderRadius: size / 2,
    opacity,
    pointerEvents: 'none' as const,
  };

  if (gradient) {
    return (
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style} />
    );
  }

  return <View style={[style, { backgroundColor: color }]} />;
}

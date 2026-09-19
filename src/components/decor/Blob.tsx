import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

export type BlobProps = {
  /** Centre of the shape, in px from the top-left of the parent. */
  cx: number;
  cy: number;
  width: number;
  /** Defaults to `width` (a circle). */
  height?: number;
  /** Flat fill. Ignored when `gradient` is provided. */
  color?: string;
  /**
   * Soft ribbon fill: colour stops laid out along the shape's width (or its
   * height when `vertical` is set). Use 'transparent' stops to fade the ends.
   */
  gradient?: readonly [string, string, ...string[]];
  vertical?: boolean;
  opacity?: number;
  /** Corner radius; defaults to a full pill/circle. */
  radius?: number;
  /** Rotation in degrees. */
  rotate?: number;
};

/**
 * A flat pastel shape used to build soft, blurred-looking backgrounds. Purely
 * decorative: absolutely positioned and never receives touches.
 */
export function Blob({
  cx,
  cy,
  width,
  height = width,
  color,
  gradient,
  vertical = false,
  opacity = 1,
  radius,
  rotate = 0,
}: BlobProps) {
  const style = {
    position: 'absolute' as const,
    left: cx - width / 2,
    top: cy - height / 2,
    width,
    height,
    borderRadius: radius ?? Math.max(width, height) / 2,
    opacity,
    transform: [{ rotate: `${rotate}deg` }],
    pointerEvents: 'none' as const,
  };

  if (gradient) {
    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={vertical ? { x: 0, y: 1 } : { x: 1, y: 0 }}
        style={style}
      />
    );
  }

  return <View style={[style, { backgroundColor: color }]} />;
}

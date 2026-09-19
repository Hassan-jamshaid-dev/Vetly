import Svg, { Path } from 'react-native-svg';

export type SparkleProps = {
  /** Centre of the sparkle, in px from the top-left of the parent. */
  cx: number;
  cy: number;
  size: number;
  color: string;
  opacity?: number;
};

// Four-point star: the curves pull in tightly towards the centre.
const STAR_PATH = 'M12 0 C13 9 15 11 24 12 C15 13 13 15 12 24 C11 15 9 13 0 12 C9 11 11 9 12 0 Z';

/** A small four-point sparkle. Decorative only. */
export function Sparkle({ cx, cy, size, color, opacity = 1 }: SparkleProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ position: 'absolute', left: cx - size / 2, top: cy - size / 2, opacity }}
    >
      <Path d={STAR_PATH} fill={color} />
    </Svg>
  );
}

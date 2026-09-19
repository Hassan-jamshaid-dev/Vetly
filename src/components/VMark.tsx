import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors } from '@/theme/colors';
import { shadows } from '@/theme/shadows';

/**
 * The Vetly brand mark: a "V" built from two separate rounded strokes.
 *
 * Geometry is expressed in a 100x100 viewBox and traced from the app icon:
 *  - The LEFT stroke is the long one. Its top edge is horizontal, it slopes
 *    down-right to the bottom vertex (~x49, y91) and its inner edge is
 *    chamfered so the gap to the right stroke stays even.
 *  - The RIGHT stroke is shorter. It slopes down-left from the top-right
 *    corner and ends with a rounded, chamfered tip (~x70, y60), well above
 *    the vertex.
 *  - Both strokes lean at the same angle (dx/dy = 0.625 ≈ 32° from vertical).
 *
 * Corners are rounded individually (see `roundedPolygonPath`) so each one can
 * have its own radius, exactly like the icon: large soft radii on the outer
 * top-left corners and the bottom tips, tight radii where the diagonals meet
 * the top edges.
 */

type Point = readonly [number, number];

// Left stroke: top-left, top-right, inner kink, bottom vertex (clockwise).
const LEFT_STROKE: readonly Point[] = [
  [1.0, 13.2],
  [31.3, 13.2],
  [64.6, 66.6],
  [49.4, 90.8],
];
const LEFT_RADII: readonly number[] = [3.2, 1.2, 1.6, 5.0];

// Right stroke: top-left, top-right, bottom tip, inner kink (clockwise).
const RIGHT_STROKE: readonly Point[] = [
  [73.5, 13.2],
  [99.0, 13.2],
  [69.7, 60.2],
  [56.9, 39.8],
];
const RIGHT_RADII: readonly number[] = [5.5, 1.2, 3.2, 1.9];

const fmt = (n: number) => (Math.round(n * 100) / 100).toString();

/**
 * Builds an SVG path for a polygon whose corners are rounded with a per-vertex
 * radius. Each corner is replaced by a circular arc tangent to both adjacent
 * edges; the radius is clamped so arcs never overlap on short edges.
 */
function roundedPolygonPath(points: readonly Point[], radii: readonly number[]): string {
  const n = points.length;
  const corners = points.map((p, i) => {
    const a = points[(i - 1 + n) % n];
    const b = points[(i + 1) % n];

    const ax = a[0] - p[0];
    const ay = a[1] - p[1];
    const bx = b[0] - p[0];
    const by = b[1] - p[1];
    const lenA = Math.hypot(ax, ay);
    const lenB = Math.hypot(bx, by);
    const uax = ax / lenA;
    const uay = ay / lenA;
    const ubx = bx / lenB;
    const uby = by / lenB;

    // Interior angle at this vertex.
    const cos = Math.min(1, Math.max(-1, uax * ubx + uay * uby));
    const theta = Math.acos(cos);
    const halfTan = Math.tan(theta / 2);

    // Distance from the vertex to each tangent point, clamped to half an edge.
    let r = radii[i] ?? 0;
    let d = r / halfTan;
    const maxD = Math.min(lenA, lenB) / 2;
    if (d > maxD) {
      d = maxD;
      r = d * halfTan;
    }

    // Turning direction decides the SVG sweep flag (y grows downwards).
    const cross = uax * uby - uay * ubx;
    const sweep = cross < 0 ? 1 : 0;

    return {
      start: [p[0] + uax * d, p[1] + uay * d] as const,
      end: [p[0] + ubx * d, p[1] + uby * d] as const,
      r,
      sweep,
    };
  });

  const arc = (c: (typeof corners)[number]) =>
    `A ${fmt(c.r)} ${fmt(c.r)} 0 0 ${c.sweep} ${fmt(c.end[0])} ${fmt(c.end[1])}`;

  const first = corners[0];
  let d = `M ${fmt(first.end[0])} ${fmt(first.end[1])}`;
  for (let i = 1; i < n; i++) {
    const c = corners[i];
    d += ` L ${fmt(c.start[0])} ${fmt(c.start[1])} ${arc(c)}`;
  }
  d += ` L ${fmt(first.start[0])} ${fmt(first.start[1])} ${arc(first)} Z`;
  return d;
}

// Both strokes live in ONE path so a single gradient spans the whole mark.
const MARK_PATH = `${roundedPolygonPath(LEFT_STROKE, LEFT_RADII)} ${roundedPolygonPath(
  RIGHT_STROKE,
  RIGHT_RADII,
)}`;

export type VMarkProps = {
  /** Rendered width and height, in px. The mark itself is wider than tall. */
  size: number;
  style?: StyleProp<ViewStyle>;
};

/** The gradient "V" mark with no background; sits directly on whatever is behind it. */
export function VMark({ size, style }: VMarkProps) {
  // Stable, unique gradient id per instance so several marks on one screen never clash.
  const gradientId = `vmark-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={style}
      accessibilityRole="image"
      accessibilityLabel="Vetly"
    >
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0.15">
          <Stop offset="0" stopColor={colors.mark.violet} />
          <Stop offset="0.3" stopColor={colors.mark.purple} />
          <Stop offset="0.65" stopColor={colors.mark.blue} />
          <Stop offset="1" stopColor={colors.mark.sky} />
        </LinearGradient>
      </Defs>
      <Path d={MARK_PATH} fill={`url(#${gradientId})`} />
    </Svg>
  );
}

export type VMarkTileProps = {
  /** Width and height of the rounded square, in px. */
  size: number;
  style?: StyleProp<ViewStyle>;
};

/** The mark inside a near-white rounded tile with a soft shadow (tab headers etc.). */
export function VMarkTile({ size, style }: VMarkTileProps) {
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: Math.round(size * 0.22) },
        style,
      ]}
    >
      <VMark size={Math.round(size * 0.72)} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.tileSurface,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadows.card,
  },
});

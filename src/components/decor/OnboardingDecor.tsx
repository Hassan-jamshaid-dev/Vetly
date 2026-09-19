import { StyleSheet, View } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';

import { Blob } from '@/components/decor/Blob';
import { Sphere } from '@/components/decor/Sphere';
import { colors } from '@/theme/colors';

export type OnboardingDecorProps = {
  /** Screen width. */
  width: number;
  /** Height of the hero area (top part of the screen) the decoration lives in. */
  heroHeight: number;
  /** Vertical centre of the V mark inside the hero. */
  markCenterY: number;
};

const ORBIT_TILT_DEG = -18;
const { ribbon, ribbonLight, ribbonClear, ribbonLightClear } = colors.decor;

/**
 * Background layer for the Onboarding hero: soft lavender ribbons, a glow
 * behind the mark, a tilted elliptical orbit and a few small spheres/sparkles
 * sitting on it. The mark itself is rendered by the screen, above this layer.
 */
export function OnboardingDecor({ width: w, heroHeight: hh, markCenterY: cy }: OnboardingDecorProps) {
  const cx = w / 2;
  const rx = w * 0.48;
  const ry = w * 0.2;

  // Point on the tilted orbit at `deg` degrees (0 = right, 90 = below).
  const orbitPoint = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    const px = rx * Math.cos(a);
    const py = ry * Math.sin(a);
    const t = (ORBIT_TILT_DEG * Math.PI) / 180;
    return {
      x: cx + px * Math.cos(t) - py * Math.sin(t),
      y: cy + px * Math.sin(t) + py * Math.cos(t),
    };
  };

  const bigSphere = orbitPoint(-30);
  const purpleSphere = orbitPoint(165);
  const lightSphere = orbitPoint(-62);
  const sparkleA = orbitPoint(-135);
  const sparkleB = orbitPoint(40);

  return (
    <View style={[styles.layer, { height: hh }]}>
      {/* Soft ribbons */}
      <Blob
        cx={0.12 * w}
        cy={0.1 * hh}
        width={0.95 * w}
        height={0.34 * w}
        rotate={-38}
        opacity={0.5}
        gradient={[ribbon, ribbonLight, ribbonLightClear]}
      />
      <Blob
        cx={0.5 * w}
        cy={0.3 * hh}
        width={1.4 * w}
        height={0.24 * w}
        rotate={26}
        opacity={0.42}
        gradient={[ribbonClear, ribbon, ribbonLight, ribbonLightClear]}
      />
      <Blob
        cx={0.62 * w}
        cy={0.44 * hh}
        width={1.2 * w}
        height={0.14 * w}
        rotate={24}
        opacity={0.35}
        gradient={[ribbonLightClear, ribbonLight, ribbonLightClear]}
      />
      <Blob
        cx={1.02 * w}
        cy={0.52 * hh}
        width={0.34 * w}
        height={0.95 * w}
        rotate={-22}
        opacity={0.45}
        vertical
        gradient={[ribbonClear, ribbon, ribbonLight, ribbonLightClear]}
      />

      {/* Glow behind the mark */}
      <Blob cx={cx} cy={cy} width={0.9 * w} color={colors.decor.glow} opacity={0.6} />

      {/* Orbit ring */}
      <Svg width={w} height={hh} style={StyleSheet.absoluteFill}>
        <Ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          stroke={colors.decor.orbit}
          strokeWidth={1}
          fill="none"
          transform={`rotate(${ORBIT_TILT_DEG} ${cx} ${cy})`}
        />
      </Svg>

      {/* Spheres on the orbit */}
      <Sphere cx={bigSphere.x} cy={bigSphere.y} size={28} gradient={colors.gradient} />
      <Sphere cx={purpleSphere.x} cy={purpleSphere.y} size={18} color={colors.purple} />
      <Sphere cx={lightSphere.x} cy={lightSphere.y} size={10} color={colors.decor.sphereLight} />
      <Sphere cx={sparkleA.x} cy={sparkleA.y} size={5} color={colors.white} />
      <Sphere cx={sparkleB.x} cy={sparkleB.y} size={4} color={colors.white} opacity={0.9} />
      <Sphere cx={0.16 * w} cy={0.22 * hh} size={6} color={colors.white} />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
});

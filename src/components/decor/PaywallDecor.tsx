import { StyleSheet, View } from 'react-native';

import { Blob } from '@/components/decor/Blob';
import { colors } from '@/theme/colors';

export type PaywallDecorProps = {
  width: number;
  height: number;
};

const { ribbon, ribbonLight, ribbonClear, ribbonLightClear } = colors.decor;

/**
 * Soft faded ribbons/blobs behind the Premium paywall. Same family as
 * Splash/Onboarding decor, dialed down so they read as atmosphere on the
 * dark purple gradient instead of competing with the copy.
 */
export function PaywallDecor({ width: w, height: h }: PaywallDecorProps) {
  return (
    <View
      style={[styles.layer, { height: h }]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Blob
        cx={0.1 * w}
        cy={0.12 * h}
        width={1.05 * w}
        height={0.36 * w}
        rotate={-36}
        opacity={0.22}
        gradient={[ribbon, ribbonLight, ribbonLightClear]}
      />
      <Blob
        cx={0.55 * w}
        cy={0.28 * h}
        width={1.45 * w}
        height={0.26 * w}
        rotate={24}
        opacity={0.18}
        gradient={[ribbonClear, ribbon, ribbonLight, ribbonLightClear]}
      />
      <Blob
        cx={0.7 * w}
        cy={0.48 * h}
        width={1.25 * w}
        height={0.16 * w}
        rotate={22}
        opacity={0.14}
        gradient={[ribbonLightClear, ribbonLight, ribbonLightClear]}
      />
      <Blob
        cx={1.05 * w}
        cy={0.62 * h}
        width={0.36 * w}
        height={1.05 * w}
        rotate={-20}
        opacity={0.16}
        vertical
        gradient={[ribbonClear, ribbon, ribbonLight, ribbonLightClear]}
      />
      <Blob
        cx={-0.08 * w}
        cy={0.78 * h}
        width={0.7 * w}
        height={0.42 * w}
        rotate={18}
        opacity={0.12}
        gradient={[ribbonLightClear, ribbon, ribbonLightClear]}
      />
      {/* Soft glow behind where the brand mark sits */}
      <Blob cx={0.5 * w} cy={0.16 * h} width={0.85 * w} color={colors.decor.glow} opacity={0.2} />
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

import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientButton, type GradientButtonProps } from '@/components/GradientButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type StickyBottomButtonProps = GradientButtonProps & {
  /** Extra copy under the button (e.g. remaining evaluations). */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Pinned form CTA. Bottom inset keeps it above the home indicator; parent KAV keeps it above the keyboard. */
export function StickyBottomButton({
  children,
  style,
  ...buttonProps
}: StickyBottomButtonProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }, style]}>
      <GradientButton {...buttonProps} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexShrink: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.backgroundSoft,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
});

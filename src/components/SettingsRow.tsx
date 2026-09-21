import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

type SettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  /** Hide the hairline under the last row in a group. */
  isLast?: boolean;
};

/** One tappable row inside a Settings group — native list row, not a mini-card. */
export function SettingsRow({ icon, label, onPress, isLast = false }: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.iconSlot}>
        <Ionicons name={icon} size={20} color={colors.purple} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
      {isLast ? null : <View style={styles.hairline} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  pressed: {
    backgroundColor: colors.backgroundSoft,
  },
  iconSlot: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  hairline: {
    position: 'absolute',
    left: 50,
    right: 16,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
  },
});

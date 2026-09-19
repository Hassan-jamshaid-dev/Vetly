import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

type ScreenHeaderProps = {
  /** Called when the back arrow is pressed. */
  onBack: () => void;
  /** Optional title, centred in the header. */
  title?: string;
  /** Adds the top safe-area inset above the header row. */
  withSafeArea?: boolean;
};

const HEADER_HEIGHT = 56;

/** A 56px header row with a back arrow on the left and an optional centred title. */
export function ScreenHeader({ onBack, title, withSafeArea = false }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.row, withSafeArea && { marginTop: insets.top }]}>
      <Pressable
        onPress={onBack}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      >
        <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
      </Pressable>

      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  back: {
    // Absolutely positioned so the title stays perfectly centred.
    position: 'absolute',
    left: 12,
    height: HEADER_HEIGHT,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.5,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.textPrimary,
    maxWidth: '70%',
  },
});

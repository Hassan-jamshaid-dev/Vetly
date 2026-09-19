import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type ExampleCardProps = {
  icon: IoniconName;
  title: string;
  url: string;
  onPress: () => void;
};

/** A tappable example opportunity on Evaluate: icon tile, title, URL, chevron. */
export function ExampleCard({ icon, title, url, onPress }: ExampleCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Use example: ${title}`}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card radius={16} padding={14} style={styles.card}>
        <View style={styles.iconTile}>
          <Ionicons name={icon} size={20} color={colors.purple} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.url} numberOfLines={1}>
            {url}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.chevron} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textBlock: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  url: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
});

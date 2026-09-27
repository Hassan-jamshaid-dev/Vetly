import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { colors } from '@/theme/colors';
import { fonts, type } from '@/theme/typography';

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
    >
      {({ pressed }) => (
        <Card radius={16} padding={16} style={pressed ? styles.pressed : undefined}>
          <View style={styles.row}>
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
            <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
          </View>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: colors.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textBlock: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  url: {
    ...type.caption,
    marginTop: 3,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
});

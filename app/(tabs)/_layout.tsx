import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarIcon } from '@/components/TabBarIcon';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

const TAB_BAR_HEIGHT = 64;

// Makes `/(tabs)/home` the screen expo-router lands on when the group is opened
// directly (deep link, replace to the group), not just the first child in order.
export const unstable_settings = {
  initialRouteName: 'home',
};

// Bottom tab shell: Home, History, Profile. Each tab hides its own header.
export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.hairline,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
          boxShadow: 'none',
        },
        tabBarLabelStyle: {
          fontFamily: fonts.medium,
          fontSize: 11,
        },
        sceneStyle: { backgroundColor: colors.backgroundSoft },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon filled="home" outline="home-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon filled="time" outline="time-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon filled="person" outline="person-outline" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

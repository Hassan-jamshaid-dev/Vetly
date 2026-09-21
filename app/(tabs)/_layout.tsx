import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_ICON_SIZE, TabBarIcon, TabBarLabel } from '@/components/TabBarIcon';
import { colors } from '@/theme/colors';

/** Content row only — bottom inset is added separately so icons don't jump. */
export const TAB_BAR_CONTENT_HEIGHT = 56;

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
        animation: 'fade',
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.hairline,
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingTop: 0,
          paddingBottom: insets.bottom,
          boxShadow: 'none',
          elevation: 0,
        },
        tabBarItemStyle: {
          height: TAB_BAR_CONTENT_HEIGHT,
          paddingTop: 6,
          paddingBottom: 4,
          minWidth: 44,
        },
        tabBarIconStyle: {
          width: 24,
          height: 24,
        },
        tabBarLabelStyle: {
          marginTop: 0,
        },
        sceneStyle: { backgroundColor: colors.backgroundSoft },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarLabel: ({ focused, color }) => (
            <TabBarLabel label="Home" focused={focused} color={color} />
          ),
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon
              filled="home"
              outline="home-outline"
              focused={focused}
              color={color}
              size={TAB_ICON_SIZE}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          headerShown: false,
          tabBarLabel: ({ focused, color }) => (
            <TabBarLabel label="History" focused={focused} color={color} />
          ),
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon
              filled="time"
              outline="time-outline"
              focused={focused}
              color={color}
              size={TAB_ICON_SIZE}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarLabel: ({ focused, color }) => (
            <TabBarLabel label="Profile" focused={focused} color={color} />
          ),
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon
              filled="person"
              outline="person-outline"
              focused={focused}
              color={color}
              size={TAB_ICON_SIZE}
            />
          ),
        }}
      />
    </Tabs>
  );
}

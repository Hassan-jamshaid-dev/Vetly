import { Tabs, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_ICON_SIZE, TabBarIcon, TabBarLabel } from '@/components/TabBarIcon';
import { getIsPremium } from '@/storage/premiumStorage';
import { colors } from '@/theme/colors';

/** Content row only — bottom inset is added separately so icons don't jump. */
export const TAB_BAR_CONTENT_HEIGHT = 56;

export const unstable_settings = {
  initialRouteName: 'home',
};

// Bottom tab shell: Home, History, Profile. Each tab hides its own header.
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    getIsPremium().then((value) => {
      if (!cancelled) setIsPremium(value);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const historyLocked = isPremium !== true;

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
          paddingTop: 4,
          paddingBottom: 2,
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
          tabBarAccessibilityLabel: historyLocked ? 'History, Premium locked' : 'History',
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
              locked={historyLocked}
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

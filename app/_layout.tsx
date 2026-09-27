import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { InteractionManager } from 'react-native';

import {
  configurePurchases,
  isNativePurchasesAvailable,
  refreshPremiumFromRevenueCat,
} from '@/services/purchases';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

// Keep the native splash up until our fonts are ready so no screen ever
// renders with a fallback typeface.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* Already hidden / not supported (e.g. web): safe to ignore. */
});

// Makes Splash (`app/index`) the screen expo-router lands on at launch,
// not just the first child in file order.
export const unstable_settings = {
  initialRouteName: 'index',
};

// Root navigator. Every screen lives in this stack; screens hide the header
// and cross-fade into each other for a calm, premium feel.
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [fonts.regular]: PlusJakartaSans_400Regular,
    [fonts.medium]: PlusJakartaSans_500Medium,
    [fonts.semibold]: PlusJakartaSans_600SemiBold,
    [fonts.bold]: PlusJakartaSans_700Bold,
  });
  const ready = fontsLoaded || fontError != null;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {
        /* Nothing to hide. */
      });
    }
  }, [ready]);

  useEffect(() => {
    // Configure after first paint so RevenueCat never freezes the splash → home
    // transition. Native IAP still starts as soon as interactions settle.
    const task = InteractionManager.runAfterInteractions(() => {
      void (async () => {
        try {
          await configurePurchases();
          if (isNativePurchasesAvailable()) {
            await refreshPremiumFromRevenueCat();
          }
        } catch {
          /* IAP configure is best-effort; screens still load. */
        }
      })();
    });
    return () => task.cancel();
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

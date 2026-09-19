import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { GradientButton } from '@/components/GradientButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SettingsRow } from '@/components/SettingsRow';
import {
  hasPublicRevenueCatApiKey,
  isCustomerCenterAvailable,
  isNativePurchasesAvailable,
  presentCustomerCenter,
  restorePurchases,
} from '@/services/purchases';
import { clearAuth, getAccount, getIsSignedIn, type Account } from '@/storage/authStorage';
import { getIsPremium } from '@/storage/premiumStorage';
import { getProfile, hasResumeFile } from '@/storage/profileStorage';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { showAlert } from '@/utils/dialog';

// Settings list, opened from the gear on Home or Profile. The Profile tab itself is the person page.
export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [account, setAccountState] = useState<Account | null>(null);
  const [needsResume, setNeedsResume] = useState(false);
  const [busy, setBusy] = useState(false);
  const nativeAvailable = isNativePurchasesAvailable();
  const customerCenterAvailable = isCustomerCenterAvailable();
  const showCustomerCenter =
    nativeAvailable && customerCenterAvailable && (isPremium === true || account != null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [premium, signedIn, saved, profile] = await Promise.all([
          getIsPremium(),
          getIsSignedIn(),
          getAccount(),
          getProfile(),
        ]);
        if (cancelled) return;
        setIsPremium(premium);
        setAccountState(signedIn ? saved : null);
        setNeedsResume(premium && !hasResumeFile(profile));
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  };

  const refreshPremiumFlag = async () => {
    const [premium, profile] = await Promise.all([getIsPremium(), getProfile()]);
    setIsPremium(premium);
    setNeedsResume(premium && !hasResumeFile(profile));
  };

  const handleRestore = async () => {
    if (busy) return;
    if (!nativeAvailable) {
      showAlert(
        'Restore purchases',
        'Restore calls RevenueCat in a development or store build. Expo Go cannot restore a store or Test Store purchase.',
      );
      return;
    }
    if (!hasPublicRevenueCatApiKey()) {
      showAlert(
        'RevenueCat key missing',
        'Add the Test Store public SDK key to EXPO_PUBLIC_REVENUECAT_API_KEY in .env, then restart Metro.',
      );
      return;
    }

    setBusy(true);
    try {
      const restored = await restorePurchases();
      await refreshPremiumFlag();
      if (restored === 'restored') {
        showAlert('Purchases restored', 'Vetly Premium is active on this device.');
        return;
      }
      if (restored === 'no_key') {
        showAlert(
          'RevenueCat key missing',
          'Add the Test Store public SDK key to EXPO_PUBLIC_REVENUECAT_API_KEY in .env, then restart Metro.',
        );
        return;
      }
      if (restored === 'none') {
        showAlert('No purchases found', 'Nothing to restore for this RevenueCat customer.');
        return;
      }
      showAlert('Could not restore', 'Please try again.');
    } catch {
      showAlert('Could not restore', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleCustomerCenter = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await presentCustomerCenter();
      await refreshPremiumFlag();
      if (result === 'unavailable' || result === 'no_sdk') {
        showAlert(
          'Customer Center unavailable',
          'Manage subscription requires a development or store build with RevenueCat UI.',
        );
        return;
      }
      if (result === 'no_key') {
        showAlert(
          'RevenueCat key missing',
          'Add the Test Store public SDK key to EXPO_PUBLIC_REVENUECAT_API_KEY in .env, then restart Metro.',
        );
        return;
      }
      if (result === 'failed') {
        showAlert('Could not open Customer Center', 'Please try again.');
      }
    } catch {
      showAlert('Could not open Customer Center', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    showAlert(
      'Log out',
      'Your local session clears; evaluations may remain in Supabase under the anonymous user.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await clearAuth();
              setAccountState(null);
            })();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScreenHeader onBack={goBack} title="Settings" withSafeArea />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {account ? (
          <View style={styles.accountRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{account.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.accountText}>
              <Text style={styles.accountName}>{account.name}</Text>
              <Text style={styles.accountEmail}>{account.email}</Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>Your goal</Text>
        <Card padding={0} radius={16}>
          <SettingsRow
            icon="create-outline"
            label="Edit your goal"
            onPress={() => router.push({ pathname: '/goal', params: { mode: 'edit' } })}
            isLast={!needsResume}
          />
          {needsResume ? (
            <SettingsRow
              icon="document-text-outline"
              label="Add resume"
              onPress={() => router.push({ pathname: '/resume', params: { mode: 'edit' } })}
              isLast
            />
          ) : null}
        </Card>

        <Text style={styles.sectionLabel}>App</Text>
        <Card padding={0} radius={16}>
          <SettingsRow
            icon="information-circle-outline"
            label="About Vetly"
            onPress={() => router.push({ pathname: '/legal', params: { page: 'about' } })}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => router.push({ pathname: '/legal', params: { page: 'privacy' } })}
          />
          <SettingsRow
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => router.push({ pathname: '/legal', params: { page: 'terms' } })}
            isLast
          />
        </Card>

        <Text style={styles.sectionLabel}>Subscription</Text>
        <Card padding={0} radius={16}>
          <SettingsRow
            icon="refresh-outline"
            label={busy ? 'Working...' : 'Restore purchases'}
            onPress={() => {
              void handleRestore();
            }}
            isLast={!showCustomerCenter}
          />
          {showCustomerCenter ? (
            <SettingsRow
              icon="card-outline"
              label="Manage subscription"
              onPress={() => {
                void handleCustomerCenter();
              }}
              isLast
            />
          ) : null}
        </Card>

        {isPremium === true ? (
          <View style={styles.premiumBanner}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text style={styles.premiumBannerText}>
              {nativeAvailable
                ? 'You are on Vetly Premium'
                : 'Demo Premium on this device — not a store purchase'}
            </Text>
          </View>
        ) : isPremium === false ? (
          <View style={styles.upgrade}>
            <GradientButton
              label="Upgrade to Premium"
              onPress={() => router.push('/paywall')}
            />
            <Text style={styles.upgradeHint}>Unlimited evaluations and full application guidance</Text>
          </View>
        ) : null}

        {account ? (
          <Pressable
            onPress={handleLogout}
            accessibilityRole="button"
            style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
          >
            <Text style={styles.logoutLabel}>Log out</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => router.push({ pathname: '/legal', params: { page: 'about' } })}
          accessibilityRole="link"
          style={styles.versionWrap}
        >
          <Text style={styles.version}>Vetly 1.0.0 · know before you go</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
  },
  flex: {
    flex: 1,
  },
  accountRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.purple,
  },
  accountText: {
    flex: 1,
    marginLeft: 14,
  },
  accountName: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  accountEmail: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionLabel: {
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: fonts.semibold,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  upgrade: {
    marginTop: 32,
  },
  upgradeHint: {
    marginTop: 12,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  premiumBanner: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  premiumBannerText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  logout: {
    marginTop: 28,
    alignItems: 'center',
    paddingVertical: 8,
  },
  logoutLabel: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.danger,
  },
  pressed: {
    opacity: 0.6,
  },
  versionWrap: {
    marginTop: 28,
    alignItems: 'center',
  },
  version: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.tabInactive,
  },
});

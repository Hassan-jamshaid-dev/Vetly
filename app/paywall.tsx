import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientButton } from '@/components/GradientButton';
import {
  hasCurrentOfferingPackages,
  hasPublicRevenueCatApiKey,
  isNativePurchasesAvailable,
  presentDashboardPaywall,
  purchaseSelectedPlan,
  restorePurchases,
  type PremiumPlan,
  type PurchaseResult,
} from '@/services/purchases';
import { appendHistory } from '@/storage/historyStorage';
import { setIsPremium } from '@/storage/premiumStorage';
import { getProfile, isPremiumProfileComplete } from '@/storage/profileStorage';
import { getCurrentEvaluation } from '@/store/evaluationStore';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { showAlert } from '@/utils/dialog';

// Copy and prices match RevenueCat products: $4.99/mo and $29.99/yr.
const FEATURES = [
  'Unlimited evaluations',
  'Save every past evaluation',
  'Pattern analysis across your profile',
  'Application, resume, and cover-letter help',
];

// Custom paywall. Native / dev-client: RevenueCat purchasePackage (Test Store
// sandbox or live stores). Expo Go cannot load native IAP.
export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [plan, setPlan] = useState<PremiumPlan>('yearly');
  const [busy, setBusy] = useState(false);
  const [hasOfferings, setHasOfferings] = useState(true);
  const nativeAvailable = isNativePurchasesAvailable();
  const showDemoUnlock = !nativeAvailable && __DEV__;
  const useDashboardPaywallPrimary = nativeAvailable && !hasOfferings;

  useEffect(() => {
    if (!nativeAvailable) return;
    let cancelled = false;
    void hasCurrentOfferingPackages().then((available) => {
      if (!cancelled) setHasOfferings(available);
    });
    return () => {
      cancelled = true;
    };
  }, [nativeAvailable]);

  const closePaywall = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };

  /** Navigate after Premium is already granted (RevenueCat entitlement or labeled demo). */
  const continueAfterUnlock = async () => {
    const current = getCurrentEvaluation();
    if (current) await appendHistory(current);
    const profile = await getProfile();
    if (!isPremiumProfileComplete(profile)) {
      router.replace('/premium-onboarding');
      return;
    }
    closePaywall();
  };

  const applyPurchaseResult = async (result: PurchaseResult): Promise<boolean> => {
    if (result === 'success') {
      await continueAfterUnlock();
      return true;
    }
    if (result === 'cancelled') return true;
    if (result === 'no_key') {
      showAlert(
        'RevenueCat key missing',
        'Add the Test Store public SDK key to EXPO_PUBLIC_REVENUECAT_API_KEY in .env (never the secret REST key), then restart Metro.',
      );
      return true;
    }
    return false;
  };

  const handleSubscribe = async () => {
    if (busy) return;

    if (!nativeAvailable) {
      showAlert(
        'Development build required',
        'Expo Go cannot run RevenueCat in-app purchases. Install a development build (`npx expo run:android` or an EAS development profile), put the Test Store public SDK key in EXPO_PUBLIC_REVENUECAT_API_KEY, then subscribe. Test Store charges no real money.',
      );
      return;
    }

    if (!hasPublicRevenueCatApiKey()) {
      showAlert(
        'RevenueCat key missing',
        'Add the Test Store public SDK key to EXPO_PUBLIC_REVENUECAT_API_KEY in .env (never the secret REST key), then restart Metro.',
      );
      return;
    }

    setBusy(true);
    try {
      if (useDashboardPaywallPrimary) {
        const handled = await applyPurchaseResult(await presentDashboardPaywall());
        if (handled) return;
        showAlert(
          'Could not present paywall',
          'Create a Paywall on the current offering in the RevenueCat dashboard, and attach vetly_pro_monthly / vetly_pro_yearly to entitlement vetly_pro.',
        );
        return;
      }

      const result = await purchaseSelectedPlan(plan);
      if (result === 'no_offerings') {
        setHasOfferings(false);
        const handled = await applyPurchaseResult(await presentDashboardPaywall());
        if (handled) return;
      } else {
        const handled = await applyPurchaseResult(result);
        if (handled) return;
      }
      showAlert(
        'Could not complete purchase',
        'Check that Test Store products vetly_pro_monthly and vetly_pro_yearly are on the current offering ($rc_monthly / $rc_annual) and attached to entitlement vetly_pro. No real money is charged in Test Store.',
      );
    } catch {
      showAlert('Could not complete purchase', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleDashboardPaywall = async () => {
    if (busy) return;
    if (!nativeAvailable) {
      showAlert(
        'Development build required',
        'Expo Go cannot present the RevenueCat dashboard Paywall. Use `npx expo run:android` or an EAS development profile.',
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
      const handled = await applyPurchaseResult(await presentDashboardPaywall());
      if (handled) return;
      showAlert(
        'Could not present paywall',
        'Create a Paywall on the current offering in the RevenueCat dashboard, then try again.',
      );
    } catch {
      showAlert('Could not present paywall', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleDemoUnlock = async () => {
    if (busy || !showDemoUnlock) return;
    setBusy(true);
    try {
      await setIsPremium(true);
      await continueAfterUnlock();
    } catch {
      showAlert('Could not unlock demo Premium', 'Please try again.');
    } finally {
      setBusy(false);
    }
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
    setBusy(true);
    try {
      const restored = await restorePurchases();
      if (restored === 'restored') {
        await continueAfterUnlock();
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

  const unlockLabel = busy
    ? nativeAvailable
      ? useDashboardPaywallPrimary
        ? 'Opening paywall...'
        : 'Purchasing...'
      : 'Please wait...'
    : !nativeAvailable
      ? 'Install a development build'
      : useDashboardPaywallPrimary
        ? 'Subscribe with RevenueCat'
        : plan === 'yearly'
          ? 'Subscribe · $29.99/year'
          : 'Subscribe · $4.99/month';

  return (
    <LinearGradient
      colors={[colors.paywallTop, colors.paywallBottom]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.screen}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={closePaywall}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}
        >
          <Ionicons name="close" size={26} color={colors.white} />
        </Pressable>

        <Image
          source={require('../assets/images/paywall-hero.webp')}
          style={styles.heroImage}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />

        <Text style={styles.heading}>Unlock Premium</Text>
        <Text style={styles.kicker}>Know before you go — without a daily cap.</Text>

        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.white} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plans}>
          <PlanCard
            title="Yearly"
            price="$29.99"
            period="per year · $2.50/mo"
            badge="Best value"
            selected={plan === 'yearly'}
            onPress={() => setPlan('yearly')}
          />
          <PlanCard
            title="Monthly"
            price="$4.99"
            period="per month"
            selected={plan === 'monthly'}
            onPress={() => setPlan('monthly')}
          />
        </View>

        <View style={styles.cta}>
          <GradientButton
            label={unlockLabel}
            onPress={handleSubscribe}
            disabled={busy}
          />
          {!nativeAvailable ? (
            <Text style={styles.demoNote}>
              Expo Go cannot purchase. Open the development APK so Subscribe runs RevenueCat Test
              Store (sandbox, no real money).
            </Text>
          ) : (
            <Text style={styles.demoNote}>
              {useDashboardPaywallPrimary
                ? 'Subscribe opens the RevenueCat paywall. Test Store charges no real money.'
                : 'RevenueCat Test Store — sandbox, no real money.'}
            </Text>
          )}
          {nativeAvailable && hasOfferings ? (
            <Pressable
              onPress={handleDashboardPaywall}
              disabled={busy}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Open RevenueCat dashboard Paywall"
              style={({ pressed }) => [styles.later, pressed && styles.pressed]}
            >
              <Text style={styles.laterText}>Open RevenueCat paywall</Text>
            </Pressable>
          ) : null}
          {showDemoUnlock ? (
            <Pressable
              onPress={handleDemoUnlock}
              disabled={busy}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Unlock demo Premium, not billed, not a store purchase"
              style={({ pressed }) => [styles.demoUnlock, pressed && styles.pressed]}
            >
              <Text style={styles.demoUnlockText}>Demo unlock · not billed · not a store purchase</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={handleRestore}
            hitSlop={8}
            accessibilityRole="button"
            style={({ pressed }) => [styles.later, pressed && styles.pressed]}
          >
            <Text style={styles.laterText}>Restore purchases</Text>
          </Pressable>
          <View style={styles.legalRow}>
            <Pressable onPress={() => router.push({ pathname: '/legal', params: { page: 'terms' } })}>
              <Text style={styles.legalLink}>Terms</Text>
            </Pressable>
            <Text style={styles.legalDot}>·</Text>
            <Pressable
              onPress={() => router.push({ pathname: '/legal', params: { page: 'privacy' } })}
            >
              <Text style={styles.legalLink}>Privacy</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function PlanCard({
  title,
  price,
  period,
  badge,
  selected,
  onPress,
}: {
  title: string;
  price: string;
  period: string;
  badge?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.plan, selected && styles.planSelected]}
    >
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <Text style={styles.planTitle}>{title}</Text>
      <Text style={styles.planPrice}>{price}</Text>
      <Text style={styles.planPeriod}>{period}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  close: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  pressed: {
    opacity: 0.6,
  },
  heroImage: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginTop: 8,
    backgroundColor: colors.paywallCard,
  },
  heading: {
    marginTop: 20,
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.white,
    textAlign: 'center',
  },
  kicker: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.paywallMuted,
    textAlign: 'center',
  },
  features: {
    marginTop: 22,
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.white,
  },
  plans: {
    marginTop: 28,
    flexDirection: 'row',
    gap: 12,
  },
  plan: {
    flex: 1,
    borderRadius: 18,
    borderCurve: 'continuous',
    paddingVertical: 22,
    paddingHorizontal: 12,
    backgroundColor: colors.paywallCard,
    borderWidth: 1.5,
    borderColor: colors.paywallLine,
    alignItems: 'center',
    minHeight: 118,
  },
  planSelected: {
    backgroundColor: colors.paywallCardSelected,
    borderColor: colors.white,
  },
  badge: {
    position: 'absolute',
    top: -10,
    backgroundColor: colors.purple,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.white,
  },
  planTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.paywallMuted,
  },
  planPrice: {
    marginTop: 6,
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.white,
  },
  planPeriod: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.paywallMuted,
    textAlign: 'center',
  },
  cta: {
    marginTop: 'auto',
    paddingTop: 28,
  },
  demoNote: {
    marginTop: 14,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.paywallMuted,
    textAlign: 'center',
  },
  later: {
    marginTop: 16,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  laterText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.paywallMuted,
  },
  demoUnlock: {
    marginTop: 4,
    alignItems: 'center',
    minHeight: 36,
    justifyContent: 'center',
  },
  demoUnlockText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.paywallMuted,
  },
  legalRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  legalLink: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.paywallMuted,
    textDecorationLine: 'underline',
  },
  legalDot: {
    color: colors.paywallMuted,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientButton } from '@/components/GradientButton';
import { PaywallDecor } from '@/components/decor/PaywallDecor';
import { VMark } from '@/components/VMark';
import {
  REVENUECAT_KEY_MISSING_BODY,
  REVENUECAT_KEY_MISSING_TITLE,
} from '@/content/revenueCatCopy';
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

const MARK_SIZE = 112;

// Copy and prices match RevenueCat products: $10.99/mo and $80.99/yr.
const FEATURES = [
  'Unlimited evaluations',
  'Save every past evaluation',
  'Pattern analysis across your profile',
  'Application, resume, and cover-letter help',
];

const WEB_CHECKOUT_NOTE =
  'Checkout opens in the iOS or Android app. This web preview cannot complete a store purchase.';
const WEB_RESTORE_NOTE =
  'Restore runs in the iOS or Android app. This preview cannot restore a store purchase.';

// Custom paywall. Native / dev-client: RevenueCat purchasePackage (Test Store
// sandbox or live stores). Expo Go cannot load native IAP.
export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [plan, setPlan] = useState<PremiumPlan>('yearly');
  const [busy, setBusy] = useState(false);
  const [hasOfferings, setHasOfferings] = useState(true);
  const [billingNotice, setBillingNotice] = useState<string | null>(null);
  const nativeAvailable = isNativePurchasesAvailable();
  const showDemoUnlock = !nativeAvailable && __DEV__;
  const useDashboardPaywallPrimary = nativeAvailable && !hasOfferings;
  // Mobile browsers often report 0 safe-area inset under chrome; keep content clear.
  const topPad = Math.max(insets.top, Platform.OS === 'web' ? 28 : 12) + 12;
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'web' ? 32 : 16) + 28;

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

  // Web: #root / body stay light from the stack, which shows as a white band under
  // Restore. Paint the document purple while this screen is mounted.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const prevHtml = html.style.backgroundColor;
    const prevBody = body.style.backgroundColor;
    const prevRoot = root?.style.backgroundColor ?? '';
    html.style.backgroundColor = colors.paywallBottom;
    body.style.backgroundColor = colors.paywallBottom;
    if (root) root.style.backgroundColor = colors.paywallBottom;
    return () => {
      html.style.backgroundColor = prevHtml;
      body.style.backgroundColor = prevBody;
      if (root) root.style.backgroundColor = prevRoot;
    };
  }, []);

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
      showAlert(REVENUECAT_KEY_MISSING_TITLE, REVENUECAT_KEY_MISSING_BODY);
      return true;
    }
    return false;
  };

  const handleSubscribe = async () => {
    if (busy) return;

    if (!nativeAvailable) {
      setBillingNotice(WEB_CHECKOUT_NOTE);
      return;
    }

    if (!hasPublicRevenueCatApiKey()) {
      showAlert(REVENUECAT_KEY_MISSING_TITLE, REVENUECAT_KEY_MISSING_BODY);
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
      setBillingNotice(WEB_CHECKOUT_NOTE);
      return;
    }
    if (!hasPublicRevenueCatApiKey()) {
      showAlert(REVENUECAT_KEY_MISSING_TITLE, REVENUECAT_KEY_MISSING_BODY);
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
      setBillingNotice(WEB_RESTORE_NOTE);
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
        showAlert(REVENUECAT_KEY_MISSING_TITLE, REVENUECAT_KEY_MISSING_BODY);
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
      ? 'Subscribe in the app'
      : useDashboardPaywallPrimary
        ? 'Subscribe with RevenueCat'
        : plan === 'yearly'
          ? 'Subscribe · $80.99/year'
          : 'Subscribe · $10.99/month';

  return (
    <>
      <Stack.Screen
        options={{
          contentStyle: { backgroundColor: colors.paywallBottom },
          animation: 'fade',
        }}
      />
      <View
        style={[
          styles.screen,
          { backgroundColor: colors.paywallBottom, minHeight: windowHeight },
        ]}
      >
        <LinearGradient
          colors={[colors.paywallTop, colors.paywallBottom]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradientFill}
        />
        <PaywallDecor width={windowWidth} height={windowHeight} />
        <StatusBar style="light" />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            paddingTop: topPad,
            paddingBottom: bottomPad,
            paddingHorizontal: 28,
            flexGrow: 1,
            minHeight: windowHeight,
          }}
          showsVerticalScrollIndicator={false}
          bounces
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={closePaywall}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}
          >
            <Ionicons name="close" size={20} color={colors.white} />
          </Pressable>

          <View style={styles.markWrap} accessibilityElementsHidden>
            <VMark size={MARK_SIZE} />
          </View>

          <Text style={styles.eyebrow}>Premium</Text>
          <Text style={styles.heading} maxFontSizeMultiplier={1.15}>
            Know before you go.
          </Text>
          <Text style={styles.kicker} maxFontSizeMultiplier={1.2}>
            Without a daily cap. Evaluated against your goals.
          </Text>

          <View style={styles.features}>
            {FEATURES.map((feature, index) => (
              <View key={feature} style={[styles.featureRow, index > 0 && styles.featureRule]}>
                <Ionicons name="checkmark" size={15} color={colors.paywallMuted} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <View style={styles.offers}>
            <Pressable
              onPress={() => setPlan('yearly')}
              accessibilityRole="button"
              accessibilityLabel="Yearly, $80.99 per year"
              accessibilityState={{ selected: plan === 'yearly' }}
              style={({ pressed }) => [
                styles.planCard,
                styles.planCardYearly,
                plan === 'yearly' && styles.planCardSelected,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.planCardTop}>
                <View style={styles.planLabelRow}>
                  <Text style={styles.planLabel}>Yearly</Text>
                  <View style={styles.savePill}>
                    <Text style={styles.savePillText}>Save 38%</Text>
                  </View>
                </View>
                <View style={[styles.radio, plan === 'yearly' && styles.radioOn]}>
                  {plan === 'yearly' ? (
                    <Ionicons name="checkmark" size={11} color={colors.paywallTop} />
                  ) : null}
                </View>
              </View>
              <Text style={styles.planPrice}>$80.99</Text>
              <Text style={styles.planPeriod}>$6.75 per month, billed once a year</Text>
            </Pressable>

            <Pressable
              onPress={() => setPlan('monthly')}
              accessibilityRole="button"
              accessibilityLabel="Monthly, $10.99 per month"
              accessibilityState={{ selected: plan === 'monthly' }}
              style={({ pressed }) => [
                styles.planCard,
                plan === 'monthly' && styles.planCardSelected,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.planCardTop}>
                <Text style={styles.planLabel}>Monthly</Text>
                <View style={[styles.radio, plan === 'monthly' && styles.radioOn]}>
                  {plan === 'monthly' ? (
                    <Ionicons name="checkmark" size={11} color={colors.paywallTop} />
                  ) : null}
                </View>
              </View>
              <Text style={styles.planPriceCompact}>$10.99</Text>
              <Text style={styles.planPeriod}>Billed each month</Text>
            </Pressable>
          </View>

          <View style={styles.cta}>
            <GradientButton label={unlockLabel} onPress={handleSubscribe} disabled={busy} />
            {!nativeAvailable ? (
              <Text style={styles.webCheckoutNote}>{WEB_CHECKOUT_NOTE}</Text>
            ) : (
              <Text style={styles.demoNote}>
                {useDashboardPaywallPrimary
                  ? 'Subscribe opens the RevenueCat paywall. Test Store charges no real money.'
                  : 'RevenueCat Test Store. Sandbox, no real money.'}
              </Text>
            )}
            {billingNotice ? (
              <View style={styles.noticeBox}>
                <Text style={styles.noticeText}>{billingNotice}</Text>
              </View>
            ) : null}
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
                <Text style={styles.demoUnlockText}>
                  Demo unlock · not billed · not a store purchase
                </Text>
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
              <Pressable
                onPress={() => router.push({ pathname: '/legal', params: { page: 'terms' } })}
              >
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
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paywallBottom,
    ...(Platform.OS === 'web'
      ? {
          position: 'absolute' as const,
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          width: '100%' as unknown as number,
          height: '100%' as unknown as number,
        }
      : {}),
  },
  gradientFill: {
    ...StyleSheet.absoluteFill,
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    backgroundColor: colors.whiteAlpha25,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  pressed: {
    opacity: 0.72,
  },
  markWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
    // Extra room so the full V mark never feels clipped at the edges.
    paddingVertical: 8,
    overflow: 'visible',
  },
  eyebrow: {
    marginTop: 16,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 1.2,
    color: colors.paywallMuted,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  heading: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.6,
    color: colors.white,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  kicker: {
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.paywallMuted,
    textAlign: 'center',
  },
  features: {
    marginTop: 28,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  featureRule: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.paywallLine,
  },
  featureText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.white,
  },
  offers: {
    marginTop: 24,
    gap: 12,
    marginBottom: 4,
  },
  planCard: {
    borderRadius: 20,
    borderCurve: 'continuous',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: colors.paywallCard,
    borderWidth: 1.5,
    borderColor: colors.paywallLine,
  },
  planCardYearly: {
    paddingVertical: 22,
  },
  planCardSelected: {
    backgroundColor: colors.paywallCardSelected,
    borderColor: colors.white,
  },
  planCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.paywallMuted,
  },
  savePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderCurve: 'continuous',
    backgroundColor: colors.whiteAlpha25,
  },
  savePillText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.white,
    letterSpacing: 0.2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.paywallMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: colors.white,
    backgroundColor: colors.white,
  },
  planPrice: {
    marginTop: 10,
    fontFamily: fonts.bold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.8,
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  planPriceCompact: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  planPeriod: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.paywallMuted,
  },
  cta: {
    marginTop: 'auto',
    paddingTop: 24,
    gap: 4,
  },
  demoNote: {
    marginTop: 14,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.paywallMuted,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  webCheckoutNote: {
    marginTop: 14,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.paywallMuted,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  noticeBox: {
    marginTop: 12,
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.whiteAlpha25,
    borderWidth: 1,
    borderColor: colors.whiteAlpha25,
  },
  noticeText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
    textAlign: 'center',
  },
  later: {
    marginTop: 8,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  laterText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.paywallMuted,
  },
  demoUnlock: {
    marginTop: 0,
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
    marginTop: 8,
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

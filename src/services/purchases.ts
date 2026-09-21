import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { setIsPremium } from '@/storage/premiumStorage';

/** Dashboard entitlement. Must match RevenueCat exactly. */
export const PREMIUM_ENTITLEMENT_ID = 'vetly_pro';

/** Store / RevenueCat product ids. Prices: $10.99/mo and $80.99/yr. */
export const MONTHLY_PRODUCT_ID = 'vetly_pro_monthly';
export const YEARLY_PRODUCT_ID = 'vetly_pro_yearly';

export const RC_ANNUAL_PACKAGE_ID = '$rc_annual';
export const RC_MONTHLY_PACKAGE_ID = '$rc_monthly';

export type PremiumPlan = 'yearly' | 'monthly';

export type PurchaseResult =
  | 'success'
  | 'cancelled'
  | 'no_sdk'
  | 'no_key'
  | 'no_offerings'
  | 'failed';

export type RestoreResult = 'restored' | 'none' | 'no_sdk' | 'no_key' | 'failed';

export type CustomerCenterResult =
  | 'dismissed'
  | 'no_sdk'
  | 'no_key'
  | 'unavailable'
  | 'failed';

type PurchasesNS = typeof import('react-native-purchases');
type PurchasesModule = PurchasesNS['default'];
type PurchasesUiNS = typeof import('react-native-purchases-ui');
type RevenueCatUIModule = PurchasesUiNS['default'];
type CustomerInfo = Awaited<ReturnType<PurchasesModule['getCustomerInfo']>>;
type PurchasesPackage = Awaited<
  ReturnType<PurchasesModule['getOfferings']>
>['current'] extends infer O
  ? O extends { availablePackages: infer P }
    ? P extends readonly (infer Item)[]
      ? Item
      : never
    : never
  : never;

type NativeSdk = {
  Purchases: PurchasesModule;
  LOG_LEVEL: PurchasesNS['LOG_LEVEL'];
  PURCHASES_ERROR_CODE?: PurchasesNS['PURCHASES_ERROR_CODE'];
  RevenueCatUI: RevenueCatUIModule;
  PAYWALL_RESULT: PurchasesUiNS['PAYWALL_RESULT'];
};

let sdk: NativeSdk | null | undefined;
let configured = false;
let loggedExpoGoSkip = false;
let loggedMissingKey = false;

function runningInExpoGo(): boolean {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return true;
  if (Constants.appOwnership === 'expo') return true;
  const expoGo = (globalThis as { expo?: { modules?: { ExpoGo?: unknown } } }).expo?.modules?.ExpoGo;
  return Boolean(expoGo);
}

function publicSdkKey(): string {
  return process.env.EXPO_PUBLIC_REVENUECAT_API_KEY?.trim() ?? '';
}

function logExpoGoSkip(): void {
  if (loggedExpoGoSkip) return;
  loggedExpoGoSkip = true;
  console.info(
    '[Vetly] RevenueCat skipped: Expo Go cannot run native IAP. Use a development build (`npx expo run:android` or `npx expo run:ios`, or an EAS development profile).',
  );
}

function logMissingKey(): void {
  if (loggedMissingKey) return;
  loggedMissingKey = true;
  console.warn(
    '[Vetly] RevenueCat skipped: EXPO_PUBLIC_REVENUECAT_API_KEY is empty. Add the Test Store public SDK key to .env (never the secret REST key), then restart Metro.',
  );
}

/**
 * True only in an iOS/Android binary that includes IAP native code
 * (development build / EAS). Expo Go, web, and a failed native require
 * cannot run RevenueCat Test Store or store billing.
 */
export function isNativePurchasesAvailable(): boolean {
  return getNativeSdk() != null;
}

export function hasPublicRevenueCatApiKey(): boolean {
  return publicSdkKey().length > 0;
}

export function isCustomerCenterAvailable(): boolean {
  const native = getNativeSdk();
  return typeof native?.RevenueCatUI?.presentCustomerCenter === 'function';
}

function getNativeSdk(): NativeSdk | null {
  if (sdk !== undefined) return sdk;

  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    sdk = null;
    return null;
  }

  // Never evaluate the native packages in Expo Go. Preview/mock APIs may
  // exist, but they are not a real Test Store / store purchase.
  if (runningInExpoGo()) {
    sdk = null;
    return null;
  }

  try {
    const purchasesNS = require('react-native-purchases') as PurchasesNS & {
      default: PurchasesModule;
    };
    const uiNS = require('react-native-purchases-ui') as PurchasesUiNS & {
      default: RevenueCatUIModule;
    };

    const Purchases = purchasesNS.default ?? (purchasesNS as unknown as PurchasesModule);
    const RevenueCatUI = uiNS.default ?? (uiNS as unknown as RevenueCatUIModule);
    const LOG_LEVEL = purchasesNS.LOG_LEVEL ?? Purchases.LOG_LEVEL;
    const PAYWALL_RESULT = uiNS.PAYWALL_RESULT ?? RevenueCatUI.PAYWALL_RESULT;
    const PURCHASES_ERROR_CODE =
      purchasesNS.PURCHASES_ERROR_CODE ?? Purchases.PURCHASES_ERROR_CODE;

    if (
      typeof Purchases?.configure !== 'function' ||
      typeof Purchases?.getOfferings !== 'function' ||
      typeof Purchases?.purchasePackage !== 'function' ||
      typeof Purchases?.restorePurchases !== 'function' ||
      typeof Purchases?.getCustomerInfo !== 'function' ||
      typeof RevenueCatUI?.presentPaywall !== 'function' ||
      LOG_LEVEL == null ||
      PAYWALL_RESULT == null
    ) {
      sdk = null;
      return null;
    }

    sdk = { Purchases, LOG_LEVEL, PURCHASES_ERROR_CODE, RevenueCatUI, PAYWALL_RESULT };
    return sdk;
  } catch {
    sdk = null;
    return null;
  }
}

function hasActivePremium(customerInfo: CustomerInfo | null | undefined): boolean | null {
  if (!customerInfo?.entitlements?.active) return null;
  return typeof customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== 'undefined';
}

/**
 * Persist Premium from CustomerInfo. Returns null if entitlements are missing
 * so callers do not grant a local unlock when the refresh failed.
 * Never writes true unless `vetly_pro` is active.
 */
async function setPremiumFromCustomerInfo(
  customerInfo: CustomerInfo | null | undefined,
): Promise<boolean | null> {
  const hasPro = hasActivePremium(customerInfo);
  if (hasPro == null) return null;
  await setIsPremium(hasPro);
  return hasPro;
}

/**
 * After a store / Test Store purchase or restore: use CustomerInfo when present,
 * otherwise refresh. Never force `isPremium` true if the entitlement is missing.
 */
async function syncPremiumAfterPurchase(customerInfo?: CustomerInfo): Promise<boolean> {
  const fromInfo = await setPremiumFromCustomerInfo(customerInfo);
  if (fromInfo != null) return fromInfo;
  const refreshed = await refreshPremiumFromRevenueCat();
  return refreshed === true;
}

function pickPackageForPlan(
  offerings: Awaited<ReturnType<PurchasesModule['getOfferings']>>,
  plan: PremiumPlan,
): PurchasesPackage | null {
  const current = offerings.current;
  if (!current) return null;

  const productId = plan === 'yearly' ? YEARLY_PRODUCT_ID : MONTHLY_PRODUCT_ID;
  const byProduct = current.availablePackages.find((pkg) => pkg.product?.identifier === productId);
  if (byProduct) return byProduct;

  if (plan === 'yearly') {
    return (
      current.annual ??
      current.availablePackages.find(
        (pkg) => pkg.packageType === 'ANNUAL' || pkg.identifier === RC_ANNUAL_PACKAGE_ID,
      ) ??
      null
    );
  }

  return (
    current.monthly ??
    current.availablePackages.find(
      (pkg) => pkg.packageType === 'MONTHLY' || pkg.identifier === RC_MONTHLY_PACKAGE_ID,
    ) ??
    null
  );
}

/**
 * Call once at app start. No-op when the public SDK key is missing or native
 * purchases are unavailable (Expo Go / web). Guarded so configure is never
 * invoked twice.
 *
 * Sandbox: put the RevenueCat **Test Store** public SDK key in
 * `EXPO_PUBLIC_REVENUECAT_API_KEY`. Production: switch to the Apple / Google
 * public SDK keys. Never put a secret REST key here.
 */
export async function configurePurchases(): Promise<void> {
  if (configured) return;

  if (runningInExpoGo()) {
    logExpoGoSkip();
    return;
  }

  const native = getNativeSdk();
  if (!native) return;

  const apiKey = publicSdkKey();
  if (!apiKey) {
    logMissingKey();
    return;
  }

  try {
    if (typeof native.Purchases.isConfigured === 'function') {
      const already = await native.Purchases.isConfigured();
      if (already) {
        configured = true;
        return;
      }
    }

    const verbose = native.LOG_LEVEL.VERBOSE ?? native.LOG_LEVEL.DEBUG;
    const production = native.LOG_LEVEL.INFO ?? native.LOG_LEVEL.WARN;
    await native.Purchases.setLogLevel(__DEV__ ? verbose : production);
    native.Purchases.configure({ apiKey });
    configured = true;
  } catch (error) {
    configured = false;
    console.warn(
      '[Vetly] RevenueCat configure failed.',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  await configurePurchases();
  const native = getNativeSdk();
  if (!native || !configured) return null;

  try {
    return await native.Purchases.getCustomerInfo();
  } catch (error) {
    console.warn(
      '[Vetly] RevenueCat getCustomerInfo failed.',
      error instanceof Error ? error.message : 'Unknown error',
    );
    return null;
  }
}

/** True only when CustomerInfo has an active `vetly_pro` entitlement. */
export async function isProEntitlementActive(): Promise<boolean> {
  const customerInfo = await getCustomerInfo();
  return hasActivePremium(customerInfo) === true;
}

export async function hasCurrentOfferingPackages(): Promise<boolean> {
  await configurePurchases();
  const native = getNativeSdk();
  if (!native || !configured) return false;

  try {
    const offerings = await native.Purchases.getOfferings();
    return (offerings.current?.availablePackages.length ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Sync the local `isPremium` flag from RevenueCat.
 *
 * Native available: RC is the source of truth. `vetly_pro` active → premium
 * true; otherwise premium false (including wiping a local demo unlock).
 *
 * Native unavailable (Expo Go / web): do nothing. A labeled demo unlock must
 * not be overwritten by a missing entitlement.
 */
export async function refreshPremiumFromRevenueCat(): Promise<boolean | null> {
  await configurePurchases();
  const native = getNativeSdk();
  if (!native || !configured) return null;

  try {
    const customerInfo = await native.Purchases.getCustomerInfo();
    return await setPremiumFromCustomerInfo(customerInfo);
  } catch {
    // Leave the local flag unchanged if the store or network fails.
    return null;
  }
}

function nativePurchaseBlocker(): Extract<PurchaseResult, 'no_sdk' | 'no_key' | 'failed'> | null {
  const native = getNativeSdk();
  if (!native) return 'no_sdk';
  if (!publicSdkKey()) return 'no_key';
  if (!configured) return 'failed';
  return null;
}

/**
 * Buy the selected Monthly ($10.99) or Yearly ($80.99) package via
 * `Purchases.purchasePackage`. With a Test Store API key, RevenueCat shows a
 * sandbox modal (success / fail / cancel) — no real money. Returns `success`
 * only when `vetly_pro` is active on CustomerInfo afterwards.
 */
export async function purchaseSelectedPlan(plan: PremiumPlan): Promise<PurchaseResult> {
  await configurePurchases();
  const blocked = nativePurchaseBlocker();
  if (blocked) return blocked;

  const native = getNativeSdk();
  if (!native) return 'no_sdk';

  try {
    const offerings = await native.Purchases.getOfferings();
    const selected = pickPackageForPlan(offerings, plan);
    if (!selected) return 'no_offerings';

    const { customerInfo } = await native.Purchases.purchasePackage(selected);
    const premium = await syncPremiumAfterPurchase(customerInfo);
    return premium ? 'success' : 'failed';
  } catch (error) {
    if (isUserCancelled(error)) return 'cancelled';
    console.warn(
      '[Vetly] RevenueCat purchasePackage failed.',
      error instanceof Error ? error.message : 'Unknown error',
    );
    return 'failed';
  }
}

/**
 * Present the dashboard paywall (`RevenueCatUI.presentPaywall`).
 * PURCHASED / RESTORED succeed only if `vetly_pro` is active.
 * CANCELLED stays cancelled (not a failed purchase).
 */
export async function presentDashboardPaywall(): Promise<PurchaseResult> {
  await configurePurchases();
  const native = getNativeSdk();
  if (!native || !configured) return nativePurchaseBlocker() ?? 'failed';

  try {
    const paywallResult = await native.RevenueCatUI.presentPaywall();
    const { PAYWALL_RESULT } = native;

    switch (paywallResult) {
      case PAYWALL_RESULT.NOT_PRESENTED:
      case PAYWALL_RESULT.ERROR:
        return 'failed';
      case PAYWALL_RESULT.CANCELLED:
        return 'cancelled';
      case PAYWALL_RESULT.PURCHASED:
      case PAYWALL_RESULT.RESTORED: {
        const premium = await refreshPremiumFromRevenueCat();
        return premium ? 'success' : 'failed';
      }
      default:
        return 'failed';
    }
  } catch (error) {
    if (isUserCancelled(error)) return 'cancelled';
    console.warn(
      '[Vetly] RevenueCat presentPaywall failed.',
      error instanceof Error ? error.message : 'Unknown error',
    );
    return 'failed';
  }
}

/** Restore via `Purchases.restorePurchases`. No-op when native SDK is unavailable. */
export async function restorePurchases(): Promise<RestoreResult> {
  await configurePurchases();
  const blocked = nativePurchaseBlocker();
  if (blocked) return blocked;

  const native = getNativeSdk();
  if (!native) return 'no_sdk';

  try {
    const customerInfo = await native.Purchases.restorePurchases();
    const fromInfo = await setPremiumFromCustomerInfo(customerInfo);
    if (fromInfo === true) return 'restored';
    if (fromInfo === false) return 'none';
    const refreshed = await refreshPremiumFromRevenueCat();
    if (refreshed === true) return 'restored';
    if (refreshed === false) return 'none';
    return 'failed';
  } catch (error) {
    if (isUserCancelled(error)) return 'none';
    console.warn(
      '[Vetly] RevenueCat restorePurchases failed.',
      error instanceof Error ? error.message : 'Unknown error',
    );
    return 'failed';
  }
}

/**
 * Present RevenueCat Customer Center when the UI SDK exports it.
 * Refreshes `vetly_pro` after dismiss (restore / plan change inside the sheet).
 */
export async function presentCustomerCenter(): Promise<CustomerCenterResult> {
  await configurePurchases();
  const blocked = nativePurchaseBlocker();
  if (blocked) return blocked;

  const native = getNativeSdk();
  if (!native) return 'no_sdk';
  if (typeof native.RevenueCatUI.presentCustomerCenter !== 'function') return 'unavailable';

  try {
    await native.RevenueCatUI.presentCustomerCenter({
      callbacks: {
        onRestoreCompleted: ({ customerInfo }) => {
          void setPremiumFromCustomerInfo(customerInfo);
        },
      },
    });
    await refreshPremiumFromRevenueCat();
    return 'dismissed';
  } catch (error) {
    console.warn(
      '[Vetly] RevenueCat presentCustomerCenter failed.',
      error instanceof Error ? error.message : 'Unknown error',
    );
    return 'failed';
  }
}

function isUserCancelled(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { userCancelled?: unknown; code?: unknown };
  if (candidate.userCancelled === true) return true;

  const cancelledCode =
    getNativeSdk()?.PURCHASES_ERROR_CODE?.PURCHASE_CANCELLED_ERROR ?? '1';
  return candidate.code === cancelledCode || candidate.code === 'PURCHASE_CANCELLED_ERROR';
}

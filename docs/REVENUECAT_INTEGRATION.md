# RevenueCat integration (Vetly)

Billing is isolated in **`src/services/purchases.ts`**. Do not replace that module with a singleton `_DEV_` class or a second `configure()` wrapper. `app/_layout.tsx` already calls `configurePurchases()` once after first paint; the paywall and Settings call the same helpers.

Secrets never belong in this repo. Use `.env` (gitignored). Copy `.env.example` first.

## Dashboard contract

| Item | Value |
|---|---|
| Entitlement | `vetly_pro` |
| Monthly product | `vetly_pro_monthly` — **$10.99** |
| Yearly product | `vetly_pro_yearly` — **$80.99** (≈ $6.75/mo) |
| Packages | `$rc_monthly`, `$rc_annual` |
| Bundle id / package | `com.vetly.app` |

Premium is granted **only** when `CustomerInfo.entitlements.active.vetly_pro` is present (after `purchasePackage`, `presentPaywall`, or `restorePurchases`).

Update Test Store prices in the RevenueCat dashboard to match $10.99 / $80.99, or the sandbox modal will show stale amounts.

## Public SDK key vs secret

| Variable | Allowed? |
|---|---|
| `EXPO_PUBLIC_REVENUECAT_API_KEY` | Yes — **Test Store public** SDK key for sandbox (Apple/Google public keys later). Unused in Expo Go. |
| `REVENUECAT_SECRET` | Local catalog / REST scripts only. **Never** `EXPO_PUBLIC_`. Never commit a real value. |

`configurePurchases` is a no-op in Expo Go, on web, or when the public key is empty. It never reads a secret REST key.

## What `purchases.ts` does

| Export | Behavior |
|---|---|
| `configurePurchases()` | `Purchases.configure({ apiKey })` once. Guarded against double configure. |
| `purchaseSelectedPlan(plan)` | `Purchases.purchasePackage` for `$rc_annual` / `$rc_monthly` (matched by product id). Returns `success` only if `vetly_pro` is active. |
| `presentDashboardPaywall()` | `RevenueCatUI.presentPaywall`. Used when the current offering has no packages, or from the paywall’s “RevenueCat Paywall” control. |
| `restorePurchases()` | `Purchases.restorePurchases`. |
| `refreshPremiumFromRevenueCat()` | Native: RC is source of truth. Expo Go / web: no-op so a labeled demo unlock is not wiped. |
| `presentCustomerCenter()` | Settings → Manage subscription. Refreshes `vetly_pro` on dismiss. |

Paywall UI (`app/paywall.tsx`):

- **Subscribe** → `purchaseSelectedPlan`.
- No packages on the current offering → fall back to `presentDashboardPaywall`.
- Success path writes Premium **from CustomerInfo**, not from a local guess.

Test Store: sandbox modal, **$0**, no real money.

## Expo Go vs preview APK

| Surface | IAP |
|---|---|
| Expo Go / web | Cannot load native purchases. Paywall CTA is **Install a development build**. Optional `__DEV__` “Unlock demo (not billed · not a store purchase)” is local-only. |
| Preview / standalone APK, or `npx expo run:android` / `run:ios` | Real SDK path: `purchasePackage` / `presentPaywall` → Test Store → `CustomerInfo` → `vetly_pro`. |

Judge APK (EAS artifact): https://expo.dev/artifacts/eas/NQu90Y-zCVdr2idRWAEGym0J-yd6AMeIWSfL_4MR8Dg.apk

Put the Test Store **public** key in `.env`, restart Metro, open the **dev client / preview APK** (not Expo Go).

## Local Premium cache

`src/storage/premiumStorage.ts` (`vetly:isPremium`) is a **cache** for UI. Native builds overwrite it from `CustomerInfo`. Never treat this flag as proof of a store purchase on Expo Go.

## Go live later (not required for Shipaton Next Gen)

Keep `com.vetly.app`. Create the same product ids on App Store Connect and Google Play, attach them to `vetly_pro`, then swap `.env` to Apple / Google **public** SDK keys. Still never commit secrets. Next Gen does **not** require a store listing.

## Do not

- Commit `.env`, `credentials.json`, `.pem` / `.key` / `.p12`, or any `appl_` / `goog_` sample keys.
- Bundle `REVENUECAT_SECRET` or a Claude key as `EXPO_PUBLIC_*`.
- Add Stripe or a second billing singleton that re-calls `configure()`.

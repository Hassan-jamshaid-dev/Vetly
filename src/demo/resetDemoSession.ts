import { signOutSupabase } from '@/lib/supabase';
import {
  configurePurchases,
  isNativePurchasesAvailable,
  refreshPremiumFromRevenueCat,
} from '@/services/purchases';
import { clearAuth } from '@/storage/authStorage';
import { clearGoal } from '@/storage/goalStorage';
import { clearHistory } from '@/storage/historyStorage';
import { clearDisplayName } from '@/storage/nameStorage';
import { setIsPremium } from '@/storage/premiumStorage';
import { clearProfile } from '@/storage/profileStorage';
import { resetUsage } from '@/storage/usageStorage';
import { clearCurrentEvaluation } from '@/store/evaluationStore';

/** Clears simulated login, Premium, usage, history, goal, and profile for a demo take. */
export async function resetDemoSession(): Promise<void> {
  clearCurrentEvaluation();
  try {
    await Promise.all([
      clearAuth(),
      setIsPremium(false),
      resetUsage(),
      clearHistory(),
      clearGoal(),
      clearProfile(),
      clearDisplayName(),
      signOutSupabase(),
    ]);
  } catch {
    // Demo reset is best-effort; still continue first-run routing.
  }

  // Demo reset wipes the local Premium flag. In a dev build, restore from
  // RevenueCat so a real `vetly_pro` purchase still wins. Expo Go has no
  // native SDK, so simulated Premium stays cleared.
  try {
    await configurePurchases();
    if (isNativePurchasesAvailable()) {
      await refreshPremiumFromRevenueCat();
    }
  } catch {
    /* Best-effort; first-run routing still continues. */
  }
}

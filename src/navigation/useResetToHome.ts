import { useNavigation } from 'expo-router';
import { useCallback } from 'react';

import { getCurrentEvaluation } from '@/store/evaluationStore';

/**
 * Replace the root stack with Home so hardware/back cannot return to
 * Splash, Onboarding, Goal, or the paywall.
 */
export function useResetToHome(): () => void {
  const navigation = useNavigation();
  return useCallback(() => {
    // Typed routes do not list the tab group as a reset target (`name` becomes `never`).
    navigation.reset({
      index: 0,
      routes: [{ name: '(tabs)', params: { screen: 'home' } }],
    } as never);
  }, [navigation]);
}

/**
 * After first-time Premium setup: Home, or Results if they just unlocked
 * an evaluation (so Unlock from Results still shows the guidance they paid for).
 */
export function useFinishPremiumSetup(): () => void {
  const navigation = useNavigation();
  return useCallback(() => {
    const current = getCurrentEvaluation();
    if (current) {
      navigation.reset({
        index: 1,
        routes: [
          { name: '(tabs)', params: { screen: 'home' } },
          { name: 'results' },
        ],
      } as never);
      return;
    }
    navigation.reset({
      index: 0,
      routes: [{ name: '(tabs)', params: { screen: 'home' } }],
    } as never);
  }, [navigation]);
}

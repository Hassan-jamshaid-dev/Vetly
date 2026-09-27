import AsyncStorage from '@react-native-async-storage/async-storage';

// The user's chosen goal is saved on-device. Splash uses getGoal() to skip
// onboarding for returning users — unless DEMO_ALWAYS_SHOW_ONBOARDING (temporary
// demo/recording, keeps the saved goal) or DEMO_FORCE_FIRST_RUN (full reset) is on.
const GOAL_KEY = 'vetly:goal';

/** Returns the saved goal, or null if none / blank / storage failed. */
export async function getGoal(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(GOAL_KEY);
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

/** Saves the user's goal. Used by the Goal screen (Screen 3). */
export async function setGoal(goal: string): Promise<void> {
  await AsyncStorage.setItem(GOAL_KEY, goal);
}

/** Removes the saved goal so the Goal screen starts empty. */
export async function clearGoal(): Promise<void> {
  await AsyncStorage.removeItem(GOAL_KEY);
}

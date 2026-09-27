import AsyncStorage from '@react-native-async-storage/async-storage';

// Local first name / display name. No account required — free and premium
// onboarding both write this so Profile can greet the person on device.

const NAME_KEY = 'vetly:displayName';

/** Saved display name, or null if none / storage failed. */
export async function getDisplayName(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(NAME_KEY);
    if (!raw) return null;
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

/** Persist a display name on device (no account). */
export async function setDisplayName(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) {
    await AsyncStorage.removeItem(NAME_KEY);
    return;
  }
  await AsyncStorage.setItem(NAME_KEY, trimmed.slice(0, 80));
}

/** Used by demo launch reset. */
export async function clearDisplayName(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NAME_KEY);
  } catch {
    /* Demo reset is best-effort. */
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Simulated account only. Password is never persisted (hashing belongs on a
// server when real auth exists). Session lives in SecureStore on device.

const SIGNED_IN_KEY = 'vetly_isSignedIn';
const ACCOUNT_KEY = 'vetly_account';
const LEGACY_SIGNED_IN_KEY = 'vetly:isSignedIn';
const LEGACY_ACCOUNT_KEY = 'vetly:account';

export type Account = {
  name: string;
  email: string;
};

function isAccount(value: unknown): value is Account {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Account;
  return typeof item.name === 'string' && typeof item.email === 'string';
}

async function readSecret(key: string): Promise<string | null> {
  if (Platform.OS !== 'web') {
    try {
      const secure = await SecureStore.getItemAsync(key);
      if (secure != null) return secure;
    } catch {
      /* Fall through to AsyncStorage (web / SecureStore unavailable). */
    }
  }
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function writeSecret(key: string, value: string): Promise<void> {
  if (Platform.OS !== 'web') {
    try {
      await SecureStore.setItemAsync(key, value);
      await AsyncStorage.removeItem(key);
      return;
    } catch {
      /* Fall through. */
    }
  }
  await AsyncStorage.setItem(key, value);
}

async function deleteSecret(key: string): Promise<void> {
  if (Platform.OS !== 'web') {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      /* ignore */
    }
  }
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Whether this device has a simulated signed-in account. Independent of Premium. */
export async function getIsSignedIn(): Promise<boolean> {
  try {
    const flag =
      (await readSecret(SIGNED_IN_KEY)) ?? (await AsyncStorage.getItem(LEGACY_SIGNED_IN_KEY));
    if (flag !== 'true') return false;
    const account = await getAccount();
    if (account) return true;
    await clearAuth();
    return false;
  } catch {
    return false;
  }
}

/** Flip the simulated signed-in flag. Does not touch Premium, goal, or history. */
export async function setIsSignedIn(value: boolean): Promise<void> {
  await writeSecret(SIGNED_IN_KEY, value ? 'true' : 'false');
}

/** Saved { name, email }, or null if missing/corrupt. */
export async function getAccount(): Promise<Account | null> {
  try {
    const raw =
      (await readSecret(ACCOUNT_KEY)) ?? (await AsyncStorage.getItem(LEGACY_ACCOUNT_KEY));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isAccount(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Persist name + email only. Password is never written. */
export async function setAccount(account: Account): Promise<void> {
  await writeSecret(ACCOUNT_KEY, JSON.stringify({ name: account.name, email: account.email }));
}

/** Sign out: clear the account. Keep Premium, goal, and history. */
export async function clearAuth(): Promise<void> {
  await Promise.all([
    deleteSecret(SIGNED_IN_KEY),
    deleteSecret(ACCOUNT_KEY),
    AsyncStorage.multiRemove([LEGACY_SIGNED_IN_KEY, LEGACY_ACCOUNT_KEY]).catch(() => {}),
  ]);
}

/** First word of a full name, used for a small Home greeting. */
export function firstNameOf(name: string): string {
  const [first] = name.trim().split(/\s+/);
  return first ?? '';
}

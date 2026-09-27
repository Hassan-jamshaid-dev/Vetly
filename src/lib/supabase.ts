import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient, type SupportedStorage } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Publishable key only. Row access is enforced by RLS on auth.uid(), not by
// hiding this key. Never add a service_role or database password here.

let client: SupabaseClient | null | undefined;
let sessionLock: Promise<string | null> | null = null;

/** Native session in SecureStore; AsyncStorage on web or if SecureStore throws. */
const authStorage: SupportedStorage = {
  async getItem(key) {
    if (Platform.OS !== 'web') {
      try {
        const secure = await SecureStore.getItemAsync(key);
        if (secure != null) return secure;
      } catch {
        /* Fall through (web / SecureStore unavailable). */
      }
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key, value) {
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(key, value);
        await AsyncStorage.removeItem(key);
        return;
      } catch {
        /* Size limit or SecureStore unavailable. */
      }
    }
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key) {
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
  },
};

export function isSupabaseConfigured(): boolean {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key);
}

/** Shared client, or null when env vars are missing. */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    client = null;
    return null;
  }
  client = createClient(url, key, {
    auth: {
      storage: authStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}

/**
 * Signed-in user id for RLS. Reuses the saved anonymous session, or creates one.
 * Returns null if Supabase is unset or anonymous sign-in is disabled.
 */
export async function requireUserId(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  if (!sessionLock) {
    sessionLock = (async () => {
      try {
        const existing = await supabase.auth.getSession();
        const current = existing.data.session?.user.id;
        if (current) return current;
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error || !data.user?.id) {
          console.warn('Supabase auth skipped:', error?.message ?? 'no user');
          return null;
        }
        return data.user.id;
      } catch {
        return null;
      } finally {
        sessionLock = null;
      }
    })();
  }
  return sessionLock;
}

/** Drops the anonymous session. Used by the demo first-run reset. */
export async function signOutSupabase(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch {
    /* Demo reset is best-effort. */
  }
}

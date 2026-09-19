import AsyncStorage from '@react-native-async-storage/async-storage';

// Local Premium cache. Native / development builds sync this from RevenueCat
// CustomerInfo (`vetly_pro` only). Expo Go may set it from a labeled __DEV__
// demo unlock — that is not a store purchase. Sign-in never writes this flag.

const PREMIUM_KEY = 'vetly:isPremium';

/** Whether this device currently has Premium (RevenueCat entitlement or labeled demo). */
export async function getIsPremium(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PREMIUM_KEY)) === 'true';
  } catch {
    return false;
  }
}

/** Persist Premium. Native path writes this only from CustomerInfo (`vetly_pro`). */
export async function setIsPremium(value: boolean): Promise<void> {
  await AsyncStorage.setItem(PREMIUM_KEY, value ? 'true' : 'false');
}

import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEMO_STORAGE_KEY = 'restaurant_demo_local_state';

const emptyState = () => ({
  registeredUsers: [],
  orderPatches: {},
  localProducts: [],
  productPatches: {},
  productRemovedIds: [],
  restaurantPatch: null,
  profilePatch: null,
  reviewPatches: {},
  notificationReadIds: [],
  notificationRemovedIds: [],
  deliverySettingsPatch: null,
  paymentSettingsPatch: null,
  userSettingsPatch: null,
  settingsPatch: null,
  subscriptionEnrollment: null,
});

export async function getDemoState() {
  try {
    const raw = await AsyncStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return emptyState();
    return { ...emptyState(), ...JSON.parse(raw) };
  } catch {
    return emptyState();
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.__GOODFOOD_GET_DEMO_STATE__ = getDemoState;
}

export async function updateDemoState(updater) {
  const current = await getDemoState();
  const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
  await AsyncStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function clearDemoState() {
  await AsyncStorage.removeItem(DEMO_STORAGE_KEY);
}

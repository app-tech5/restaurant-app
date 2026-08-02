import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEMO_STORAGE_KEY } from '../api/demo/localStore';

const STORAGE_KEYS = {
  RESTAURANT_DATA: 'restaurantData',
  RESTAURANT_TOKEN: 'restaurantToken',
  DEVICE_TOKEN: 'restaurantDeviceToken',
  SETTINGS: 'restaurantSettings',
  CACHE_VERSION: 'restaurantCacheVersion'
};
export const updateRestaurantCache = async (restaurantData, token = null) => {
  try {
    if (restaurantData) {
      await AsyncStorage.setItem(STORAGE_KEYS.RESTAURANT_DATA, JSON.stringify(restaurantData));
    }
    if (token) {
      await AsyncStorage.setItem(STORAGE_KEYS.RESTAURANT_TOKEN, token);
    }
  } catch (error) {
    throw error;
  }
};
export const getRestaurantFromCache = async () => {
  try {
    const restaurantData = await AsyncStorage.getItem(STORAGE_KEYS.RESTAURANT_DATA);
    const token = await AsyncStorage.getItem(STORAGE_KEYS.RESTAURANT_TOKEN);
    if (restaurantData && token) {
      return {
        restaurant: JSON.parse(restaurantData),
        token
      };
    }
    return null;
  } catch (error) {
    return null;
  }
};
export const clearRestaurantCache = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.RESTAURANT_DATA,
      STORAGE_KEYS.RESTAURANT_TOKEN,
      STORAGE_KEYS.DEVICE_TOKEN,
      DEMO_STORAGE_KEY,
    ]);
  } catch (error) {
    throw error;
  }
};
export const getDeviceTokenFromCache = async () => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN);
  } catch (error) {
    return null;
  }
};
export const saveDeviceTokenToCache = async (deviceToken) => {
  try {
    if (!deviceToken) return;
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_TOKEN, deviceToken);
  } catch (error) {
  }
};
export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    throw error;
  }
};
export const getSettings = async () => {
  try {
    const settings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return settings ? JSON.parse(settings) : null;
  } catch (error) {
    return null;
  }
};
export const clearSettings = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS);
  } catch (error) {
    throw error;
  }
};
export const clearAllStorage = async () => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    throw error;
  }
};
export const getStorageInfo = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const stores = {};
    for (const key of keys) {
      try {
        const value = await AsyncStorage.getItem(key);
        stores[key] = value ? JSON.parse(value) : null;
      } catch (e) {
        stores[key] = 'Erreur parsing';
      }
    }
    return {
      totalKeys: keys.length,
      keys,
      stores
    };
  } catch (error) {
    return { error: error.message };
  }
};

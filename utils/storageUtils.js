import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  RESTAURANT_DATA: 'restaurantData',
  RESTAURANT_TOKEN: 'restaurantToken',
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

    console.log('✅ Données restaurant sauvegardées dans AsyncStorage');
  } catch (error) {
    console.error('❌ Erreur sauvegarde restaurant:', error);
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
    console.error('❌ Erreur récupération restaurant:', error);
    return null;
  }
};

export const clearRestaurantCache = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.RESTAURANT_DATA,
      STORAGE_KEYS.RESTAURANT_TOKEN
    ]);
    console.log('🗑️ Cache restaurant nettoyé');
  } catch (error) {
    console.error('❌ Erreur nettoyage cache restaurant:', error);
    throw error;
  }
};

export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    console.log('✅ Paramètres sauvegardés');
  } catch (error) {
    console.error('❌ Erreur sauvegarde paramètres:', error);
    throw error;
  }
};

export const getSettings = async () => {
  try {
    const settings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return settings ? JSON.parse(settings) : null;
  } catch (error) {
    console.error('❌ Erreur récupération paramètres:', error);
    return null;
  }
};

export const clearSettings = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS);
    console.log('🗑️ Paramètres nettoyés');
  } catch (error) {
    console.error('❌ Erreur nettoyage paramètres:', error);
    throw error;
  }
};

export const clearAllStorage = async () => {
  try {
    await AsyncStorage.clear();
    console.log('🗑️ Tout le stockage nettoyé');
  } catch (error) {
    console.error('❌ Erreur nettoyage stockage:', error);
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
    console.error('❌ Erreur récupération info stockage:', error);
    return { error: error.message };
  }
};

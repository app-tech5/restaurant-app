import AsyncStorage from '@react-native-async-storage/async-storage';

// Clés de stockage pour restaurant-app
const STORAGE_KEYS = {
  RESTAURANT_DATA: 'restaurantData',
  RESTAURANT_TOKEN: 'restaurantToken',
  SETTINGS: 'restaurantSettings',
  CACHE_VERSION: 'restaurantCacheVersion'
};

/**
 * Sauvegarde les données du restaurant dans AsyncStorage
 * @param {Object} restaurantData - Données du restaurant
 * @param {string} token - Token d'authentification
 */
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

/**
 * Récupère les données du restaurant depuis AsyncStorage
 * @returns {Promise<Object|null>} Données du restaurant ou null
 */
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

/**
 * Supprime toutes les données du restaurant du cache
 */
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

/**
 * Sauvegarde les paramètres utilisateur
 * @param {Object} settings - Paramètres à sauvegarder
 */
export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    console.log('✅ Paramètres sauvegardés');
  } catch (error) {
    console.error('❌ Erreur sauvegarde paramètres:', error);
    throw error;
  }
};

/**
 * Récupère les paramètres utilisateur
 * @returns {Promise<Object|null>} Paramètres ou null
 */
export const getSettings = async () => {
  try {
    const settings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return settings ? JSON.parse(settings) : null;
  } catch (error) {
    console.error('❌ Erreur récupération paramètres:', error);
    return null;
  }
};

/**
 * Nettoie tous les paramètres sauvegardés
 */
export const clearSettings = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS);
    console.log('🗑️ Paramètres nettoyés');
  } catch (error) {
    console.error('❌ Erreur nettoyage paramètres:', error);
    throw error;
  }
};

/**
 * Nettoie complètement tout le stockage de l'app
 */
export const clearAllStorage = async () => {
  try {
    await AsyncStorage.clear();
    console.log('🗑️ Tout le stockage nettoyé');
  } catch (error) {
    console.error('❌ Erreur nettoyage stockage:', error);
    throw error;
  }
};

/**
 * Obtient des informations sur le stockage
 * @returns {Promise<Object>} Informations de debug sur le stockage
 */
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

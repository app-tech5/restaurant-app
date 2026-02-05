import { DEFAULT_CURRENCY, getCurrency } from './currencyUtils';

/**
 * Valeurs par défaut pour les paramètres restaurant
 */
export const DEFAULT_LANGUAGE = { code: 'fr', name: 'Français' };
export const DEFAULT_APP_NAME = 'Good Food Restaurant';

/**
 * Obtient les informations de cache des paramètres
 * @returns {Promise<Object>} Informations sur le cache
 */
export const getSettingsCacheInfo = async () => {
  try {
    const { getSettingsFromCache } = await import('../utils/cacheUtils');
    const cacheData = await getSettingsFromCache();
    return cacheData ? {
      hasCache: true,
      timestamp: cacheData.timestamp,
      age: Date.now() - cacheData.timestamp,
      fromCache: true
    } : { hasCache: false };
  } catch (error) {
    return { hasCache: false, error: error.message };
  }
};

// Réexport de getCurrency depuis currencyUtils
export { getCurrency, DEFAULT_CURRENCY };

/**
 * Obtient la langue par défaut ou celle des paramètres
 * @param {Object} settings - Objet des paramètres
 * @returns {Object} Langue
 */
export const getLanguage = (settings) => {
  return settings?.language || DEFAULT_LANGUAGE;
};

/**
 * Obtient le nom de l'application par défaut ou celui des paramètres
 * @param {Object} settings - Objet des paramètres
 * @returns {string} Nom de l'application
 */
export const getAppName = (settings) => {
  return settings?.appName || DEFAULT_APP_NAME;
};

/**
 * Remet à zéro l'état des paramètres
 * @returns {Object} État remis à zéro
 */
export const resetSettingsState = () => {
  return {
    settings: null,
    loading: false,
    error: null
  };
};

/**
 * Configuration par défaut pour les paramètres restaurant
 */
export const getDefaultRestaurantSettings = () => {
  return {
    currency: DEFAULT_CURRENCY,
    language: DEFAULT_LANGUAGE,
    appName: DEFAULT_APP_NAME,
    notifications: {
      newOrders: true,
      orderUpdates: true,
      lowStock: true,
      marketing: false
    },
    restaurant: {
      autoAcceptOrders: false,
      preparationTime: 15, // minutes
      deliveryRadius: 5, // km
      openingHours: {
        monday: { open: '11:00', close: '22:00', closed: false },
        tuesday: { open: '11:00', close: '22:00', closed: false },
        wednesday: { open: '11:00', close: '22:00', closed: false },
        thursday: { open: '11:00', close: '22:00', closed: false },
        friday: { open: '11:00', close: '22:00', closed: false },
        saturday: { open: '11:00', close: '22:00', closed: false },
        sunday: { open: '11:00', close: '22:00', closed: true }
      }
    },
    theme: {
      primaryColor: '#FF6B35',
      secondaryColor: '#F7931E'
    }
  };
};

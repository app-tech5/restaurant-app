import { DEFAULT_CURRENCY, getCurrency } from './currencyUtils';

export const DEFAULT_LANGUAGE = { code: 'fr', name: 'Français' };
export const DEFAULT_APP_NAME = 'Good Food Restaurant';

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

export { getCurrency, DEFAULT_CURRENCY };

export const getLanguage = (settings) => {
  return settings?.language || DEFAULT_LANGUAGE;
};

export const getAppName = (settings) => {
  return settings?.appName || DEFAULT_APP_NAME;
};

export const resetSettingsState = () => {
  return {
    settings: null,
    loading: false,
    error: null
  };
};

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
      preparationTime: 15, 
      deliveryRadius: 5, 
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

import AsyncStorage from '@react-native-async-storage/async-storage';
const CACHE_KEYS = {
  SETTINGS: 'restaurant_app_settings',
  RESTAURANT_ORDERS: 'restaurant_orders',
  RESTAURANT_STATS: 'restaurant_stats',
  RESTAURANT_MENU: 'restaurant_menu',
  RESTAURANT_PROFILE: 'restaurant_profile',
  CACHE_TIMESTAMP: '_timestamp',
  CACHE_VERSION: 'cache_version'
};
const CACHE_CONFIG = {
  VERSION: '1.0',
  DEFAULT_TTL: 5 * 60 * 1000, 
  LONG_TTL: 30 * 60 * 1000, 
};
const CACHE_TTL = {
  [CACHE_KEYS.SETTINGS]: CACHE_CONFIG.LONG_TTL,
  [CACHE_KEYS.RESTAURANT_ORDERS]: CACHE_CONFIG.DEFAULT_TTL,
  [CACHE_KEYS.RESTAURANT_STATS]: CACHE_CONFIG.DEFAULT_TTL,
  [CACHE_KEYS.RESTAURANT_MENU]: CACHE_CONFIG.LONG_TTL,
  [CACHE_KEYS.RESTAURANT_PROFILE]: CACHE_CONFIG.DEFAULT_TTL,
};
const getCacheKey = (restaurantId, cacheType) => {
  return `${restaurantId}_${cacheType}`;
};
const saveToCache = async (key, data) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      version: CACHE_CONFIG.VERSION
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Erreur sauvegarde cache:', error);
  }
};
const getFromCache = async (key, ttl = CACHE_CONFIG.DEFAULT_TTL) => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;
    const cacheData = JSON.parse(cached);
    if (cacheData.version !== CACHE_CONFIG.VERSION) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    const age = Date.now() - cacheData.timestamp;
    if (age > ttl) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return cacheData;
  } catch (error) {
    console.error('Erreur lecture cache:', error);
    return null;
  }
};
export const loadWithSmartCache = async (
  restaurantId,
  cacheKey,
  apiFetcher,
  onDataLoaded,
  onDataUpdated,
  onLoadingStateChange,
  onError
) => {
  const fullCacheKey = getCacheKey(restaurantId, cacheKey);
  const ttl = CACHE_TTL[cacheKey] || CACHE_CONFIG.DEFAULT_TTL;
  try {
    onLoadingStateChange?.(true);
    const cachedData = await getFromCache(fullCacheKey, ttl);
    if (cachedData?.data != null) {
      const box = cachedData.data;
      const payload =
        typeof box === 'object' &&
        box !== null &&
        Object.prototype.hasOwnProperty.call(box, 'data') &&
        box.data !== undefined
          ? box.data
          : box;
      onDataLoaded?.(payload, true);
    }
    try {
      const freshData = await apiFetcher();
      if (freshData) {
        await saveToCache(fullCacheKey, freshData);
        if (cachedData) {
          onDataUpdated?.(freshData.data);
        } else {
          onDataLoaded?.(freshData.data, false);
        }
      }
    } catch (apiError) {
      if (!cachedData) {
        onError?.('Impossible de charger les données');
      }
    }
  } catch (error) {
    console.error('Erreur chargement avec cache:', error);
    onError?.(error.message);
  } finally {
    onLoadingStateChange?.(false);
  }
};
export const loadOrdersWithSmartCache = (
  restaurantId,
  apiFetcher,
  onDataLoaded,
  onDataUpdated,
  onLoadingStateChange,
  onError
) => {
  return loadWithSmartCache(
    restaurantId,
    CACHE_KEYS.RESTAURANT_ORDERS,
    apiFetcher,
    onDataLoaded,
    onDataUpdated,
    onLoadingStateChange,
    onError
  );
};
export const loadRestaurantStatsWithSmartCache = (
  restaurantId,
  apiFetcher,
  onDataLoaded,
  onDataUpdated,
  onLoadingStateChange,
  onError
) => {
  return loadWithSmartCache(
    restaurantId,
    CACHE_KEYS.RESTAURANT_STATS,
    apiFetcher,
    onDataLoaded,
    onDataUpdated,
    onLoadingStateChange,
    onError
  );
};
export const loadMenuWithSmartCache = (
  restaurantId,
  apiFetcher,
  onDataLoaded,
  onDataUpdated,
  onLoadingStateChange,
  onError
) => {
  return loadWithSmartCache(
    restaurantId,
    CACHE_KEYS.RESTAURANT_MENU,
    apiFetcher,
    onDataLoaded,
    onDataUpdated,
    onLoadingStateChange,
    onError
  );
};
export const loadRestaurantProfileWithSmartCache = (
  restaurantId,
  apiFetcher,
  onDataLoaded,
  onDataUpdated,
  onLoadingStateChange,
  onError
) => {
  const wrappedFetcher = async () => {
    const result = await apiFetcher();
    if (result && typeof result === 'object' && Object.prototype.hasOwnProperty.call(result, 'data')) {
      return result;
    }
    return { data: result };
  };
  return loadWithSmartCache(
    restaurantId,
    CACHE_KEYS.RESTAURANT_PROFILE,
    wrappedFetcher,
    onDataLoaded,
    onDataUpdated,
    onLoadingStateChange,
    onError
  );
};
export const loadSettingsWithSmartCache = (
  apiFetcher,
  onDataLoaded,
  onDataUpdated,
  onLoadingStateChange,
  onError
) => {
  return loadWithSmartCache(
    'global',
    CACHE_KEYS.SETTINGS,
    apiFetcher,
    onDataLoaded,
    onDataUpdated,
    onLoadingStateChange,
    onError
  );
};
export const clearOrdersCache = async (restaurantId) => {
  const cacheKey = getCacheKey(restaurantId, CACHE_KEYS.RESTAURANT_ORDERS);
  await AsyncStorage.removeItem(cacheKey);
};
export const clearRestaurantStatsCache = async (restaurantId) => {
  const cacheKey = getCacheKey(restaurantId, CACHE_KEYS.RESTAURANT_STATS);
  await AsyncStorage.removeItem(cacheKey);
};
export const clearMenuCache = async (restaurantId) => {
  const cacheKey = getCacheKey(restaurantId, CACHE_KEYS.RESTAURANT_MENU);
  await AsyncStorage.removeItem(cacheKey);
};
export const clearRestaurantProfileCache = async (restaurantId) => {
  const cacheKey = getCacheKey(restaurantId, CACHE_KEYS.RESTAURANT_PROFILE);
  await AsyncStorage.removeItem(cacheKey);
};
export const clearSettingsCache = async () => {
  const cacheKey = getCacheKey('global', CACHE_KEYS.SETTINGS);
  await AsyncStorage.removeItem(cacheKey);
};
export const saveSettingsToCache = async (settings) => {
  const cacheKey = getCacheKey('global', CACHE_KEYS.SETTINGS);
  const payload =
    settings &&
    typeof settings === 'object' &&
    Object.prototype.hasOwnProperty.call(settings, 'data') &&
    settings.data !== undefined
      ? settings
      : { data: settings };
  await saveToCache(cacheKey, payload);
};
export const getSettingsFromCache = async () => {
  const cacheKey = getCacheKey('global', CACHE_KEYS.SETTINGS);
  return await getFromCache(cacheKey, CACHE_TTL[CACHE_KEYS.SETTINGS]);
};

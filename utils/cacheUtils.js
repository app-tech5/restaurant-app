import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys pour restaurant-app
const CACHE_KEYS = {
  SETTINGS: 'restaurant_app_settings',
  RESTAURANT_ORDERS: 'restaurant_orders',
  RESTAURANT_STATS: 'restaurant_stats',
  RESTAURANT_MENU: 'restaurant_menu',
  CACHE_TIMESTAMP: '_timestamp',
  CACHE_VERSION: 'cache_version'
};

// Cache configuration pour restaurant-app
const CACHE_CONFIG = {
  VERSION: '1.0',
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes en ms
  LONG_TTL: 30 * 60 * 1000, // 30 minutes pour données moins volatiles
};

// Cache TTL par type de données
const CACHE_TTL = {
  [CACHE_KEYS.SETTINGS]: CACHE_CONFIG.LONG_TTL,
  [CACHE_KEYS.RESTAURANT_ORDERS]: CACHE_CONFIG.DEFAULT_TTL,
  [CACHE_KEYS.RESTAURANT_STATS]: CACHE_CONFIG.DEFAULT_TTL,
  [CACHE_KEYS.RESTAURANT_MENU]: CACHE_CONFIG.LONG_TTL,
};

/**
 * Génère une clé de cache unique pour un restaurant
 * @param {string} restaurantId - ID du restaurant
 * @param {string} cacheType - Type de cache (orders, stats, menu)
 * @returns {string} Clé de cache unique
 */
const getCacheKey = (restaurantId, cacheType) => {
  return `${restaurantId}_${cacheType}`;
};

/**
 * Sauvegarde des données dans le cache avec timestamp
 * @param {string} key - Clé de cache
 * @param {any} data - Données à sauvegarder
 */
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

/**
 * Récupère des données du cache si elles sont valides
 * @param {string} key - Clé de cache
 * @param {number} ttl - Time To Live en millisecondes
 * @returns {Object|null} Données du cache ou null si expiré/invalide
 */
const getFromCache = async (key, ttl = CACHE_CONFIG.DEFAULT_TTL) => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const cacheData = JSON.parse(cached);

    // Vérifier la version du cache
    if (cacheData.version !== CACHE_CONFIG.VERSION) {
      console.log('Cache version mismatch, invalidating');
      await AsyncStorage.removeItem(key);
      return null;
    }

    // Vérifier si le cache n'est pas expiré
    const age = Date.now() - cacheData.timestamp;
    if (age > ttl) {
      console.log(`Cache expired for ${key}, age: ${age}ms, ttl: ${ttl}ms`);
      await AsyncStorage.removeItem(key);
      return null;
    }

    return cacheData;
  } catch (error) {
    console.error('Erreur lecture cache:', error);
    return null;
  }
};

/**
 * Fonction générique pour charger des données avec cache intelligent
 * @param {string} restaurantId - ID du restaurant
 * @param {string} cacheKey - Clé de cache
 * @param {Function} apiFetcher - Fonction pour récupérer depuis l'API
 * @param {Function} onDataLoaded - Callback quand données chargées (cache ou API)
 * @param {Function} onDataUpdated - Callback quand données mises à jour depuis API
 * @param {Function} onLoadingStateChange - Callback pour état de chargement
 * @param {Function} onError - Callback d'erreur
 */
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
    // Étape 1: Essayer de charger depuis le cache
    onLoadingStateChange?.(true);
    const cachedData = await getFromCache(fullCacheKey, ttl);

    if (cachedData) {
      // Données trouvées en cache
      onDataLoaded?.(cachedData.data.data, true);
    }

    // Étape 2: Charger depuis l'API en arrière-plan
    try {
      const freshData = await apiFetcher();

      // console.log("FreshData", freshData)

      if (freshData) {
        // Sauvegarder dans le cache
        await saveToCache(fullCacheKey, freshData);

        // Notifier que les données ont été mises à jour
        if (cachedData) {
          onDataUpdated?.(freshData.data);
        } else {
          // Pas de cache, première fois
          onDataLoaded?.(freshData.data, false);
        }
      }
    } catch (apiError) {
      console.log('API fetch failed, using cached data if available:', apiError.message);
      if (!cachedData) {
        // Pas de cache et API échoue
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

// Fonctions spécialisées pour chaque type de données

/**
 * Charge les commandes du restaurant avec cache intelligent
 */
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

/**
 * Charge les statistiques du restaurant avec cache intelligent
 */
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

/**
 * Charge le menu du restaurant avec cache intelligent
 */
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

/**
 * Charge les paramètres avec cache intelligent
 */
export const loadSettingsWithSmartCache = (
  apiFetcher,
  onDataLoaded,
  onDataUpdated,
  onLoadingStateChange,
  onError
) => {
  // Pour les settings, pas de restaurantId car global
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

// Fonctions de nettoyage du cache

/**
 * Nettoie le cache des commandes d'un restaurant
 */
export const clearOrdersCache = async (restaurantId) => {
  const cacheKey = getCacheKey(restaurantId, CACHE_KEYS.RESTAURANT_ORDERS);
  await AsyncStorage.removeItem(cacheKey);
};

/**
 * Nettoie le cache des statistiques d'un restaurant
 */
export const clearRestaurantStatsCache = async (restaurantId) => {
  const cacheKey = getCacheKey(restaurantId, CACHE_KEYS.RESTAURANT_STATS);
  await AsyncStorage.removeItem(cacheKey);
};

/**
 * Nettoie le cache du menu d'un restaurant
 */
export const clearMenuCache = async (restaurantId) => {
  const cacheKey = getCacheKey(restaurantId, CACHE_KEYS.RESTAURANT_MENU);
  await AsyncStorage.removeItem(cacheKey);
};

/**
 * Nettoie le cache des paramètres
 */
export const clearSettingsCache = async () => {
  const cacheKey = getCacheKey('global', CACHE_KEYS.SETTINGS);
  await AsyncStorage.removeItem(cacheKey);
};

// Fonctions de sauvegarde directe (pour forcer la mise à jour du cache)

/**
 * Sauvegarde les paramètres dans le cache
 */
export const saveSettingsToCache = async (settings) => {
  const cacheKey = getCacheKey('global', CACHE_KEYS.SETTINGS);
  await saveToCache(cacheKey, settings);
};

/**
 * Récupère les paramètres depuis le cache
 */
export const getSettingsFromCache = async () => {
  const cacheKey = getCacheKey('global', CACHE_KEYS.SETTINGS);
  return await getFromCache(cacheKey, CACHE_TTL[CACHE_KEYS.SETTINGS]);
};

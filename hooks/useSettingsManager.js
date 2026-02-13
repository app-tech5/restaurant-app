import { useState, useEffect } from 'react';
import apiClient from '../api';
import { loadSettingsWithSmartCache, clearSettingsCache, saveSettingsToCache } from '../utils/cacheUtils';
import {
  getCurrency,
  getLanguage,
  getAppName,
  resetSettingsState
} from '../utils/settingsUtils';

/**
 * Hook personnalisé pour gérer les paramètres de l'application restaurant
 * @param {boolean} isAuthenticated - État d'authentification du restaurant
 * @returns {Object} État et fonctions pour gérer les paramètres
 */
export const useSettingsManager = (isAuthenticated) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Ne charger les settings que si le restaurant est authentifié
    if (isAuthenticated) {
      console.log('🔄 Chargement des settings car restaurant authentifié');
      // Charger les settings avec le système de cache intelligent
      loadSettingsWithSmartCache(
        () => apiClient.getSettings(), // apiFetcher
        (response, fromCache) => {
          // onDataLoaded - appelé quand les données sont prêtes (cache ou API)
          const data = response.data || response;
          setSettings(data);
          setError(null);
          if (fromCache) {
            console.log('🔄 Settings chargés depuis le cache');
          }
        },
        (response) => {
          // onDataUpdated - appelé quand les données sont mises à jour depuis l'API
          const data = response.data || response;
          setSettings(data);
          console.log('🔄 Settings mis à jour depuis l\'API');
        },
        (loading) => {
          // onLoadingStateChange
          setLoading(loading);
        },
        (errorMsg) => {
          // onError
          setError(errorMsg);
          console.error('Erreur chargement settings:', errorMsg);
        }
      );
    } else {
      // Si le restaurant n'est pas authentifié, remettre à zéro les settings
      console.log('🔄 Restaurant non authentifié - remise à zéro des settings');
      const resetState = resetSettingsState();
      setSettings(resetState.settings);
      setLoading(resetState.loading);
      setError(resetState.error);
    }
  }, [isAuthenticated]);

  const refreshSettings = async () => {
    // Ne rafraîchir que si le restaurant est authentifié
    if (!isAuthenticated) {
      console.log('🔄 Impossible de rafraîchir les settings - restaurant non authentifié');
      return;
    }

    // Forcer le rechargement depuis l'API (sans cache)
    try {
      setLoading(true);
      const response = await apiClient.getSettings();
      const appSettings = response.data || response;
      setSettings(appSettings);
      setError(null);

      // Sauvegarder dans le cache
      saveSettingsToCache(appSettings);
    } catch (err) {
      console.error('Erreur rechargement settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const invalidateCache = async () => {
    // Invalider le cache et forcer un rechargement (seulement si authentifié)
    if (!isAuthenticated) {
      console.log('🔄 Impossible d\'invalider le cache des settings - restaurant non authentifié');
      return;
    }

    try {
      await clearSettingsCache();
      console.log('🗑️ Cache des settings invalidé');
      await refreshSettings();
    } catch (error) {
      console.error('Erreur lors de l\'invalidation du cache:', error);
    }
  };

  // Valeurs calculées spécifiques aux restaurants
  const currency = getCurrency(settings);
  const language = getLanguage(settings);
  const appName = getAppName(settings);

  return {
    settings,
    loading,
    error,
    refreshSettings,
    invalidateCache,
    currency,
    language,
    appName
  };
};

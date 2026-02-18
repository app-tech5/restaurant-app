import { useState, useEffect } from 'react';
import apiClient from '../api';
import { loadSettingsWithSmartCache, clearSettingsCache, saveSettingsToCache } from '../utils/cacheUtils';
import {
  getCurrency,
  getLanguage,
  getAppName,
  resetSettingsState
} from '../utils/settingsUtils';

export const useSettingsManager = (isAuthenticated) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    
    if (isAuthenticated) {
      console.log('🔄 Chargement des settings car restaurant authentifié');
      
      loadSettingsWithSmartCache(
        () => apiClient.getSettings(), 
        (response, fromCache) => {
          
          const data = response.data || response;
          setSettings(data);
          setError(null);
          if (fromCache) {
            console.log('🔄 Settings chargés depuis le cache');
          }
        },
        (response) => {
          
          const data = response.data || response;
          setSettings(data);
          console.log('🔄 Settings mis à jour depuis l\'API');
        },
        (loading) => {
          
          setLoading(loading);
        },
        (errorMsg) => {
          
          setError(errorMsg);
          console.error('Erreur chargement settings:', errorMsg);
        }
      );
    } else {
      
      console.log('🔄 Restaurant non authentifié - remise à zéro des settings');
      const resetState = resetSettingsState();
      setSettings(resetState.settings);
      setLoading(resetState.loading);
      setError(resetState.error);
    }
  }, [isAuthenticated]);

  const refreshSettings = async () => {
    
    if (!isAuthenticated) {
      console.log('🔄 Impossible de rafraîchir les settings - restaurant non authentifié');
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiClient.getSettings();
      const appSettings = response.data || response;
      setSettings(appSettings);
      setError(null);
      
      saveSettingsToCache(appSettings);
    } catch (err) {
      console.error('Erreur rechargement settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const invalidateCache = async () => {
    
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
  
  const changeLanguage = async (languageCode) => {
    try {
      
      console.log(`🌐 Changement de langue demandé: ${languageCode}`);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur changement langue:', error);
      throw error;
    }
  };
  
  const getAvailableLanguages = async () => {
    try {
      
      const mockLanguages = [
        { _id: '1', code: 'fr', name: 'Français', isDefault: true },
        { _id: '2', code: 'en', name: 'English', isDefault: false }
      ];

      return mockLanguages;
    } catch (error) {
      console.error('Erreur récupération langues:', error);
      
      return [
        { _id: '1', code: 'fr', name: 'Français', isDefault: true },
        { _id: '2', code: 'en', name: 'English', isDefault: false }
      ];
    }
  };
  
  const currency = getCurrency(settings);
  const language = getLanguage(settings);
  const appName = getAppName(settings);

  return {
    settings,
    loading,
    error,
    refreshSettings,
    invalidateCache,
    changeLanguage,
    getAvailableLanguages,
    currency,
    language,
    appName
  };
};

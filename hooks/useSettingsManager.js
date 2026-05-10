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
      loadSettingsWithSmartCache(
        () => apiClient.getSettings(), 
        (response, fromCache) => {
          const data = response.data || response;
          setSettings(data);
          setError(null);
          if (fromCache) {
          }
        },
        (response) => {
          const data = response.data || response;
          setSettings(data);
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
      const resetState = resetSettingsState();
      setSettings(resetState.settings);
      setLoading(resetState.loading);
      setError(resetState.error);
    }
  }, [isAuthenticated]);
  const refreshSettings = async () => {
    if (!isAuthenticated) {
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
      return;
    }
    try {
      await clearSettingsCache();
      await refreshSettings();
    } catch (error) {
      console.error('Erreur lors de l\'invalidation du cache:', error);
    }
  };
  const changeLanguage = async (languageCode) => {
    try {
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
  const getAvailableCurrencies = async () => {
    try {
      return await apiClient.listCurrencies();
    } catch (error) {
      console.error('Erreur récupération devises:', error);
      return [];
    }
  };
  const changeCurrency = async (currencyId) => {
    const settingsId = settings?._id;
    if (!settingsId) {
      throw new Error('missing_settings_id');
    }
    if (!currencyId) {
      throw new Error('missing_currency_id');
    }
    await apiClient.updateSettingsDocument(settingsId, { currency: currencyId });
    await refreshSettings();
    return { success: true };
  };
  const currency = getCurrency(settings);
  const language = getLanguage(settings);
  const appName = getAppName(settings);
  const formatCurrency = (amount, options = {}) => {
    const sym = options.symbol ?? currency?.symbol ?? '€';
    return `${Number(amount ?? 0).toFixed(2)}${sym}`;
  };
  const getCurrencySymbol = () => currency?.symbol ?? '€';
  const getCurrencyCode = () => currency?.code ?? 'EUR';
  return {
    settings,
    loading,
    error,
    refreshSettings,
    invalidateCache,
    changeLanguage,
    getAvailableLanguages,
    getAvailableCurrencies,
    changeCurrency,
    currency,
    language,
    appName,
    formatCurrency,
    getCurrencySymbol,
    getCurrencyCode,
    loadSettings: refreshSettings,
    isLoading: loading,
  };
};

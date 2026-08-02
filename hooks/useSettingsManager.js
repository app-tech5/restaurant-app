import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api';
import { loadSettingsWithSmartCache, clearSettingsCache, saveSettingsToCache } from '../utils/cacheUtils';
import {
  getCurrency,
  getLanguage,
  getAppName,
  resetSettingsState
} from '../utils/settingsUtils';
import { changeLanguage as changeI18nLanguage } from '../i18n';
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
    }
  };
  const changeLanguage = async (languageCode) => {
    const languages = await getAvailableLanguages();
    const selected =
      languages.find((lang) => String(lang.code) === String(languageCode)) || {
        code: languageCode,
        name: String(languageCode).toUpperCase(),
      };
    try {
      await AsyncStorage.setItem('userLanguage', String(languageCode));
      changeI18nLanguage(String(languageCode));
      setSettings((prev) => ({
        ...(prev || {}),
        language: {
          code: selected.code,
          name: selected.name,
          _id: selected._id,
        },
      }));
      return { success: true };
    } catch (error) {
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

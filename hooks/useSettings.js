import { useState, useEffect } from 'react';
import apiClient from '../api';
import { config } from '../config';

export const useSettings = () => {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isDemoMode = () => config.DEMO_MODE === true;
  
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let settingsData;
        
        const response = await apiClient.getSettings();
        settingsData = response.data;

      setSettings(settingsData);
      console.log('🔧 Paramètres chargés:', settingsData);

    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
      setError(error.message);
      
      setSettings({
        _id: "app_settings",
        appName: "Good Food Restaurant",
        currency: {
          _id: "fallback-currency",
          code: "EUR",
          name: "Euro",
          symbol: "€",
          exchangeRate: 1.0
        },
        language: {
          code: "fr",
          name: "Français",
          isDefault: true
        }
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatCurrency = (amount, options = {}) => {
    if (!settings?.currency) {
      return `${amount?.toFixed(2) || '0.00'}€`;
    }

    const { symbol = settings.currency.symbol, code = settings.currency.code } = options;
    return `${amount?.toFixed(2) || '0.00'}${symbol || code}`;
  };
  
  const getCurrencySymbol = () => {
    return settings?.currency?.symbol || '€';
  };
  
  const getCurrencyCode = () => {
    return settings?.currency?.code || 'EUR';
  };
  
  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    isLoading,
    error,
    loadSettings,
    formatCurrency,
    getCurrencySymbol,
    getCurrencyCode
  };
};

import { useState, useEffect } from 'react';
import apiClient from '../api';
import { config } from '../config';

/**
 * Hook personnalisé pour gérer les paramètres globaux de l'application
 * @returns {Object} État et fonctions des paramètres
 */
export const useSettings = () => {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction utilitaire pour vérifier si on est en mode démo
  const isDemoMode = () => config.DEMO_MODE === true;

  // Charger les paramètres
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let settingsData;

      // if (isDemoMode()) {
      //   // Données mockées pour le mode démo
      //   settingsData = {
      //     _id: "app_settings",
      //     appName: "Good Food Restaurant",
      //     currency: {
      //       _id: "demo-currency-eur",
      //       code: "EUR",
      //       name: "Euro",
      //       symbol: "€",
      //       exchangeRate: 1.0
      //     },
      //     language: {
      //       code: "fr",
      //       name: "Français",
      //       isDefault: true
      //     }
      //   };
      // } 
      // else {
        // Récupération depuis l'API
        const response = await apiClient.getSettings();
        settingsData = response.data;
      // }

      setSettings(settingsData);
      console.log('🔧 Paramètres chargés:', settingsData);

    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
      setError(error.message);

      // En cas d'erreur, utiliser des paramètres par défaut
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

  // Fonction pour formater un montant avec la monnaie courante
  const formatCurrency = (amount, options = {}) => {
    if (!settings?.currency) {
      return `${amount?.toFixed(2) || '0.00'}€`;
    }

    const { symbol = settings.currency.symbol, code = settings.currency.code } = options;
    return `${amount?.toFixed(2) || '0.00'}${symbol || code}`;
  };

  // Fonction pour obtenir le symbole de la monnaie
  const getCurrencySymbol = () => {
    return settings?.currency?.symbol || '€';
  };

  // Fonction pour obtenir le code de la monnaie
  const getCurrencyCode = () => {
    return settings?.currency?.code || 'EUR';
  };

  // Charger les paramètres au montage du composant
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

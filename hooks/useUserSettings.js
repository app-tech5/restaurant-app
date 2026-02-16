import { useState, useEffect } from 'react';
import apiClient from '../api';

/**
 * Hook personnalisé pour gérer les paramètres utilisateur
 * @returns {Object} État et fonctions pour gérer les paramètres utilisateur
 */
export const useUserSettings = () => {
  const [userSettings, setUserSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUserSettings();

      if (response.success) {
        setUserSettings(response.data);
        setError(null);
      } else {
        throw new Error(response.message || 'Failed to load settings');
      }
    } catch (err) {
      console.error('Error loading user settings:', err);
      setError(err.message);

      // En cas d'erreur, définir des valeurs par défaut
      setUserSettings({
        notifications: {
          newOrders: true,
          orderUpdates: true,
          lowStock: false,
          marketing: false,
        },
        restaurantSettings: {
          autoAcceptOrders: false,
          preparationTime: 15,
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const updateNotifications = async (notifications) => {
    try {
      const response = await apiClient.updateNotifications(notifications);

      if (response.success) {
        setUserSettings(prev => ({
          ...prev,
          notifications: response.data
        }));
        setError(null);
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to update notifications');
      }
    } catch (err) {
      console.error('Error updating notifications:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const updateRestaurantSettings = async (restaurantSettings) => {
    try {
      const response = await apiClient.updateRestaurantSettings(restaurantSettings);

      if (response.success) {
        setUserSettings(prev => ({
          ...prev,
          restaurantSettings: response.data
        }));
        setError(null);
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to update restaurant settings');
      }
    } catch (err) {
      console.error('Error updating restaurant settings:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const updateUserSettings = async (settingsData) => {
    try {
      const response = await apiClient.updateUserSettings(settingsData);

      if (response.success) {
        setUserSettings(response.data);
        setError(null);
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to update settings');
      }
    } catch (err) {
      console.error('Error updating user settings:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  return {
    userSettings,
    loading,
    error,
    loadUserSettings,
    updateNotifications,
    updateRestaurantSettings,
    updateUserSettings
  };
};

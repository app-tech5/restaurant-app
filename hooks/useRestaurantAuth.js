import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api';
import { updateRestaurantCache, clearRestaurantCache } from '../utils/restaurantUtils';
import { getNativePushToken } from '../services/pushNotifications';
export const useRestaurantAuth = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const syncPushToken = async () => {
    try {
      const token = await getNativePushToken();
      if (token) {
        await apiClient.updateDeviceToken(token);
      }
    } catch (error) {
    }
  };
  useEffect(() => {
    const initializeRestaurant = async () => {
      try {
        const restaurantData = await AsyncStorage.getItem('restaurantData');
        const token = await AsyncStorage.getItem('restaurantToken');
        if (restaurantData && token) {
          const parsedRestaurant = JSON.parse(restaurantData);
          setRestaurant(parsedRestaurant);
          setIsAuthenticated(true);
          apiClient.token = token;
          apiClient.restaurant = parsedRestaurant;
          apiClient.userId = parsedRestaurant?._id || parsedRestaurant?.id || null;
          try {
            const freshRestaurantData = await apiClient.getRestaurantProfile();
            if (freshRestaurantData) {
              setRestaurant(freshRestaurantData);
              await updateRestaurantCache(freshRestaurantData);
            }
          } catch (refreshError) {
          }
          await syncPushToken();
        }
      } catch (error) {
        console.error('Error initializing restaurant:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initializeRestaurant();
  }, 
  []
);
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const config = require('../config').default || require('../config');
      let response;
      response = await apiClient.restaurantLogin(email, password);
      if (response.user && response.token) {
        const restaurantData = apiClient.restaurant || response.user;
        if (restaurantData) {
          setRestaurant(restaurantData);
          setIsAuthenticated(true);
          await updateRestaurantCache(restaurantData, response.token);
          if (!config.DEMO_MODE) {
            try {
              const freshRestaurantData = await apiClient.getRestaurantProfile();
              if (freshRestaurantData) {
                setRestaurant(freshRestaurantData);
              }
            } catch (refreshError) {
            }
          }
          await syncPushToken();
          return { success: true, restaurant: restaurantData };
        } else {
          throw new Error('Données restaurant non disponibles');
        }
      } else {
        throw new Error('Réponse de connexion invalide');
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message || 'Erreur de connexion' };
    } finally {
      setIsLoading(false);
    }
  };
  const logout = async () => {
    try {
      await apiClient.logout();
      setRestaurant(null);
      setIsAuthenticated(false);
      await clearRestaurantCache();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };
  return {
    restaurant,
    isLoading,
    isAuthenticated,
    login,
    logout,
    setRestaurant,
    setIsAuthenticated
  };
};

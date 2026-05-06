import { useState, useEffect } from 'react';
import apiClient from '../api';
import { getNativePushToken } from '../services/pushNotifications';
import { getRestaurantFromCache, updateRestaurantCache } from '../utils/storageUtils';
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
        const cached = await getRestaurantFromCache();
        if (cached?.restaurant && cached?.token) {
          const authenticatedUser = cached.restaurant;
          apiClient.token = cached.token;
          apiClient.userId = authenticatedUser._id || authenticatedUser.id || null;
          apiClient.restaurant = authenticatedUser;
          setIsAuthenticated(true);
          try {
            const freshRestaurantData = await apiClient.getRestaurantProfile();
            if (freshRestaurantData) {
              setRestaurant(freshRestaurantData);
            }
          } catch (refreshError) {
            setRestaurant(null);
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
  }, []);
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const config = require('../config').default || require('../config');
      const response = await apiClient.restaurantLogin(email, password);
      if (response.user && response.token) {
        const authenticatedUser = response.user;
        await updateRestaurantCache(authenticatedUser, response.token);
        setIsAuthenticated(true);
        let restaurantProfile = null;
        if (!config.DEMO_MODE) {
          try {
            const freshRestaurantData = await apiClient.getRestaurantProfile();
            if (freshRestaurantData) {
              restaurantProfile = freshRestaurantData;
            }
          } catch (refreshError) {
          }
        }
        setRestaurant(restaurantProfile || apiClient.restaurant || null);
        await syncPushToken();
        return { success: true, restaurant: restaurantProfile || null };
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

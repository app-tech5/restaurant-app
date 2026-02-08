import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api';
import { updateRestaurantCache, clearRestaurantCache } from '../utils/restaurantUtils';

/**
 * Hook personnalisé pour gérer l'authentification du restaurant
 * @param {Function} onRestaurantLoaded - Callback appelé quand le restaurant est chargé
 * @param {Function} onStatsLoaded - Callback appelé quand les stats sont chargées
 * @param {Function} onOrdersLoaded - Callback appelé quand les commandes sont chargées
 * @param {Function} onMenuLoaded - Callback appelé quand le menu est chargé
 * @returns {Object} État et fonctions d'authentification
 */
export const useRestaurantAuth = (onRestaurantLoaded, onStatsLoaded, onOrdersLoaded, onMenuLoaded) => {
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialisation du restaurant depuis AsyncStorage et refresh depuis API
  useEffect(() => {
    const initializeRestaurant = async () => {
      try {
        const restaurantData = await AsyncStorage.getItem('restaurantData');
        const token = await AsyncStorage.getItem('restaurantToken');

        if (restaurantData && token) {
          // Charger d'abord les données du cache
          const parsedRestaurant = JSON.parse(restaurantData);
          setRestaurant(parsedRestaurant);
          setIsAuthenticated(true);
          apiClient.token = token;
          apiClient.restaurant = parsedRestaurant;

          // Puis rafraîchir avec les données les plus récentes de l'API
          try {
            const freshRestaurantData = await apiClient.getRestaurantProfile();
            if (freshRestaurantData) {
              setRestaurant(freshRestaurantData);
              // Mettre à jour le cache avec les nouvelles données
              await updateRestaurantCache(freshRestaurantData);
            }
          } catch (refreshError) {
            console.log('Could not refresh restaurant data, using cached data:', refreshError.message);
          }

          // Charger les stats, commandes et menu
          if (onStatsLoaded) await onStatsLoaded();
          if (onOrdersLoaded) await onOrdersLoaded();
          if (onMenuLoaded) await onMenuLoaded();
        }
      } catch (error) {
        console.error('Error initializing restaurant:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeRestaurant();
  }, [onRestaurantLoaded, onStatsLoaded, onOrdersLoaded, onMenuLoaded]);

  // Connexion du restaurant
  const login = async (email, password) => {
    try {
      setIsLoading(true);

      // Mode démo ou production
      const config = require('../config').default || require('../config');
      let response;

      if (config.DEMO_MODE) {
        // Mode démo - simulation de connexion
        response = {
          user: {
            _id: 'demo-restaurant-1',
            name: 'Demo Restaurant',
            email: email,
            type: 'restaurant',
            status: 'active'
          },
          token: 'demo-token-' + Date.now()
        };
      } else {
        // Mode production - appel API réel
        response = await apiClient.restaurantLogin(email, password);
      }

      if (response.user && response.token) {
        // Le restaurant a été chargé dans apiClient lors du login
        const restaurantData = apiClient.restaurant || response.user;

        if (restaurantData) {
          setRestaurant(restaurantData);
          setIsAuthenticated(true);

          // Sauvegarder dans le cache
          await updateRestaurantCache(restaurantData, response.token);

          // Charger les données initiales
          if (onStatsLoaded) await onStatsLoaded();
          if (onOrdersLoaded) await onOrdersLoaded();
          if (onMenuLoaded) await onMenuLoaded();

          // Essayer de rafraîchir les données restaurant en arrière-plan (sans bloquer)
          if (!config.DEMO_MODE) {
            try {
              const freshRestaurantData = await apiClient.getRestaurantProfile();
              if (freshRestaurantData) {
                setRestaurant(freshRestaurantData);
              }
            } catch (refreshError) {
              // Ne pas échouer si le refresh échoue, on garde les données existantes
              console.log('Could not refresh restaurant data, using existing data');
            }
          }

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

  // Déconnexion
  const logout = async () => {
    try {
      // Nettoyer l'API client
      await apiClient.logout();

      // Reset local state
      setRestaurant(null);
      setIsAuthenticated(false);

      // Nettoyer le cache
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

import { useState } from 'react';
import { Alert } from 'react-native';
import apiClient from '../api';
import { config } from '../config';
import { loadOrdersWithSmartCache, clearOrdersCache } from '../utils/cacheUtils';
import { isRestaurantAuthenticated } from '../utils/restaurantUtils';

/**
 * Hook personnalisé pour gérer les commandes du restaurant
 * @param {Object} restaurant - Objet restaurant
 * @param {boolean} isAuthenticated - État d'authentification
 * @returns {Object} État et fonctions des commandes
 */
export const useRestaurantOrders = (restaurant, isAuthenticated) => {
  const [orders, setOrders] = useState([]);

  // Charger les commandes du restaurant avec cache intelligent
  const loadRestaurantOrders = async (status = null) => {
    if (!isAuthenticated || !restaurant?._id) {
      console.log('❌ Restaurant non authentifié, impossible de charger les commandes');
      return;
    }

    try {
      // Utiliser le cache intelligent pour les commandes
      await loadOrdersWithSmartCache(
        restaurant._id, // restaurantId
        () => apiClient.getRestaurantOrders(status), // apiFetcher
        (data, fromCache) => {
          // onDataLoaded - appelé quand les données sont prêtes (cache ou API)
          setOrders(data.data);
          if (fromCache) {
            console.log('🔄 Commandes chargées depuis le cache dans RestaurantContext');
          }
        },
        (data) => {
          // onDataUpdated - appelé quand les données sont mises à jour depuis l'API
          setOrders(data);
          console.log('🔄 Commandes mises à jour depuis l\'API dans RestaurantContext');
        },
        (loading) => {
          // onLoadingStateChange - on pourrait utiliser un état de chargement spécifique
          console.log(`🔄 État de chargement des commandes: ${loading}`);
        },
        (errorMsg) => {
          // onError
          console.error('Erreur chargement commandes:', errorMsg);
        }
      );
    } catch (error) {
      console.error('Error loading restaurant orders with smart cache:', error);
    }
  };

  // Accepter une commande
  const acceptOrder = async (orderId) => {
    if (config.DEMO_MODE) {
      // Mode démo : simulation locale
      Alert.alert('Mode Démo', 'Commande acceptée (simulation)');
      await loadRestaurantOrders(); // Recharger pour refléter les changements
      return { success: true };
    }

    try {
      const response = await apiClient.acceptOrder(orderId);
      console.log('✅ Commande acceptée:', response);
      await loadRestaurantOrders(); // Recharger les commandes
      return response;
    } catch (error) {
      console.error('Accept order error:', error);
      throw error;
    }
  };

  // Préparer une commande
  const prepareOrder = async (orderId) => {
    if (config.DEMO_MODE) {
      // Mode démo : simulation locale
      Alert.alert('Mode Démo', 'Commande en préparation (simulation)');
      await loadRestaurantOrders();
      return { success: true };
    }

    try {
      const response = await apiClient.prepareOrder(orderId);
      console.log('👨‍🍳 Commande en préparation:', response);
      await loadRestaurantOrders(); // Recharger les commandes
      return response;
    } catch (error) {
      console.error('Prepare order error:', error);
      throw error;
    }
  };

  // Commande prête pour le pickup/livraison
  const readyForPickup = async (orderId) => {
    if (config.DEMO_MODE) {
      // Mode démo : simulation locale
      Alert.alert('Mode Démo', 'Commande prête (simulation)');
      await loadRestaurantOrders();
      return { success: true };
    }

    try {
      const response = await apiClient.readyForPickup(orderId);
      console.log('✅ Commande prête:', response);
      await loadRestaurantOrders(); // Recharger les commandes
      return response;
    } catch (error) {
      console.error('Ready for pickup error:', error);
      throw error;
    }
  };

  // Mettre à jour le statut d'une commande
  const updateOrderStatus = async (orderId, status) => {
    if (config.DEMO_MODE) {
      // Mode démo : simulation locale
      Alert.alert('Mode Démo', `Statut changé à "${status}" (simulation)`);
      await loadRestaurantOrders();
      return { success: true };
    }

    try {
      const response = await apiClient.updateOrderStatus(orderId, status);
      console.log('🔄 Statut commande mis à jour:', response);
      await loadRestaurantOrders(); // Recharger les commandes
      return response;
    } catch (error) {
      console.error('Update order status error:', error);
      throw error;
    }
  };

  // Invalider le cache des commandes (pour forcer un rechargement)
  const invalidateOrdersCache = async () => {
    if (restaurant?._id) {
      try {
        await clearOrdersCache(restaurant._id);
        console.log('🗑️ Cache des commandes invalidé');
        await loadRestaurantOrders(); // Recharger immédiatement
      } catch (error) {
        console.error('Erreur lors de l\'invalidation du cache des commandes:', error);
      }
    }
  };

  return {
    orders,
    loadRestaurantOrders,
    updateOrderStatus,
    acceptOrder,
    prepareOrder,
    readyForPickup,
    invalidateOrdersCache
  };
};

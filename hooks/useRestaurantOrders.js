import { useState } from 'react';
import { Alert } from 'react-native';
import apiClient from '../api';
import { config } from '../config';
import { loadOrdersWithSmartCache, clearOrdersCache } from '../utils/cacheUtils';
import { isRestaurantAuthenticated } from '../utils/restaurantUtils';

export const useRestaurantOrders = (restaurant, isAuthenticated) => {
  const [orders, setOrders] = useState([]);
  
  const loadRestaurantOrders = async (status = null) => {
    if (!isAuthenticated || !restaurant?._id) {
      console.log('❌ Restaurant non authentifié, impossible de charger les commandes');
      return;
    }

    try {
      
      await loadOrdersWithSmartCache(
        restaurant._id, 
        () => apiClient.getRestaurantOrders(status), 
        (data, fromCache) => {
          
          setOrders(data);
          if (fromCache) {
            console.log('🔄 Commandes chargées depuis le cache dans RestaurantContext');
          }
        },
        (data) => {
          
          setOrders(data);
          console.log('🔄 Commandes mises à jour depuis l\'API dans RestaurantContext');
        },
        (loading) => {
          
          console.log(`🔄 État de chargement des commandes: ${loading}`);
        },
        (errorMsg) => {
          
          console.error('Erreur chargement commandes:', errorMsg);
        }
      );
    } catch (error) {
      console.error('Error loading restaurant orders with smart cache:', error);
    }
  };
  
  const acceptOrder = async (orderId) => {
    if (config.DEMO_MODE) {
      
      Alert.alert('Mode Démo', 'Commande acceptée (simulation)');
      await loadRestaurantOrders(); 
      return { success: true };
    }

    try {
      const response = await apiClient.acceptOrder(orderId);
      console.log('✅ Commande acceptée:', response);
      await loadRestaurantOrders(); 
      return response;
    } catch (error) {
      console.error('Accept order error:', error);
      throw error;
    }
  };
  
  const prepareOrder = async (orderId) => {
    if (config.DEMO_MODE) {
      
      Alert.alert('Mode Démo', 'Commande en préparation (simulation)');
      await loadRestaurantOrders();
      return { success: true };
    }

    try {
      const response = await apiClient.prepareOrder(orderId);
      console.log('👨‍🍳 Commande en préparation:', response);
      await loadRestaurantOrders(); 
      return response;
    } catch (error) {
      console.error('Prepare order error:', error);
      throw error;
    }
  };
  
  const readyForPickup = async (orderId) => {
    if (config.DEMO_MODE) {
      
      Alert.alert('Mode Démo', 'Commande prête (simulation)');
      await loadRestaurantOrders();
      return { success: true };
    }

    try {
      const response = await apiClient.readyForPickup(orderId);
      console.log('✅ Commande prête:', response);
      await loadRestaurantOrders(); 
      return response;
    } catch (error) {
      console.error('Ready for pickup error:', error);
      throw error;
    }
  };
  
  const updateOrderStatus = async (orderId, status) => {
    if (config.DEMO_MODE) {
      
      Alert.alert('Mode Démo', `Statut changé à "${status}" (simulation)`);
      await loadRestaurantOrders();
      return { success: true };
    }

    try {
      const response = await apiClient.updateOrderStatus(orderId, status);
      console.log('🔄 Statut commande mis à jour:', response);
      await loadRestaurantOrders(); 
      return response;
    } catch (error) {
      console.error('Update order status error:', error);
      throw error;
    }
  };
  
  const invalidateOrdersCache = async () => {
    if (restaurant?._id) {
      try {
        await clearOrdersCache(restaurant._id);
        console.log('🗑️ Cache des commandes invalidé');
        await loadRestaurantOrders(); 
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

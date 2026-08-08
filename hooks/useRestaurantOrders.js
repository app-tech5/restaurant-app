import { useState, useCallback } from 'react';
import apiClient from '../api';
import { loadOrdersWithSmartCache, clearOrdersCache } from '../utils/cacheUtils';

export const useRestaurantOrders = (restaurant, isAuthenticated) => {
  const [orders, setOrders] = useState([]);

  const restaurantId = restaurant?._id;

  const loadRestaurantOrders = useCallback(
    async (status = null) => {
      if (!isAuthenticated || !restaurantId) {
        return;
      }
      try {
        await loadOrdersWithSmartCache(
          restaurantId,
          () => apiClient.getRestaurantOrders(status),
          (data) => {
            setOrders(data);
          },
          (data) => {
            setOrders(data);
          },
          () => {},
          (errorMsg) => {
            console.error('Erreur chargement commandes:', errorMsg);
          }
        );
      } catch (error) {
        console.error('Error loading restaurant orders with smart cache:', error);
      }
    },
    [isAuthenticated, restaurantId]
  );

  const acceptOrder = useCallback(
    async (orderId) => {
      try {
        const response = await apiClient.acceptOrder(orderId);
        await loadRestaurantOrders();
        return response;
      } catch (error) {
        console.error('Accept order error:', error);
        throw error;
      }
    },
    [loadRestaurantOrders]
  );

  const prepareOrder = useCallback(
    async (orderId) => {
      try {
        const response = await apiClient.prepareOrder(orderId);
        await loadRestaurantOrders();
        return response;
      } catch (error) {
        console.error('Prepare order error:', error);
        throw error;
      }
    },
    [loadRestaurantOrders]
  );

  const readyForPickup = useCallback(
    async (orderId) => {
      try {
        const response = await apiClient.readyForPickup(orderId);
        await loadRestaurantOrders();
        return response;
      } catch (error) {
        console.error('Ready for pickup error:', error);
        throw error;
      }
    },
    [loadRestaurantOrders]
  );

  const updateOrderStatus = useCallback(
    async (orderId, status) => {
      try {
        const response = await apiClient.updateOrderStatus(orderId, status);
        await loadRestaurantOrders();
        return response;
      } catch (error) {
        console.error('Update order status error:', error);
        throw error;
      }
    },
    [loadRestaurantOrders]
  );

  const invalidateOrdersCache = useCallback(async () => {
    if (!restaurantId) return;
    try {
      await clearOrdersCache(restaurantId);
      await loadRestaurantOrders();
    } catch (error) {
      console.error("Erreur lors de l'invalidation du cache des commandes:", error);
    }
  }, [restaurantId, loadRestaurantOrders]);

  return {
    orders,
    loadRestaurantOrders,
    updateOrderStatus,
    acceptOrder,
    prepareOrder,
    readyForPickup,
    invalidateOrdersCache,
  };
};

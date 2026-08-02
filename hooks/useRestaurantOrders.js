import { useState } from 'react';
import apiClient from '../api';
import { loadOrdersWithSmartCache, clearOrdersCache } from '../utils/cacheUtils';

export const useRestaurantOrders = (restaurant, isAuthenticated) => {
  const [orders, setOrders] = useState([]);
  const loadRestaurantOrders = async (status = null) => {
    if (!isAuthenticated || !restaurant?._id) {
      return;
    }
    try {
      await loadOrdersWithSmartCache(
        restaurant._id,
        () => apiClient.getRestaurantOrders(status),
        (data) => {
          setOrders(data);
        },
        (data) => {
          setOrders(data);
        },
        () => {},
        (errorMsg) => {
        }
      );
    } catch (error) {
    }
  };
  const acceptOrder = async (orderId) => {
    try {
      const response = await apiClient.acceptOrder(orderId);
      await loadRestaurantOrders();
      return response;
    } catch (error) {
      throw error;
    }
  };
  const prepareOrder = async (orderId) => {
    try {
      const response = await apiClient.prepareOrder(orderId);
      await loadRestaurantOrders();
      return response;
    } catch (error) {
      throw error;
    }
  };
  const readyForPickup = async (orderId) => {
    try {
      const response = await apiClient.readyForPickup(orderId);
      await loadRestaurantOrders();
      return response;
    } catch (error) {
      throw error;
    }
  };
  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await apiClient.updateOrderStatus(orderId, status);
      await loadRestaurantOrders();
      return response;
    } catch (error) {
      throw error;
    }
  };
  const invalidateOrdersCache = async () => {
    if (restaurant?._id) {
      try {
        await clearOrdersCache(restaurant._id);
        await loadRestaurantOrders();
      } catch (error) {
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
    invalidateOrdersCache,
  };
};

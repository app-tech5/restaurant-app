import { useState } from 'react';
import apiClient from '../api';
import { loadMenuWithSmartCache, clearMenuCache } from '../utils/cacheUtils';

export const useRestaurantMenu = (restaurant, isAuthenticated) => {
  const [menu, setMenu] = useState([]);
  const loadMenu = async () => {
    if (!isAuthenticated || !restaurant?._id) {
      return;
    }
    try {
      await loadMenuWithSmartCache(
        restaurant._id,
        () => apiClient.getRestaurantMenu(),
        (data) => {
          setMenu(data);
        },
        (data) => {
          setMenu(data);
        },
        () => {},
        (errorMsg) => {
        }
      );
    } catch (error) {
    }
  };
  const addMenuItem = async (menuItem) => {
    try {
      const response = await apiClient.addMenuItem(menuItem);
      await loadMenu();
      return response;
    } catch (error) {
      throw error;
    }
  };
  const updateMenuItem = async (itemId, updates) => {
    try {
      const response = await apiClient.updateMenuItem(itemId, updates);
      await loadMenu();
      return response;
    } catch (error) {
      throw error;
    }
  };
  const deleteMenuItem = async (itemId) => {
    try {
      const response = await apiClient.deleteMenuItem(itemId);
      await loadMenu();
      return response;
    } catch (error) {
      throw error;
    }
  };
  const toggleMenuItemAvailability = async (itemId, available) => {
    try {
      const response = await apiClient.toggleMenuItemAvailability(itemId, available);
      await loadMenu();
      return response;
    } catch (error) {
      throw error;
    }
  };
  const invalidateMenuCache = async () => {
    if (restaurant?._id) {
      try {
        await clearMenuCache(restaurant._id);
        await loadMenu();
      } catch (error) {
      }
    }
  };
  return {
    menu,
    setMenu,
    loadMenu,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleMenuItemAvailability,
    invalidateMenuCache,
  };
};

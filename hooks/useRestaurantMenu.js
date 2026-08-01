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
          console.error('Erreur chargement menu:', errorMsg);
        }
      );
    } catch (error) {
      console.error('Error loading restaurant menu with smart cache:', error);
    }
  };
  const addMenuItem = async (menuItem) => {
    try {
      const response = await apiClient.addMenuItem(menuItem);
      await loadMenu();
      return response;
    } catch (error) {
      console.error('Add menu item error:', error);
      throw error;
    }
  };
  const updateMenuItem = async (itemId, updates) => {
    try {
      const response = await apiClient.updateMenuItem(itemId, updates);
      await loadMenu();
      return response;
    } catch (error) {
      console.error('Update menu item error:', error);
      throw error;
    }
  };
  const deleteMenuItem = async (itemId) => {
    try {
      const response = await apiClient.deleteMenuItem(itemId);
      await loadMenu();
      return response;
    } catch (error) {
      console.error('Delete menu item error:', error);
      throw error;
    }
  };
  const toggleMenuItemAvailability = async (itemId, available) => {
    try {
      const response = await apiClient.toggleMenuItemAvailability(itemId, available);
      await loadMenu();
      return response;
    } catch (error) {
      console.error('Toggle menu item availability error:', error);
      throw error;
    }
  };
  const invalidateMenuCache = async () => {
    if (restaurant?._id) {
      try {
        await clearMenuCache(restaurant._id);
        await loadMenu();
      } catch (error) {
        console.error("Erreur lors de l'invalidation du cache du menu:", error);
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

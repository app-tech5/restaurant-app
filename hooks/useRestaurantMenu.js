import { useState } from 'react';
import { Alert } from 'react-native';
import apiClient from '../api';
import { config } from '../config';
import { loadMenuWithSmartCache, clearMenuCache } from '../utils/cacheUtils';
import { isRestaurantAuthenticated } from '../utils/restaurantUtils';
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
        (data, fromCache) => {
          setMenu(data);
          if (fromCache) {
          }
        },
        (data) => {
          setMenu(data);
        },
        (loading) => {
        },
        (errorMsg) => {
          console.error('Erreur chargement menu:', errorMsg);
        }
      );
    } catch (error) {
      console.error('Error loading restaurant menu with smart cache:', error);
    }
  };
  const addMenuItem = async (menuItem) => {
    if (config.DEMO_MODE) {
      const newItem = {
        ...menuItem,
        _id: 'demo-' + Date.now(),
        createdAt: new Date().toISOString()
      };
      setMenu(prev => [...prev, newItem]);
      Alert.alert('Mode Démo', 'Élément ajouté au menu (simulation)');
      return { success: true, item: newItem };
    }
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
    if (config.DEMO_MODE) {
      setMenu(prev => prev.map(item =>
        item._id === itemId ? { ...item, ...updates } : item
      ));
      Alert.alert('Mode Démo', 'Élément mis à jour (simulation)');
      return { success: true };
    }
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
    if (config.DEMO_MODE) {
      setMenu(prev => prev.filter(item => item._id !== itemId));
      Alert.alert('Mode Démo', 'Élément supprimé du menu (simulation)');
      return { success: true };
    }
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
    if (config.DEMO_MODE) {
      setMenu(prev => prev.map(item =>
        item._id === itemId ? { ...item, available } : item
      ));
      Alert.alert('Mode Démo', `Élément ${available ? 'activé' : 'désactivé'} (simulation)`);
      return { success: true };
    }
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
        console.error('Erreur lors de l\'invalidation du cache du menu:', error);
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
    invalidateMenuCache
  };
};

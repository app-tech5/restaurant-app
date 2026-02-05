import { useState } from 'react';
import { Alert } from 'react-native';
import apiClient from '../api';
import { config } from '../config';
import { loadMenuWithSmartCache, clearMenuCache } from '../utils/cacheUtils';
import { isRestaurantAuthenticated } from '../utils/restaurantUtils';

/**
 * Hook personnalisé pour gérer le menu du restaurant
 * @param {Object} restaurant - Objet restaurant
 * @param {boolean} isAuthenticated - État d'authentification
 * @returns {Object} État et fonctions du menu
 */
export const useRestaurantMenu = (restaurant, isAuthenticated) => {
  const [menu, setMenu] = useState([]);

  // Charger le menu du restaurant avec cache intelligent
  const loadMenu = async () => {
    if (!isAuthenticated || !restaurant?._id) {
      console.log('❌ Restaurant non authentifié, impossible de charger le menu');
      return;
    }

    try {
      // Utiliser le cache intelligent pour le menu
      await loadMenuWithSmartCache(
        restaurant._id, // restaurantId
        () => apiClient.getRestaurantMenu(), // apiFetcher
        (data, fromCache) => {
          // onDataLoaded - appelé quand les données sont prêtes (cache ou API)
          setMenu(data);
          if (fromCache) {
            console.log('🔄 Menu chargé depuis le cache dans RestaurantContext');
          }
        },
        (data) => {
          // onDataUpdated - appelé quand les données sont mises à jour depuis l'API
          setMenu(data);
          console.log('🔄 Menu mis à jour depuis l\'API dans RestaurantContext');
        },
        (loading) => {
          // onLoadingStateChange
          console.log(`🔄 État de chargement du menu: ${loading}`);
        },
        (errorMsg) => {
          // onError
          console.error('Erreur chargement menu:', errorMsg);
        }
      );
    } catch (error) {
      console.error('Error loading restaurant menu with smart cache:', error);
    }
  };

  // Ajouter un élément au menu
  const addMenuItem = async (menuItem) => {
    if (config.DEMO_MODE) {
      // Mode démo : simulation locale
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
      console.log('➕ Élément ajouté au menu:', response);
      await loadMenu(); // Recharger le menu
      return response;
    } catch (error) {
      console.error('Add menu item error:', error);
      throw error;
    }
  };

  // Mettre à jour un élément du menu
  const updateMenuItem = async (itemId, updates) => {
    if (config.DEMO_MODE) {
      // Mode démo : simulation locale
      setMenu(prev => prev.map(item =>
        item._id === itemId ? { ...item, ...updates } : item
      ));
      Alert.alert('Mode Démo', 'Élément mis à jour (simulation)');
      return { success: true };
    }

    try {
      const response = await apiClient.updateMenuItem(itemId, updates);
      console.log('🔄 Élément du menu mis à jour:', response);
      await loadMenu(); // Recharger le menu
      return response;
    } catch (error) {
      console.error('Update menu item error:', error);
      throw error;
    }
  };

  // Supprimer un élément du menu
  const deleteMenuItem = async (itemId) => {
    if (config.DEMO_MODE) {
      // Mode démo : simulation locale
      setMenu(prev => prev.filter(item => item._id !== itemId));
      Alert.alert('Mode Démo', 'Élément supprimé du menu (simulation)');
      return { success: true };
    }

    try {
      const response = await apiClient.deleteMenuItem(itemId);
      console.log('🗑️ Élément supprimé du menu:', response);
      await loadMenu(); // Recharger le menu
      return response;
    } catch (error) {
      console.error('Delete menu item error:', error);
      throw error;
    }
  };

  // Activer/désactiver la disponibilité d'un élément
  const toggleMenuItemAvailability = async (itemId, available) => {
    if (config.DEMO_MODE) {
      // Mode démo : simulation locale
      setMenu(prev => prev.map(item =>
        item._id === itemId ? { ...item, available } : item
      ));
      Alert.alert('Mode Démo', `Élément ${available ? 'activé' : 'désactivé'} (simulation)`);
      return { success: true };
    }

    try {
      const response = await apiClient.toggleMenuItemAvailability(itemId, available);
      console.log(`🔄 Élément ${available ? 'activé' : 'désactivé'}:`, response);
      await loadMenu(); // Recharger le menu
      return response;
    } catch (error) {
      console.error('Toggle menu item availability error:', error);
      throw error;
    }
  };

  // Invalider le cache du menu (pour forcer un rechargement)
  const invalidateMenuCache = async () => {
    if (restaurant?._id) {
      try {
        await clearMenuCache(restaurant._id);
        console.log('🗑️ Cache du menu invalidé');
        await loadMenu(); // Recharger immédiatement
      } catch (error) {
        console.error('Erreur lors de l\'invalidation du cache du menu:', error);
      }
    }
  };

  return {
    menu,
    loadMenu,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleMenuItemAvailability,
    invalidateMenuCache
  };
};

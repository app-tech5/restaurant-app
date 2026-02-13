import React, { createContext, useContext } from 'react';
import { useRestaurantAuth } from '../hooks/useRestaurantAuth';
import { useRestaurantStats } from '../hooks/useRestaurantStats';
import { useRestaurantOrders } from '../hooks/useRestaurantOrders';
import { useRestaurantMenu } from '../hooks/useRestaurantMenu';
import { useSettings } from '../hooks/useSettings';
import { INITIAL_STATS } from '../utils/restaurantUtils';

const RestaurantContext = createContext();

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};

export const RestaurantProvider = ({ children }) => {
  // Hook d'authentification
  const {
    restaurant,
    isLoading,
    isAuthenticated,
    login,
    logout: authLogout,
    setRestaurant,
    setIsAuthenticated
  } = useRestaurantAuth();

  // Hook des paramètres
  const {
    settings,
    isLoading: settingsLoading,
    error: settingsError,
    loadSettings,
    formatCurrency,
    getCurrencySymbol,
    getCurrencyCode
  } = useSettings();

  // Hook des statistiques
  const {
    stats,
    loadRestaurantStats,
    invalidateRestaurantStatsCache
  } = useRestaurantStats(restaurant, isAuthenticated);

  // Hook des commandes
  const {
    orders,
    loadRestaurantOrders,
    updateOrderStatus,
    acceptOrder,
    prepareOrder,
    readyForPickup,
    invalidateOrdersCache
  } = useRestaurantOrders(restaurant, isAuthenticated);

  console.log("Orders in RestaurantContext", orders)

  // Hook du menu
  const {
    menu,
    loadMenu,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleMenuItemAvailability,
    invalidateMenuCache
  } = useRestaurantMenu(restaurant, isAuthenticated);

  // Wrapper pour logout qui nettoie tout
  const logout = async () => {
    // Invalider tous les caches
    invalidateRestaurantStatsCache();
    invalidateOrdersCache();
    invalidateMenuCache();

    // Appeler le logout d'authentification
    await authLogout();

    // Reset local state
    setRestaurant(null);
    setIsAuthenticated(false);
  };

  // Valeur du contexte
  const value = {
    // Authentification
    restaurant,
    isLoading,
    isAuthenticated,
    login,
    logout,
    setRestaurant,
    setIsAuthenticated,

    // Paramètres
    settings,
    settingsLoading,
    settingsError,
    loadSettings,
    formatCurrency,
    getCurrencySymbol,
    getCurrencyCode,

    // Statistiques
    stats,
    loadRestaurantStats,
    invalidateRestaurantStatsCache,

    // Commandes
    orders,
    loadRestaurantOrders,
    updateOrderStatus,
    acceptOrder,
    prepareOrder,
    readyForPickup,
    invalidateOrdersCache,

    // Menu
    menu,
    loadMenu,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleMenuItemAvailability,
    invalidateMenuCache,
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};

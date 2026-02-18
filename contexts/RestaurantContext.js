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
  
  const {
    restaurant,
    isLoading,
    isAuthenticated,
    login,
    logout: authLogout,
    setRestaurant,
    setIsAuthenticated
  } = useRestaurantAuth();
  
  const {
    settings,
    isLoading: settingsLoading,
    error: settingsError,
    loadSettings,
    formatCurrency,
    getCurrencySymbol,
    getCurrencyCode
  } = useSettings();
  
  const {
    stats,
    loadRestaurantStats,
    invalidateRestaurantStatsCache
  } = useRestaurantStats(restaurant, isAuthenticated);
  
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
  
  const {
    menu,
    loadMenu,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleMenuItemAvailability,
    invalidateMenuCache
  } = useRestaurantMenu(restaurant, isAuthenticated);
  
  const logout = async () => {
    
    invalidateRestaurantStatsCache();
    invalidateOrdersCache();
    invalidateMenuCache();
    
    await authLogout();
    
    setRestaurant(null);
    setIsAuthenticated(false);
  };
  
  const value = {
    
    restaurant,
    isLoading,
    isAuthenticated,
    login,
    logout,
    setRestaurant,
    setIsAuthenticated,
    
    settings,
    settingsLoading,
    settingsError,
    loadSettings,
    formatCurrency,
    getCurrencySymbol,
    getCurrencyCode,
    
    stats,
    loadRestaurantStats,
    invalidateRestaurantStatsCache,
    
    orders,
    loadRestaurantOrders,
    updateOrderStatus,
    acceptOrder,
    prepareOrder,
    readyForPickup,
    invalidateOrdersCache,
    
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

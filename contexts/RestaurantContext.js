import React, { createContext, useContext } from 'react';
import { useRestaurantAuth } from '../hooks/useRestaurantAuth';
import { useRestaurantStats } from '../hooks/useRestaurantStats';
import { useRestaurantOrders } from '../hooks/useRestaurantOrders';
import { useRestaurantMenu } from '../hooks/useRestaurantMenu';
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
    needsOnboarding,
    login,
    signup,
    logout: authLogout,
    completeOnboarding,
    setRestaurant,
    setIsAuthenticated
  } = useRestaurantAuth();
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
    needsOnboarding,
    login,
    signup,
    logout,
    completeOnboarding,
    setRestaurant,
    setIsAuthenticated,
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

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useRestaurantAuth } from '../hooks/useRestaurantAuth';
import { getRestaurantFromCache } from '../utils/storageUtils';
import { clearRestaurantProfileCache } from '../utils/cacheUtils';
import { resolveRestaurantPlaceId } from '../utils/restaurantIdUtils';
import { useRestaurantStats } from '../hooks/useRestaurantStats';
import { useRestaurantOrders } from '../hooks/useRestaurantOrders';
import { useRestaurantMenu } from '../hooks/useRestaurantMenu';
import { useRestaurantProfile } from '../hooks/useRestaurantProfile';
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
    refreshRestaurantProfile,
    setRestaurant,
    setIsAuthenticated
  } = useRestaurantAuth();
  const {
    loadRestaurantProfile,
    invalidateRestaurantProfileCache
  } = useRestaurantProfile(restaurant, isAuthenticated);
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

  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasBackground = /inactive|background/.test(appStateRef.current);
      appStateRef.current = nextState;
      if (nextState !== 'active' || !wasBackground) {
        return;
      }

      void (async () => {
        try {
          const cached = await getRestaurantFromCache();
          const accountUser = cached?.restaurant ?? restaurant;
          if (!accountUser) {
            return;
          }
          const restaurantId = resolveRestaurantPlaceId(accountUser);
          if (restaurantId) {
            await clearRestaurantProfileCache(String(restaurantId));
          }
          await refreshRestaurantProfile(accountUser, cached?.token);
        } catch (error) {
          console.error('Foreground profile refresh error:', error);
        }
      })();
    });

    return () => subscription.remove();
  }, [isAuthenticated, restaurant, refreshRestaurantProfile]);

  const logout = async () => {
    invalidateRestaurantStatsCache();
    invalidateOrdersCache();
    invalidateMenuCache();
    invalidateRestaurantProfileCache();
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
    refreshRestaurantProfile,
    loadRestaurantProfile,
    invalidateRestaurantProfileCache,
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

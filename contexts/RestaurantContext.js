import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { io } from 'socket.io-client';
import { config } from '../config';
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

  const [socket, setSocket] = useState(null);
  useEffect(() => {
    if (!restaurant?._id) {
      return;
    }
    const url = String(config.API_BASE_URL).replace(/\/api\/?$/, '');
    const socketInstance = io(url);
    setSocket(socketInstance);
    socketInstance.on('connect', () => {
      socketInstance.emit('joinRestaurantRoom', restaurant._id);
    });
    socketInstance.on('restaurant-updated', (data) => {
      setRestaurant((prev) =>
        prev?._id === data.restaurant._id ? data.restaurant : prev
      );
    });
    return () => {
      socketInstance.disconnect();
    };
  }, [restaurant?._id]);

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
    socket,
  };
  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};

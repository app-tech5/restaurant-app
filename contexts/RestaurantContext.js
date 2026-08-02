import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { io } from 'socket.io-client';
import { config } from '../config';
import { useRestaurantAuth } from '../hooks/useRestaurantAuth';
import { getRestaurantFromCache } from '../utils/storageUtils';
import {
  clearRestaurantProfileCache,
  clearRestaurantStatsCache,
  clearMenuCache,
  clearOrdersCache,
} from '../utils/cacheUtils';
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
  const isReady = isAuthenticated && !needsOnboarding;
  const {
    loadRestaurantProfile,
    invalidateRestaurantProfileCache
  } = useRestaurantProfile(restaurant, isReady);
  const {
    stats,
    loadRestaurantStats,
    invalidateRestaurantStatsCache
  } = useRestaurantStats(restaurant, isReady);
  const {
    orders,
    loadRestaurantOrders,
    updateOrderStatus,
    acceptOrder,
    prepareOrder,
    readyForPickup,
    invalidateOrdersCache
  } = useRestaurantOrders(restaurant, isReady);
  const {
    menu,
    setMenu,
    loadMenu,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleMenuItemAvailability,
    invalidateMenuCache
  } = useRestaurantMenu(restaurant, isReady);

  const [socket, setSocket] = useState(null);
  useEffect(() => {
    if (!isReady || !restaurant?._id) {
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
  }, [isReady, restaurant?._id]);

  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    if (!isReady || !restaurant) {
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
        }
      })();
    });

    return () => subscription.remove();
  }, [isReady, restaurant, refreshRestaurantProfile]);

  const logout = async () => {
    const restaurantId = resolveRestaurantPlaceId(restaurant);
    if (restaurantId) {
      const id = String(restaurantId);
      await Promise.all([
        clearRestaurantProfileCache(id),
        clearRestaurantStatsCache(id),
        clearMenuCache(id),
        clearOrdersCache(id),
      ]);
    }
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
    setMenu,
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

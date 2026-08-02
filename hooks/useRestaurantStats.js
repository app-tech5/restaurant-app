import { useState } from 'react';
import apiClient from '../api';
import { loadRestaurantStatsWithSmartCache, clearRestaurantStatsCache } from '../utils/cacheUtils';
import { isRestaurantAuthenticated, INITIAL_STATS } from '../utils/restaurantUtils';
export const useRestaurantStats = (restaurant, isAuthenticated) => {
  const [stats, setStats] = useState(INITIAL_STATS);
  const loadRestaurantStats = async () => {
    if (!isAuthenticated || !restaurant?._id) {
      return;
    }
    try {
      await loadRestaurantStatsWithSmartCache(
        restaurant._id, 
        () => apiClient.getRestaurantStats(), 
        (data, fromCache) => {
          setStats(data);
          if (fromCache) {
          }
        },
        (data) => {
          setStats(data);
        },
        (loading) => {
        },
        (errorMsg) => {
        }
      );
    } catch (error) {
    }
  };
  const invalidateRestaurantStatsCache = async () => {
    if (restaurant?._id) {
      try {
        await clearRestaurantStatsCache(restaurant._id);
        await loadRestaurantStats(); 
      } catch (error) {
      }
    }
  };
  return {
    stats,
    loadRestaurantStats,
    invalidateRestaurantStatsCache
  };
};

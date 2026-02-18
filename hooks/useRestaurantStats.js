import { useState } from 'react';
import apiClient from '../api';
import { loadRestaurantStatsWithSmartCache, clearRestaurantStatsCache } from '../utils/cacheUtils';
import { isRestaurantAuthenticated, INITIAL_STATS } from '../utils/restaurantUtils';

export const useRestaurantStats = (restaurant, isAuthenticated) => {
  const [stats, setStats] = useState(INITIAL_STATS);
  
  const loadRestaurantStats = async () => {
    if (!isAuthenticated || !restaurant?._id) {
      console.log('❌ Restaurant non authentifié, impossible de charger les stats');
      return;
    }

    try {
      
      await loadRestaurantStatsWithSmartCache(
        restaurant._id, 
        () => apiClient.getRestaurantStats(), 
        (data, fromCache) => {
          
          setStats(data);
          if (fromCache) {
            console.log('🔄 Stats chargées depuis le cache dans RestaurantContext');
          }
        },
        (data) => {
          
          setStats(data);
          console.log('🔄 Stats mises à jour depuis l\'API dans RestaurantContext');
        },
        (loading) => {
          
          console.log(`🔄 État de chargement des stats: ${loading}`);
        },
        (errorMsg) => {
          
          console.error('Erreur chargement stats:', errorMsg);
        }
      );
    } catch (error) {
      console.error('Error loading restaurant stats with smart cache:', error);
    }
  };
  
  const invalidateRestaurantStatsCache = async () => {
    if (restaurant?._id) {
      try {
        await clearRestaurantStatsCache(restaurant._id);
        console.log('🗑️ Cache des stats invalidé');
        await loadRestaurantStats(); 
      } catch (error) {
        console.error('Erreur lors de l\'invalidation du cache des stats:', error);
      }
    }
  };

  return {
    stats,
    loadRestaurantStats,
    invalidateRestaurantStatsCache
  };
};

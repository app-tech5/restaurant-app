import { useState } from 'react';
import apiClient from '../api';
import { loadRestaurantStatsWithSmartCache, clearRestaurantStatsCache } from '../utils/cacheUtils';
import { isRestaurantAuthenticated, INITIAL_STATS } from '../utils/restaurantUtils';

/**
 * Hook personnalisé pour gérer les statistiques du restaurant
 * @param {Object} restaurant - Objet restaurant
 * @param {boolean} isAuthenticated - État d'authentification
 * @returns {Object} État et fonctions des statistiques
 */
export const useRestaurantStats = (restaurant, isAuthenticated) => {
  const [stats, setStats] = useState(INITIAL_STATS);

  // Charger les statistiques du restaurant avec cache intelligent
  const loadRestaurantStats = async () => {
    if (!isAuthenticated || !restaurant?._id) {
      console.log('❌ Restaurant non authentifié, impossible de charger les stats');
      return;
    }

    try {
      // Utiliser le cache intelligent pour les stats
      await loadRestaurantStatsWithSmartCache(
        restaurant._id, // restaurantId
        () => apiClient.getRestaurantStats(), // apiFetcher
        (data, fromCache) => {
          // onDataLoaded - appelé quand les données sont prêtes (cache ou API)
          setStats(data);
          if (fromCache) {
            console.log('🔄 Stats chargées depuis le cache dans RestaurantContext');
          }
        },
        (data) => {
          // onDataUpdated - appelé quand les données sont mises à jour depuis l'API
          setStats(data);
          console.log('🔄 Stats mises à jour depuis l\'API dans RestaurantContext');
        },
        (loading) => {
          // onLoadingStateChange - on pourrait utiliser un état de chargement spécifique
          console.log(`🔄 État de chargement des stats: ${loading}`);
        },
        (errorMsg) => {
          // onError
          console.error('Erreur chargement stats:', errorMsg);
        }
      );
    } catch (error) {
      console.error('Error loading restaurant stats with smart cache:', error);
    }
  };

  // Invalider le cache des stats (pour forcer un rechargement)
  const invalidateRestaurantStatsCache = async () => {
    if (restaurant?._id) {
      try {
        await clearRestaurantStatsCache(restaurant._id);
        console.log('🗑️ Cache des stats invalidé');
        await loadRestaurantStats(); // Recharger immédiatement
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

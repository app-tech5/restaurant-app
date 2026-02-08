import { useState, useEffect, useMemo } from 'react';
import apiClient from '../api';
import { loadWithSmartCache, clearOrdersCache } from '../utils/cacheUtils';

/**
 * Hook personnalisé pour gérer les données d'analytics du restaurant
 * @param {Object} restaurant - Objet restaurant
 * @param {boolean} isAuthenticated - État d'authentification
 * @returns {Object} État et fonctions pour les analytics
 */
export const useAnalytics = (restaurant, isAuthenticated) => {
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('today');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger les analytics avec cache intelligent
  const loadAnalytics = async (selectedPeriod = period) => {
    if (!isAuthenticated || !restaurant?._id) {
      console.log('❌ Restaurant non authentifié, impossible de charger les analytics');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Utiliser le cache intelligent pour les analytics
      await loadWithSmartCache(
        restaurant._id, // restaurantId
        `analytics_${selectedPeriod}`, // cacheKey
        () => apiClient.getRestaurantAnalytics(selectedPeriod), // apiFetcher
        (data, fromCache) => {
          // onDataLoaded - appelé quand les données sont prêtes (cache ou API)
          setAnalytics(data);
          if (fromCache) {
            console.log(`🔄 Analytics ${selectedPeriod} chargés depuis le cache`);
          }
        },
        (data) => {
          // onDataUpdated - appelé quand les données sont mises à jour depuis l'API
          setAnalytics(data);
          console.log(`🔄 Analytics ${selectedPeriod} mis à jour depuis l'API`);
        },
        (loading) => {
          // onLoadingStateChange
          setIsLoading(loading);
        },
        (errorMsg) => {
          // onError
          setError(errorMsg);
          console.error('Erreur chargement analytics:', errorMsg);
        }
      );
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Recharger les analytics quand la période change
  useEffect(() => {
    if (isAuthenticated && restaurant?._id) {
      loadAnalytics(period);
    }
  }, [period, isAuthenticated, restaurant?._id]);

  // Calculer les métriques dérivées
  const derivedMetrics = useMemo(() => {
    if (!analytics) return null;

    return {
      // Métriques principales
      revenue: {
        value: analytics.totalRevenue || 0,
        trend: analytics.trends?.revenue || 0,
        formatted: `${(analytics.totalRevenue || 0).toFixed(2)}€`
      },
      orders: {
        value: analytics.totalOrders || 0,
        trend: analytics.trends?.orders || 0,
        formatted: analytics.totalOrders || 0
      },
      customers: {
        value: analytics.activeCustomers || 0,
        trend: analytics.trends?.customers || 0,
        formatted: analytics.activeCustomers || 0
      },
      averageOrderValue: {
        value: analytics.averageOrderValue || 0,
        trend: 0, // Calculé plus tard
        formatted: `${(analytics.averageOrderValue || 0).toFixed(2)}€`
      },

      // Métriques de performance
      preparationTime: {
        value: analytics.averagePreparationTime || 0,
        formatted: `${analytics.averagePreparationTime || 0} min`
      },
      rating: {
        value: analytics.averageRating || 0,
        trend: analytics.trends?.rating || 0,
        formatted: `${(analytics.averageRating || 0).toFixed(1)}/5`
      },
      cancellationRate: {
        value: analytics.cancellationRate || 0,
        formatted: `${(analytics.cancellationRate || 0).toFixed(1)}%`
      },

      // Métriques détaillées
      completedOrders: analytics.completedOrders || 0,
      onTimeDeliveryRate: analytics.onTimeDeliveryRate || 0,
      totalDeliveries: analytics.totalDeliveries || 0
    };
  }, [analytics]);

  // Fonction pour changer la période
  const changePeriod = async (newPeriod) => {
    setPeriod(newPeriod);
  };

  // Fonction pour rafraîchir les données
  const refreshAnalytics = () => {
    loadAnalytics(period);
  };

  return {
    // État
    analytics,
    derivedMetrics,
    period,
    isLoading,
    error,

    // Actions
    changePeriod,
    refreshAnalytics,
    loadAnalytics
  };
};

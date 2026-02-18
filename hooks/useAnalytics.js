import { useState, useEffect, useMemo } from 'react';
import apiClient from '../api';
import { loadWithSmartCache, clearOrdersCache } from '../utils/cacheUtils';

export const useAnalytics = (restaurant, isAuthenticated) => {
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('today');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const loadAnalytics = async (selectedPeriod = period) => {
    if (!isAuthenticated || !restaurant?._id) {
      console.log('❌ Restaurant non authentifié, impossible de charger les analytics');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await loadWithSmartCache(
        restaurant._id, 
        `analytics_${selectedPeriod}`, 
        () => apiClient.getRestaurantAnalytics(selectedPeriod), 
        (data, fromCache) => {
          
          setAnalytics(data);
          if (fromCache) {
            console.log(`🔄 Analytics ${selectedPeriod} chargés depuis le cache`);
          }
        },
        (data) => {
          
          setAnalytics(data);
          console.log(`🔄 Analytics ${selectedPeriod} mis à jour depuis l'API`);
        },
        (loading) => {
          
          setIsLoading(loading);
        },
        (errorMsg) => {
          
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
  
  useEffect(() => {
    if (isAuthenticated && restaurant?._id) {
      loadAnalytics(period);
    }
  }, [period, isAuthenticated, restaurant?._id]);
  
  const derivedMetrics = useMemo(() => {
    if (!analytics) return null;

    return {
      
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
        trend: 0, 
        formatted: `${(analytics.averageOrderValue || 0).toFixed(2)}€`
      },
      
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
      
      completedOrders: analytics.completedOrders || 0,
      onTimeDeliveryRate: analytics.onTimeDeliveryRate || 0,
      totalDeliveries: analytics.totalDeliveries || 0
    };
  }, [analytics]);
  
  const changePeriod = async (newPeriod) => {
    setPeriod(newPeriod);
  };
  
  const refreshAnalytics = () => {
    loadAnalytics(period);
  };

  return {
    
    analytics,
    derivedMetrics,
    period,
    isLoading,
    error,
    
    changePeriod,
    refreshAnalytics,
    loadAnalytics
  };
};

import { useState, useEffect, useMemo, useRef } from 'react';
import apiClient from '../api';
import { buildRestaurantAnalyticsData } from '../utils/restaurantAnalyticsUtils';

/**
 * Instant metrics from in-memory orders; API refresh in background.
 * Never blocks the screen forever on a slow network.
 */
export const useAnalytics = (restaurant, isAuthenticated, orders = []) => {
  const [remoteAnalytics, setRemoteAnalytics] = useState(null);
  const [period, setPeriod] = useState('today');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  const localAnalytics = useMemo(() => {
    if (!isAuthenticated || !restaurant?._id) return null;
    return buildRestaurantAnalyticsData(
      period,
      Array.isArray(orders) ? orders : [],
      []
    );
  }, [period, isAuthenticated, restaurant?._id, orders]);

  useEffect(() => {
    if (!isAuthenticated || !restaurant?._id) {
      setRemoteAnalytics(null);
      return;
    }

    let cancelled = false;
    const refresh = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient.getRestaurantAnalytics(period);
        if (cancelled) return;
        if (res?.data) setRemoteAnalytics(res.data);
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading analytics:', err);
          if (!(ordersRef.current || []).length) {
            setError(err.message || 'Impossible de charger les analytics');
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    refresh();
    return () => {
      cancelled = true;
    };
  }, [period, isAuthenticated, restaurant?._id, refreshTick]);

  const analytics = remoteAnalytics || localAnalytics;

  const derivedMetrics = useMemo(() => {
    if (!analytics) return null;
    return {
      revenue: {
        value: analytics.totalRevenue || 0,
        trend: analytics.trends?.revenue || 0,
      },
      orders: {
        value: analytics.totalOrders || 0,
        trend: analytics.trends?.orders || 0,
        formatted: analytics.totalOrders || 0,
      },
      customers: {
        value: analytics.activeCustomers || 0,
        trend: analytics.trends?.customers || 0,
        formatted: analytics.activeCustomers || 0,
      },
      averageOrderValue: {
        value: analytics.averageOrderValue || 0,
        trend: 0,
      },
      preparationTime: {
        value: analytics.averagePreparationTime || 0,
        formatted: `${analytics.averagePreparationTime || 0} min`,
      },
      rating: {
        value: analytics.averageRating || 0,
        trend: analytics.trends?.rating || 0,
        formatted: `${(analytics.averageRating || 0).toFixed(1)}/5`,
      },
      cancellationRate: {
        value: analytics.cancellationRate || 0,
        formatted: `${(analytics.cancellationRate || 0).toFixed(1)}%`,
      },
      completedOrders: analytics.completedOrders || 0,
      onTimeDeliveryRate: analytics.onTimeDeliveryRate || 0,
      totalDeliveries: analytics.totalDeliveries || 0,
    };
  }, [analytics]);

  const changePeriod = (newPeriod) => {
    setPeriod(newPeriod);
    setRemoteAnalytics(null);
  };

  const refreshAnalytics = () => {
    setRemoteAnalytics(null);
    setRefreshTick((n) => n + 1);
  };

  return {
    analytics,
    derivedMetrics,
    period,
    isLoading,
    error,
    changePeriod,
    refreshAnalytics,
  };
};

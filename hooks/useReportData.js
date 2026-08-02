import { useState, useEffect, useMemo } from 'react';
import { useRestaurant } from '../contexts/RestaurantContext';
import i18n from '../i18n';

export const useReportData = (reportType, period) => {
  const { stats, orders, loadRestaurantStats, loadRestaurantOrders } = useRestaurant();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    loadReportData();
  }, [reportType, period]);
  const loadReportData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadRestaurantStats(),
        loadRestaurantOrders()
      ]);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };
  const onRefresh = async () => {
    setRefreshing(true);
    await loadReportData();
    setRefreshing(false);
  };
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const now = new Date();
    let startDate;
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }
    return orders.filter(order => new Date(order.createdAt) >= startDate);
  }, [orders, period]);
  const baseMetrics = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const deliveredOrders = filteredOrders.filter(order => order.status === 'delivered');
    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      deliveredOrders: deliveredOrders.length
    };
  }, [filteredOrders]);
  const reportInfo = useMemo(() => {
    let periodText = '';
    switch (period) {
      case 'day':
        periodText = i18n.t('reports.today');
        break;
      case 'week':
        periodText = i18n.t('reports.thisWeek');
        break;
      case 'month':
      default:
        periodText = i18n.t('reports.thisMonth');
        break;
    }
    let title = '';
    switch (reportType) {
      case 'daily':
        title = i18n.t('reports.dailyReport', { period: periodText });
        break;
      case 'weekly':
        title = i18n.t('reports.weeklyReport', { period: periodText });
        break;
      case 'monthly':
        title = i18n.t('reports.monthlyReport', { period: periodText });
        break;
      case 'revenue':
        title = i18n.t('reports.revenueReport', { period: periodText });
        break;
      case 'orders':
        title = i18n.t('reports.ordersReport', { period: periodText });
        break;
      case 'customers':
        title = i18n.t('reports.customersReport', { period: periodText });
        break;
      default:
        title = i18n.t('reports.customReport', { period: periodText });
        break;
    }
    return { title, periodText };
  }, [reportType, period]);
  return {
    isLoading,
    refreshing,
    filteredOrders,
    baseMetrics,
    reportInfo,
    onRefresh,
    stats
  };
};

import { useState, useEffect, useMemo } from 'react';
import { useRestaurant } from '../contexts/RestaurantContext';

/**
 * Hook personnalisé pour gérer les données des rapports
 * @param {string} reportType - Type de rapport (daily, weekly, monthly, revenue, orders)
 * @param {string} period - Période (day, week, month)
 * @returns {Object} État et fonctions pour les données du rapport
 */
export const useReportData = (reportType, period) => {
  const { stats, orders, loadRestaurantStats, loadRestaurantOrders } = useRestaurant();

  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Charger les données au montage
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
      console.error('Erreur chargement données rapport:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReportData();
    setRefreshing(false);
  };

  // Filtrer les commandes selon la période
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

  // Calculer les métriques de base
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

  // Déterminer le titre et la période textuelle
  const reportInfo = useMemo(() => {
    const now = new Date();
    let title = '';
    let periodText = '';

    switch (period) {
      case 'day':
        periodText = 'Aujourd\'hui';
        break;
      case 'week':
        periodText = 'Cette semaine';
        break;
      case 'month':
      default:
        periodText = 'Ce mois';
        break;
    }

    switch (reportType) {
      case 'daily':
        title = `${periodText} - Rapport journalier`;
        break;
      case 'weekly':
        title = `${periodText} - Rapport hebdomadaire`;
        break;
      case 'monthly':
        title = `${periodText} - Rapport mensuel`;
        break;
      case 'revenue':
        title = `${periodText} - Analyse des revenus`;
        break;
      case 'orders':
        title = `${periodText} - Statistiques des commandes`;
        break;
      default:
        title = `${periodText} - Rapport`;
    }

    return { title, periodText };
  }, [reportType, period]);

  return {
    // État
    isLoading,
    refreshing,
    filteredOrders,
    baseMetrics,
    reportInfo,

    // Actions
    onRefresh
  };
};

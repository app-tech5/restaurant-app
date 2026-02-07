import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform
} from 'react-native';
import { Card, Button, Icon } from 'react-native-elements';
import { useRestaurant } from '../contexts/RestaurantContext';
import { ScreenHeader } from '../components';
import { colors, constants } from '../global';
import { formatPrice } from '../utils/restaurantUtils';
import i18n from '../i18n';

const ReportDetailsScreen = ({ route, navigation }) => {
  const { reportType, period } = route.params || {};
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

  // Calculer les données du rapport selon le type
  const reportData = useMemo(() => {
    if (!orders || !stats) return null;

    const now = new Date();
    let filteredOrders = [];
    let title = '';
    let periodText = '';

    // Déterminer la période
    switch (period) {
      case 'day':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filteredOrders = orders.filter(order =>
          new Date(order.createdAt) >= today
        );
        periodText = 'Aujourd\'hui';
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        filteredOrders = orders.filter(order =>
          new Date(order.createdAt) >= weekStart
        );
        periodText = 'Cette semaine';
        break;
      case 'month':
      default:
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filteredOrders = orders.filter(order =>
          new Date(order.createdAt) >= monthStart
        );
        periodText = 'Ce mois';
        break;
    }

    // Calculer les métriques selon le type de rapport
    switch (reportType) {
      case 'daily':
      case 'weekly':
      case 'monthly':
        title = `${periodText} - Rapport ${reportType === 'daily' ? 'journalier' :
                                              reportType === 'weekly' ? 'hebdomadaire' : 'mensuel'}`;
        return {
          title,
          periodText,
          totalOrders: filteredOrders.length,
          totalRevenue: filteredOrders
            .filter(order => order.status === 'delivered')
            .reduce((sum, order) => sum + (order.total || 0), 0),
          averageOrderValue: filteredOrders.length > 0 ?
            filteredOrders
              .filter(order => order.status === 'delivered')
              .reduce((sum, order) => sum + (order.total || 0), 0) / filteredOrders.length : 0,
          ordersByStatus: {
            pending: filteredOrders.filter(o => o.status === 'pending').length,
            accepted: filteredOrders.filter(o => o.status === 'accepted').length,
            preparing: filteredOrders.filter(o => o.status === 'preparing').length,
            ready: filteredOrders.filter(o => o.status === 'ready').length,
            delivered: filteredOrders.filter(o => o.status === 'delivered').length,
            cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
          },
          topItems: calculateTopItems(filteredOrders),
          hourlyDistribution: calculateHourlyDistribution(filteredOrders)
        };

      case 'revenue':
        title = `${periodText} - Analyse des revenus`;
        const revenueByDay = calculateRevenueByDay(filteredOrders);
        return {
          title,
          periodText,
          totalRevenue: filteredOrders
            .filter(order => order.status === 'delivered')
            .reduce((sum, order) => sum + (order.total || 0), 0),
          averageOrderValue: filteredOrders.length > 0 ?
            filteredOrders
              .filter(order => order.status === 'delivered')
              .reduce((sum, order) => sum + (order.total || 0), 0) / filteredOrders.length : 0,
          revenueByDay,
          topRevenueItems: calculateTopRevenueItems(filteredOrders)
        };

      case 'orders':
        title = `${periodText} - Statistiques des commandes`;
        return {
          title,
          periodText,
          totalOrders: filteredOrders.length,
          ordersByStatus: {
            pending: filteredOrders.filter(o => o.status === 'pending').length,
            accepted: filteredOrders.filter(o => o.status === 'accepted').length,
            preparing: filteredOrders.filter(o => o.status === 'preparing').length,
            ready: filteredOrders.filter(o => o.status === 'ready').length,
            delivered: filteredOrders.filter(o => o.status === 'delivered').length,
            cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
          },
          averagePreparationTime: calculateAveragePreparationTime(filteredOrders),
          peakHours: calculatePeakHours(filteredOrders)
        };

      default:
        return null;
    }
  }, [orders, stats, reportType, period]);

  // Fonctions utilitaires pour les calculs
  const calculateTopItems = (orders) => {
    const itemCount = {};
    orders.forEach(order => {
      order.items?.forEach(item => {
        itemCount[item.name] = (itemCount[item.name] || 0) + item.quantity;
      });
    });

    return Object.entries(itemCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  };

  const calculateHourlyDistribution = (orders) => {
    const hourlyCount = new Array(24).fill(0);
    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourlyCount[hour]++;
    });

    return hourlyCount.map((count, hour) => ({ hour, count }));
  };

  const calculateRevenueByDay = (orders) => {
    const revenueByDay = {};
    orders
      .filter(order => order.status === 'delivered')
      .forEach(order => {
        const date = new Date(order.createdAt).toDateString();
        revenueByDay[date] = (revenueByDay[date] || 0) + (order.total || 0);
      });

    return Object.entries(revenueByDay)
      .map(([date, revenue]) => ({ date: new Date(date), revenue }))
      .sort((a, b) => b.date - a.date);
  };

  const calculateTopRevenueItems = (orders) => {
    const itemRevenue = {};
    orders
      .filter(order => order.status === 'delivered')
      .forEach(order => {
        order.items?.forEach(item => {
          const revenue = item.price * item.quantity;
          itemRevenue[item.name] = (itemRevenue[item.name] || 0) + revenue;
        });
      });

    return Object.entries(itemRevenue)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, revenue]) => ({ name, revenue }));
  };

  const calculateAveragePreparationTime = (orders) => {
    const deliveredOrders = orders.filter(order => order.status === 'delivered');
    if (deliveredOrders.length === 0) return 0;

    const totalTime = deliveredOrders.reduce((sum, order) => {
      // Estimation simple : 30 minutes par défaut si pas de temps réel
      return sum + (order.estimatedTime || 30);
    }, 0);

    return Math.round(totalTime / deliveredOrders.length);
  };

  const calculatePeakHours = (orders) => {
    const hourlyCount = new Array(24).fill(0);
    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourlyCount[hour]++;
    });

    return hourlyCount
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const renderStatusChart = () => {
    if (!reportData?.ordersByStatus) return null;

    const statusConfig = {
      delivered: { label: 'Livrées', color: colors.success },
      ready: { label: 'Prêtes', color: colors.info },
      preparing: { label: 'En préparation', color: colors.warning },
      accepted: { label: 'Acceptées', color: colors.primary },
      pending: { label: 'En attente', color: colors.grey[500] },
      cancelled: { label: 'Annulées', color: colors.error }
    };

    return (
      <Card containerStyle={styles.chartCard}>
        <Text style={styles.chartTitle}>Répartition par statut</Text>
        {Object.entries(reportData.ordersByStatus).map(([status, count]) => {
          if (count === 0) return null;
          const config = statusConfig[status];
          return (
            <View key={status} style={styles.statusRow}>
              <View style={styles.statusInfo}>
                <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                <Text style={styles.statusLabel}>{config.label}</Text>
              </View>
              <Text style={styles.statusCount}>{count}</Text>
            </View>
          );
        })}
      </Card>
    );
  };

  const renderTopItems = () => {
    if (!reportData?.topItems?.length) return null;

    return (
      <Card containerStyle={styles.chartCard}>
        <Text style={styles.chartTitle}>Plats les plus commandés</Text>
        {reportData.topItems.map((item, index) => (
          <View key={item.name} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemRank}>#{index + 1}</Text>
              <Text style={styles.itemName}>{item.name}</Text>
            </View>
            <Text style={styles.itemCount}>{item.count} cmd</Text>
          </View>
        ))}
      </Card>
    );
  };

  const renderRevenueChart = () => {
    if (!reportData?.revenueByDay?.length) return null;

    return (
      <Card containerStyle={styles.chartCard}>
        <Text style={styles.chartTitle}>Revenus par jour</Text>
        {reportData.revenueByDay.slice(0, 7).map((day, index) => (
          <View key={index} style={styles.revenueRow}>
            <Text style={styles.revenueDate}>
              {day.date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
            </Text>
            <Text style={styles.revenueAmount}>{formatPrice(day.revenue)}</Text>
          </View>
        ))}
      </Card>
    );
  };

  const renderPeakHours = () => {
    if (!reportData?.peakHours?.length) return null;

    return (
      <Card containerStyle={styles.chartCard}>
        <Text style={styles.chartTitle}>Heures de pointe</Text>
        {reportData.peakHours.map((hour, index) => (
          <View key={index} style={styles.hourRow}>
            <Text style={styles.hourTime}>{hour.hour}h - {hour.hour + 1}h</Text>
            <Text style={styles.hourCount}>{hour.count} commandes</Text>
          </View>
        ))}
      </Card>
    );
  };

  if (isLoading || !reportData) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Détails du rapport"
          showBackButton
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement du rapport...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Détails du rapport"
        showBackButton
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* En-tête du rapport */}
        <Card containerStyle={styles.headerCard}>
          <Text style={styles.reportTitle}>{reportData.title}</Text>
          <Text style={styles.reportPeriod}>{reportData.periodText}</Text>
        </Card>

        {/* Métriques principales */}
        <View style={styles.metricsContainer}>
          {reportType !== 'orders' && (
            <Card containerStyle={styles.metricCard}>
              <Text style={styles.metricValue}>{formatPrice(reportData.totalRevenue)}</Text>
              <Text style={styles.metricLabel}>Revenus totaux</Text>
            </Card>
          )}

          <Card containerStyle={styles.metricCard}>
            <Text style={styles.metricValue}>{reportData.totalOrders}</Text>
            <Text style={styles.metricLabel}>Commandes totales</Text>
          </Card>

          {(reportType === 'revenue' || reportType === 'daily' || reportType === 'weekly' || reportType === 'monthly') && reportData.averageOrderValue > 0 && (
            <Card containerStyle={styles.metricCard}>
              <Text style={styles.metricValue}>{formatPrice(reportData.averageOrderValue)}</Text>
              <Text style={styles.metricLabel}>Panier moyen</Text>
            </Card>
          )}

          {reportType === 'orders' && reportData.averagePreparationTime > 0 && (
            <Card containerStyle={styles.metricCard}>
              <Text style={styles.metricValue}>{reportData.averagePreparationTime}min</Text>
              <Text style={styles.metricLabel}>Temps moyen</Text>
            </Card>
          )}
        </View>

        {/* Graphiques spécifiques au type de rapport */}
        {(reportType === 'daily' || reportType === 'weekly' || reportType === 'monthly' || reportType === 'orders') && renderStatusChart()}
        {(reportType === 'daily' || reportType === 'weekly' || reportType === 'monthly') && renderTopItems()}
        {reportType === 'revenue' && renderRevenueChart()}
        {reportType === 'orders' && renderPeakHours()}
        {reportType === 'revenue' && reportData.topRevenueItems?.length > 0 && (
          <Card containerStyle={styles.chartCard}>
            <Text style={styles.chartTitle}>Plats les plus rentables</Text>
            {reportData.topRevenueItems.map((item, index) => (
              <View key={item.name} style={styles.revenueRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemRank}>#{index + 1}</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                <Text style={styles.revenueAmount}>{formatPrice(item.revenue)}</Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grey[50],
  },
  scrollView: {
    flex: 1,
    padding: constants.SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  headerCard: {
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.md,
    marginBottom: constants.SPACING.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: constants.SPACING.xs,
  },
  reportPeriod: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  metricsContainer: {
    flexDirection: 'row',
    marginBottom: constants.SPACING.md,
    gap: constants.SPACING.sm,
  },
  metricCard: {
    flex: 1,
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.md,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: constants.SPACING.xs,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  chartCard: {
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.md,
    marginBottom: constants.SPACING.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: constants.SPACING.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: constants.SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey[100],
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: constants.SPACING.sm,
  },
  statusLabel: {
    fontSize: 14,
    color: colors.text.primary,
  },
  statusCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: constants.SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey[100],
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemRank: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    width: 30,
  },
  itemName: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  itemCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: constants.SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey[100],
  },
  revenueDate: {
    fontSize: 14,
    color: colors.text.primary,
  },
  revenueAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: constants.SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey[100],
  },
  hourTime: {
    fontSize: 14,
    color: colors.text.primary,
  },
  hourCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default ReportDetailsScreen;

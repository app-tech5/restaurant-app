import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import { useRestaurant } from '../contexts/RestaurantContext';
import { StatCard, ActionCard, StatusCard, Loading, EmptyState, ScreenHeader } from '../components';
import { colors, constants } from '../global';
import { calculateRestaurantStats } from '../utils/restaurantUtils';
import i18n from '../i18n';
import { SafeAreaView } from 'react-native-safe-area-context';

const DashboardScreen = ({ navigation }) => {
  const { stats, loadRestaurantStats, orders, loadRestaurantOrders, isAuthenticated, formatCurrency } = useRestaurant();

  console.log("orders dans DashboardScreen", orders)
  const [refreshing, setRefreshing] = useState(false);
  const [calculatedStats, setCalculatedStats] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    
    console.log("stats dans Dashboard", stats)
    
    if (Array.isArray(orders) && stats) {
      console.log("orders dans Dashboard", orders)
      const calcStats = calculateRestaurantStats(orders, []);
      console.log('Calculated Stats:', calcStats);
      setCalculatedStats(calcStats);
    }
  }, [orders, stats]);

  const loadStats = async () => {
    try {
      await Promise.all([
        loadRestaurantStats(),
        loadRestaurantOrders()
      ]);
    } catch (error) {
      console.error('Erreur chargement stats et commandes:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const statCards = [
    {
      title: i18n.t('dashboard.todayOrders'),
      value: calculatedStats?.todayOrders || 0,
      icon: 'shopping-cart',
      gradient: colors.auth.gradient1,
    },
    {
      title: i18n.t('dashboard.totalRevenue'),
      value: formatCurrency(calculatedStats?.totalRevenue || 0),
      icon: 'attach-money',
      gradient: [colors.success, colors.success],
    },
    {
      title: i18n.t('dashboard.totalOrders'),
      value: calculatedStats?.totalOrders || 0,
      icon: 'receipt',
      gradient: [colors.accent, colors.rating],
    },
    {
      title: i18n.t('dashboard.activeOrders'),
      value: calculatedStats?.pendingOrders || 0,
      icon: 'restaurant',
      gradient: [colors.info, colors.info],
    },
  ];

  if (!calculatedStats) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={i18n.t('navigation.dashboard')} />
        <Loading fullScreen text={i18n.t('common.loading')} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={i18n.t('navigation.dashboard')} showDrawerMenu/>

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
        {}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {i18n.t('dashboard.title')}
          </Text>

          <View style={styles.statsGrid}>
            {statCards.map((card, index) => (
              <StatCard
                key={index}
                title={card.title}
                value={card.value}
                icon={card.icon}
                gradient={card.gradient}
                size="large"
                style={styles.statCard}
              />
            ))}
          </View>
        </View>

        {}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {i18n.t('dashboard.quickActions')}
          </Text>

          <View style={styles.quickActions}>
            <ActionCard
              title={i18n.t('dashboard.viewOrders')}
              subtitle={i18n.t('dashboard.active')}
              icon="restaurant"
              color={colors.primary}
              size="medium"
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Orders')}
            />

            <ActionCard
              title={i18n.t('dashboard.manageMenu')}
              subtitle={i18n.t('dashboard.edit')}
              icon="list"
              color={colors.success}
              size="medium"
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Menu')}
            />

            <ActionCard
              title={i18n.t('dashboard.viewAnalytics')}
              subtitle={i18n.t('dashboard.details')}
              icon="bar-chart"
              color={colors.warning}
              size="medium"
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Analytics')}
            />
          </View>
        </View>

        {}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {i18n.t('dashboard.recentOrders')}
          </Text>

          {orders && orders.length > 0 ? (
            <View style={styles.recentOrders}>
              <Text style={styles.recentOrdersText}>
                {orders.slice(0, 3).length} {i18n.t('dashboard.recentOrdersCount')}
              </Text>
              <Text style={styles.viewAllText}
                    onPress={() => navigation.navigate('Orders')}>
                {i18n.t('common.viewAll')} →
              </Text>
            </View>
          ) : (
            <EmptyState
              icon="receipt"
              title={i18n.t('orders.noOrders')}
              subtitle={i18n.t('orders.noOrdersSubtitle')}
            />
          )}
        </View>

        {}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {i18n.t('dashboard.restaurantStatus')}
          </Text>

          <View style={styles.restaurantStatus}>
            <StatusCard
              title={i18n.t('dashboard.activeItems')}
              value={calculatedStats?.activeMenuItems || 0}
              icon="check-circle"
              color={colors.success}
              size="medium"
              style={styles.statusCard}
            />

            <StatusCard
              title={i18n.t('dashboard.pendingOrders')}
              value={calculatedStats?.pendingOrders || 0}
              icon="schedule"
              color={colors.warning}
              size="medium"
              style={styles.statusCard}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grey[50],
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: constants.SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: constants.SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: constants.SPACING.md,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',

  },
  quickActionCard: {
    width: '49%',
  },
  recentOrders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: constants.SPACING.md,
    borderRadius: constants.BORDER_RADIUS,
  },
  recentOrdersText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  restaurantStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusCard: {
    width: '48%',
  },
});

export default DashboardScreen;

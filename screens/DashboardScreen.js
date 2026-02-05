import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRestaurant } from '../contexts/RestaurantContext';
import { StatCard, Loading, EmptyState, ScreenHeader } from '../components';
import { colors, constants } from '../global';
import { calculateRestaurantStats } from '../utils/restaurantUtils';
import i18n from '../i18n';

const DashboardScreen = ({ navigation }) => {
  const { stats, loadRestaurantStats, orders, isAuthenticated } = useRestaurant();
  const [refreshing, setRefreshing] = useState(false);
  const [calculatedStats, setCalculatedStats] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Calculer les statistiques quand orders ou stats changent
    if (orders && stats) {
      const calcStats = calculateRestaurantStats(orders, []);
      setCalculatedStats(calcStats);
    }
  }, [orders, stats]);

  const loadStats = async () => {
    try {
      await loadRestaurantStats();
    } catch (error) {
      console.error('Erreur chargement stats:', error);
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
      gradient: ['#FF6B35', '#F7931E'],
    },
    {
      title: i18n.t('dashboard.totalRevenue'),
      value: `${calculatedStats?.totalRevenue?.toFixed(2) || '0.00'}€`,
      icon: 'euro',
      gradient: ['#4CAF50', '#66BB6A'],
    },
    {
      title: i18n.t('dashboard.averageRating'),
      value: calculatedStats?.averageRating || '0.0',
      icon: 'star',
      gradient: ['#FFD700', '#FFA000'],
    },
    {
      title: i18n.t('dashboard.activeOrders'),
      value: calculatedStats?.pendingOrders || 0,
      icon: 'restaurant',
      gradient: ['#2196F3', '#42A5F5'],
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
    <View style={styles.container}>
      <ScreenHeader title={i18n.t('navigation.dashboard')} />

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
        {/* Section Statistiques */}
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

        {/* Section Actions Rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Actions rapides
          </Text>

          <View style={styles.quickActions}>
            <StatCard
              title="Voir les commandes"
              value="actives"
              icon="restaurant"
              color={colors.primary}
              size="medium"
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Orders')}
            />

            <StatCard
              title="Gérer le menu"
              value="modifier"
              icon="list"
              color="#4CAF50"
              size="medium"
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Menu')}
            />

            <StatCard
              title="Voir les analyses"
              value="détails"
              icon="bar-chart"
              color="#FF9800"
              size="medium"
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Analytics')}
            />
          </View>
        </View>

        {/* Section Commandes Récentes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Commandes récentes
          </Text>

          {orders && orders.length > 0 ? (
            <View style={styles.recentOrders}>
              <Text style={styles.recentOrdersText}>
                {orders.slice(0, 3).length} commandes récentes
              </Text>
              <Text style={styles.viewAllText}
                    onPress={() => navigation.navigate('Orders')}>
                Voir tout →
              </Text>
            </View>
          ) : (
            <EmptyState
              icon="receipt"
              title="Aucune commande"
              subtitle="Les nouvelles commandes apparaîtront ici"
            />
          )}
        </View>

        {/* Section État du Restaurant */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            État du restaurant
          </Text>

          <View style={styles.restaurantStatus}>
            <StatCard
              title="Articles actifs"
              value={calculatedStats?.activeMenuItems || 0}
              icon="check-circle"
              color="#4CAF50"
              size="medium"
              style={styles.statusCard}
            />

            <StatCard
              title="Commandes en attente"
              value={calculatedStats?.pendingOrders || 0}
              icon="schedule"
              color="#FF9800"
              size="medium"
              style={styles.statusCard}
            />
          </View>
        </View>
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
  },
  quickActionCard: {
    width: '31%',
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

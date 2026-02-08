import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useRestaurant } from '../contexts/RestaurantContext';
import { AnalyticsCard, Loading, ScreenHeader } from '../components';
import { colors, constants } from '../global';
import { calculateRestaurantStats } from '../utils/restaurantUtils';
import i18n from '../i18n';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const AnalyticsScreen = ({ navigation }) => {
  const { stats, orders, isAuthenticated } = useRestaurant();
  const [calculatedStats, setCalculatedStats] = useState(null);
  const [period, setPeriod] = useState('today'); // 'today', 'week', 'month'

  useEffect(() => {
    if (isAuthenticated && orders && stats) {
      const calcStats = calculateRestaurantStats(orders, []);
      setCalculatedStats(calcStats);
    }
  }, [isAuthenticated, orders, stats]);

  const periodOptions = [
    { key: 'today', label: 'Aujourd\'hui' },
    { key: 'week', label: 'Cette semaine' },
    { key: 'month', label: 'Ce mois' }
  ];

  const analyticsCards = [
    {
      title: i18n.t('analytics.revenue'),
      value: `${calculatedStats?.totalRevenue?.toFixed(2) || '0.00'}€`,
      change: 12.5,
      changeType: 'positive',
      icon: 'euro',
    },
    {
      title: i18n.t('analytics.orders'),
      value: calculatedStats?.totalOrders || 0,
      change: 8.2,
      changeType: 'positive',
      icon: 'shopping-cart',
    },
    {
      title: i18n.t('analytics.customers'),
      value: '24',
      change: -2.1,
      changeType: 'negative',
      icon: 'people',
    },
    {
      title: i18n.t('analytics.averageOrderValue'),
      value: `${((calculatedStats?.totalRevenue || 0) / (calculatedStats?.totalOrders || 1)).toFixed(2)}€`,
      change: 5.7,
      changeType: 'positive',
      icon: 'trending-up',
    },
  ];

  const performanceMetrics = [
    {
      title: 'Temps de préparation moyen',
      value: '18 min',
      subtitle: '-2 min vs hier',
      color: colors.success,
    },
    {
      title: 'Taux de satisfaction',
      value: `${calculatedStats?.averageRating || 0}/5`,
      subtitle: '+0.2 vs semaine dernière',
      color: colors.accent,
    },
    {
      title: 'Commandes annulées',
      value: '2',
      subtitle: '3% du total',
      color: colors.error,
    },
  ];

  if (!calculatedStats) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title={i18n.t('navigation.analytics')}
          showBackButton
          onLeftPress={() => navigation.goBack()}
        />
        <Loading fullScreen text={i18n.t('common.loading')} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={i18n.t('navigation.analytics')}
        showBackButton
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Sélecteur de période */}
        <View style={styles.periodSelector}>
          {periodOptions.map(option => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.periodButton,
                period === option.key && styles.activePeriodButton
              ]}
              onPress={() => setPeriod(option.key)}
            >
              <Text style={[
                styles.periodButtonText,
                period === option.key && styles.activePeriodButtonText
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Métriques principales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Métriques principales</Text>
          <View style={styles.metricsGrid}>
            {analyticsCards.map((card, index) => (
              <AnalyticsCard
                key={index}
                title={card.title}
                value={card.value}
                change={card.change}
                changeType={card.changeType}
                icon={card.icon}
                style={styles.metricCard}
              />
            ))}
          </View>
        </View>

        {/* Graphiques */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Évolution</Text>

          <View style={styles.chartContainer}>
            <Text style={styles.chartPlaceholder}>
              Graphique des ventes par jour
            </Text>
            <Text style={styles.chartPlaceholder}>
              (Victory Native sera intégré ici)
            </Text>
          </View>
        </View>

        {/* Métriques de performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>

          {performanceMetrics.map((metric, index) => (
            <View key={index} style={styles.performanceCard}>
              <View style={styles.performanceHeader}>
                <Text style={styles.performanceTitle}>{metric.title}</Text>
                <Text style={[styles.performanceValue, { color: metric.color }]}>
                  {metric.value}
                </Text>
              </View>
              <Text style={styles.performanceSubtitle}>{metric.subtitle}</Text>
            </View>
          ))}
        </View>

        {/* Statistiques détaillées */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques détaillées</Text>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Commandes livrées</Text>
              <Text style={styles.detailValue}>{calculatedStats.completedOrders}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Articles actifs</Text>
              <Text style={styles.detailValue}>{calculatedStats.activeMenuItems}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Revenus moyens/jour</Text>
              <Text style={styles.detailValue}>
                {(calculatedStats.totalRevenue / 30).toFixed(2)}€
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Temps réponse moyen</Text>
              <Text style={styles.detailValue}>3 min</Text>
            </View>
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    margin: constants.SPACING.md,
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.xs,
  },
  periodButton: {
    flex: 1,
    paddingVertical: constants.SPACING.sm,
    alignItems: 'center',
    borderRadius: constants.BORDER_RADIUS,
  },
  activePeriodButton: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  activePeriodButtonText: {
    color: colors.white,
  },
  section: {
    margin: constants.SPACING.md,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: constants.SPACING.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // justifyContent: 'space-between',
  },
  metricCard: {
    width: '45%',
    marginBottom: constants.SPACING.md,
  },
  chartContainer: {
    backgroundColor: colors.white,
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  chartPlaceholder: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  performanceCard: {
    backgroundColor: colors.white,
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.md,
    marginBottom: constants.SPACING.sm,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: constants.SPACING.xs,
  },
  performanceTitle: {
    fontSize: 16,
    color: colors.text.primary,
    flex: 1,
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  performanceSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    width: '50%',
    backgroundColor: colors.white,
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.md,
    marginBottom: constants.SPACING.sm,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: constants.SPACING.xs,
    textAlign: 'center',
  },
  detailValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
});

export default AnalyticsScreen;

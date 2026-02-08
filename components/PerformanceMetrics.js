import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, constants } from '../global';
import i18n from '../i18n';

/**
 * Composant pour afficher les métriques de performance
 * @param {Object} metrics - Objet contenant les métriques de performance
 * @param {boolean} isLoading - État de chargement
 */
const PerformanceMetrics = ({ metrics, isLoading }) => {
  if (!metrics || isLoading) {
    return null;
  }

  const performanceItems = [
    {
      title: i18n.t('analytics.preparationTime'),
      value: metrics.preparationTime.formatted,
      subtitle: `-2 min ${i18n.t('analytics.trends.vsYesterday')}`,
      color: colors.success,
    },
    {
      title: i18n.t('analytics.rating'),
      value: metrics.rating.formatted,
      subtitle: `+${metrics.rating.trend.toFixed(1)} ${i18n.t('analytics.trends.vsLastWeek')}`,
      color: colors.accent,
    },
    {
      title: i18n.t('analytics.cancelledOrders'),
      value: `${Math.round((metrics.orders.value - metrics.completedOrders) / metrics.orders.value * 100)}%`,
      subtitle: `${i18n.t('analytics.trends.perTotal')}`,
      color: colors.error,
    },
  ];

  return (
    <View style={styles.container}>
      {performanceItems.map((item, index) => (
        <View key={index} style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricTitle}>{item.title}</Text>
            <Text style={[styles.metricValue, { color: item.color }]}>
              {item.value}
            </Text>
          </View>
          <Text style={styles.metricSubtitle}>{item.subtitle}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Pas de style spécifique pour le conteneur
  },
  metricCard: {
    backgroundColor: colors.white,
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.md,
    marginBottom: constants.SPACING.sm,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: constants.SPACING.xs,
  },
  metricTitle: {
    fontSize: 16,
    color: colors.text.primary,
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
  },
});

export default PerformanceMetrics;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, constants } from '../global';
import i18n from '../i18n';

function safePercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0%';
  return `${Math.round(n)}%`;
}

function safeFixed(value, digits = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return (0).toFixed(digits);
  return n.toFixed(digits);
}

const PerformanceMetrics = ({ metrics, isLoading }) => {
  if (!metrics || isLoading) {
    return null;
  }

  const cancellationPct =
    metrics.cancellationRate?.value ??
    (metrics.orders?.value > 0
      ? ((metrics.orders.value - (metrics.completedOrders || 0)) / metrics.orders.value) * 100
      : 0);

  const ratingTrend = Number(metrics.rating?.trend);
  const ratingTrendLabel = Number.isFinite(ratingTrend)
    ? `${ratingTrend >= 0 ? '+' : ''}${safeFixed(ratingTrend, 1)}`
    : '+0.0';

  const performanceItems = [
    {
      title: i18n.t('analytics.preparationTime'),
      value: metrics.preparationTime?.formatted ?? '0 min',
      subtitle: `-2 min ${i18n.t('analytics.trends.vsYesterday')}`,
      color: colors.success,
    },
    {
      title: i18n.t('analytics.rating'),
      value: metrics.rating?.formatted ?? '0.0/5',
      subtitle: `${ratingTrendLabel} ${i18n.t('analytics.trends.vsLastWeek')}`,
      color: colors.accent,
    },
    {
      title: i18n.t('analytics.cancelledOrders'),
      value: metrics.cancellationRate?.formatted ?? safePercent(cancellationPct),
      subtitle: `${i18n.t('analytics.trends.perTotal')}`,
      color: colors.error,
    },
  ];

  return (
    <View style={styles.container}>
      {performanceItems.map((item) => (
        <View key={item.title} style={styles.metricCard}>
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
  container: {},
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

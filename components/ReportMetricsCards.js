import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-elements';
import { colors, constants } from '../global';
import { formatPrice } from '../utils/restaurantUtils';

const ReportMetricsCards = ({ baseMetrics, reportType }) => {
  const { totalOrders, totalRevenue, averageOrderValue, averagePreparationTime } = baseMetrics;

  const renderMetricCard = (value, label, show = true) => {
    if (!show) return null;

    return (
      <Card containerStyle={styles.metricCard} key={label}>
        <Text style={styles.metricValue}>
          {typeof value === 'number' && label.toLowerCase().includes('revenu') ? formatPrice(value) :
           typeof value === 'number' && label.toLowerCase().includes('panier') ? formatPrice(value) :
           typeof value === 'number' && label.toLowerCase().includes('temps') ? `${value}min` :
           value}
        </Text>
        <Text style={styles.metricLabel}>{label}</Text>
      </Card>
    );
  };

  const metrics = [];

  // Métriques selon le type de rapport
  if (reportType !== 'orders') {
    metrics.push(renderMetricCard(totalRevenue, 'Revenus totaux'));
  }

  metrics.push(renderMetricCard(totalOrders, 'Commandes totales'));

  if (reportType === 'revenue' || reportType === 'daily' || reportType === 'weekly' || reportType === 'monthly') {
    metrics.push(renderMetricCard(averageOrderValue, 'Panier moyen', averageOrderValue > 0));
  }

  if (reportType === 'orders' && averagePreparationTime > 0) {
    metrics.push(renderMetricCard(averagePreparationTime, 'Temps moyen'));
  }

  return (
    <View style={styles.metricsContainer}>
      {metrics}
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default ReportMetricsCards;

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Card, Text } from 'react-native-elements';
import { colors, constants } from '../global';
import { useSettings } from '../hooks';
import i18n from '../i18n';

const ReportMetricsCards = ({ baseMetrics, reportType }) => {
  const { totalOrders, totalRevenue, averageOrderValue, averagePreparationTime } = baseMetrics;
  const { formatCurrency, settings, isLoading: settingsLoading } = useSettings();

  // Fonction de formatage de fallback si les settings ne sont pas chargés
  const formatCurrencyFallback = (amount) => {
    if (typeof amount !== 'number') return '0.00€';
    return `${amount.toFixed(2)}€`;
  };

  const renderMetricCard = (value, labelKey, show = true) => {
    if (!show) return null;

    const label = i18n.t(`reports.metrics.${labelKey}`);
    const formatter = formatCurrency || formatCurrencyFallback;

    return (
      <Card containerStyle={styles.metricCard} key={labelKey}>
        <Text style={styles.metricValue}>
          {typeof value === 'number' && (labelKey === 'totalRevenue' || labelKey === 'averageOrderValue') ? formatter(value) :
           typeof value === 'number' && labelKey === 'averageTime' ? `${value}min` :
           value}
        </Text>
        <Text style={styles.metricLabel}>{label}</Text>
      </Card>
    );
  };

  const metrics = [];

  // Métriques selon le type de rapport
  if (reportType !== 'orders') {
    metrics.push(renderMetricCard(totalRevenue, 'totalRevenue'));
  }

  metrics.push(renderMetricCard(totalOrders, 'totalOrders'));

  if (reportType === 'revenue' || reportType === 'daily' || reportType === 'weekly' || reportType === 'monthly') {
    metrics.push(renderMetricCard(averageOrderValue, 'averageOrderValue', averageOrderValue > 0));
  }

  if (reportType === 'orders' && averagePreparationTime > 0) {
    metrics.push(renderMetricCard(averagePreparationTime, 'averageTime'));
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

import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { Card } from 'react-native-elements';
import { colors, constants } from '../global';
import { formatPrice } from '../utils/restaurantUtils';
import i18n from '../i18n';

const ReportCharts = ({ calculations, reportType }) => {
  const renderStatusChart = () => {
    const { ordersByStatus } = calculations;
    const statusConfig = {
      delivered: { label: i18n.t('reports.charts.status.delivered'), color: colors.success },
      ready: { label: i18n.t('reports.charts.status.ready'), color: colors.info },
      preparing: { label: i18n.t('reports.charts.status.preparing'), color: colors.warning },
      accepted: { label: i18n.t('reports.charts.status.accepted'), color: colors.primary },
      pending: { label: i18n.t('reports.charts.status.pending'), color: colors.grey[500] },
      cancelled: { label: i18n.t('reports.charts.status.cancelled'), color: colors.error }
    };

    return (
      <Card containerStyle={styles.chartCard}>
        <Text style={styles.chartTitle}>{i18n.t('reports.charts.statusDistribution')}</Text>
        {Object.entries(ordersByStatus).map(([status, count]) => {
          if (count === 0) return null;
          const config = statusConfig[status];
          return (
            <View key={`status-${status}`} style={styles.statusRow}>
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

  const renderTopItemsChart = () => {
    const { topItems } = calculations;

    if (!topItems?.length) return null;

    return (
      <Card containerStyle={styles.chartCard}>
        <Text style={styles.chartTitle}>{i18n.t('reports.charts.mostOrderedDishes')}</Text>
        {topItems.map((item, index) => (
          <View key={item.name} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemRank}>#{index + 1}</Text>
              <Text style={styles.itemName}>{item.name}</Text>
            </View>
            <Text style={styles.itemCount}>{item.count} {i18n.t('reports.charts.units.ordersAbbrev')}</Text>
          </View>
        ))}
      </Card>
    );
  };

  const renderRevenueChart = () => {
    const { revenueByDay } = calculations;

    if (!revenueByDay?.length) return null;

    return (
      <Card containerStyle={styles.chartCard}>
        <Text style={styles.chartTitle}>{i18n.t('reports.charts.revenueByDay')}</Text>
        {revenueByDay.slice(0, 7).map((day, index) => (
          <View key={index} style={styles.revenueRow}>
            <Text style={styles.revenueDate}>
              {day.date.toLocaleDateString(i18n.locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', day: 'numeric' })}
            </Text>
            <Text style={styles.revenueAmount}>{formatPrice(day.revenue)}</Text>
          </View>
        ))}
      </Card>
    );
  };

  const renderTopRevenueItemsChart = () => {
    const { topRevenueItems } = calculations;

    if (!topRevenueItems?.length) return null;

    return (
      <Card containerStyle={styles.chartCard}>
        <Text style={styles.chartTitle}>{i18n.t('reports.charts.mostProfitableDishes')}</Text>
        {topRevenueItems.map((item, index) => (
          <View key={item.name} style={styles.revenueRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemRank}>#{index + 1}</Text>
              <Text style={styles.itemName}>{item.name}</Text>
            </View>
            <Text style={styles.revenueAmount}>{formatPrice(item.revenue)}</Text>
          </View>
        ))}
      </Card>
    );
  };

  const renderPeakHoursChart = () => {
    const { peakHours } = calculations;

    if (!peakHours?.length) return null;

    return (
      <Card containerStyle={styles.chartCard}>
        <Text style={styles.chartTitle}>{i18n.t('reports.charts.peakHours')}</Text>
        {peakHours.map((hour, index) => (
          <View key={index} style={styles.hourRow}>
            <Text style={styles.hourTime}>{hour.hour}h - {hour.hour + 1}h</Text>
            <Text style={styles.hourCount}>{hour.count} {i18n.t('reports.charts.units.orders')}</Text>
          </View>
        ))}
      </Card>
    );
  };

  const charts = [];
  
  if (calculations.showStatusChart) {
    charts.push(renderStatusChart());
  }

  if (calculations.showTopItems) {
    charts.push(renderTopItemsChart());
  }

  if (calculations.showRevenueChart) {
    charts.push(renderRevenueChart());
  }

  if (calculations.showTopRevenueItems) {
    charts.push(renderTopRevenueItemsChart());
  }

  if (calculations.showPeakHours) {
    charts.push(renderPeakHoursChart());
  }

  return <>{charts.map((chart, index) => (
    <React.Fragment key={`chart-${index}`}>
      {chart}
    </React.Fragment>
  ))}</>;
};

const styles = StyleSheet.create({
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

export default ReportCharts;

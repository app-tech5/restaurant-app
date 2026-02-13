import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../global';
import i18n from '../i18n';

const OrderStatsHeader = ({ orderStats }) => {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{orderStats.total}</Text>
          <Text style={styles.statLabel}>{i18n.t('orders.total', 'Total')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{orderStats.delivered}</Text>
          <Text style={styles.statLabel}>{i18n.t('orders.completed', 'Completed')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{orderStats.pending + orderStats.preparing + orderStats.out_for_delivery}</Text>
          <Text style={styles.statLabel}>{i18n.t('orders.active', 'Active')}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default OrderStatsHeader;

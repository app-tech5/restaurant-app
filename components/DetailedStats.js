import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, constants } from '../global';
import i18n from '../i18n';

/**
 * Composant pour afficher les statistiques détaillées
 * @param {Object} metrics - Objet contenant toutes les métriques
 * @param {boolean} isLoading - État de chargement
 */
const DetailedStats = ({ metrics, isLoading }) => {
  if (!metrics || isLoading) {
    return null;
  }

  const stats = [
    {
      label: i18n.t('analytics.completedOrders'),
      value: metrics.completedOrders,
    },
    {
      label: i18n.t('analytics.activeItems'),
      value: '24', // Valeur fixe pour l'instant
    },
    {
      label: i18n.t('analytics.averageRevenuePerDay'),
      value: `${(metrics.revenue.value / 30).toFixed(2)}€`,
    },
    {
      label: i18n.t('analytics.responseTime'),
      value: '3 min',
    },
  ];

  return (
    <View style={styles.grid}>
      {stats.map((stat, index) => (
        <View key={index} style={styles.statItem}>
          <Text style={styles.statLabel}>{stat.label}</Text>
          <Text style={styles.statValue}>{stat.value}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    backgroundColor: colors.white,
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.md,
    marginBottom: constants.SPACING.sm,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: constants.SPACING.xs,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
});

export default DetailedStats;

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AnalyticsCard } from './index';
import { constants } from '../global';
import i18n from '../i18n';

/**
 * Composant pour afficher la grille des métriques d'analytics principales
 * @param {Object} metrics - Objet contenant les métriques calculées
 * @param {boolean} isLoading - État de chargement
 */
const AnalyticsGrid = ({ metrics, isLoading }) => {
  if (!metrics || isLoading) {
    return null;
  }

  const analyticsCards = [
    {
      title: i18n.t('analytics.revenue'),
      value: metrics.revenue.formatted,
      change: metrics.revenue.trend,
      changeType: metrics.revenue.trend >= 0 ? 'positive' : 'negative',
      icon: 'euro',
    },
    {
      title: i18n.t('analytics.orders'),
      value: metrics.orders.formatted,
      change: metrics.orders.trend,
      changeType: metrics.orders.trend >= 0 ? 'positive' : 'negative',
      icon: 'shopping-cart',
    },
    {
      title: i18n.t('analytics.customers'),
      value: metrics.customers.formatted,
      change: metrics.customers.trend,
      changeType: metrics.customers.trend >= 0 ? 'positive' : 'negative',
      icon: 'people',
    },
    {
      title: i18n.t('analytics.averageOrderValue'),
      value: metrics.averageOrderValue.formatted,
      change: 5.7, // Valeur fixe pour l'instant
      changeType: 'positive',
      icon: 'trending-up',
    },
  ];

  return (
    <View style={styles.grid}>
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
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '45.7%',
    marginBottom: constants.SPACING.md,
  },
});

export default AnalyticsGrid;

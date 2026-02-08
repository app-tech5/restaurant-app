import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, constants } from '../global';
import i18n from '../i18n';

/**
 * Composant pour sélectionner la période d'analyse
 * @param {string} selectedPeriod - Période actuellement sélectionnée
 * @param {Function} onPeriodChange - Callback appelé quand la période change
 */
const PeriodSelector = ({ selectedPeriod, onPeriodChange }) => {
  const periods = [
    { key: 'today', label: i18n.t('analytics.periods.today') },
    { key: 'week', label: i18n.t('analytics.periods.week') },
    { key: 'month', label: i18n.t('analytics.periods.month') }
  ];

  return (
    <View style={styles.container}>
      {periods.map(period => (
        <TouchableOpacity
          key={period.key}
          style={[
            styles.periodButton,
            selectedPeriod === period.key && styles.activePeriodButton
          ]}
          onPress={() => onPeriodChange(period.key)}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === period.key && styles.activePeriodButtonText
          ]}>
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
});

export default PeriodSelector;

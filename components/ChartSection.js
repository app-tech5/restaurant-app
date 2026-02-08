import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, constants } from '../global';
import i18n from '../i18n';

/**
 * Composant pour afficher la section des graphiques d'évolution
 * @param {boolean} isLoading - État de chargement
 */
const ChartSection = ({ isLoading }) => {
  if (isLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>
        {i18n.t('analytics.salesByDay')}
      </Text>
      <Text style={styles.placeholder}>
        (Victory Native sera intégré ici)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  placeholder: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default ChartSection;

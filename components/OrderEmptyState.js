import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../global';
import i18n from '../i18n';

const OrderEmptyState = ({ onStartOrdering }) => {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="receipt-outline" size={80} color={colors.grey[300]} />
      </View>
      <Text style={styles.emptyTitle}>
        {i18n.t('orders.noOrdersTitle', 'No orders yet')}
      </Text>
      <Text style={styles.emptySubtitle}>
        {i18n.t('orders.noOrdersSubtitle', 'Your delicious food journey starts here')}
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={onStartOrdering}
      >
        <Ionicons name="restaurant" size={20} color={colors.text.white} />
        <Text style={styles.shopButtonText}>
          {i18n.t('orders.startOrdering', 'Start Ordering')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 24,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  shopButtonText: {
    color: colors.text.white,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default OrderEmptyState;

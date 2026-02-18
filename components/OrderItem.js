import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../global';
import { useSettings } from '../contexts/SettingContext';
import {
  getStatusColor,
  getStatusIcon,
  getStatusText,
  formatDate,
  formatTimeAgo,
  formatEstimatedTime
} from '../utils/orderUtils';
import i18n from '../i18n';

const OrderItem = ({ order, onPress, onCancel }) => {
  const { currency } = useSettings();

  return (
    <View style={styles.orderItemContainer}>
      {}
      <View style={styles.timelineContainer}>
        <View style={styles.timelineLine} />
        <View style={[styles.timelineDot, { backgroundColor: getStatusColor(order.status) }]}>
          <Ionicons name={getStatusIcon(order.status)} size={12} color={colors.text.white} />
        </View>
      </View>

      <TouchableOpacity
        style={styles.orderItem}
        onPress={() => onPress(order)}
        activeOpacity={0.7}
      >
        {}
        <View style={styles.orderHeader}>
          <View style={styles.orderLeft}>
            <Text style={styles.orderId}>
              {i18n.t('orders.title', 'Order')} #{order.id || order._id}
            </Text>
            <Text style={styles.orderTime}>
              {formatTimeAgo(order.createdAt || order.date)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Ionicons name={getStatusIcon(order.status)} size={14} color={colors.text.white} />
            <Text style={styles.statusText}>
              {getStatusText(order.status)}
            </Text>
          </View>
        </View>

        {}
        <View style={styles.restaurantSection}>
          <View style={styles.restaurantIcon}>
            <Ionicons name="restaurant" size={20} color={colors.primary} />
          </View>
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>
              {order.restaurant?.name || order.restaurantName || 'Restaurant inconnu'}
            </Text>
            <Text style={styles.orderDate}>
              {formatDate(order.createdAt || order.date)}
            </Text>
          </View>
        </View>

        {}
        <View style={styles.orderDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="bag-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>
              {order.items?.length || 0} {order.items?.length === 1 ?
                i18n.t('orders.item', 'item') :
                i18n.t('orders.items', 'items')
              }
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.orderTotal}>
              {order.totalPrice && !isNaN(order.totalPrice) ?
                `${order.totalPrice.toFixed(2)}${currency.symbol}` : i18n.t('orders.na', 'N/A')
              }
            </Text>
          </View>
        </View>

        {}
        <View style={styles.additionalInfo}>
          {}
          {order.payment?.method && (
            <View style={styles.infoItem}>
              <Ionicons name="card-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.infoText}>
                {i18n.t(`payment.${order.payment.method}`, order.payment.method)}
              </Text>
            </View>
          )}

          {}
          {order.delivery?.type && (
            <View style={styles.infoItem}>
              <Ionicons
                name={order.delivery.type === 'delivery' ? "bicycle-outline" : "storefront-outline"}
                size={14}
                color={colors.text.secondary}
              />
              <Text style={styles.infoText}>
                {i18n.t(`delivery.${order.delivery.type}`, order.delivery.type)}
              </Text>
            </View>
          )}

          {}
          {order.status?.toLowerCase() === 'out_for_delivery' && order.delivery?.estimatedTime && (
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={14} color={colors.primary} />
              <Text style={styles.estimatedTimeText}>
                {i18n.t('orders.estimatedArrival', 'ETA')}: {formatEstimatedTime(order.delivery.estimatedTime)}
              </Text>
            </View>
          )}

          {}
          {order.status?.toLowerCase() === 'out_for_delivery' && order.driver?.userId && (
            <View style={styles.infoItem}>
              <Ionicons name="person-outline" size={14} color={colors.primary} />
              <Text style={styles.driverText}>
                {order.driver.userId?.name || i18n.t('orders.driverName', 'Driver')}
              </Text>
            </View>
          )}
        </View>

        {}
        <View style={styles.orderActions}>
          {order.status?.toLowerCase() === 'pending' && onCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => onCancel(order)}
            >
              <Ionicons name="close-circle" size={16} color={colors.error} />
              <Text style={styles.cancelButtonText}>
                {i18n.t('orders.cancel', 'Cancel')}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => {}}
          >
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={styles.trackButtonText}>
              {i18n.t('orders.track', 'Track Order')}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  orderItemContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineContainer: {
    width: 40,
    alignItems: 'center',
    paddingTop: 20,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border.light,
    marginTop: 20,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 16,
    borderWidth: 3,
    borderColor: colors.background.primary,
  },
  orderItem: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 20,
    marginLeft: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.white,
    textTransform: 'uppercase',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  restaurantSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  restaurantIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.grey[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
    marginLeft: 6,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  additionalInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  estimatedTimeText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
  driverText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
  orderActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    width: '48%',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 6,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 12,
    width: '48%',
    borderWidth: 1,
    borderColor: colors.error,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 6,
  },
});

export default OrderItem;

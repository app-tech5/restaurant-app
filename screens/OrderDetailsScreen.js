import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { Card, Button, Icon } from 'react-native-elements';
import { useRestaurant } from '../contexts/RestaurantContext';
import { useSettings } from '../contexts/SettingContext';
import { ScreenHeader } from '../components';
import { colors, constants } from '../global';
import {
  getOrderStatusLabel,
  getOrderStatusColor,
  getRestaurantOrderCustomerFields,
  getOrderLineAmount,
} from '../utils/restaurantUtils';
import i18n from '../i18n';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../api';
const OrderDetailsScreen = ({ route, navigation }) => {
  const paramsOrder = route.params?.order;
  const paramsOrderId =
    route.params?.orderId ||
    paramsOrder?._id ||
    paramsOrder?.id ||
    null;
  const hasValidOrder = !!(paramsOrder && (paramsOrder._id || paramsOrder.id));
  const [order, setOrder] = useState(hasValidOrder ? paramsOrder : null);
  const [loadingOrder, setLoadingOrder] = useState(!hasValidOrder && !!paramsOrderId);
  useEffect(() => {
    const next = route.params?.order;
    if (next && (next._id || next.id)) {
      setOrder(next);
      setLoadingOrder(false);
      return;
    }
    const orderId =
      route.params?.orderId ||
      (typeof next === 'object' && next ? next._id || next.id : null);
    if (!orderId) {
      setLoadingOrder(false);
      return;
    }
    let cancelled = false;
    setLoadingOrder(true);
    apiClient
      .getOrderById(orderId)
      .then((fetched) => {
        if (!cancelled) setOrder(fetched);
      })
      .catch(() => {
        if (!cancelled) setOrder(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingOrder(false);
      });
    return () => {
      cancelled = true;
    };
  }, [route.params?.order?._id, route.params?.order?.id, route.params?.orderId]);
  const {
    updateOrderStatus,
    acceptOrder,
    prepareOrder,
    readyForPickup,
  } = useRestaurant();
  const { formatCurrency } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  if (loadingOrder) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader
          title={i18n.t('orderDetails.title')}
          autoLeftNav
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{i18n.t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (!order || !(order._id || order.id)) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader
          title={i18n.t('orderDetails.title')}
          autoLeftNav
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{i18n.t('orderDetails.notFound')}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>{i18n.t('orderDetails.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  const {
    _id: orderMongoId,
    id: orderAltId,
    items = [],
    status,
    createdAt,
    estimatedTime,
    notes,
  } = order;
  const _id = orderMongoId || orderAltId;
  const {
    customerName,
    customerPhone,
    customerAddress,
    paymentMethod,
    total,
  } = getRestaurantOrderCustomerFields(order);
  const toMoney = (v) => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const itemsSubtotal = items.reduce(
    (sum, item) => sum + getOrderLineAmount(item),
    0
  );
  const deliveryFee = toMoney(order.delivery?.deliveryFee);
  const taxAmount = toMoney(order.tax?.amount);
  const hasPriceBreakdown =
    deliveryFee > 0.005 ||
    taxAmount > 0.005 ||
    Math.abs(total - itemsSubtotal) > 0.005;
  const statusLabel = getOrderStatusLabel(status);
  const statusColor = getOrderStatusColor(status);
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(i18n.locale),
      time: date.toLocaleTimeString(i18n.locale, {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };
  const formatEstimatedTime = (minutes) => {
    if (!minutes) return 'Non spécifié';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? `${mins}min` : ''}`;
    }
    return `${mins}min`;
  };
  const handleStatusChange = async (newStatus) => {
    Alert.alert(
      i18n.t('alerts.confirmStatusChangeTitle'),
      i18n.t('alerts.confirmStatusChangeMessage', { status: getOrderStatusLabel(newStatus) }),
      [
        { text: i18n.t('alerts.cancel'), style: 'cancel' },
        {
          text: i18n.t('alerts.confirm'),
          onPress: async () => {
            try {
              setIsLoading(true);
              await updateOrderStatus(_id, newStatus);
              setOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
              Alert.alert(
                i18n.t('alerts.success'),
                i18n.t('alerts.statusUpdated')
              );
            } catch (error) {
              console.error('Erreur mise à jour statut:', error);
              Alert.alert(
                i18n.t('alerts.error'),
                i18n.t('alerts.statusUpdateFailed')
              );
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };
  const handleAccept = async () => {
    try {
      setIsLoading(true);
      await acceptOrder(_id);
      setOrder((prev) => (prev ? { ...prev, status: 'accepted' } : prev));
      Alert.alert(i18n.t('alerts.success'), i18n.t('alerts.orderAccepted'));
    } catch (error) {
      console.error('Erreur acceptation:', error);
      Alert.alert(i18n.t('alerts.error'), i18n.t('alerts.acceptFailed'));
    } finally {
      setIsLoading(false);
    }
  };
  const handlePrepare = async () => {
    try {
      setIsLoading(true);
      await prepareOrder(_id);
      setOrder((prev) => (prev ? { ...prev, status: 'preparing' } : prev));
      Alert.alert(i18n.t('alerts.success'), i18n.t('alerts.orderPreparing'));
    } catch (error) {
      console.error('Erreur préparation:', error);
      Alert.alert(i18n.t('alerts.error'), i18n.t('alerts.prepareFailed'));
    } finally {
      setIsLoading(false);
    }
  };
  const handleReady = async () => {
    try {
      setIsLoading(true);
      await readyForPickup(_id);
      setOrder((prev) => (prev ? { ...prev, status: 'ready' } : prev));
      Alert.alert(i18n.t('alerts.success'), i18n.t('alerts.orderReady'));
    } catch (error) {
      console.error('Erreur prêt:', error);
      Alert.alert(i18n.t('alerts.error'), i18n.t('alerts.readyFailed'));
    } finally {
      setIsLoading(false);
    }
  };
  const getActionButtons = () => {
    const buttons = [];
    switch (status) {
      case 'pending':
        buttons.push(
          <Button
            key="accept"
            title={i18n.t('orders.accept')}
            buttonStyle={[styles.actionButton, { backgroundColor: colors.success }]}
            onPress={handleAccept}
            loading={isLoading}
            disabled={isLoading}
          />
        );
        buttons.push(
          <Button
            key="reject"
            title={i18n.t('orders.reject')}
            buttonStyle={[styles.actionButton, { backgroundColor: colors.error }]}
            onPress={() => handleStatusChange('cancelled')}
            disabled={isLoading}
          />
        );
        break;
      case 'accepted':
        buttons.push(
          <Button
            key="prepare"
            title={i18n.t('orders.startPreparation')}
            buttonStyle={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handlePrepare}
            loading={isLoading}
            disabled={isLoading}
          />
        );
        break;
      case 'preparing':
        buttons.push(
          <Button
            key="ready"
            title={i18n.t('orders.markReady')}
            buttonStyle={[styles.actionButton, { backgroundColor: colors.success }]}
            onPress={handleReady}
            loading={isLoading}
            disabled={isLoading}
          />
        );
        break;
      case 'ready':
        buttons.push(
          <Text key="ready-text" style={styles.readyText}>
            {i18n.t('orders.readyText')}
          </Text>
        );
        break;
      default:
        break;
    }
    return buttons;
  };
  const orderDateTime = formatDateTime(createdAt);
  return (
    <SafeAreaView style={styles.container}>
  <ScreenHeader
    title={`${i18n.t('orderDetails.title')} #${_id.slice(-6)}`}
    autoLeftNav
  />
  <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
    {}
    <Card containerStyle={styles.statusCard}>
      <View style={styles.statusHeader}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
        <Text style={styles.orderId}>#{_id.slice(-6)}</Text>
      </View>
      <View style={styles.orderInfo}>
        <Text style={styles.orderDate}>
          {orderDateTime.date} {i18n.t('orderDetails.at')} {orderDateTime.time}
        </Text>
        {estimatedTime && (
          <Text style={styles.estimatedTime}>
            {i18n.t('orderDetails.estimatedTime')}: {formatEstimatedTime(estimatedTime)}
          </Text>
        )}
      </View>
    </Card>
    {}
    {getActionButtons().length > 0 && (
      <Card containerStyle={styles.actionsCard}>
        <Text style={styles.actionsTitle}>{i18n.t('orderDetails.actions')}</Text>
        <View style={styles.actionsContainer}>
          {getActionButtons()}
        </View>
      </Card>
    )}
    {}
    <Card containerStyle={styles.customerCard}>
      <Text style={styles.cardTitle}>{i18n.t('orderDetails.customerInfo')}</Text>
      <View style={styles.customerInfo}>
        <View style={styles.infoRow}>
          <Icon name="person" size={20} color={colors.grey[600]} />
          <Text style={styles.infoText}>{customerName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="phone" size={20} color={colors.grey[600]} />
          <Text style={styles.infoText}>{customerPhone}</Text>
        </View>
        {customerAddress && (
          <View style={styles.infoRow}>
            <Icon name="location-on" size={20} color={colors.grey[600]} />
            <Text style={styles.infoText}>{customerAddress}</Text>
          </View>
        )}
        {paymentMethod && (
          <View style={styles.infoRow}>
            <Icon
              name={paymentMethod === 'cash' ? 'payments' : 'credit-card'}
              size={20}
              color={colors.grey[600]}
            />
            <Text style={styles.infoText}>
              {i18n.t('orderDetails.payment')}: {paymentMethod === 'card' ? i18n.t('orderDetails.paymentCard') :
                paymentMethod === 'cash' ? i18n.t('orderDetails.paymentCash') : paymentMethod}
            </Text>
          </View>
        )}
      </View>
    </Card>
    {}
    <Card containerStyle={styles.itemsCard}>
      <Text style={styles.cardTitle}>{i18n.t('orderDetails.orderedItems')}</Text>
      {items.map((item, index) => {
        const qtyRaw = Number(item.quantity);
        const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? qtyRaw : 1;
        const unitRaw =
          typeof item.price === 'number' ? item.price : Number(item.price);
        const unit = Number.isFinite(unitRaw) ? unitRaw : NaN;
        const lineAmount = getOrderLineAmount(item);
        const baseOnly = (Number.isFinite(unit) ? unit : 0) * qty;
        const showAddOnsHint = lineAmount > baseOnly + 0.009;
        return (
        <View key={index} style={styles.itemRow}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.itemDescription}>{item.description}</Text>
            )}
            <Text style={styles.itemQuantity}>{i18n.t('orderDetails.quantity')}: {item.quantity}</Text>
            {Number.isFinite(unit) && (
              <Text style={styles.itemUnitLine}>
                {i18n.t('orderDetails.unitTimesQty', {
                  price: formatCurrency(unit),
                  quantity: String(qty),
                })}
              </Text>
            )}
            {showAddOnsHint && (
              <Text style={styles.itemAddOnsHint}>
                {i18n.t('orderDetails.includingAddOns')}
              </Text>
            )}
          </View>
          <Text style={styles.itemPrice}>{formatCurrency(lineAmount)}</Text>
        </View>
        );
      })}
      {hasPriceBreakdown ? (
        <>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{i18n.t('orderDetails.itemsSubtotal')}</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(itemsSubtotal)}</Text>
          </View>
          {deliveryFee > 0.005 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{i18n.t('orderDetails.deliveryFee')}</Text>
              <Text style={styles.summaryAmount}>{formatCurrency(deliveryFee)}</Text>
            </View>
          )}
          {taxAmount > 0.005 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{i18n.t('orderDetails.taxes')}</Text>
              <Text style={styles.summaryAmount}>{formatCurrency(taxAmount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{i18n.t('orderDetails.total')}</Text>
            <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
          </View>
        </>
      ) : (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{i18n.t('orderDetails.total')}</Text>
          <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
        </View>
      )}
    </Card>
    {}
    {notes && (
      <Card containerStyle={styles.notesCard}>
        <Text style={styles.cardTitle}>{i18n.t('orderDetails.specialNotes')}</Text>
        <Text style={styles.notesText}>{notes}</Text>
      </Card>
    )}
  </ScrollView>
</SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grey[50],
  },
  scrollView: {
    flex: 1,
    padding: constants.SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: constants.SPACING.xl,
  },
  errorText: {
    fontSize: 18,
    color: colors.grey[600],
    marginBottom: constants.SPACING.lg,
  },
  backButton: {
    paddingHorizontal: constants.SPACING.lg,
    paddingVertical: constants.SPACING.md,
    backgroundColor: colors.primary,
    borderRadius: constants.BORDER_RADIUS,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: constants.SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: constants.SPACING.md,
    paddingVertical: constants.SPACING.xs,
    borderRadius: constants.BORDER_RADIUS / 2,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  orderInfo: {
    marginTop: constants.SPACING.sm,
  },
  orderDate: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  estimatedTime: {
    fontSize: 14,
    color: colors.primary,
    marginTop: constants.SPACING.xs,
  },
  actionsCard: {
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
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: constants.SPACING.md,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: constants.SPACING.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: constants.BORDER_RADIUS,
  },
  readyText: {
    fontSize: 16,
    color: colors.success,
    textAlign: 'center',
    fontWeight: '600',
  },
  customerCard: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: constants.SPACING.md,
  },
  customerInfo: {
    gap: constants.SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: constants.SPACING.sm,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  itemsCard: {
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: constants.SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey[100],
  },
  itemInfo: {
    flex: 1,
    marginRight: constants.SPACING.md,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  itemDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: constants.SPACING.xs,
  },
  itemQuantity: {
    fontSize: 14,
    color: colors.grey[600],
    marginTop: constants.SPACING.xs,
  },
  itemUnitLine: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  itemAddOnsHint: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: constants.SPACING.sm,
    marginTop: constants.SPACING.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: constants.SPACING.md,
    marginTop: constants.SPACING.md,
    borderTopWidth: 2,
    borderTopColor: colors.grey[200],
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  notesCard: {
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
  notesText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
});
export default OrderDetailsScreen;

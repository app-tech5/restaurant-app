import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Icon } from 'react-native-elements';
import { colors, constants } from '../global';
import { getOrderStatusLabel, getOrderStatusColor, formatPrice } from '../utils/restaurantUtils';
import i18n from '../i18n';
import { useSettings } from '../contexts/SettingContext';

const OrderCard = ({
  order,
  onPress = null,
  onAccept = null,
  onPrepare = null,
  onReady = null,
  showActions = true,
  style = {}
}) => {
  const {
    _id,
    customerName,
    customerPhone,
    items = [],
    totalPrice: total,
    status,
    createdAt,
    estimatedTime
  } = order;

  const { currency } = useSettings();
  console.log("currency in OrderCard", currency)

  const statusLabel = getOrderStatusLabel(status);
  const statusColor = getOrderStatusColor(status);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(i18n.locale, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionButtons = () => {
    const buttons = [];

    if (status === 'pending' && onAccept) {
      buttons.push({
        title: i18n.t('orders.acceptOrder'),
        onPress: () => onAccept(_id),
        color: '#4CAF50',
        icon: 'check'
      });
    }

    if (status === 'accepted' && onPrepare) {
      buttons.push({
        title: i18n.t('orders.prepareOrder'),
        onPress: () => onPrepare(_id),
        color: '#FF9800',
        icon: 'play-arrow'
      });
    }

    if (status === 'preparing' && onReady) {
      buttons.push({
        title: i18n.t('orders.readyForPickup'),
        onPress: () => onReady(_id),
        color: '#2196F3',
        icon: 'done'
      });
    }

    return buttons;
  };

  const actionButtons = showActions ? getActionButtons() : [];

  return (
    <Card containerStyle={[styles.card, style]}>
      <TouchableOpacity
        onPress={onPress ? () => onPress(order) : null}
        style={styles.content}
        disabled={!onPress}
      >
        {/* Header avec numéro de commande et statut */}
        <View style={styles.header}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>
              #{_id?.slice(-6) || 'N/A'}
            </Text>
            <Text style={styles.orderTime}>
              {formatTime(createdAt)}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Informations client */}
        <View style={styles.customerInfo}>
          <Icon
            name="person"
            type="material"
            size={16}
            color={colors.grey[600]}
            containerStyle={styles.customerIcon}
          />
          <Text style={styles.customerName}>{customerName}</Text>
          <Text style={styles.customerPhone}>{customerPhone}</Text>
        </View>

        {/* Articles commandés */}
        <View style={styles.itemsContainer}>
          <Text style={styles.itemsTitle}>
            {items.length} article{items.length > 1 ? 's' : ''}
          </Text>
          {items.slice(0, 2).map((item, index) => (
            <Text key={index} style={styles.itemText} numberOfLines={1}>
              {item.quantity}x {item.name}
            </Text>
          ))}
          {items.length > 2 && (
            <Text style={styles.moreItems}>
              +{items.length - 2} autres...
            </Text>
          )}
        </View>

        {/* Footer avec total et temps estimé */}
        <View style={styles.footer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>{i18n.t('orders.total')}</Text>
            <Text style={styles.totalAmount}>
              {formatPrice(total)}
            </Text>
          </View>

          {estimatedTime && (
            <View style={styles.timeContainer}>
              <Icon
                name="schedule"
                type="material"
                size={14}
                color={colors.grey[600]}
              />
              <Text style={styles.estimatedTime}>
                {estimatedTime} min
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Boutons d'action */}
      {actionButtons.length > 0 && (
        <View style={styles.actionsContainer}>
          {actionButtons.map((button, index) => (
            <TouchableOpacity
              key={index}
              onPress={button.onPress}
              style={[styles.actionButton, { backgroundColor: button.color }]}
            >
              <Icon
                name={button.icon}
                type="material"
                size={16}
                color={colors.white}
              />
              <Text style={styles.actionButtonText}>
                {button.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: constants.BORDER_RADIUS,
    padding: 0,
    margin: constants.SPACING.sm,
    marginBottom: constants.SPACING.sm,
  },
  content: {
    padding: constants.SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: constants.SPACING.sm,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  orderTime: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: constants.SPACING.sm,
  },
  customerIcon: {
    marginRight: constants.SPACING.sm,
  },
  customerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  customerPhone: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: constants.SPACING.sm,
  },
  itemsContainer: {
    marginBottom: constants.SPACING.sm,
  },
  itemsTitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  itemText: {
    fontSize: 13,
    color: colors.text.primary,
    marginBottom: 2,
  },
  moreItems: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  estimatedTime: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: constants.SPACING.md,
    paddingTop: 0,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default OrderCard;

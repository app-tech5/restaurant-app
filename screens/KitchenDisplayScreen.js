import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { Icon } from 'react-native-elements';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRestaurant } from '../contexts/RestaurantContext';
import { ScreenHeader } from '../components';
import { colors, constants } from '../global';
import i18n from '../i18n';
import { formatPrice, getRestaurantOrderCustomerFields } from '../utils/restaurantUtils';
import { useSettings } from '../contexts/SettingContext';
import { safeBottomPad } from '../utils/safeBottom';

const COLUMNS = [
  { key: 'pending', titleKey: 'kds.columnNew', statuses: ['pending'] },
  { key: 'preparing', titleKey: 'kds.columnPreparing', statuses: ['accepted', 'preparing'] },
  { key: 'ready', titleKey: 'kds.columnReady', statuses: ['ready'] },
];

function formatTicketAge(ageMin) {
  if (ageMin < 60) return `${ageMin}m`;
  if (ageMin < 1440) return `${Math.floor(ageMin / 60)}h`;
  return `${Math.floor(ageMin / 1440)}d`;
}

function KdsTicket({ order, currency, onAccept, onPrepare, onReady }) {
  const { customerName } = getRestaurantOrderCustomerFields(order);
  const items = order.items || [];
  const ageMin = Math.max(
    0,
    Math.floor((Date.now() - new Date(order.createdAt || Date.now()).getTime()) / 60000)
  );
  // Only flag "late" for active kitchen tickets, not ancient demo orders
  const hot = ageMin >= 15 && ageMin < 180;

  let action = null;
  if (order.status === 'pending' && onAccept) {
    action = {
      label: i18n.t('orders.acceptOrder'),
      onPress: () => onAccept(order._id),
      color: colors.primary,
    };
  } else if (order.status === 'accepted' && onPrepare) {
    action = {
      label: i18n.t('orders.prepareOrder'),
      onPress: () => onPrepare(order._id),
      color: colors.warning,
    };
  } else if (order.status === 'preparing' && onReady) {
    action = {
      label: i18n.t('orders.readyForPickup'),
      onPress: () => onReady(order._id),
      color: colors.primary,
    };
  }

  return (
    <View style={[styles.ticket, hot && styles.ticketHot]}>
      <View style={styles.ticketHead}>
        <Text style={styles.ticketId} numberOfLines={1}>
          #{String(order._id || '').slice(-6)}
        </Text>
      </View>
      <Text style={[styles.ticketAge, hot && styles.ticketAgeHot]}>
        {formatTicketAge(ageMin)}
      </Text>
      <Text style={styles.ticketCustomer} numberOfLines={1}>
        {customerName || i18n.t('kds.guest')}
      </Text>
      <Text style={styles.ticketTotal}>
        {formatPrice(order.totalPrice || 0, currency?.symbol || '€')} · {items.length}{' '}
        {items.length === 1 ? i18n.t('kds.item') : i18n.t('kds.items')}
      </Text>
      {items.slice(0, 4).map((item, idx) => (
        <Text key={idx} style={styles.ticketItem} numberOfLines={1}>
          {item.quantity || 1}× {item.name || item.product?.name || i18n.t('kds.item')}
        </Text>
      ))}
      {items.length > 4 ? (
        <Text style={styles.ticketMore}>+{items.length - 4}</Text>
      ) : null}
      {action ? (
        <TouchableOpacity
          style={[styles.ticketBtn, { backgroundColor: action.color }]}
          onPress={action.onPress}
          activeOpacity={0.85}
        >
          <Text style={styles.ticketBtnText} numberOfLines={2}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function KitchenDisplayScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { currency } = useSettings();
  const {
    orders,
    loadRestaurantOrders,
    acceptOrder,
    prepareOrder,
    readyForPickup,
    isAuthenticated,
  } = useRestaurant();
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      await loadRestaurantOrders();
    } catch (e) {
      console.error('KDS load', e);
    }
  }, [isAuthenticated, loadRestaurantOrders]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const run = async () => {
        if (!cancelled) await load();
      };
      run();
      const t = setInterval(run, 15000);
      return () => {
        cancelled = true;
        clearInterval(t);
      };
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const columns = useMemo(() => {
    const list = orders || [];
    return COLUMNS.map((col) => ({
      ...col,
      orders: list.filter((o) => col.statuses.includes(o.status)),
    }));
  }, [orders]);

  const isPhone = width < 700;
  const colWidth = isPhone
    ? undefined
    : Math.max(220, Math.floor((width - 32 - 16) / 3));

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={i18n.t('kds.title')}
        autoLeftNav
        rightComponent={
          <TouchableOpacity
            onPress={onRefresh}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('common.refresh')}
          >
            <Icon name="refresh" type="material" size={22} color={colors.text.primary} />
          </TouchableOpacity>
        }
      />

      <Text style={styles.subtitle}>{i18n.t('kds.subtitle')}</Text>

      <ScrollView
        horizontal={!isPhone}
        showsHorizontalScrollIndicator={!isPhone}
        contentContainerStyle={[
          styles.board,
          isPhone && styles.boardPhone,
          { paddingBottom: safeBottomPad(insets.bottom, constants.SPACING.md) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {columns.map((col) => (
          <View
            key={col.key}
            style={[styles.column, isPhone ? styles.columnPhone : { width: colWidth }]}
          >
            <View style={styles.columnHead}>
              <Text style={styles.columnTitle} numberOfLines={1}>
                {i18n.t(col.titleKey)}
              </Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{col.orders.length}</Text>
              </View>
            </View>
            <ScrollView
              style={styles.columnScroll}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {col.orders.length === 0 ? (
                <Text style={styles.emptyCol}>{i18n.t('kds.empty')}</Text>
              ) : (
                col.orders.map((order) => (
                  <KdsTicket
                    key={order._id}
                    order={order}
                    currency={currency}
                    onAccept={acceptOrder}
                    onPrepare={prepareOrder}
                    onReady={readyForPickup}
                  />
                ))
              )}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grey[50],
  },
  subtitle: {
    paddingHorizontal: constants.SPACING.md,
    paddingBottom: constants.SPACING.sm,
    fontSize: 13,
    color: colors.text.secondary,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey[200],
  },
  board: {
    paddingHorizontal: constants.SPACING.sm,
    paddingTop: constants.SPACING.sm,
    gap: 8,
  },
  boardPhone: {
    flexDirection: 'row',
    flexGrow: 1,
    width: '100%',
  },
  column: {
    backgroundColor: colors.white,
    borderRadius: 14,
    marginRight: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.grey[200],
    maxHeight: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  columnPhone: {
    flex: 1,
    marginRight: 6,
    padding: 10,
  },
  columnHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.black,
  },
  columnTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 1,
    letterSpacing: 0.2,
  },
  countBadge: {
    backgroundColor: colors.black,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 11,
  },
  columnScroll: { flexGrow: 1 },
  emptyCol: {
    color: colors.text.secondary,
    fontSize: 13,
    paddingVertical: 28,
    textAlign: 'center',
  },
  ticket: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.grey[200],
  },
  ticketHot: {
    borderColor: colors.warning,
    backgroundColor: '#FFF8F0',
  },
  ticketHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  ticketId: {
    color: colors.text.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  ticketAge: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  ticketAgeHot: { color: colors.warning },
  ticketCustomer: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  ticketTotal: {
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  ticketItem: {
    color: colors.text.primary,
    fontSize: 12,
    marginBottom: 3,
  },
  ticketMore: {
    color: colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  ticketBtn: {
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  ticketBtnText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
  },
});

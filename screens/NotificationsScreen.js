import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, Text, ActivityIndicator } from 'react-native';
import { Badge, Icon } from 'react-native-elements';
import { ScreenHeader, EmptyState } from '../components';
import { colors, constants } from '../global';
import i18n from '../i18n';
import { formatTimeAgo } from '../utils/timeUtils';
import apiClient from '../api';

const ORDER_TYPES = new Set(['order', 'order_status', 'delivery_update', 'payment']);
const SYSTEM_TYPES = new Set(['system', 'promotion', 'account', 'new_restaurant', 'review']);

const getNotificationIcon = (type) => {
  switch (type) {
    case 'order':
    case 'order_status':
      return { name: 'restaurant', color: colors.primary };
    case 'delivery_update':
      return { name: 'local-shipping', color: colors.primary };
    case 'payment':
      return { name: 'payment', color: colors.accent };
    case 'review':
      return { name: 'star', color: colors.accent };
    case 'system':
    case 'account':
      return { name: 'info', color: colors.info };
    case 'promotion':
      return { name: 'campaign', color: colors.accent };
    case 'new_restaurant':
      return { name: 'storefront', color: colors.primary };
    default:
      return { name: 'notifications', color: colors.primary };
  }
};

const notificationTimeMs = (n) => {
  const t = n.createdAt || n.updatedAt;
  if (!t) return 0;
  const ms = new Date(t).getTime();
  return Number.isFinite(ms) ? ms : 0;
};

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const loadNotifications = useCallback(async ({ silent } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const list = await apiClient.getNotifications();
      setNotifications(Array.isArray(list) ? list : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (notification) => {
    if (notification.isRead) return;
    try {
      await apiClient.updateNotification(notification._id, { isRead: true });
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
      );
    } catch {
    }
  };

  const resolveOrderId = (notification) => {
    const fromAction = notification?.actionData?.orderId;
    if (fromAction) return String(fromAction);
    const related = notification?.relatedEntity;
    if (related && typeof related === 'object') {
      const id = related._id || related.id;
      return id ? String(id) : null;
    }
    if (related) return String(related);
    return null;
  };

  const openOrderFromNotification = async (notification) => {
    const orderId = resolveOrderId(notification);
    if (!orderId) {
      navigation.navigate('Orders', { screen: 'OrdersMain' });
      return;
    }
    try {
      const order = await apiClient.getOrderById(orderId);
      navigation.navigate('Orders', {
        screen: 'OrderDetails',
        params: { order, orderId: String(order._id || order.id || orderId) },
        initial: false,
      });
    } catch {
      Alert.alert(
        i18n.t('common.error'),
        i18n.t('orderDetails.notFound'),
        [
          {
            text: i18n.t('orderDetails.back'),
            onPress: () => navigation.navigate('Orders', { screen: 'OrdersMain' }),
          },
        ]
      );
    }
  };

  const handleNotificationPress = async (notification) => {
    await markAsRead(notification);

    const action = notification.action;
    const relatedModel = notification.relatedEntityModel;
    const isOrderNotif =
      action === 'view_order' ||
      relatedModel === 'Order' ||
      notification.type === 'order' ||
      notification.type === 'order_status' ||
      notification.type === 'delivery_update';

    if (isOrderNotif) {
      await openOrderFromNotification(notification);
      return;
    }

    if (action === 'view_reviews' || relatedModel === 'Review') {
      navigation.navigate('Reviews', { screen: 'ReviewsMain' });
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    try {
      await Promise.all(
        unread.map((n) => apiClient.updateNotification(n._id, { isRead: true }))
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
    }
  };

  const clearAllNotifications = () => {
    Alert.alert(
      i18n.t('notifications.actions.clearAllTitle'),
      i18n.t('notifications.actions.clearAllMessage'),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('notifications.actions.clearAllConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(
                notifications.map((n) => apiClient.deleteNotification(n._id))
              );
              setNotifications([]);
            } catch {
            }
          },
        },
      ]
    );
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;
    switch (filter) {
      case 'unread':
        filtered = filtered.filter((n) => !n.isRead);
        break;
      case 'orders':
        filtered = filtered.filter((n) => ORDER_TYPES.has(n.type));
        break;
      case 'system':
        filtered = filtered.filter((n) => SYSTEM_TYPES.has(n.type));
        break;
      default:
        break;
    }
    return [...filtered].sort((a, b) => notificationTimeMs(b) - notificationTimeMs(a));
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const orderCount = notifications.filter((n) => ORDER_TYPES.has(n.type)).length;
  const systemCount = notifications.filter((n) => SYSTEM_TYPES.has(n.type)).length;

  const filterOptions = [
    { key: 'all', label: i18n.t('notifications.filters.all'), count: notifications.length },
    { key: 'unread', label: i18n.t('notifications.filters.unread'), count: unreadCount },
    { key: 'orders', label: i18n.t('notifications.filters.orders'), count: orderCount },
    { key: 'system', label: i18n.t('notifications.filters.system'), count: systemCount },
  ];

  const renderFilterTab = (option) => (
    <TouchableOpacity
      key={option.key}
      style={[styles.filterTab, filter === option.key && styles.activeFilterTab]}
      onPress={() => setFilter(option.key)}
    >
      <Text
        style={[styles.filterTabText, filter === option.key && styles.activeFilterTabText]}
      >
        {option.label}
      </Text>
      <Badge
        value={option.count}
        containerStyle={styles.filterBadge}
        badgeStyle={[styles.filterBadgeStyle, filter === option.key && styles.activeFilterBadge]}
        textStyle={styles.filterBadgeText}
      />
    </TouchableOpacity>
  );

  const formatNotificationText = (text, item) => {
    const raw = String(text || '');
    if (!raw.includes('%s')) return raw;
    const orderId =
      item?.actionData?.orderId ||
      item?.relatedEntity ||
      item?.actionData?.id ||
      '';
    const replacement = orderId ? String(orderId) : '';
    return raw.replace(/%s/g, replacement);
  };

  const renderNotification = ({ item }) => {
    const iconConfig = getNotificationIcon(item.type);
    const timeLabel = formatTimeAgo(new Date(item.createdAt || item.updatedAt || Date.now()));
    const title = formatNotificationText(item.title, item);
    const message = formatNotificationText(item.message, item);
    return (
      <TouchableOpacity
        onPress={() => handleNotificationPress(item)}
        style={[
          styles.notificationItem,
          !item.isRead && styles.unreadNotification,
        ]}
        activeOpacity={0.7}
      >
        <Icon
          name={iconConfig.name}
          type="material"
          color={iconConfig.color}
          size={24}
          containerStyle={styles.notificationIcon}
        />
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{title}</Text>
          <Text style={styles.notificationMessage}>{message}</Text>
          <Text style={styles.notificationTime}>{timeLabel}</Text>
        </View>
        {!item.isRead ? (
          <View style={styles.unreadIndicator} testID="unread-indicator" />
        ) : null}
        <Icon name="chevron-right" type="material" color={colors.grey[400]} size={22} />
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <EmptyState
      icon="notifications-off"
      title={i18n.t('notifications.empty.title')}
      subtitle={
        filter === 'all'
          ? i18n.t('notifications.empty.all')
          : i18n.t('notifications.empty.filter', { filter })
      }
    />
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={i18n.t('navigation.notifications')}
        autoLeftNav
        rightComponent={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllAsRead} testID="mark-all-read-button">
              <Icon name="done-all" type="material" color={colors.primary} size={24} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={clearAllNotifications} testID="clear-all-button">
              <Icon name="delete-sweep" type="material" color={colors.grey[500]} size={24} />
            </TouchableOpacity>
          )
        }
      />
      <View style={styles.filtersContainer}>{filterOptions.map(renderFilterTab)}</View>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotification}
          keyExtractor={(item, index) => String(item._id || item.id || `notif-${index}`)}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => loadNotifications({ silent: true })}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grey[50],
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: constants.SPACING.md,
    paddingVertical: constants.SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey[200],
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: constants.SPACING.xs,
    marginHorizontal: 2,
    borderRadius: constants.BORDER_RADIUS,
  },
  activeFilterTab: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
    marginRight: constants.SPACING.xs,
  },
  activeFilterTabText: {
    color: colors.white,
  },
  filterBadge: {
    position: 'relative',
  },
  filterBadgeStyle: {
    backgroundColor: colors.grey[300],
    minWidth: 16,
    height: 16,
    borderRadius: 8,
  },
  activeFilterBadge: {
    backgroundColor: colors.white,
  },
  filterBadgeText: {
    fontSize: 10,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: constants.SPACING.md,
    flexGrow: 1,
  },
  notificationItem: {
    backgroundColor: colors.white,
    borderRadius: constants.BORDER_RADIUS,
    marginBottom: constants.SPACING.sm,
    padding: constants.SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  notificationIcon: {
    marginRight: constants.SPACING.md,
  },
  notificationContent: {
    flex: 1,
    marginRight: constants.SPACING.sm,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.grey[500],
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: constants.SPACING.sm,
  },
});

export default NotificationsScreen;

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, Text } from 'react-native';
import { ListItem, Badge, Icon } from 'react-native-elements';
import { ScreenHeader, EmptyState } from '../components';
import { colors, constants } from '../global';
import i18n from '../i18n';
import { formatTimeAgo } from '../utils/timeUtils';
import { mockNotifications } from '../__mocks__/mockNotifications';

const NotificationsScreen = ({ navigation, initialNotifications = mockNotifications }) => {
  const [notifications, setNotifications] = useState(initialNotifications);

  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'orders', 'system'

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return { name: 'restaurant', color: colors.primary };
      case 'system':
        return { name: 'info', color: colors.info };
      case 'review':
        return { name: 'star', color: colors.accent };
      default:
        return { name: 'notifications', color: colors.primary };
    }
  };


  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const handleNotificationPress = (notification) => {
    // Marquer comme lu
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Gérer l'action associée
    switch (notification.action) {
      case 'view_order':
        navigation.navigate('Orders', {
          screen: 'OrderDetails',
          params: {
            orderId: notification.actionData.orderId
          }
        });
        break;
      case 'view_reviews':
        navigation.navigate('Reviews', { screen: 'ReviewsMain' });
        break;
      default:
        // Pas d'action spécifique
        break;
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
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
          onPress: () => setNotifications([])
        }
      ]
    );
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    switch (filter) {
      case 'unread':
        filtered = filtered.filter(n => !n.read);
        break;
      case 'orders':
        filtered = filtered.filter(n => n.type === 'order');
        break;
      case 'system':
        filtered = filtered.filter(n => n.type === 'system');
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  const filterOptions = [
    { key: 'all', label: i18n.t('notifications.filters.all'), count: notifications.length },
    { key: 'unread', label: i18n.t('notifications.filters.unread'), count: unreadCount },
    { key: 'orders', label: i18n.t('notifications.filters.orders'), count: notifications.filter(n => n.type === 'order').length },
    { key: 'system', label: i18n.t('notifications.filters.system'), count: notifications.filter(n => n.type === 'system').length },
  ];

  const renderFilterTab = (option) => (
    <TouchableOpacity
      key={option.key}
      style={[
        styles.filterTab,
        filter === option.key && styles.activeFilterTab
      ]}
      onPress={() => setFilter(option.key)}
    >
      <Text style={[
        styles.filterTabText,
        filter === option.key && styles.activeFilterTabText
      ]}>
        {option.label}
      </Text>
      <Badge
        value={option.count}
        containerStyle={styles.filterBadge}
        badgeStyle={[
          styles.filterBadgeStyle,
          filter === option.key && styles.activeFilterBadge
        ]}
        textStyle={styles.filterBadgeText}
      />
    </TouchableOpacity>
  );

  const renderNotification = ({ item }) => {
    const iconConfig = getNotificationIcon(item.type);

    return (
      <ListItem
        onPress={() => handleNotificationPress(item)}
        containerStyle={[
          styles.notificationItem,
          !item.read && styles.unreadNotification
        ]}
      >
        <Icon
          name={iconConfig.name}
          type="material"
          color={iconConfig.color}
          size={24}
          containerStyle={styles.notificationIcon}
        />

        <ListItem.Content>
          <View style={styles.notificationContent}>
            <ListItem.Title style={styles.notificationTitle}>
              {item.title}
            </ListItem.Title>
            <ListItem.Subtitle style={styles.notificationMessage}>
              {item.message}
            </ListItem.Subtitle>
            <Text style={styles.notificationTime}>
              {formatTimeAgo(item.timestamp)}
            </Text>
          </View>
        </ListItem.Content>

        {!item.read && <View style={styles.unreadIndicator} testID="unread-indicator" />}

        <ListItem.Chevron />
      </ListItem>
    );
  };

  const renderEmpty = () => (
    <EmptyState
      icon="notifications-off"
      title={i18n.t('notifications.empty.title')}
      subtitle={
        filter === 'all'
          ? i18n.t('notifications.empty.all')
          : i18n.t('notifications.empty.filter', { filter: filter })
      }
    />
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={i18n.t('navigation.notifications')}
        showBackButton
        onLeftPress={() => navigation.goBack()}
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

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        {filterOptions.map(renderFilterTab)}
      </View>

      {/* Liste des notifications */}
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grey[50],
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
    alignSelf: 'center',
  },
});

export default NotificationsScreen;

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useRestaurant } from '../contexts/RestaurantContext';
import { OrderCard, Loading, EmptyState, ScreenHeader } from '../components';
import { colors, constants } from '../global';
import i18n from '../i18n';

const OrdersScreen = ({ navigation }) => {
  const {
    orders,
    loadRestaurantOrders,
    updateOrderStatus,
    acceptOrder,
    prepareOrder,
    readyForPickup,
    isAuthenticated
  } = useRestaurant();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'preparing', 'ready'

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated]);

  const loadOrders = async () => {
    try {
      await loadRestaurantOrders();
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await acceptOrder(orderId);
    } catch (error) {
      console.error('Erreur acceptation commande:', error);
    }
  };

  const handlePrepareOrder = async (orderId) => {
    try {
      await prepareOrder(orderId);
    } catch (error) {
      console.error('Erreur préparation commande:', error);
    }
  };

  const handleReadyForPickup = async (orderId) => {
    try {
      await readyForPickup(orderId);
    } catch (error) {
      console.error('Erreur commande prête:', error);
    }
  };

  const handleOrderPress = (order) => {
    // Navigation vers les détails de la commande
    navigation.navigate('OrderDetails', { order });
  };

  const getFilteredOrders = () => {
    if (!orders) return [];

    switch (activeTab) {
      case 'pending':
        return orders.filter(order => order.status === 'pending');
      case 'preparing':
        return orders.filter(order => order.status === 'preparing' || order.status === 'accepted');
      case 'ready':
        return orders.filter(order => order.status === 'ready');
      default:
        return orders;
    }
  };

  const filteredOrders = getFilteredOrders();

  const renderOrder = ({ item }) => (
    <OrderCard
      order={item}
      onPress={handleOrderPress}
      onAccept={handleAcceptOrder}
      onPrepare={handlePrepareOrder}
      onReady={handleReadyForPickup}
    />
  );

  const renderEmpty = () => {
    const emptyMessages = {
      all: {
        title: "Aucune commande",
        subtitle: "Les nouvelles commandes apparaîtront ici"
      },
      pending: {
        title: "Aucune commande en attente",
        subtitle: "Toutes les commandes ont été traitées"
      },
      preparing: {
        title: "Aucune commande en préparation",
        subtitle: "Les commandes en cours de préparation apparaîtront ici"
      },
      ready: {
        title: "Aucune commande prête",
        subtitle: "Les commandes prêtes pour le retrait apparaîtront ici"
      }
    };

    const message = emptyMessages[activeTab];

    return (
      <EmptyState
        icon="receipt"
        title={message.title}
        subtitle={message.subtitle}
      />
    );
  };

  if (!orders) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title={i18n.t('navigation.orders')}
          showBackButton
          onLeftPress={() => navigation.goBack()}
        />
        <Loading fullScreen text={i18n.t('common.loading')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={i18n.t('navigation.orders')}
        showBackButton
        onLeftPress={() => navigation.goBack()}
      />

      {/* Onglets de filtrage */}
      <View style={styles.tabsContainer}>
        {[
          { key: 'all', label: 'Toutes' },
          { key: 'pending', label: 'En attente' },
          { key: 'preparing', label: 'Préparation' },
          { key: 'ready', label: 'Prêtes' }
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
            {tab.key !== 'all' && (
              <View style={[
                styles.tabBadge,
                activeTab === tab.key && styles.activeTabBadge
              ]}>
                <Text style={styles.tabBadgeText}>
                  {getFilteredOrders().length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: constants.SPACING.md,
    paddingVertical: constants.SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey[200],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: constants.SPACING.sm,
    marginHorizontal: 2,
    borderRadius: constants.BORDER_RADIUS,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.white,
  },
  tabBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.grey[300],
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabBadge: {
    backgroundColor: colors.white,
  },
  tabBadgeText: {
    fontSize: 10,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: constants.SPACING.md,
    flexGrow: 1,
  },
});

export default OrdersScreen;

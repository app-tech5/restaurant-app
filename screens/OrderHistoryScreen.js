import React, { useMemo, useState } from 'react';
import { StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRestaurant } from '../contexts/RestaurantContext';
import { OrderCard, EmptyState, ScreenHeader, Loading } from '../components';
import { colors, constants } from '../global';
import i18n from '../i18n';

const HISTORY_STATUSES = new Set(['delivered', 'cancelled']);

const OrderHistoryScreen = ({ navigation }) => {
  const { orders, loadRestaurantOrders, isAuthenticated } = useRestaurant();
  const [refreshing, setRefreshing] = useState(false);

  const historyOrders = useMemo(
    () =>
      (Array.isArray(orders) ? orders : [])
        .filter((order) => HISTORY_STATUSES.has(String(order.status || '').toLowerCase()))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [orders]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (isAuthenticated) await loadRestaurantOrders();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader title={i18n.t('orders.orderHistory')} autoLeftNav />
      {!orders ? (
        <Loading text={i18n.t('common.loading')} />
      ) : (
        <FlatList
          data={historyOrders}
          keyExtractor={(item) => String(item._id || item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="history"
              title={i18n.t('orders.noOrders')}
              subtitle={i18n.t('orders.noOrdersSubtitle')}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('OrderDetails', {
                  orderId: item._id || item.id,
                  order: item,
                })
              }
            >
              <OrderCard order={item} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  list: { padding: constants.SPACING.md, paddingBottom: constants.SPACING.xl, flexGrow: 1 },
});

export default OrderHistoryScreen;

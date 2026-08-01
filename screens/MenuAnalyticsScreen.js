import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRestaurant } from '../contexts/RestaurantContext';
import { useSettings } from '../contexts/SettingContext';
import { ScreenHeader, StatCard } from '../components';
import { colors, constants } from '../global';
import i18n from '../i18n';
import { safeBottomPad } from '../utils/safeBottom';

const MenuAnalyticsScreen = () => {
  const insets = useSafeAreaInsets();
  const { menu, orders } = useRestaurant();
  const { formatCurrency } = useSettings();

  const analytics = useMemo(() => {
    const items = Array.isArray(menu) ? menu : [];
    const orderList = Array.isArray(orders) ? orders : [];
    const available = items.filter((item) => item.available !== false && item.availability !== false).length;
    const unavailable = Math.max(0, items.length - available);

    const soldByName = new Map();
    orderList.forEach((order) => {
      (order.items || []).forEach((line) => {
        const name = line.name || 'Item';
        const qty = Number(line.quantity) || 1;
        const revenue = Number(line.total ?? line.price * qty) || 0;
        const prev = soldByName.get(name) || { name, count: 0, revenue: 0 };
        soldByName.set(name, {
          name,
          count: prev.count + qty,
          revenue: prev.revenue + revenue,
        });
      });
    });

    const topItems = [...soldByName.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalItems: items.length,
      available,
      unavailable,
      topItems,
    };
  }, [menu, orders]);

  return (
    <View style={styles.container}>
      <ScreenHeader title={i18n.t('navigation.menuAnalytics')} autoLeftNav />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: safeBottomPad(insets.bottom, constants.SPACING.xl) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          <StatCard
            title={i18n.t('menu.totalItems') || 'Total items'}
            value={analytics.totalItems}
            icon="restaurant-menu"
            gradient={colors.auth?.gradient1 || [colors.primary, colors.primary]}
            size="medium"
            style={styles.card}
          />
          <StatCard
            title={i18n.t('dashboard.activeItems')}
            value={analytics.available}
            icon="check-circle"
            gradient={[colors.success, colors.success]}
            size="medium"
            style={styles.card}
          />
          <StatCard
            title={i18n.t('menu.unavailable') || 'Unavailable'}
            value={analytics.unavailable}
            icon="block"
            gradient={[colors.grey[600], colors.grey[700]]}
            size="medium"
            style={styles.card}
          />
        </View>

        <Text style={styles.sectionTitle}>{i18n.t('menu.topSelling') || 'Top selling dishes'}</Text>
        {analytics.topItems.length === 0 ? (
          <Text style={styles.empty}>{i18n.t('orders.noOrdersSubtitle')}</Text>
        ) : (
          analytics.topItems.map((item, index) => (
            <View key={item.name} style={styles.row}>
              <Text style={styles.rank}>{index + 1}</Text>
              <View style={styles.meta}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowSubtitle}>
                  {item.count} × — {formatCurrency(item.revenue)}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      <View style={{ height: safeBottomPad(insets.bottom, 0) }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: constants.SPACING.md, paddingBottom: constants.SPACING.xl },
  grid: { gap: constants.SPACING.sm, marginBottom: constants.SPACING.lg },
  card: { width: '100%' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: constants.SPACING.sm,
  },
  empty: { color: colors.text.secondary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: constants.SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.grey[200],
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
    backgroundColor: colors.grey[100],
    color: colors.text.primary,
    fontWeight: '700',
    marginRight: constants.SPACING.md,
    lineHeight: 28,
  },
  meta: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  rowSubtitle: { fontSize: 13, color: colors.text.secondary, marginTop: 2 },
});

export default MenuAnalyticsScreen;

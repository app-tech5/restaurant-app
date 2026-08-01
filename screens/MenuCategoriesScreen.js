import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from 'react-native-elements';
import { useRestaurant } from '../contexts/RestaurantContext';
import { ScreenHeader, EmptyState } from '../components';
import { colors, constants } from '../global';
import i18n from '../i18n';

const MenuCategoriesScreen = () => {
  const { menu } = useRestaurant();

  const categories = useMemo(() => {
    const counts = new Map();
    (Array.isArray(menu) ? menu : []).forEach((item) => {
      const name = item?.category?.name || item?.category || i18n.t('menu.uncategorized') || 'Uncategorized';
      const key = String(name);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [menu]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader title={i18n.t('navigation.menuCategories')} autoLeftNav />
      <FlatList
        data={categories}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="category"
            title={i18n.t('menu.noItems') || 'No categories'}
            subtitle={i18n.t('menu.noItemsSubtitle') || 'Add menu items to see categories'}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <Icon name="category" color={colors.primary} size={22} />
            </View>
            <View style={styles.meta}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.subtitle}>
                {item.count} {item.count > 1 ? i18n.t('menu.items') || 'items' : i18n.t('menu.item') || 'item'}
              </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  list: { padding: constants.SPACING.md, paddingBottom: constants.SPACING.xl, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: constants.SPACING.md,
    borderRadius: constants.BORDER_RADIUS,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.grey[200],
    marginBottom: constants.SPACING.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    marginRight: constants.SPACING.md,
  },
  meta: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text.primary },
  subtitle: { fontSize: 13, color: colors.text.secondary, marginTop: 2 },
});

export default MenuCategoriesScreen;

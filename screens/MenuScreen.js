import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { FAB } from 'react-native-elements';
import { useRestaurant } from '../contexts/RestaurantContext';
import { Loading, ScreenHeader, MenuSearchBar, MenuCategoriesTabs, MenuList } from '../components';
import { useMenuFilters, useMenuActions } from '../hooks';
import { colors } from '../global';
import i18n from '../i18n';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../api';
import { loadMenuWithSmartCache } from '../utils/cacheUtils';
import { useFocusEffect } from '@react-navigation/native';

const MenuScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { menu, setMenu, restaurant, isAuthenticated } = useRestaurant();
  const menuFilters = useMenuFilters(menu);
  const menuActions = useMenuActions(navigation);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated || !restaurant?._id) {
        return;
      }
  
      loadMenuWithSmartCache(
        restaurant._id,
        () => apiClient.getRestaurantMenu(),
        (data) => setMenu(Array.isArray(data) ? data : []),
        (data) => setMenu(Array.isArray(data) ? data : [])
      );
    }, [isAuthenticated, restaurant?._id])
  );
  if (!menu) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title={i18n.t('navigation.menu')}
          showBackButton
          onLeftPress={() => navigation.goBack()}
        />
        <Loading fullScreen text={i18n.t('common.loading')} />
      </View>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={i18n.t('navigation.menu')}
        showBackButton
        onLeftPress={() => navigation.goBack()}
      />
      <MenuSearchBar
        searchQuery={menuFilters.searchQuery}
        setSearchQuery={menuFilters.setSearchQuery}
      />
      <MenuCategoriesTabs
        categories={menuFilters.categories}
        selectedCategory={menuFilters.selectedCategory}
        setSelectedCategory={menuFilters.setSelectedCategory}
      />
      <MenuList
        filteredItems={menuFilters.filteredItems}
        refreshing={menuActions.refreshing}
        onRefresh={menuActions.onRefresh}
        searchQuery={menuFilters.searchQuery}
        selectedCategory={menuFilters.selectedCategory}
        onEditItem={menuActions.handleEditMenuItem}
        onDeleteItem={menuActions.handleDeleteMenuItem}
        onToggleAvailability={menuActions.handleToggleAvailability}
        onAddFirstItem={menuActions.handleAddMenuItem}
      />
      <FAB
        icon={{ name: 'add', color: 'white' }}
        color={colors.primary}
        placement="right"
        onPress={menuActions.handleAddMenuItem}
        style={{ marginBottom: 16 + insets.bottom }}
      />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grey[50],
  },
});
export default MenuScreen;

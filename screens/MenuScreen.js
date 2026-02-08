import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { FAB } from 'react-native-elements';
import { useRestaurant } from '../contexts/RestaurantContext';
import { Loading, ScreenHeader, MenuSearchBar, MenuCategoriesTabs, MenuList } from '../components';
import { useMenuFilters, useMenuActions } from '../hooks';
import { colors } from '../global';
import i18n from '../i18n';
import { SafeAreaView } from 'react-native-safe-area-context';

const MenuScreen = ({ navigation }) => {
  const { menu, isAuthenticated } = useRestaurant();

  const menuFilters = useMenuFilters(menu);
  const menuActions = useMenuActions(navigation);

  useEffect(() => {
    if (isAuthenticated) {
      menuActions.loadMenuItems();
    }
  }, [isAuthenticated]);

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

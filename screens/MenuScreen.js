import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, Text } from 'react-native';
import { FAB, SearchBar } from 'react-native-elements';
import { useRestaurant } from '../contexts/RestaurantContext';
import { MenuItemCard, Loading, EmptyState, ScreenHeader } from '../components';
import { colors, constants } from '../global';
import i18n from '../i18n';

const MenuScreen = ({ navigation }) => {
  const {
    menu,
    loadMenu,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleMenuItemAvailability,
    isAuthenticated
  } = useRestaurant();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadMenuItems();
    }
  }, [isAuthenticated]);

  const loadMenuItems = async () => {
    try {
      await loadMenu();
    } catch (error) {
      console.error('Erreur chargement menu:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMenuItems();
    setRefreshing(false);
  };

  const handleAddMenuItem = () => {
    navigation.navigate('AddEditMenuItem', { mode: 'add' });
  };

  const handleEditMenuItem = (item) => {
    navigation.navigate('AddEditMenuItem', { mode: 'edit', item });
  };

  const handleDeleteMenuItem = async (itemId) => {
    Alert.alert(
      i18n.t('common.confirm'),
      i18n.t('menu.deleteItem') + ' ?',
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMenuItem(itemId);
            } catch (error) {
              console.error('Erreur suppression item:', error);
            }
          }
        }
      ]
    );
  };

  const handleToggleAvailability = async (itemId, available) => {
    try {
      await toggleMenuItemAvailability(itemId, available);
    } catch (error) {
      console.error('Erreur changement disponibilité:', error);
    }
  };

  // Obtenir les catégories uniques
  const getCategories = () => {
    if (!menu) return ['all'];
    const categories = [...new Set(menu.map(item => item.category))];
    return ['all', ...categories];
  };

  // Filtrer les items selon la recherche et la catégorie
  const getFilteredItems = () => {
    if (!menu) return [];

    let filtered = menu;

    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    return filtered;
  };

  const filteredItems = getFilteredItems();
  const categories = getCategories();

  const renderCategoryTab = (category) => {
    const isActive = selectedCategory === category;
    const categoryLabel = category === 'all' ? 'Tous' : category;

    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.categoryTab,
          isActive && styles.activeCategoryTab
        ]}
        onPress={() => setSelectedCategory(category)}
      >
        <Text style={[
          styles.categoryTabText,
          isActive && styles.activeCategoryTabText
        ]}>
          {categoryLabel}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMenuItem = ({ item }) => (
    <MenuItemCard
      item={item}
      onPress={() => handleEditMenuItem(item)}
      onEdit={() => handleEditMenuItem(item)}
      onDelete={() => handleDeleteMenuItem(item._id)}
      onToggleAvailability={handleToggleAvailability}
    />
  );

  const renderEmpty = () => {
    if (searchQuery || selectedCategory !== 'all') {
      return (
        <EmptyState
          icon="search"
          title="Aucun résultat"
          subtitle="Aucun plat ne correspond à vos critères"
        />
      );
    }

    return (
      <EmptyState
        icon="restaurant-menu"
        title="Menu vide"
        subtitle="Ajoutez votre premier plat pour commencer"
        action={
          <TouchableOpacity
            style={styles.addFirstItemButton}
            onPress={handleAddMenuItem}
          >
            <Text style={styles.addFirstItemText}>
              Ajouter un plat
            </Text>
          </TouchableOpacity>
        }
      />
    );
  };

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
    <View style={styles.container}>
      <ScreenHeader
        title={i18n.t('navigation.menu')}
        showBackButton
        onLeftPress={() => navigation.goBack()}
      />

      {/* Barre de recherche */}
      <SearchBar
        placeholder="Rechercher un plat..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        containerStyle={styles.searchContainer}
        inputContainerStyle={styles.searchInputContainer}
        inputStyle={styles.searchInput}
        searchIcon={{ size: 24 }}
      />

      {/* Onglets de catégories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={({ item }) => renderCategoryTab(item)}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Liste des plats */}
      <FlatList
        data={filteredItems}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={{
          refreshing,
          onRefresh,
          colors: [colors.primary],
          tintColor: colors.primary
        }}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      {/* Bouton flottant d'ajout */}
      <FAB
        icon={{ name: 'add', color: 'white' }}
        color={colors.primary}
        placement="right"
        onPress={handleAddMenuItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grey[50],
  },
  searchContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: constants.SPACING.md,
    paddingVertical: constants.SPACING.sm,
  },
  searchInputContainer: {
    backgroundColor: colors.white,
    borderRadius: constants.BORDER_RADIUS,
    borderWidth: 1,
    borderColor: colors.grey[200],
  },
  searchInput: {
    fontSize: 16,
    color: colors.text.primary,
  },
  categoriesContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey[200],
  },
  categoriesList: {
    paddingHorizontal: constants.SPACING.md,
    paddingVertical: constants.SPACING.sm,
  },
  categoryTab: {
    paddingHorizontal: constants.SPACING.md,
    paddingVertical: constants.SPACING.sm,
    marginRight: constants.SPACING.sm,
    borderRadius: constants.BORDER_RADIUS,
    backgroundColor: colors.grey[100],
  },
  activeCategoryTab: {
    backgroundColor: colors.primary,
  },
  categoryTabText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  activeCategoryTabText: {
    color: colors.white,
  },
  listContainer: {
    padding: constants.SPACING.md,
    flexGrow: 1,
  },
  addFirstItemButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: constants.SPACING.lg,
    paddingVertical: constants.SPACING.md,
    borderRadius: constants.BORDER_RADIUS,
  },
  addFirstItemText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MenuScreen;

import React from 'react';
import { StyleSheet, FlatList, TouchableOpacity, Text } from 'react-native';
import { MenuItemCard, EmptyState } from './';
import { colors, constants } from '../global';
import { RefreshControl } from 'react-native';

const MenuList = ({
  filteredItems,
  refreshing,
  onRefresh,
  searchQuery,
  selectedCategory,
  onEditItem,
  onDeleteItem,
  onToggleAvailability,
  onAddFirstItem
}) => {
  const renderMenuItem = ({ item }) => (
    <MenuItemCard
      item={item}
      onPress={() => onEditItem(item)}
      onEdit={() => onEditItem(item)}
      onDelete={() => onDeleteItem(item._id)}
      onToggleAvailability={onToggleAvailability}
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
            onPress={onAddFirstItem}
          >
            <Text style={styles.addFirstItemText}>
              Ajouter un plat
            </Text>
          </TouchableOpacity>
        }
      />
    );
  };

  return (
    <FlatList
      data={filteredItems}
      renderItem={renderMenuItem}
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
  );
};

const styles = StyleSheet.create({
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

export default MenuList;

import React from 'react';
import { StyleSheet } from 'react-native';
import { SearchBar } from 'react-native-elements';
import { colors, constants } from '../global';

const MenuSearchBar = ({ searchQuery, setSearchQuery }) => {
  return (
    <SearchBar
      placeholder="Rechercher un plat..."
      onChangeText={setSearchQuery}
      value={searchQuery}
      containerStyle={styles.searchContainer}
      inputContainerStyle={styles.searchInputContainer}
      inputStyle={styles.searchInput}
      searchIcon={{ size: 24 }}
    />
  );
};

const styles = StyleSheet.create({
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
});

export default MenuSearchBar;

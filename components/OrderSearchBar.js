import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../global';
import i18n from '../i18n';

const OrderSearchBar = ({ searchQuery, onSearchChange, onClearSearch }) => {
  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color={colors.text.secondary} style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder={i18n.t('orders.searchPlaceholder', 'Search by restaurant or order ID...')}
        placeholderTextColor={colors.text.secondary}
        value={searchQuery}
        onChangeText={onSearchChange}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={onClearSearch} style={styles.clearButton}>
          <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
});

export default OrderSearchBar;

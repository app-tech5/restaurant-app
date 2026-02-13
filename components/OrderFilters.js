import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../global';

const OrderFilters = ({ statusFilters, selectedStatus, onSelectStatus }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filtersContainer}
      contentContainerStyle={styles.filtersContent}
    >
      {statusFilters.map((filter) => (
        <TouchableOpacity
          key={filter.value || 'all'}
          style={[
            styles.filterChip,
            selectedStatus === filter.value && styles.filterChipActive
          ]}
          onPress={() => onSelectStatus(filter.value)}
        >
          <Text style={[
            styles.filterChipText,
            selectedStatus === filter.value && styles.filterChipTextActive
          ]}>
            {filter.label}
          </Text>
          {filter.count > 0 && (
            <View style={[
              styles.filterCount,
              selectedStatus === filter.value && styles.filterCountActive
            ]}>
              <Text style={[
                styles.filterCountText,
                selectedStatus === filter.value && styles.filterCountTextActive
              ]}>
                {filter.count}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  filtersContainer: {
    marginBottom: 16,
    maxHeight: 60,
    minHeight: 60
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: colors.background.primary,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    height: 45
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    height: 45
  },
  filterChipText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.text.white,
  },
  filterCount: {
    backgroundColor: colors.grey[200],
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  filterCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterCountText: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  filterCountTextActive: {
    color: colors.text.white,
  },
});

export default OrderFilters;

import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text } from 'react-native';
import { colors, constants } from '../global';

const MenuCategoriesTabs = ({ categories, selectedCategory, setSelectedCategory }) => {
  const renderCategoryTab = (category) => {
    const isActive = selectedCategory === category;
    const categoryLabel = category === 'all' ? 'Tous' : category;

    return (
      <TouchableOpacity
        // key={category}
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

  return (
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
  );
};

const styles = StyleSheet.create({
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
});

export default MenuCategoriesTabs;

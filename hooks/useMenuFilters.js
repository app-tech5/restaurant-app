import { useState, useMemo } from 'react';
export const useMenuFilters = (menu) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const categories = useMemo(() => {
    if (!Array.isArray(menu)) return ['all'];
    const uniqueCategories = [
      ...new Set(
        menu
          .map((item) => item?.category?.name)
          .filter(Boolean)
      ),
    ];
    return ['all', ...uniqueCategories];
  }, [menu]);
  const filteredItems = useMemo(() => {
    if (!Array.isArray(menu)) return [];
    let filtered = menu;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          String(item?.name || '')
            .toLowerCase()
            .includes(q) ||
          String(item?.description || '')
            .toLowerCase()
            .includes(q)
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item?.category?.name === selectedCategory);
    }
    return filtered;
  }, [menu, searchQuery, selectedCategory]);
  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredItems
  };
};

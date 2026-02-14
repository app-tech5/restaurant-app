import { useState, useMemo } from 'react';

export const useMenuFilters = (menu) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Obtenir les catégories uniques
  const categories = useMemo(() => {
    if (!menu) return ['all'];
    const uniqueCategories = [...new Set(menu.map(item => item.category.name))];
    return ['all', ...uniqueCategories];
  }, [menu]);

  // Filtrer les items selon la recherche et la catégorie
  const filteredItems = useMemo(() => {
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

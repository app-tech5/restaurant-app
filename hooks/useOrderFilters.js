import { useState, useMemo } from 'react';

/**
 * Hook personnalisé pour gérer les filtres et la recherche des commandes
 * @param {Array} orders - Liste des commandes
 * @returns {Object} État et fonctions des filtres
 */
export const useOrderFilters = (orders = []) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);

  // Filtrer les commandes selon la recherche et le statut
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Filtre par statut
    if (selectedStatus) {
      filtered = filtered.filter(order =>
        order.status?.toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    // Filtre par recherche (nom du restaurant ou ID de commande)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => {
        const restaurantName = (order.restaurant?.name || order.restaurantName || '').toLowerCase();
        const orderId = String(order.id || order._id || '').toLowerCase();
        return restaurantName.includes(query) || orderId.includes(query);
      });
    }

    return filtered;
  }, [orders, searchQuery, selectedStatus]);

  // Fonctions de gestion des filtres
  const clearSearch = () => setSearchQuery('');
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStatus(null);
  };

  return {
    // État
    searchQuery,
    selectedStatus,
    filteredOrders,

    // Actions
    setSearchQuery,
    setSelectedStatus,
    clearSearch,
    clearFilters,
  };
};

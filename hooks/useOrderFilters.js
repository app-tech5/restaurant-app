import { useState, useMemo } from 'react';

export const useOrderFilters = (orders = []) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  
  const filteredOrders = useMemo(() => {
    let filtered = orders;
    
    if (selectedStatus) {
      filtered = filtered.filter(order =>
        order.status?.toLowerCase() === selectedStatus.toLowerCase()
      );
    }
    
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
  
  const clearSearch = () => setSearchQuery('');
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStatus(null);
  };

  return {
    
    searchQuery,
    selectedStatus,
    filteredOrders,
    
    setSearchQuery,
    setSelectedStatus,
    clearSearch,
    clearFilters,
  };
};

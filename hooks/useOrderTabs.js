import { useState, useMemo } from 'react';
import i18n from '../i18n';

export const useOrderTabs = (orders = []) => {
  const [activeTab, setActiveTab] = useState('all');
  
  const tabsConfig = [
    { key: 'all', label: i18n.t('orders.restaurant.tabs.all') },
    { key: 'pending', label: i18n.t('orders.restaurant.tabs.pending') },
    { key: 'preparing', label: i18n.t('orders.restaurant.tabs.preparing') },
    { key: 'ready', label: i18n.t('orders.restaurant.tabs.ready') }
  ];
  
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    switch (activeTab) {
      case 'pending':
        return orders.filter(order => order.status === 'pending');
      case 'preparing':
        return orders.filter(order => order.status === 'preparing' || order.status === 'accepted');
      case 'ready':
        return orders.filter(order => order.status === 'ready');
      default:
        return orders;
    }
  }, [orders, activeTab]);
  
  const tabCounts = useMemo(() => {
    if (!orders) return {};

    return {
      all: orders.length,
      pending: orders.filter(order => order.status === 'pending').length,
      preparing: orders.filter(order => order.status === 'preparing' || order.status === 'accepted').length,
      ready: orders.filter(order => order.status === 'ready').length,
    };
  }, [orders]);

  return {
    
    activeTab,
    filteredOrders,
    tabCounts,
    
    setActiveTab,
    tabsConfig,
  };
};

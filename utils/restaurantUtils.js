import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateRestaurantCache, clearRestaurantCache } from './storageUtils';
import i18n from '../i18n';

export const INITIAL_STATS = {
  todayOrders: 0,
  totalRevenue: 0,
  averageRating: 0,
  completedOrders: 0,
  pendingOrders: 0,
  activeMenuItems: 0
};

export const ORDER_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUSES.PENDING]: i18n.t('orders.orderPending'),
  [ORDER_STATUSES.ACCEPTED]: i18n.t('orders.orderAccepted'),
  [ORDER_STATUSES.PREPARING]: i18n.t('orders.orderPreparing'),
  [ORDER_STATUSES.READY]: i18n.t('orders.orderReady'),
  [ORDER_STATUSES.DELIVERED]: i18n.t('orders.orderDelivered'),
  [ORDER_STATUSES.CANCELLED]: i18n.t('orders.orderCancelled')
};

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUSES.PENDING]: '#FFA500',
  [ORDER_STATUSES.ACCEPTED]: '#2196F3',
  [ORDER_STATUSES.PREPARING]: '#FF9800',
  [ORDER_STATUSES.READY]: '#4CAF50',
  [ORDER_STATUSES.DELIVERED]: '#9C27B0',
  [ORDER_STATUSES.CANCELLED]: '#F44336'
};

export const isRestaurantAuthenticated = (restaurant) => {
  return restaurant && restaurant._id;
};

export const getOrderStatusLabel = (status) => {
  return ORDER_STATUS_LABELS[status] || status;
};

export const getOrderStatusColor = (status) => {
  return ORDER_STATUS_COLORS[status] || '#666';
};

export const calculateRestaurantStats = (orders = [], menu = []) => {
  console.log("orders dans calculateRestaurantStats", orders)
  
  const safeOrders = Array.isArray(orders) ? orders : [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const todayOrders = safeOrders.filter(order =>
    new Date(order.createdAt) >= today
  );
  
  const totalRevenue = safeOrders
    .filter(order => order.status === ORDER_STATUSES.DELIVERED)
    .reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  
  const completedOrders = safeOrders.filter(order =>
    order.status === ORDER_STATUSES.DELIVERED
  ).length;

  const pendingOrders = safeOrders.filter(order =>
    [ORDER_STATUSES.PENDING, ORDER_STATUSES.ACCEPTED, ORDER_STATUSES.PREPARING].includes(order.status)
  ).length;
  
  const activeMenuItems = menu.filter(item => item.available !== false).length;

  return {
    todayOrders: todayOrders.length,
    totalRevenue,
    completedOrders,
    pendingOrders,
    activeMenuItems,
    totalOrders: safeOrders.length
  };
};

export const formatPrice = (price, currencySymbol = '€') => {
  if (typeof price !== 'number') return '0' + currencySymbol;
  return `${price.toFixed(2)}${currencySymbol}`;
};

export const calculatePreparationTime = (orderItems = []) => {
  
  const baseTime = 10;
  const timePerItem = 5;
  return baseTime + (orderItems.length * timePerItem);
};

export { updateRestaurantCache, clearRestaurantCache };

import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateRestaurantCache, clearRestaurantCache } from './storageUtils';
import i18n from '../i18n';

/**
 * État initial des statistiques du restaurant
 */
export const INITIAL_STATS = {
  todayOrders: 0,
  totalRevenue: 0,
  averageRating: 0,
  completedOrders: 0,
  pendingOrders: 0,
  activeMenuItems: 0
};

/**
 * Statuts possibles pour les commandes
 */
export const ORDER_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

/**
 * Labels pour les statuts de commande
 */
export const ORDER_STATUS_LABELS = {
  [ORDER_STATUSES.PENDING]: i18n.t('orders.orderPending'),
  [ORDER_STATUSES.ACCEPTED]: i18n.t('orders.orderAccepted'),
  [ORDER_STATUSES.PREPARING]: i18n.t('orders.orderPreparing'),
  [ORDER_STATUSES.READY]: i18n.t('orders.orderReady'),
  [ORDER_STATUSES.DELIVERED]: i18n.t('orders.orderDelivered'),
  [ORDER_STATUSES.CANCELLED]: i18n.t('orders.orderCancelled')
};
/**
 * Couleurs pour les statuts de commande
 */
export const ORDER_STATUS_COLORS = {
  [ORDER_STATUSES.PENDING]: '#FFA500',
  [ORDER_STATUSES.ACCEPTED]: '#2196F3',
  [ORDER_STATUSES.PREPARING]: '#FF9800',
  [ORDER_STATUSES.READY]: '#4CAF50',
  [ORDER_STATUSES.DELIVERED]: '#9C27B0',
  [ORDER_STATUSES.CANCELLED]: '#F44336'
};

/**
 * Vérifie si le restaurant est authentifié
 * @param {Object} restaurant - Objet restaurant
 * @returns {boolean} True si authentifié
 */
export const isRestaurantAuthenticated = (restaurant) => {
  return restaurant && restaurant._id;
};

/**
 * Obtient le label d'un statut de commande
 * @param {string} status - Statut de la commande
 * @returns {string} Label du statut
 */
export const getOrderStatusLabel = (status) => {
  return ORDER_STATUS_LABELS[status] || status;
};

/**
 * Obtient la couleur d'un statut de commande
 * @param {string} status - Statut de la commande
 * @returns {string} Couleur hex du statut
 */
export const getOrderStatusColor = (status) => {
  return ORDER_STATUS_COLORS[status] || '#666';
};

/**
 * Calcule les statistiques du restaurant à partir des données
 * @param {Array} orders - Liste des commandes
 * @param {Array} menu - Menu du restaurant
 * @returns {Object} Statistiques calculées
 */
export const calculateRestaurantStats = (orders = [], menu = []) => {
  console.log("orders dans calculateRestaurantStats", orders)
  // Gérer le cas où orders est undefined ou null
  const safeOrders = Array.isArray(orders) ? orders : [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Commandes du jour
  const todayOrders = safeOrders.filter(order =>
    new Date(order.createdAt) >= today
  );

  // Revenus totaux
  const totalRevenue = safeOrders
    .filter(order => order.status === ORDER_STATUSES.DELIVERED)
    .reduce((sum, order) => sum + (order.totalPrice || 0), 0);


  // Commandes par statut
  const completedOrders = safeOrders.filter(order =>
    order.status === ORDER_STATUSES.DELIVERED
  ).length;

  const pendingOrders = safeOrders.filter(order =>
    [ORDER_STATUSES.PENDING, ORDER_STATUSES.ACCEPTED, ORDER_STATUSES.PREPARING].includes(order.status)
  ).length;

  // Éléments de menu actifs
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

/**
 * Formate un prix selon la devise
 * @param {number} price - Prix à formater
 * @param {string} currency - Devise (par défaut '€')
 * @returns {string} Prix formaté
 */
export const formatPrice = (price, currency = '€') => {
  if (typeof price !== 'number') return '0' + currency;
  return `${price.toFixed(2)}${currency}`;
};

/**
 * Calcule le temps de préparation estimé en minutes
 * @param {Array} orderItems - Items de la commande
 * @returns {number} Temps estimé en minutes
 */
export const calculatePreparationTime = (orderItems = []) => {
  // Estimation simple : 5 minutes par item + 10 minutes de base
  const baseTime = 10;
  const timePerItem = 5;
  return baseTime + (orderItems.length * timePerItem);
};

// Réexport des fonctions depuis les modules spécialisés
export { updateRestaurantCache, clearRestaurantCache };

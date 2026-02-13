import { colors } from '../global';
import i18n from '../i18n';

/**
 * Obtient la couleur d'un statut de commande
 * @param {string} status - Statut de la commande
 * @returns {string} Couleur hex du statut
 */
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending': return colors.warning;
    case 'preparing': return colors.primary;
    case 'out_for_delivery': return colors.info;
    case 'delivered': return colors.success;
    case 'cancelled': return colors.error;
    default: return colors.grey[500];
  }
};

/**
 * Obtient l'icône d'un statut de commande
 * @param {string} status - Statut de la commande
 * @returns {string} Nom de l'icône
 */
export const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending': return 'time-outline';
    case 'preparing': return 'restaurant-outline';
    case 'out_for_delivery': return 'bicycle-outline';
    case 'delivered': return 'checkmark-circle-outline';
    case 'cancelled': return 'close-circle-outline';
    default: return 'help-circle-outline';
  }
};

/**
 * Obtient le texte d'un statut de commande
 * @param {string} status - Statut de la commande
 * @returns {string} Texte du statut
 */
export const getStatusText = (status) => {
  if (!status) return i18n.t('orders.status.unknown', 'Unknown');
  return i18n.t(`orders.status.${status.toLowerCase()}`, status);
};

/**
 * Formate une date en format lisible
 * @param {string} dateString - Chaîne de date
 * @returns {string} Date formatée
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Formate le temps écoulé depuis une date
 * @param {string} dateString - Chaîne de date
 * @returns {string} Temps écoulé formaté
 */
export const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

  if (diffInHours < 1) return i18n.t('orders.justNow', 'Just now');
  if (diffInHours < 24) return `${diffInHours}h ${i18n.t('orders.ago', 'ago')}`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ${i18n.t('orders.ago', 'ago')}`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks}w ${i18n.t('orders.ago', 'ago')}`;
};

/**
 * Formate le temps estimé d'arrivée
 * @param {string} dateString - Chaîne de date d'estimation
 * @returns {string|null} Temps estimé formaté ou null
 */
export const formatEstimatedTime = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diff = date - now;
  const minutes = Math.floor(diff / 60000);

  if (minutes < 0) return i18n.t('orders.delivered', 'Delivered');
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}min`;
};

/**
 * Calcule les statistiques des commandes
 * @param {Array} orders - Liste des commandes
 * @returns {Object} Statistiques calculées
 */
export const calculateOrderStats = (orders = []) => {
  const stats = {
    total: orders.length,
    pending: 0,
    preparing: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
  };

  orders.forEach(order => {
    const status = order.status?.toLowerCase();
    if (stats[status] !== undefined) {
      stats[status]++;
    }
  });

  return stats;
};

/**
 * Obtient les options de filtrage par statut
 * @param {Object} orderStats - Statistiques des commandes
 * @returns {Array} Liste des filtres
 */
export const getStatusFilters = (orderStats) => {
  return [
    { label: i18n.t('orders.all', 'All'), value: null, count: orderStats.total },
    { label: i18n.t('orders.status.pending', 'Pending'), value: 'pending', count: orderStats.pending },
    { label: i18n.t('orders.status.preparing', 'Preparing'), value: 'preparing', count: orderStats.preparing },
    { label: i18n.t('orders.status.out_for_delivery', 'Out for Delivery'), value: 'out_for_delivery', count: orderStats.out_for_delivery },
    { label: i18n.t('orders.status.delivered', 'Delivered'), value: 'delivered', count: orderStats.delivered },
    { label: i18n.t('orders.status.cancelled', 'Cancelled'), value: 'cancelled', count: orderStats.cancelled },
  ];
};

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

/** Maps API order shape (user, delivery, payment) to fields used by restaurant UI. */
function toOrderMoney(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return NaN;
}

export function getOrderLineExtrasSum(item) {
  if (!item || !Array.isArray(item.extras)) return 0;
  return item.extras.reduce((sum, extra) => {
    const ep = toOrderMoney(extra?.price);
    const eq = toOrderMoney(extra?.quantity);
    const price = Number.isFinite(ep) ? ep : 0;
    const qty = Number.isFinite(eq) && eq > 0 ? eq : 1;
    return sum + price * qty;
  }, 0);
}

/** Montant ligne aligné sur le backend : `total` si présent, sinon prix×qté + extras. */
export function getOrderLineAmount(item) {
  if (!item) return 0;
  const totalField = toOrderMoney(item.total);
  if (Number.isFinite(totalField) && totalField >= 0) return totalField;
  const qtyRaw = toOrderMoney(item.quantity);
  const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? qtyRaw : 1;
  const unit = toOrderMoney(item.price);
  const unitPrice = Number.isFinite(unit) && unit >= 0 ? unit : 0;
  return unitPrice * qty + getOrderLineExtrasSum(item);
}

export const getRestaurantOrderCustomerFields = (order) => {
  if (!order) {
    return {
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      paymentMethod: null,
      total: 0,
    };
  }
  const user = order.user != null && typeof order.user === 'object' ? order.user : {};
  const userAddress = typeof user.address === 'string' ? user.address : '';
  const rawPayment = order.paymentMethod ?? order.payment?.method ?? null;
  let paymentMethod = rawPayment;
  if (rawPayment === 'credit_card') paymentMethod = 'card';
  if (rawPayment === 'cash_on_delivery') paymentMethod = 'cash';

  return {
    customerName: order.customerName ?? user.name ?? '',
    customerPhone: order.customerPhone ?? user.phone ?? '',
    customerAddress:
      order.customerAddress ?? order.delivery?.address ?? userAddress ?? '',
    paymentMethod: paymentMethod ?? null,
    total: order.total ?? order.totalPrice ?? 0,
  };
};
export const calculateRestaurantStats = (orders = [], menu = []) => {
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

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

/** Email compte : champ direct, ou utilisateur lié `users.value` (API Restaurant). */
export const getRestaurantEmailForDisplay = (restaurant) => {
  if (!restaurant) return '';
  if (typeof restaurant.email === 'string' && restaurant.email.trim()) {
    return restaurant.email.trim();
  }
  const linked = restaurant.users?.value;
  if (linked && typeof linked === 'object' && typeof linked.email === 'string' && linked.email.trim()) {
    return linked.email.trim();
  }
  return '';
};

/** Fusionne le document Restaurant avec l'email du compte (réponse login / cache User). */
export const withRestaurantAccountEmail = (profileDoc, accountUser) => {
  if (!profileDoc) return accountUser || null;
  const fromProfile = getRestaurantEmailForDisplay(profileDoc);
  const fromAccount =
    accountUser && typeof accountUser.email === 'string' && accountUser.email.trim()
      ? accountUser.email.trim()
      : '';
  const email = fromProfile || fromAccount;
  return email ? { ...profileDoc, email } : { ...profileDoc };
};

/** Valeurs enum `serviceModes` du modèle Restaurant (backend). */
export const RESTAURANT_SERVICE_MODES = Object.freeze(['delivery', 'pickup']);

export function normalizeRestaurantServiceMode(raw) {
  if (raw === 'delivery' || raw === 'pickup') return raw;
  if (raw && typeof raw === 'object') {
    const s = String(raw.alias || raw.title || raw.label || '').toLowerCase();
    if (s.includes('pickup') || s.includes('emporter') || s.includes('à emporter')) return 'pickup';
    if (s.includes('deliv') || s.includes('livraison')) return 'delivery';
  }
  const str = typeof raw === 'string' ? raw.toLowerCase().trim() : '';
  if (str === 'pickup' || str === 'delivery') return str;
  return 'delivery';
}

export const RESTAURANT_THEME_OPTIONS = Object.freeze(['default', 'dark', 'light']);

export function normalizeRestaurantTheme(raw) {
  const t = typeof raw === 'string' ? raw.trim() : '';
  return RESTAURANT_THEME_OPTIONS.includes(t) ? t : 'default';
}

export function restaurantProfileFormFromRestaurant(restaurant) {
  if (!restaurant) return null;
  return {
    name: restaurant.name || '',
    email: getRestaurantEmailForDisplay(restaurant),
    phone: restaurant.phone || restaurant.display_phone || '',
    address: restaurant.address || '',
    description: restaurant.description || '',
    country: restaurant.country || '',
    city: restaurant.city || '',
    latitude: restaurant.latitude != null ? String(restaurant.latitude) : '',
    longitude: restaurant.longitude != null ? String(restaurant.longitude) : '',
    openingTime: restaurant.openingTime || '',
    closingTime: restaurant.closingTime || '',
    collectTime: restaurant.collectTime != null ? String(restaurant.collectTime) : '',
    serviceModes: normalizeRestaurantServiceMode(restaurant.serviceModes),
    image: restaurant.image || restaurant.image_url || '',
    theme: normalizeRestaurantTheme(restaurant.theme),
    commission_rate:
      restaurant.commission_rate !== undefined && restaurant.commission_rate !== null
        ? String(restaurant.commission_rate)
        : '',
    reward: restaurant.reward || '',
    is_closed: !!restaurant.is_closed,
    isActivated: restaurant.isActivated !== undefined ? !!restaurant.isActivated : true,
    isAvailableForDelivery: !!restaurant.isAvailableForDelivery,
  };
}

/** Slug ASCII compact pour `alias` / `id` à partir du nom du restaurant. */
export function slugifyRestaurantName(value) {
  const base = String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return base || 'restaurant';
}

export const RESTAURANT_PRICE_OPTIONS = Object.freeze(['$', '$$', '$$$', '$$$$']);

export function normalizeRestaurantPrice(raw) {
  const p = typeof raw === 'string' ? raw.trim() : '';
  return RESTAURANT_PRICE_OPTIONS.includes(p) ? p : '$';
}

/**
 * Choisit la Tax à associer au nouveau restaurant.
 * - Match sur `location` (insensible à la casse) si `country` est fourni.
 * - Fallback : première taxe de la liste.
 * - Retourne `null` si la liste est vide.
 */
export function pickDefaultTax(taxes, country) {
  const list = Array.isArray(taxes) ? taxes : [];
  if (list.length === 0) return null;
  const target = String(country || '').trim().toLowerCase();
  if (target) {
    const matched = list.find(
      (t) => String(t?.location || '').trim().toLowerCase() === target
    );
    if (matched?._id) return matched;
  }
  return list[0] || null;
}

/**
 * Construit le sous-objet `tax` du Restaurant compatible avec :
 *  - le `pre('find')` du backend (populate `tax.value` → ObjectId ref `Tax`),
 *  - le rendu admin-app (`detectSelectField` exige `value` + `label`).
 * Retourne `null` si aucune Tax disponible.
 */
export function buildRestaurantTaxField(taxes, country) {
  const tax = pickDefaultTax(taxes, country);
  if (!tax || !tax._id) return null;
  const id = tax._id;
  return {
    id,
    value: id,
    label: `${tax.name || ''}${tax.location ? ` - ${tax.location}` : ''}`.trim() || tax.name || id,
    name: tax.name || '',
    rate: tax.rate != null ? String(tax.rate) : '0',
    location: tax.location || '',
  };
}

/** Corps PUT `/resource/restaurants/:id` aligné sur le schéma Mongoose (sans `email`). */
export function buildRestaurantProfileUpdatePayload(formData) {
  const ct = parseInt(String(formData.collectTime ?? '').replace(/\D/g, ''), 10);
  const commissionRaw = String(formData.commission_rate ?? '').replace(',', '.').trim();
  const crParsed = parseFloat(commissionRaw);
  const commission_rate = Number.isFinite(crParsed) ? crParsed : 0;
  const phone = String(formData.phone || '').trim();
  return {
    name: String(formData.name || '').trim(),
    phone,
    display_phone: phone,
    address: String(formData.address || '').trim(),
    description: String(formData.description || '').trim(),
    country: String(formData.country || '').trim(),
    city: String(formData.city || '').trim(),
    latitude: String(formData.latitude ?? '').trim(),
    longitude: String(formData.longitude ?? '').trim(),
    openingTime: String(formData.openingTime || '').trim() || '09:00',
    closingTime: String(formData.closingTime || '').trim() || '21:00',
    collectTime: Number.isFinite(ct) && ct >= 0 ? ct : undefined,
    serviceModes: normalizeRestaurantServiceMode(formData.serviceModes),
    image: String(formData.image || '').trim(),
    image_url: String(formData.image || '').trim(),
    theme: normalizeRestaurantTheme(formData.theme),
    commission_rate,
    reward: String(formData.reward || '').trim(),
    is_closed: !!formData.is_closed,
    isActivated: !!formData.isActivated,
    isAvailableForDelivery: !!formData.isAvailableForDelivery,
  };
}

/**
 * Corps POST `/resource/restaurants` côté création.
 * - `alias` / `id` : dérivés du `name` (slug).
 * - `price` : sélectionné par l'utilisateur dans le formulaire (`$`..`$$$$`).
 * - `users.value` : ajouté par l'orchestrateur d'onboarding.
 */
export function buildRestaurantOnboardingPayload(formData) {
  const base = buildRestaurantProfileUpdatePayload(formData);
  const slug = slugifyRestaurantName(formData?.name);
  return {
    ...base,
    alias: slug,
    id: slug,
    price: normalizeRestaurantPrice(formData?.price),
  };
}

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

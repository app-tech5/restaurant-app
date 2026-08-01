import { config } from '../../config';
import { getDemoState, updateDemoState } from './localStore';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const pathOnly = (endpoint) => String(endpoint || '').split('?')[0];

const parseBody = (options) => {
  if (!options?.body) return {};
  if (typeof options.body === 'string') {
    try {
      return JSON.parse(options.body);
    } catch {
      return {};
    }
  }
  return options.body;
};

const newId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const isBuiltinDemoEmail = (email) =>
  String(email || '')
    .trim()
    .toLowerCase() === String(config.DEMO_EMAIL || '').trim().toLowerCase();

const isLocalDemoToken = (token) =>
  String(token || '').startsWith('demo_restaurant_token_');

const isLocalDemoRestaurantId = (id) =>
  String(id || '').startsWith('demo_restaurant');

/** Resolve product restaurant id whether `type`/`restaurant` is an ObjectId string or populated doc. */
const productRestaurantKey = (item) => {
  const candidates = [item?.type, item?.restaurant, item?.restaurantId];
  for (const value of candidates) {
    if (value == null || value === '') continue;
    if (typeof value === 'object') {
      const id = value._id || value.id;
      if (id != null && id !== '') return String(id);
      continue;
    }
    return String(value);
  }
  return '';
};

const asList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const applyOrderPatches = (orders, state) =>
  (orders || []).map((order) => {
    const id = String(order._id || order.id);
    const patch = state.orderPatches?.[id];
    return patch ? { ...order, ...patch } : order;
  });

const applyProductOverrides = (products, state) => {
  const removed = new Set((state.productRemovedIds || []).map(String));
  let list = (products || [])
    .filter((item) => !removed.has(String(item._id || item.id)))
    .map((item) => {
      const id = String(item._id || item.id);
      const patch = state.productPatches?.[id];
      return patch ? { ...item, ...patch } : item;
    });

  const existing = new Set(list.map((item) => String(item._id || item.id)));
  (state.localProducts || []).forEach((added) => {
    const id = String(added._id || added.id);
    if (!existing.has(id) && !removed.has(id)) {
      list.push(added);
      existing.add(id);
    }
  });

  return list;
};

const applyReviewPatches = (reviews, state) =>
  (reviews || []).map((review) => {
    const id = String(review._id || review.id);
    const patch = state.reviewPatches?.[id];
    if (!patch) return review;
    return {
      ...review,
      ...patch,
      reply: patch.reply ? { ...(review.reply || {}), ...patch.reply } : review.reply,
    };
  });

const applyNotificationOverrides = (notifications, state) => {
  const removed = new Set((state.notificationRemovedIds || []).map(String));
  const readIds = new Set((state.notificationReadIds || []).map(String));
  return (notifications || [])
    .filter((item) => !removed.has(String(item._id || item.id)))
    .map((item) => {
      const id = String(item._id || item.id);
      if (!readIds.has(id)) return item;
      return { ...item, read: true, isRead: true };
    });
};

/**
 * Demo writes stay in AsyncStorage. Builtin demo login falls through to API.
 */
export async function handleDemoWrite(client, endpoint, method, options = {}) {
  if (!config.DEMO_MODE || !WRITE_METHODS.has(method)) return null;

  const endpointPath = pathOnly(endpoint);
  const body = parseBody(options);

  if (endpointPath === '/auth/signup' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase();
    if (!email || !body.password || !body.name) {
      throw new Error('Email, password and name are required');
    }
    const state = await getDemoState();
    const exists = state.registeredUsers.some(
      (item) => String(item.email || '').trim().toLowerCase() === email
    );
    if (exists || isBuiltinDemoEmail(email)) {
      throw new Error('Email already in use');
    }
    const id = newId('demo_restaurant_user');
    const restaurantId = newId('demo_restaurant');
    const record = {
      id,
      email: String(body.email).trim(),
      password: body.password,
      name: String(body.name).trim(),
      phone: body.phone || '',
      address: body.address || '',
      role: 'restaurant',
      restaurant: restaurantId,
    };
    await updateDemoState((current) => ({
      ...current,
      registeredUsers: [...current.registeredUsers, record],
      restaurantPatch: {
        _id: restaurantId,
        id: restaurantId,
        name: record.name,
        email: record.email,
        phone: record.phone,
        address: record.address,
        isActivated: true,
      },
    }));
    const token = `demo_restaurant_token_${id}`;
    const user = {
      _id: id,
      id,
      email: record.email,
      name: record.name,
      phone: record.phone,
      role: 'restaurant',
      restaurant: restaurantId,
    };
    client.token = token;
    client.restaurant = user;
    client.userId = id;
    await client.saveRestaurantToStorage();
    return { token, user, message: 'Account created (demo)' };
  }

  // Builtin demo account → real API login
  if (endpointPath === '/auth/restaurant-login' && method === 'POST') {
    if (isBuiltinDemoEmail(body.email)) {
      return null;
    }
    const state = await getDemoState();
    const email = String(body.email || '').trim().toLowerCase();
    const record = state.registeredUsers.find(
      (item) => String(item.email || '').trim().toLowerCase() === email
    );
    if (!record) return null;
    if (record.password !== body.password) {
      throw new Error('Incorrect email or password');
    }
    const token = `demo_restaurant_token_${record.id}`;
    const user = {
      _id: record.id,
      id: record.id,
      email: record.email,
      name: record.name,
      phone: record.phone,
      role: 'restaurant',
      restaurant: record.restaurant,
      ...(state.restaurantPatch || {}),
    };
    client.token = token;
    client.restaurant = user;
    client.userId = record.id;
    await client.saveRestaurantToStorage();
    return { token, user, message: 'Demo login' };
  }

  if (endpointPath.startsWith('/resource/orders/') && method === 'PUT') {
    const orderId = endpointPath.split('/').pop();
    await updateDemoState((current) => ({
      ...current,
      orderPatches: {
        ...current.orderPatches,
        [String(orderId)]: {
          ...(current.orderPatches[String(orderId)] || {}),
          ...body,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
    return { _id: orderId, id: orderId, ...body };
  }

  if (endpointPath === '/resource/products' && method === 'POST') {
    const id = newId('demo_product');
    const item = {
      _id: id,
      id,
      ...body,
      available: body.available !== false,
      availability: body.availability !== false,
      createdAt: new Date().toISOString(),
    };
    await updateDemoState((current) => ({
      ...current,
      localProducts: [...(current.localProducts || []), item],
    }));
    return item;
  }

  if (endpointPath.startsWith('/resource/products/') && method === 'PUT') {
    const productId = endpointPath.split('/').pop();
    await updateDemoState((current) => ({
      ...current,
      productPatches: {
        ...current.productPatches,
        [String(productId)]: {
          ...(current.productPatches[String(productId)] || {}),
          ...body,
        },
      },
      localProducts: (current.localProducts || []).map((item) =>
        String(item._id || item.id) === String(productId) ? { ...item, ...body } : item
      ),
    }));
    return { _id: productId, id: productId, ...body };
  }

  if (endpointPath.startsWith('/resource/products/') && method === 'DELETE') {
    const productId = endpointPath.split('/').pop();
    await updateDemoState((current) => ({
      ...current,
      productRemovedIds: [...new Set([...(current.productRemovedIds || []), String(productId)])],
      localProducts: (current.localProducts || []).filter(
        (item) => String(item._id || item.id) !== String(productId)
      ),
    }));
    return { success: true };
  }

  if (endpointPath.startsWith('/resource/restaurants/') && method === 'PUT') {
    const restaurantId = endpointPath.split('/').pop();
    await updateDemoState((current) => ({
      ...current,
      restaurantPatch: {
        ...(current.restaurantPatch || {}),
        ...body,
        _id: restaurantId,
        id: restaurantId,
      },
    }));
    if (client.restaurant) {
      client.restaurant = { ...client.restaurant, ...body };
      await client.saveRestaurantToStorage();
    }
    return { _id: restaurantId, id: restaurantId, ...body };
  }

  if (endpointPath === '/resource/restaurants' && method === 'POST') {
    const id = body._id || newId('demo_restaurant');
    const restaurant = { ...body, _id: id, id };
    await updateDemoState((current) => ({ ...current, restaurantPatch: restaurant }));
    return restaurant;
  }

  if (endpointPath.startsWith('/resource/users/') && method === 'PUT') {
    const userId = endpointPath.split('/').pop();
    await updateDemoState((current) => ({
      ...current,
      profilePatch: { ...(current.profilePatch || {}), ...body },
    }));
    if (client.restaurant && String(client.userId) === String(userId)) {
      client.restaurant = { ...client.restaurant, ...body };
      await client.saveRestaurantToStorage();
    }
    return { _id: userId, id: userId, ...body };
  }

  if (endpointPath === '/resource/deliverysettings' && method === 'POST') {
    const doc = { _id: newId('demo_delivery'), ...body };
    await updateDemoState((current) => ({ ...current, deliverySettingsPatch: doc }));
    return doc;
  }

  if (endpointPath.startsWith('/resource/deliverysettings/') && method === 'PUT') {
    const id = endpointPath.split('/').pop();
    await updateDemoState((current) => ({
      ...current,
      deliverySettingsPatch: { ...(current.deliverySettingsPatch || {}), ...body, _id: id },
    }));
    return { _id: id, ...body };
  }

  if (endpointPath === '/resource/restaurantpaymentsettings' && method === 'POST') {
    const doc = { _id: newId('demo_pay'), ...body };
    await updateDemoState((current) => ({ ...current, paymentSettingsPatch: doc }));
    return doc;
  }

  if (endpointPath.startsWith('/resource/restaurantpaymentsettings/') && method === 'PUT') {
    const id = endpointPath.split('/').pop();
    await updateDemoState((current) => ({
      ...current,
      paymentSettingsPatch: { ...(current.paymentSettingsPatch || {}), ...body, _id: id },
    }));
    return { _id: id, ...body };
  }

  if (endpointPath.startsWith('/resource/reviews/') && method === 'PUT') {
    const reviewId = endpointPath.split('/').pop();
    await updateDemoState((current) => ({
      ...current,
      reviewPatches: { ...current.reviewPatches, [String(reviewId)]: body },
    }));
    return { _id: reviewId, id: reviewId, ...body };
  }

  if (endpointPath.startsWith('/resource/notifications/') && method === 'PUT') {
    const notificationId = endpointPath.split('/').pop();
    if (body.read === true || body.isRead === true) {
      await updateDemoState((current) => ({
        ...current,
        notificationReadIds: [
          ...new Set([...(current.notificationReadIds || []), String(notificationId)]),
        ],
      }));
    }
    return { _id: notificationId, id: notificationId, ...body };
  }

  if (endpointPath.startsWith('/resource/notifications/') && method === 'DELETE') {
    const notificationId = endpointPath.split('/').pop();
    await updateDemoState((current) => ({
      ...current,
      notificationRemovedIds: [
        ...new Set([...(current.notificationRemovedIds || []), String(notificationId)]),
      ],
    }));
    return { success: true };
  }

  if (
    endpointPath === '/user-settings' ||
    endpointPath === '/user-settings/notifications' ||
    endpointPath === '/user-settings/restaurant'
  ) {
    await updateDemoState((current) => ({
      ...current,
      userSettingsPatch: { ...(current.userSettingsPatch || {}), ...body },
    }));
    return { success: true, ...body };
  }

  if (endpointPath.startsWith('/resource/settings/') && method === 'PUT') {
    await updateDemoState((current) => ({
      ...current,
      settingsPatch: { ...(current.settingsPatch || {}), ...body },
    }));
    return { success: true, ...body };
  }

  if (endpointPath.startsWith('/upload/')) {
    return { url: `demo://upload/${Date.now()}.jpg`, success: true };
  }

  return null;
}

/**
 * Local demo accounts never hit the API for restaurant-scoped GETs
 * (ids like demo_restaurant_* do not exist in Mongo).
 * Also short-circuit whenever the requested id/type is local, even if the
 * session token is a real JWT (stale placeId after signup tests).
 */
export async function handleDemoRead(client, endpoint, method) {
  if (!config.DEMO_MODE || method !== 'GET') {
    return null;
  }

  const endpointPath = pathOnly(endpoint);
  const hasLocalToken = isLocalDemoToken(client?.token);
  const state = await getDemoState();
  const restaurantId =
    state.restaurantPatch?._id ||
    state.restaurantPatch?.id ||
    client?.restaurant?.restaurant ||
    client?.restaurant?._id ||
    client?.restaurant?.id;

  if (endpointPath.startsWith('/resource/restaurants/')) {
    const requestedId = endpointPath.split('/').pop();
    const isLocalId = isLocalDemoRestaurantId(requestedId);
    if (!isLocalId && !hasLocalToken) return null;
    if (!isLocalId && String(requestedId) !== String(restaurantId)) return null;
    return {
      name: state.restaurantPatch?.name || client?.restaurant?.name || '',
      email: state.restaurantPatch?.email || client?.restaurant?.email || '',
      phone: state.restaurantPatch?.phone || client?.restaurant?.phone || '',
      address: state.restaurantPatch?.address || '',
      isActivated: true,
      ...(state.restaurantPatch || {}),
      _id: requestedId || restaurantId,
      id: requestedId || restaurantId,
    };
  }

  if (endpointPath === '/resource/products') {
    const queryType = decodeURIComponent(String(endpoint.split('type=')[1] || '').split('&')[0] || '');
    if (!hasLocalToken && !isLocalDemoRestaurantId(queryType)) return null;
    return applyProductOverrides([], state).filter((item) => {
      if (!queryType) return true;
      const itemType = productRestaurantKey(item);
      if (!itemType) return true;
      return String(itemType) === String(queryType);
    });
  }

  if (!hasLocalToken) {
    return null;
  }

  if (endpointPath === '/resource/orders') {
    return applyOrderPatches([], state);
  }

  if (endpointPath.startsWith('/resource/orders/')) {
    const orderId = endpointPath.split('/').pop();
    const patch = state.orderPatches?.[String(orderId)];
    return patch ? { _id: orderId, id: orderId, ...patch } : null;
  }

  if (endpointPath === '/resource/reviews') {
    return applyReviewPatches([], state);
  }

  if (endpointPath === '/resource/notifications') {
    return applyNotificationOverrides([], state);
  }

  if (endpointPath === '/resource/deliverysettings') {
    return state.deliverySettingsPatch ? [state.deliverySettingsPatch] : [];
  }

  if (endpointPath === '/resource/restaurantpaymentsettings') {
    return state.paymentSettingsPatch ? [state.paymentSettingsPatch] : [];
  }

  if (endpointPath === '/user-settings') {
    return { ...(state.userSettingsPatch || {}) };
  }

  if (endpointPath.startsWith('/resource/users/')) {
    const userId = endpointPath.split('/').pop();
    const record = (state.registeredUsers || []).find(
      (item) => String(item.id) === String(userId)
    );
    if (!record && String(client?.userId) !== String(userId)) {
      return null;
    }
    const base = record
      ? {
          _id: record.id,
          id: record.id,
          email: record.email,
          name: record.name,
          phone: record.phone || '',
          role: 'restaurant',
          restaurant: record.restaurant,
        }
      : {
          _id: userId,
          id: userId,
          ...(client?.restaurant || {}),
        };
    return { ...base, ...(state.profilePatch || {}) };
  }

  // Catalog endpoints can still hit the API (categories, settings, taxes…).
  return null;
}

/**
 * Merge AsyncStorage demo patches onto API/DB read payloads
 * (builtin demo account that still reads seed data from Mongo).
 */
export async function mergeDemoRead(endpoint, data) {
  if (!config.DEMO_MODE) return data;

  const state = await getDemoState();
  const endpointPath = pathOnly(endpoint);

  if (endpointPath === '/resource/orders') {
    const merged = applyOrderPatches(asList(data), state);
    if (Array.isArray(data)) return merged;
    if (data && typeof data === 'object') return { ...data, data: merged };
    return merged;
  }

  if (endpointPath.startsWith('/resource/orders/')) {
    const orderId = endpointPath.split('/').pop();
    const patch = state.orderPatches?.[String(orderId)];
    return patch && data ? { ...data, ...patch } : data;
  }

  if (endpointPath === '/resource/products') {
    const queryType = String(endpoint.split('type=')[1] || '').split('&')[0];
    const restaurantType = queryType ? decodeURIComponent(queryType) : '';
    const merged = applyProductOverrides(asList(data), state).filter((item) => {
      if (!restaurantType) return true;
      const itemType = productRestaurantKey(item);
      // Local demo products must not leak onto builtin Mongo restaurant menus.
      if (isLocalDemoRestaurantId(itemType) && !isLocalDemoRestaurantId(restaurantType)) {
        return false;
      }
      if (!itemType) return true;
      return String(itemType) === String(restaurantType);
    });
    if (Array.isArray(data)) return merged;
    if (data && typeof data === 'object') return { ...data, data: merged };
    return merged;
  }

  if (endpointPath.startsWith('/resource/restaurants/')) {
    if (!state.restaurantPatch || !data) return data;
    const requestedId = endpointPath.split('/').pop();
    const patchId = state.restaurantPatch._id || state.restaurantPatch.id;
    // Never overwrite a Mongo restaurant profile with a local signup patch.
    if (patchId && String(patchId) !== String(requestedId)) return data;
    if (isLocalDemoRestaurantId(patchId) && !isLocalDemoRestaurantId(requestedId)) return data;
    return { ...data, ...state.restaurantPatch };
  }

  if (endpointPath === '/resource/reviews') {
    const list = asList(data);
    const merged = applyReviewPatches(list, state);
    if (Array.isArray(data)) return merged;
    if (data && typeof data === 'object') return { ...data, data: merged };
    return merged;
  }

  if (endpointPath === '/resource/notifications') {
    const list = asList(data);
    const merged = applyNotificationOverrides(list, state);
    if (Array.isArray(data)) return merged;
    if (data && typeof data === 'object') return { ...data, data: merged };
    return merged;
  }

  if (endpointPath === '/resource/deliverysettings') {
    if (!state.deliverySettingsPatch) return data;
    const patch = state.deliverySettingsPatch;
    const patchType = String(patch.type || patch.restaurant || patch.restaurantId || '');
    if (isLocalDemoRestaurantId(patchType)) {
      // Local signup delivery settings must not replace builtin demo API data.
      return data;
    }
    const list = asList(data);
    if (!list.length) return [patch];
    return list.map((item, index) =>
      index === 0 ? { ...item, ...patch } : item
    );
  }

  if (endpointPath === '/resource/restaurantpaymentsettings') {
    if (!state.paymentSettingsPatch) return data;
    const patch = state.paymentSettingsPatch;
    const patchType = String(patch.type || patch.restaurant || patch.restaurantId || '');
    if (isLocalDemoRestaurantId(patchType)) {
      return data;
    }
    const list = asList(data);
    if (!list.length) return [patch];
    return list.map((item, index) =>
      index === 0 ? { ...item, ...patch } : item
    );
  }

  if (endpointPath === '/user-settings') {
    if (!state.userSettingsPatch) return data;
    return { ...(data || {}), ...state.userSettingsPatch };
  }

  if (endpointPath === '/resource/settings') {
    if (!state.settingsPatch) return data;
    if (Array.isArray(data) && data[0]) {
      return [{ ...data[0], ...state.settingsPatch }, ...data.slice(1)];
    }
    if (data && typeof data === 'object') return { ...data, ...state.settingsPatch };
  }

  if (endpointPath.startsWith('/resource/users/')) {
    if (!state.profilePatch) return data;
    return { ...(data || {}), ...state.profilePatch };
  }

  return data;
}

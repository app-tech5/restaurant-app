import { config as appConfig } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeOrdersPayload } from './utils/apiPayloadUtils';
import { resolveRestaurantPlaceId as resolveRestaurantId } from './utils/restaurantIdUtils';
import { buildRestaurantReviewsResult } from './utils/restaurantReviewUtils';
import { buildRestaurantStatsData } from './utils/restaurantStatsUtils';
import { buildRestaurantAnalyticsData } from './utils/restaurantAnalyticsUtils';
import { handleDemoWrite, handleDemoRead, mergeDemoRead } from './api/demo/handlers';
import { handleDemoSubscription } from './api/demo/subscriptionHandlers';
import { clearDemoState } from './api/demo/localStore';

const API_BASE_URL = appConfig.API_BASE_URL;
const API_TIMEOUT = appConfig.API_TIMEOUT;
const isDemoMode = () => appConfig.DEMO_MODE === true;

class ApiClient {
  constructor() {
    this.token = null;
    this.restaurant = null;
    this.userId = null;
    this.initializeFromStorage();
  }

  resolveRestaurantPlaceId() {
    return resolveRestaurantId(this.restaurant);
  }

  normalizeOrdersPayload(raw) {
    return normalizeOrdersPayload(raw);
  }

  async initializeFromStorage() {
    try {
      const token = await AsyncStorage.getItem('restaurantToken');
      const restaurantData = await AsyncStorage.getItem('restaurantData');
      if (token) {
        this.token = token;
      }
      if (restaurantData) {
        this.restaurant = JSON.parse(restaurantData);
        this.userId = this.restaurant._id || this.restaurant.id || null;
      }
    } catch (error) {
      console.error('Error initializing restaurant from storage:', error);
    }
  }

  async saveRestaurantToStorage() {
    try {
      if (this.token) {
        await AsyncStorage.setItem('restaurantToken', this.token);
      }
      if (this.restaurant) {
        await AsyncStorage.setItem('restaurantData', JSON.stringify(this.restaurant));
      }
    } catch (error) {
      console.error('Error saving restaurant to storage:', error);
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  async apiCall(endpoint, options = {}) {
    return this._apiFetch(endpoint, options, this.getHeaders());
  }

  /** POST multipart (ex. upload fichier) : pas de `Content-Type: application/json` (RN fixe le boundary). */
  async apiCallMultipart(endpoint, options = {}) {
    const headers = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return this._apiFetch(endpoint, options, headers);
  }

  async _apiFetch(endpoint, options, baseHeaders) {
    const method = (options.method || 'GET').toUpperCase();

    if (isDemoMode()) {
      const localWrite = await handleDemoWrite(this, endpoint, method, options);
      if (localWrite !== null) {
        return localWrite;
      }
      const subscriptionDemo = await handleDemoSubscription(this, endpoint, method, options);
      if (subscriptionDemo !== null) {
        return subscriptionDemo;
      }
      if (method === 'GET') {
        const localRead = await handleDemoRead(this, endpoint, method);
        if (localRead !== null) {
          return localRead;
        }
      }
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const fetchOptions = {
      ...options,
      headers: {
        ...baseHeaders,
        ...options.headers,
      },
      timeout: API_TIMEOUT,
    };
    try {
      const response = await fetch(url, fetchOptions);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (isDemoMode() && method === 'GET') {
        return mergeDemoRead(endpoint, data);
      }
      return data;
    } catch (error) {
      console.error(`❌ API Error: ${endpoint}`, error);
      throw error;
    }
  }

  async restaurantLogin(email, password) {
    const response = await this.apiCall('/auth/restaurant-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response.user && response.token) {
      this.restaurant = response.user;
      this.token = response.token;
      this.userId = response.user._id || response.user.id || null;
      await this.saveRestaurantToStorage();
    }
    return response;
  }

  async restaurantSignup({ email, password, name, phone, address } = {}) {
    const response = await this.apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        name,
        phone: phone || '',
        address: address || '',
        role: 'restaurant',
      }),
    });
    if (response.user && response.token) {
      this.restaurant = response.user;
      this.token = response.token;
      this.userId = response.user._id || response.user.id || null;
      await this.saveRestaurantToStorage();
    }
    return response;
  }

  async createRestaurantDoc(body) {
    return await this.apiCall('/resource/restaurants', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async linkUserToRestaurant(userId, restaurantId) {
    if (!userId || !restaurantId) {
      throw new Error('Missing userId or restaurantId for link');
    }
    return await this.apiCall(`/resource/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ restaurant: restaurantId }),
    });
  }

  async getRestaurantProfile() {
    const id = this.resolveRestaurantPlaceId();
    if (!id) {
      throw new Error('Missing restaurant id for profile');
    }
    return await this.apiCall(`/resource/restaurants/${id}`);
  }

  async logout() {
    this.token = null;
    this.restaurant = null;
    this.userId = null;
    try {
      await AsyncStorage.multiRemove(['restaurantToken', 'restaurantData']);
      await clearDemoState();
    } catch (error) {
      console.error('Error clearing storage on logout:', error);
    }
    return { success: true };
  }

  async getRestaurantStats() {
    const [{ data: list }, reviewsRes, menuRes] = await Promise.all([
      this.getRestaurantOrders(),
      this.getRestaurantReviews(),
      this.getRestaurantMenu(),
    ]);
    const menuList = Array.isArray(menuRes?.data) ? menuRes.data : [];
    const data = buildRestaurantStatsData({
      orders: list,
      reviewsAverageRating: reviewsRes?.data?.stats?.averageRating,
      menuItemCount: menuList.length,
    });
    return { success: true, data };
  }

  async getRestaurantOrders(status = null) {
    const endpoint = status
      ? `/resource/orders?status=${encodeURIComponent(status)}`
      : '/resource/orders';
    const raw = await this.apiCall(endpoint);
    return this.normalizeOrdersPayload(raw);
  }

  async acceptOrder(orderId) {
    return await this.apiCall(`/resource/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'preparing' }),
    });
  }

  async prepareOrder(orderId) {
    return await this.apiCall(`/resource/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'preparing' }),
    });
  }

  async readyForPickup(orderId) {
    return await this.apiCall(`/resource/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'ready' }),
    });
  }

  async updateOrderStatus(orderId, status) {
    return await this.apiCall(`/resource/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getRestaurantMenu() {
    const rid = this.resolveRestaurantPlaceId();
    if (!rid) {
      return { data: [] };
    }
    const raw = await this.apiCall(`/resource/products?type=${encodeURIComponent(String(rid))}`);
    const list = Array.isArray(raw) ? raw : [];
    return { data: list };
  }

  async updateRestaurantProfile(profileData) {
    const id = this.resolveRestaurantPlaceId();
    if (!id) {
      throw new Error('Missing restaurant id for profile update');
    }
    return await this.apiCall(`/resource/restaurants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  /** Liste réglages livraison pour le restaurant courant (`type` comme sur `products`). */
  async fetchDeliverySettingsListForRestaurant() {
    const rid = this.resolveRestaurantPlaceId();
    if (!rid) {
      throw new Error('Missing restaurant id for delivery settings');
    }
    const raw = await this.apiCall(
      `/resource/deliverysettings?type=${encodeURIComponent(String(rid))}`
    );
    return Array.isArray(raw) ? raw : [];
  }

  async getDeliverySettingsDoc() {
    const list = await this.fetchDeliverySettingsListForRestaurant();
    return list[0] || null;
  }

  async createDeliverySettingsForRestaurant(restaurantId, payload = {}) {
    if (!restaurantId) {
      throw new Error('Missing restaurant id for delivery settings');
    }
    return await this.apiCall('/resource/deliverysettings', {
      method: 'POST',
      body: JSON.stringify({ restaurant: restaurantId, ...payload }),
    });
  }

  async upsertRestaurantDeliverySettings(payload) {
    const list = await this.fetchDeliverySettingsListForRestaurant();
    const existing = list[0];
    if (existing && existing._id) {
      return await this.apiCall(`/resource/deliverysettings/${existing._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    }
    return await this.apiCall('/resource/deliverysettings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async fetchPaymentSettingsListForRestaurant() {
    const rid = this.resolveRestaurantPlaceId();
    if (!rid) {
      throw new Error('Missing restaurant id for payment settings');
    }
    const raw = await this.apiCall(
      `/resource/restaurantpaymentsettings?type=${encodeURIComponent(String(rid))}`
    );
    return Array.isArray(raw) ? raw : [];
  }

  async getRestaurantPaymentSettingsDoc() {
    const list = await this.fetchPaymentSettingsListForRestaurant();
    return list[0] || null;
  }

  async upsertRestaurantPaymentSettings(payload) {
    const list = await this.fetchPaymentSettingsListForRestaurant();
    const existing = list[0];
    if (existing && existing._id) {
      return await this.apiCall(`/resource/restaurantpaymentsettings/${existing._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    }
    return await this.apiCall('/resource/restaurantpaymentsettings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getUserSettings() {
    return await this.apiCall('/user-settings');
  }

  async updateUserSettings(settingsData) {
    return await this.apiCall('/user-settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  }

  async updateNotifications(notifications) {
    return await this.apiCall('/user-settings/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ notifications }),
    });
  }

  async updateRestaurantSettings(restaurantSettings) {
    return await this.apiCall('/user-settings/restaurant', {
      method: 'PATCH',
      body: JSON.stringify({ restaurantSettings }),
    });
  }

  async updateDeviceToken(deviceToken) {
    if (!this.userId || !deviceToken) return null;
    return await this.apiCall(`/resource/users/${this.userId}`, {
      method: 'PUT',
      body: JSON.stringify({ deviceToken }),
    });
  }

  async addMenuItem(menuItem) {
    return await this.apiCall('/resource/products', {
      method: 'POST',
      body: JSON.stringify(menuItem),
    });
  }

  async updateMenuItem(itemId, updates) {
    return await this.apiCall(`/resource/products/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteMenuItem(itemId) {
    return await this.apiCall(`/resource/products/${itemId}`, {
      method: 'DELETE',
    });
  }

  async toggleMenuItemAvailability(itemId, available) {
    return await this.apiCall(`/resource/products/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ availability: available }),
    });
  }

  async getSettings() {
    const raw = await this.apiCall('/resource/settings');
    const doc = Array.isArray(raw) ? raw[0] : raw;
    return { data: doc };
  }

  /** Devises disponibles (réf. Mongo pour le champ `currency` du Setting global). */
  async listCurrencies() {
    const raw = await this.apiCall('/resource/currencies');
    return Array.isArray(raw) ? raw : [];
  }

  /** Taxes disponibles (réf. Mongo pour le champ `tax` du Restaurant). */
  async listTaxes() {
    const raw = await this.apiCall('/resource/taxes');
    return Array.isArray(raw) ? raw : [];
  }

  /** Catégories cuisine (collection Category → `Restaurant.categories`). */
  async listCategories() {
    const raw = await this.apiCall('/resource/categories');
    return Array.isArray(raw) ? raw : [];
  }

  async listVariants() {
    const raw = await this.apiCall('/resource/variants');
    return Array.isArray(raw) ? raw : [];
  }

  /** Met à jour le Setting global (ex. `currency`: ObjectId). */
  async updateSettingsDocument(settingsId, patch) {
    return await this.apiCall(`/resource/settings/${settingsId}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
  }

  async getRestaurantReviews() {
    const rid = this.resolveRestaurantPlaceId();
    const raw = await this.apiCall('/resource/reviews');
    return buildRestaurantReviewsResult(rid, raw);
  }

  async replyToReview(reviewId, replyText) {
    const text = (replyText || '').trim();
    return await this.apiCall(`/resource/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify({
        reply: {
          text,
          date: new Date().toISOString(),
          by: this.userId || this.restaurant?._id || this.restaurant?.id,
        },
      }),
    });
  }

  async getRestaurantAnalytics(period = 'today') {
    const [{ data: orders }, reviewsRes] = await Promise.all([
      this.getRestaurantOrders(),
      this.getRestaurantReviews(),
    ]);
    const reviews = Array.isArray(reviewsRes?.data?.reviews) ? reviewsRes.data.reviews : [];
    const data = buildRestaurantAnalyticsData(period, orders, reviews);
    return { success: true, data };
  }

  async getNotifications() {
    const raw = await this.apiCall('/resource/notifications');
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    return [];
  }

  async updateNotification(notificationId, patch) {
    return await this.apiCall(`/resource/notifications/${notificationId}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
  }

  async deleteNotification(notificationId) {
    return await this.apiCall(`/resource/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  async getOrderById(orderId) {
    const id = typeof orderId === 'object' && orderId
      ? (orderId._id || orderId.id)
      : orderId;
    if (!id) {
      throw new Error('Missing order id');
    }
    const raw = await this.apiCall(`/resource/orders/${encodeURIComponent(String(id))}`);
    const order = raw?.data && (raw.data._id || raw.data.id) ? raw.data : raw;
    if (!order || !(order._id || order.id)) {
      throw new Error('Order not found');
    }
    return order;
  }

  async listSubscriptionPlans(target) {
    const query = target ? `?target=${encodeURIComponent(target)}` : '';
    return await this.apiCall(`/subscriptions${query}`);
  }

  async getMySubscription() {
    return await this.apiCall('/subscriptions/mine');
  }

  async getSubscriptionBenefits() {
    return await this.apiCall('/subscriptions/mine/benefits');
  }

  async subscribeToPlan(planId) {
    return await this.apiCall(`/subscriptions/${planId}/subscribe`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async cancelMySubscription() {
    return await this.apiCall('/subscriptions/mine/cancel', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async createImageLink(imageUri) {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'upload.jpg',
    });
    return await this.apiCallMultipart('/upload/get-imgbb-link', {
      method: 'POST',
      body: formData,
    });
  }
  
  async uploadImageToCloudinary(imageUri) {
    try {
      // 1. demander signature au backend
      const sig = await this.apiCall('/upload/cloudinary-signature', {
        method: 'GET',
      });
  
      // 2. construire form data
      const formData = new FormData();
  
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'upload.jpg',
      });
  
      formData.append('api_key', sig.apiKey);
      formData.append('timestamp', sig.timestamp);
      formData.append('signature', sig.signature);
  
      // optionnel (si tu utilises un upload preset)
      // formData.append('upload_preset', 'YOUR_PRESET');
  
      // 3. upload direct vers Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data?.error?.message || 'Cloudinary upload failed');
      }
  
      // 4. retourner URL optimisée
      return {
        url: data.secure_url,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
      };
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      throw error;
    }
  }
}

const apiClient = new ApiClient();
// Hermes E2E reads this instead of brute-forcing Metro module ids (which crashes RN).
if (typeof globalThis !== 'undefined') {
  globalThis.__GOODFOOD_RESTAURANT_API__ = apiClient;
}
export default apiClient;

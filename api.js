import { config as appConfig } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeOrdersPayload } from './utils/apiPayloadUtils';
import { resolveRestaurantPlaceId as resolveRestaurantId } from './utils/restaurantIdUtils';
import { buildRestaurantReviewsResult } from './utils/restaurantReviewUtils';
import { buildRestaurantStatsData } from './utils/restaurantStatsUtils';
import { buildRestaurantAnalyticsData } from './utils/restaurantAnalyticsUtils';

const API_BASE_URL = appConfig.API_BASE_URL;
const API_TIMEOUT = appConfig.API_TIMEOUT;

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
      }
    } catch (error) {
      console.error('Error initializing restaurant from storage:', error);
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
    const url = `${API_BASE_URL}${endpoint}`;
    const fetchOptions = {
      ...options,
      headers: {
        ...this.getHeaders(),
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
      return data;
    } catch (error) {
      console.error(`❌ API Error: ${endpoint}`, error);
      throw error;
    }
  }

  async restaurantLogin(email, password) {
    const response = await this.apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response.user && response.token) {
      this.restaurant = response.user;
      this.token = response.token;
      this.userId = response.user._id || response.user.id || null;
    }
    return response;
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

  async addMenuItem(menuItem) {
    const rid = this.resolveRestaurantPlaceId();
    const body = { ...menuItem, ...(rid ? { restaurant: rid } : {}) };
    return await this.apiCall('/resource/products', {
      method: 'POST',
      body: JSON.stringify(body),
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
}

const apiClient = new ApiClient();
export default apiClient;

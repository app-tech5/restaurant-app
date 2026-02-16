// API Client pour l'application restaurant
import { config } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fonction utilitaire pour vérifier si on est en mode démo
const isDemoMode = () => config.DEMO_MODE === true;

const API_BASE_URL = config.API_BASE_URL;
const API_TIMEOUT = config.API_TIMEOUT;

class ApiClient {
  constructor() {
    this.token = null;
    this.restaurant = null;
    this.initializeFromStorage();
  }

  // Initialisation automatique depuis AsyncStorage
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

  // Configuration des headers avec token si disponible
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Méthode générique pour les appels API
  async apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
      timeout: API_TIMEOUT,
    };

    try {
      console.log(`🚀 API Call: ${options.method || 'GET'} ${url}`);

      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ API Success: ${endpoint}`)
      // console.log(`✅ API Success: ${endpoint}`, data);
      return data;

    } catch (error) {
      console.error(`❌ API Error: ${endpoint}`, error);

      // En mode démo, on peut retourner des données mockées
      if (isDemoMode() && endpoint.includes('stats')) {
        return this.getMockData(endpoint);
      }

      throw error;
    }
  }

  // Données mockées pour le mode démo
  getMockData(endpoint) {
    if (endpoint.includes('stats')) {
      return {
        todayOrders: 12,
        totalRevenue: 245.50,
        averageRating: 4.2,
        completedOrders: 89,
        pendingOrders: 3,
        activeMenuItems: 24
      };
    }

    if (endpoint.includes('orders')) {
      return [
        {
          _id: 'demo-order-1',
          customerName: 'Jean Dupont',
          customerPhone: '+33123456789',
          items: [
            { name: 'Pizza Margherita', quantity: 1, price: 12.50 },
            { name: 'Coca-Cola', quantity: 2, price: 2.50 }
          ],
          total: 17.50,
          status: 'pending',
          createdAt: new Date().toISOString(),
          estimatedTime: 25
        }
      ];
    }

    if (endpoint.includes('menu')) {
      return [
        {
          _id: 'demo-item-1',
          name: 'Pizza Margherita',
          description: 'Tomate, mozzarella, basilic',
          price: 12.50,
          category: 'Pizzas',
          available: true,
          image: null
        },
        {
          _id: 'demo-item-2',
          name: 'Pasta Carbonara',
          description: 'Pâtes, crème, lardons, parmesan',
          price: 14.00,
          category: 'Pâtes',
          available: true,
          image: null
        }
      ];
    }

    return null;
  }

  // === AUTHENTIFICATION ===

  // Connexion restaurant
  async restaurantLogin(email, password) {
    // En mode démo, utiliser les credentials de démo pour se connecter à la vraie API
    const loginEmail = isDemoMode() ? config.DEMO_EMAIL : email;
    const loginPassword = isDemoMode() ? config.DEMO_PASSWORD : password;

    const response = await this.apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    });

    if (response.user && response.token) {
      this.restaurant = response.user;
      this.token = response.token;
    }

    return response;
  }

  // Profil restaurant
  async getRestaurantProfile() {
    if (isDemoMode()) {
      return this.restaurant || {
        _id: 'demo-restaurant-1',
        name: 'Demo Restaurant',
        email: config.DEMO_EMAIL,
        phone: '+33123456789',
        address: '123 Rue de la Demo, 75001 Paris',
        type: 'restaurant',
        status: 'active'
      };
    }

    return await this.apiCall('/restaurant/profile');
  }

  // Déconnexion
  async logout() {
    this.token = null;
    this.restaurant = null;

    try {
      await AsyncStorage.multiRemove(['restaurantToken', 'restaurantData']);
    } catch (error) {
      console.error('Error clearing storage on logout:', error);
    }

    return { success: true };
  }

  // === STATISTIQUES ===

  // Statistiques du restaurant
  async getRestaurantStats() {
    return await this.apiCall('/restaurant/stats');
  }

  // === COMMANDES ===

  // Liste des commandes
  async getRestaurantOrders(status = null) {
    const endpoint = status ? `/restaurant/orders?status=${status}` : '/restaurant/orders';
    return await this.apiCall(endpoint);
  }

  // Accepter une commande
  async acceptOrder(orderId) {
    if (isDemoMode()) {
      return { success: true, message: 'Commande acceptée' };
    }

    return await this.apiCall(`/restaurant/orders/${orderId}/accept`, {
      method: 'POST',
    });
  }

  // Préparer une commande
  async prepareOrder(orderId) {
    if (isDemoMode()) {
      return { success: true, message: 'Préparation démarrée' };
    }

    return await this.apiCall(`/restaurant/orders/${orderId}/prepare`, {
      method: 'POST',
    });
  }

  // Commande prête
  async readyForPickup(orderId) {
    if (isDemoMode()) {
      return { success: true, message: 'Commande prête' };
    }

    return await this.apiCall(`/restaurant/orders/${orderId}/ready`, {
      method: 'POST',
    });
  }

  // Changer le statut d'une commande
  async updateOrderStatus(orderId, status) {
    if (isDemoMode()) {
      return { success: true, message: `Statut changé à ${status}` };
    }

    return await this.apiCall(`/restaurant/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // === MENU ===

  // Récupérer le menu
  async getRestaurantMenu() {
    // if (isDemoMode()) {
    //   return this.getMockData('/menu');
    // }

    return await this.apiCall('/restaurant/menu');
  }

  // Mettre à jour le profil du restaurant
  async updateRestaurantProfile(profileData) {
    if (isDemoMode()) {
      return { success: true, message: 'Profil mis à jour', data: profileData };
    }

    return await this.apiCall('/restaurant/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Récupérer les paramètres utilisateur
  async getUserSettings() {
    return await this.apiCall('/user-settings');
  }

  // Mettre à jour les paramètres utilisateur
  async updateUserSettings(settingsData) {
    if (isDemoMode()) {
      return { success: true, message: 'Paramètres mis à jour', data: settingsData };
    }

    return await this.apiCall('/user-settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  }

  // Mettre à jour seulement les notifications
  async updateNotifications(notifications) {
    if (isDemoMode()) {
      return { success: true, message: 'Notifications mises à jour', data: notifications };
    }

    return await this.apiCall('/user-settings/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ notifications }),
    });
  }

  // Mettre à jour seulement les paramètres restaurant
  async updateRestaurantSettings(restaurantSettings) {
    if (isDemoMode()) {
      return { success: true, message: 'Paramètres restaurant mis à jour', data: restaurantSettings };
    }

    return await this.apiCall('/user-settings/restaurant', {
      method: 'PATCH',
      body: JSON.stringify({ restaurantSettings }),
    });
  }

  // Ajouter un élément au menu
  async addMenuItem(menuItem) {
    if (isDemoMode()) {
      return {
        success: true,
        item: { ...menuItem, _id: 'demo-' + Date.now() }
      };
    }

    return await this.apiCall('/restaurant/menu', {
      method: 'POST',
      body: JSON.stringify(menuItem),
    });
  }

  // Modifier un élément du menu
  async updateMenuItem(itemId, updates) {
    if (isDemoMode()) {
      return { success: true, message: 'Élément mis à jour' };
    }

    return await this.apiCall(`/restaurant/menu/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Supprimer un élément du menu
  async deleteMenuItem(itemId) {
    if (isDemoMode()) {
      return { success: true, message: 'Élément supprimé' };
    }

    return await this.apiCall(`/restaurant/menu/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Changer la disponibilité d'un élément
  async toggleMenuItemAvailability(itemId, available) {
    if (isDemoMode()) {
      return { success: true, message: `Élément ${available ? 'activé' : 'désactivé'}` };
    }

    return await this.apiCall(`/restaurant/menu/${itemId}/availability`, {
      method: 'PUT',
      body: JSON.stringify({ available }),
    });
  }

  // === PARAMÈTRES ===

  // Récupérer les paramètres
  async getSettings() {
    // if (isDemoMode()) {
    //   return {
    //     success: true,
    //     data: {
    //       currency: { code: 'EUR', symbol: '€', name: 'Euro', value: 'EUR', label: 'EUR - Euro' },
    //       language: { code: 'fr', name: 'Français', isDefault: true },
    //       appName: 'Good Food Restaurant'
    //     }
    //   };
    // }

    return await this.apiCall('/settings');
  }

  // === LANGUES ===

  // Récupérer toutes les langues disponibles
  async getLanguages() {
    // if (isDemoMode()) {
    //   return {
    //     success: true,
    //     data: [
    //       { _id: '1', code: 'fr', name: 'Français', isDefault: true },
    //       { _id: '2', code: 'en', name: 'English', isDefault: false }
    //     ]
    //   };
    // }

    try {
      const response = await this.apiCall('/languages');
      return { success: true, data: response };
    } catch (error) {
      console.error('Error fetching languages:', error);
      return { success: false, error: error.message };
    }
  }

  // Changer la langue de l'utilisateur
  async changeUserLanguage(languageCode) {
    if (isDemoMode()) {
      // En mode démo, on sauvegarde juste localement
      try {
        await AsyncStorage.setItem('userLanguage', languageCode);
        return { success: true, message: 'Langue changée' };
      } catch (error) {
        return { success: false, error: 'Erreur de sauvegarde' };
      }
    }

    try {
      const response = await this.apiCall('/user/language', {
        method: 'PUT',
        body: JSON.stringify({ language: languageCode })
      });
      return { success: true, data: response };
    } catch (error) {
      console.error('Error changing language:', error);
      return { success: false, error: error.message };
    }
  }

  // === AVIS CLIENTS ===

  // Récupérer les avis du restaurant
  async getRestaurantReviews() {
    return await this.apiCall('/restaurant/reviews');
  }

  // Répondre à un avis
  async replyToReview(reviewId, replyText) {
    if (isDemoMode()) {
      return { success: true, message: 'Réponse ajoutée' };
    }

    return await this.apiCall(`/restaurant/reviews/${reviewId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ text: replyText }),
    });
  }

  // === ANALYTICS ===

  // Récupérer les analytics du restaurant
  async getRestaurantAnalytics(period = 'today') {
    return await this.apiCall(`/restaurant/analytics?period=${period}`);
  }
}

// Instance unique de l'API client
const apiClient = new ApiClient();

export default apiClient;

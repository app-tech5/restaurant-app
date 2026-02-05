// Configuration globale de l'application restaurant

export const config = {
  // === MODE DÉVELOPPEMENT ===
  DEMO_MODE: __DEV__, // Automatiquement true en développement

  // === DONNÉES DÉMO ===
  DEMO_EMAIL: 'demo@restaurant.com',
  DEMO_PASSWORD: 'demo123',

  // === API CONFIGURATION ===
  API_BASE_URL: __DEV__
    ? 'http://localhost:3000/api'  // Développement
    : 'https://api.goodfood.com/api', // Production

  API_TIMEOUT: 10000, // 10 secondes

  // === APPLICATION INFO ===
  APP_NAME: 'Good Food Restaurant',
  VERSION: '1.0.0',
  BUILD_NUMBER: '1',

  // === FONCTIONNALITÉS ===
  ENABLE_NOTIFICATIONS: true,
  ENABLE_LOCATION: true,
  ENABLE_CAMERA: true,
  ENABLE_ANIMATIONS: true,

  // === CACHE CONFIGURATION ===
  CACHE_ENABLED: true,
  CACHE_DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  CACHE_LONG_TTL: 30 * 60 * 1000, // 30 minutes

  // === LIMITES APPLICATION ===
  MAX_MENU_ITEMS: 100,
  MAX_ORDER_ITEMS: 50,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB

  // === CONSTANTES RESTAURANT ===
  DEFAULT_PREPARATION_TIME: 15, // minutes
  DEFAULT_DELIVERY_RADIUS: 5, // km
  MIN_ORDER_AMOUNT: 5.00, // €
  DEFAULT_TAX_RATE: 20, // %

  // === TIMERS ===
  ORDER_REFRESH_INTERVAL: 30000, // 30 secondes
  STATS_REFRESH_INTERVAL: 60000, // 1 minute
  LOCATION_UPDATE_INTERVAL: 10000, // 10 secondes

  // === ANALYTICS ===
  ENABLE_ANALYTICS: true,
  ANALYTICS_TRACKING_ID: 'restaurant-app',

  // === SUPPORT ===
  SUPPORT_EMAIL: 'support@goodfood.com',
  SUPPORT_PHONE: '+33123456789',

  // === PAIEMENT ===
  ENABLE_PAYMENT: true,
  PAYMENT_CURRENCIES: ['EUR', 'USD', 'GBP'],
  DEFAULT_CURRENCY: 'EUR',

  // === THÈME ===
  THEME: {
    primary: '#FF6B35',
    secondary: '#F7931E',
    accent: '#FFD700',
  },

  // === VALIDATION ===
  VALIDATION: {
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      maxLength: 100,
    },
    password: {
      minLength: 6,
      maxLength: 50,
    },
    phone: {
      pattern: /^[\+]?[0-9\s\-\(\)]{10,}$/,
      maxLength: 20,
    },
    restaurantName: {
      minLength: 2,
      maxLength: 50,
    },
    menuItemName: {
      minLength: 1,
      maxLength: 30,
    },
    menuItemDescription: {
      maxLength: 200,
    },
    price: {
      min: 0.01,
      max: 999.99,
    },
  },
};

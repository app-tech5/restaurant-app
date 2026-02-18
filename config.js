
export const config = {
  
  DEMO_MODE: __DEV__, 
  
  DEMO_EMAIL: 'demo@restaurant.com',
  DEMO_PASSWORD: 'password123',

  API_BASE_URL: __DEV__
    ? 'http://localhost:5000/api'  
    : 'https://api.goodfood.com/api', 

  API_TIMEOUT: 10000, 
  
  APP_NAME: 'Good Food',
  APP_SUBTITLE: 'Restaurant',
  VERSION: '1.0.0',
  BUILD_NUMBER: '1',
  
  ENABLE_NOTIFICATIONS: true,
  ENABLE_LOCATION: true,
  ENABLE_CAMERA: true,
  ENABLE_ANIMATIONS: true,
  
  CACHE_ENABLED: true,
  CACHE_DEFAULT_TTL: 5 * 60 * 1000, 
  CACHE_LONG_TTL: 30 * 60 * 1000, 
  
  MAX_MENU_ITEMS: 100,
  MAX_ORDER_ITEMS: 50,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, 
  
  DEFAULT_PREPARATION_TIME: 15, 
  DEFAULT_DELIVERY_RADIUS: 5, 
  MIN_ORDER_AMOUNT: 5.00, 
  DEFAULT_TAX_RATE: 20, 
  
  ORDER_REFRESH_INTERVAL: 30000, 
  STATS_REFRESH_INTERVAL: 60000, 
  LOCATION_UPDATE_INTERVAL: 10000, 
  
  ENABLE_ANALYTICS: true,
  ANALYTICS_TRACKING_ID: 'restaurant-app',
  
  SUPPORT_EMAIL: 'support@goodfood.com',
  SUPPORT_PHONE: '+33123456789',
  
  ENABLE_PAYMENT: true,
  PAYMENT_CURRENCIES: ['EUR', 'USD', 'GBP'],
  DEFAULT_CURRENCY: 'EUR',
  
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

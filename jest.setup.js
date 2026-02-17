import '@testing-library/jest-native/extend-expect';

// Global AsyncStorage mock - must be first
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  mergeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
  multiMerge: jest.fn(),
}));

// Mock i18n-js to avoid ES6 module issues
const mockT = jest.fn((key, options) => {
  const translations = {
    'notifications.newOrder': 'Nouvelle commande',
    'notifications.newOrderMessage': 'Commande #{{orderNumber}} reçue pour {{items}}',
    'notifications.maintenanceScheduled': 'Maintenance programmée',
    'notifications.maintenanceMessage': 'Le système sera en maintenance demain de 2h à 4h',
    'notifications.newReview': 'Nouvel avis client',
    'notifications.newReviewMessage': 'Note {{rating}}/5 pour votre restaurant',
    'notifications.orderReady': 'Commande prête',
    'notifications.orderReadyMessage': 'La commande #{{orderNumber}} est prête pour le retrait',
    'notifications.timeAgo.minutes': 'Il y a {{count}} min',
    'notifications.timeAgo.hours': 'Il y a {{count}}h',
    'notifications.timeAgo.days': 'Il y a {{count}}j',
    'notifications.filters.all': 'Toutes',
    'notifications.filters.unread': 'Non lues',
    'notifications.filters.orders': 'Commandes',
    'notifications.filters.system': 'Système',
    'notifications.empty.title': 'Aucune notification',
    'notifications.empty.all': 'Vous n\'avez pas de notifications pour le moment',
    'notifications.empty.filter': 'Aucune notification dans la catégorie "{{filter}}"',
    'notifications.actions.markAllRead': 'Marquer tout comme lu',
    'notifications.actions.clearAll': 'Supprimer toutes les notifications',
    'notifications.actions.clearAllTitle': 'Supprimer toutes les notifications',
    'notifications.actions.clearAllMessage': 'Êtes-vous sûr de vouloir supprimer toutes les notifications ?',
    'notifications.actions.clearAllConfirm': 'Supprimer',
    'navigation.notifications': 'Notifications',
    'common.noData': 'Aucune donnée disponible',
    'common.cancel': 'Annuler',
  };

  let result = translations[key] || key;

  // Handle interpolation
  if (options) {
    // Handle all interpolations including count
    Object.keys(options).forEach(optionKey => {
      result = result.replace(new RegExp(`{{${optionKey}}}`, 'g'), options[optionKey]);
      result = result.replace(new RegExp(`{{count}}`, 'g'), options[optionKey]);
    });
  }

  return result;
});

jest.mock('i18n-js', () => ({
  I18n: jest.fn().mockImplementation(() => ({
    t: mockT,
    defaultLocale: 'en',
    locale: 'fr',
    translations: { en: {}, fr: {} },
  })),
}));

// Also mock the default export
jest.mock('../i18n', () => ({
  t: mockT,
  default: {
    t: mockT,
    defaultLocale: 'en',
    locale: 'fr',
    translations: { en: {}, fr: {} },
  },
}));


// Mock expo-font
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));

// Mock expo-localization
jest.mock('expo-localization', () => ({
  locale: 'fr-FR',
  locales: ['fr-FR'],
  timezone: 'Europe/Paris',
  isoCurrencyCodes: ['EUR'],
  region: 'FR',
  isRTL: false,
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  withTiming: jest.fn(() => ({ value: 0 })),
  runOnJS: jest.fn((fn) => fn()),
  runOnUI: jest.fn((fn) => fn()),
}));

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');

  const MockMapView = React.forwardRef((props, ref) => (
    <View ref={ref} {...props} testID="mock-map-view" />
  ));

  const MockMarker = (props) => <View {...props} testID="mock-marker" />;

  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    PROVIDER_GOOGLE: 'google',
  };
});

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: 48.8566,
        longitude: 2.3522,
        accuracy: 5,
      },
    })
  ),
}));

// Mock other libraries
jest.mock('react-native-modal', () => 'MockModal');
jest.mock('react-native-linear-gradient', () => 'MockLinearGradient');
jest.mock('expo-linear-gradient', () => 'MockExpoLinearGradient');
jest.mock('react-native-svg', () => ({
  Svg: 'MockSvg',
  Path: 'MockPath',
  Circle: 'MockCircle',
  Rect: 'MockRect',
}));
jest.mock('react-native-bouncy-checkbox', () => 'MockBouncyCheckbox');
jest.mock('react-native-animatable', () => ({
  View: 'MockAnimatableView',
  Text: 'MockAnimatableText',
}));
jest.mock('react-native-google-places-autocomplete', () => 'MockGooglePlaces');
jest.mock('react-native-maps-directions', () => 'MockMapsDirections');
jest.mock('react-native-worklets', () => ({
  runOnUI: jest.fn((fn) => fn()),
  runOnJS: jest.fn((fn) => fn()),
}));
jest.mock('react-native-gesture-handler', () => ({
  PanGestureHandler: 'MockPanGestureHandler',
  State: {},
}));
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: { latitude: 0, longitude: 0 }
  })),
}));

// Global test utilities
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Keep error and warn for debugging
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

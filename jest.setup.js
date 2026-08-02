import '@testing-library/jest-native/extend-expect';
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
const mockT = jest.fn((key, options) => {
  const translations = {
    'notifications.newOrder': 'New order',
    'notifications.newOrderMessage': 'Order #{{orderNumber}} received for {{items}}',
    'notifications.maintenanceScheduled': 'Scheduled maintenance',
    'notifications.maintenanceMessage': 'The system will be under maintenance tomorrow from 2am to 4am',
    'notifications.newReview': 'New customer review',
    'notifications.newReviewMessage': 'Rating {{rating}}/5 for your restaurant',
    'notifications.orderReady': 'Order ready',
    'notifications.orderReadyMessage': 'Order #{{orderNumber}} is ready for pickup',
    'notifications.timeAgo.minutes': '{{count}} min ago',
    'notifications.timeAgo.hours': '{{count}}h ago',
    'notifications.timeAgo.days': '{{count}}d ago',
    'notifications.filters.all': 'All',
    'notifications.filters.unread': 'Unread',
    'notifications.filters.orders': 'Orders',
    'notifications.filters.system': 'System',
    'notifications.empty.title': 'No notifications',
    'notifications.empty.all': 'You have no notifications at the moment',
    'notifications.empty.filter': 'No notifications in the "{{filter}}" category',
    'notifications.actions.markAllRead': 'Mark all as read',
    'notifications.actions.clearAll': 'Clear all notifications',
    'notifications.actions.clearAllTitle': 'Clear all notifications',
    'notifications.actions.clearAllMessage': 'Are you sure you want to delete all notifications?',
    'notifications.actions.clearAllConfirm': 'Delete',
    'navigation.notifications': 'Notifications',
    'common.noData': 'No data available',
    'common.cancel': 'Cancel',
  };

  let result = translations[key] || key;

  if (options) {
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
jest.mock('../i18n', () => ({
  t: mockT,
  default: {
    t: mockT,
    defaultLocale: 'en',
    locale: 'fr',
    translations: { en: {}, fr: {} },
  },
}));
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
}));
jest.mock('expo-localization', () => ({
  locale: 'fr-FR',
  locales: ['fr-FR'],
  timezone: 'Europe/Paris',
  isoCurrencyCodes: ['EUR'],
  region: 'FR',
  isRTL: false,
}));
jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  withTiming: jest.fn(() => ({ value: 0 })),
  runOnJS: jest.fn((fn) => fn()),
  runOnUI: jest.fn((fn) => fn()),
}));
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
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
global.fetch = jest.fn();
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

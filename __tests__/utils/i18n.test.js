// Mock AsyncStorage before importing i18n
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import i18n, { initializeLanguage, changeLanguage, getCurrentLanguage, hasTranslation } from '../../i18n';

describe('i18n', () => {
  beforeEach(() => {
    // Reset i18n state before each test
    i18n.locale = 'en';
    jest.clearAllMocks();
  });

  describe('initializeLanguage', () => {
    it('should be a function', () => {
      expect(typeof initializeLanguage).toBe('function');
    });

    it('should initialize language from AsyncStorage', async () => {
      const mockAsyncStorage = require('@react-native-async-storage/async-storage');
      mockAsyncStorage.getItem.mockResolvedValue('fr');

      await initializeLanguage();

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('userLanguage');
    });
  });

  describe('changeLanguage', () => {
    it('should be a function', () => {
      expect(typeof changeLanguage).toBe('function');
    });
  });

  describe('getCurrentLanguage', () => {
    it('should be a function', () => {
      expect(typeof getCurrentLanguage).toBe('function');
    });
  });

  describe('hasTranslation', () => {
    it('should be a function', () => {
      expect(typeof hasTranslation).toBe('function');
    });
  });

  describe('i18n instance', () => {
    it('should have translation function', () => {
      expect(typeof i18n.t).toBe('function');
    });

    it('should translate basic keys', () => {
      expect(i18n.t('navigation.notifications')).toBe('Notifications');
    });
  });
});

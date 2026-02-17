// Mock AsyncStorage before importing anything that uses it
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

// Mock i18n for this specific test
jest.mock('../../i18n', () => ({
  t: jest.fn((key, options) => {
    const translations = {
      'notifications.timeAgo.minutes': 'Il y a {{count}} min',
      'notifications.timeAgo.hours': 'Il y a {{count}}h',
      'notifications.timeAgo.days': 'Il y a {{count}}j',
    };

    let result = translations[key] || key;

    if (options) {
      Object.keys(options).forEach(optionKey => {
        result = result.replace(new RegExp(`{{${optionKey}}}`, 'g'), options[optionKey]);
        result = result.replace(new RegExp(`{{count}}`, 'g'), options[optionKey]);
      });
    }

    return result;
  }),
}));

import { formatTimeAgo } from '../../utils/timeUtils';

describe('timeUtils', () => {
  const now = new Date('2024-01-15T12:00:00Z');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('formatTimeAgo', () => {
    it('should format minutes correctly', () => {
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      expect(formatTimeAgo(fiveMinutesAgo)).toBe('Il y a 5 min');

      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
      expect(formatTimeAgo(oneMinuteAgo)).toBe('Il y a 1 min');
    });

    it('should format hours correctly', () => {
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(formatTimeAgo(twoHoursAgo)).toBe('Il y a 2h');

      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
      expect(formatTimeAgo(oneHourAgo)).toBe('Il y a 1h');
    });

    it('should format days correctly', () => {
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      expect(formatTimeAgo(threeDaysAgo)).toBe('Il y a 3j');

      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      expect(formatTimeAgo(oneDayAgo)).toBe('Il y a 1j');
    });

    it('should handle edge cases', () => {
      const justNow = new Date(now.getTime() - 10 * 1000); // 10 seconds ago
      expect(formatTimeAgo(justNow)).toBe('Il y a 0 min');

      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      expect(formatTimeAgo(twentyFourHoursAgo)).toBe('Il y a 1j');
    });

    it('should handle future dates', () => {
      const futureDate = new Date(now.getTime() + 60 * 1000); // 1 minute in future
      expect(formatTimeAgo(futureDate)).toBe('Il y a 1 min');
    });
  });
});

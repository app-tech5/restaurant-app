// Mock i18n for this test
jest.mock('../../i18n', () => ({
  t: jest.fn((key, options) => {
    const translations = {
      'reports.charts.statusDistribution': 'Status Distribution',
      'reports.charts.mostOrderedDishes': 'Most Ordered Dishes',
      'reports.charts.revenueByDay': 'Revenue by Day',
      'reports.charts.mostProfitableDishes': 'Most Profitable Dishes',
      'reports.charts.peakHours': 'Peak Hours',
      'reports.charts.status.delivered': 'Delivered',
      'reports.charts.status.ready': 'Ready',
      'reports.charts.status.preparing': 'Preparing',
      'reports.charts.status.accepted': 'Accepted',
      'reports.charts.status.pending': 'Pending',
      'reports.charts.status.cancelled': 'Cancelled',
      'reports.charts.units.orders': 'orders',
      'reports.charts.units.ordersAbbrev': 'ord'
    };

    let result = translations[key] || key;

    if (options) {
      Object.keys(options).forEach(optionKey => {
        const placeholder = `{{${optionKey}}}`;
        result = result.replace(new RegExp(placeholder, 'g'), options[optionKey]);
      });
    }

    return result;
  }),
  locale: 'en'
}));

import React from 'react';
import { render } from '@testing-library/react-native';
import ReportCharts from '../../components/ReportCharts';

// Mock react-native-elements
jest.mock('react-native-elements', () => ({
  Card: ({ children, containerStyle }) => (
    <div style={containerStyle} testID="card">
      {children}
    </div>
  )
}));

// Mock formatPrice utility
jest.mock('../../utils/restaurantUtils', () => ({
  formatPrice: jest.fn((price) => `$${price}`)
}));

describe('ReportCharts Component', () => {
  const mockCalculations = {
    ordersByStatus: {
      delivered: 10,
      ready: 5,
      preparing: 3,
      accepted: 2,
      pending: 1,
      cancelled: 0
    },
    topItems: [
      { name: 'Burger', count: 15 },
      { name: 'Pizza', count: 12 }
    ],
    revenueByDay: [
      { date: new Date('2024-01-01'), revenue: 100 },
      { date: new Date('2024-01-02'), revenue: 150 }
    ],
    topRevenueItems: [
      { name: 'Burger', revenue: 200 },
      { name: 'Pizza', revenue: 180 }
    ],
    peakHours: [
      { hour: 12, count: 8 },
      { hour: 19, count: 12 }
    ],
    showStatusChart: true,
    showTopItems: true,
    showRevenueChart: true,
    showTopRevenueItems: true,
    showPeakHours: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Status Chart', () => {
    it('renders status chart with correct translations', () => {
      const { getByText } = render(
        <ReportCharts calculations={mockCalculations} reportType="daily" />
      );

      expect(getByText('Status Distribution')).toBeTruthy();
      expect(getByText('Delivered')).toBeTruthy();
      expect(getByText('10')).toBeTruthy();
      expect(getByText('Ready')).toBeTruthy();
      expect(getByText('5')).toBeTruthy();
    });

    it('does not render cancelled status when count is 0', () => {
      const { queryByText } = render(
        <ReportCharts calculations={mockCalculations} reportType="daily" />
      );

      expect(queryByText('Cancelled')).toBeNull();
    });
  });

  describe('Top Items Chart', () => {
    it('renders top items chart with correct translations', () => {
      const { getByText, getAllByText } = render(
        <ReportCharts calculations={mockCalculations} reportType="daily" />
      );

      expect(getByText('Most Ordered Dishes')).toBeTruthy();
      const burgerElements = getAllByText('Burger');
      expect(burgerElements.length).toBeGreaterThan(0);
      expect(getByText('15 ord')).toBeTruthy();
      expect(getByText('Pizza')).toBeTruthy();
      expect(getByText('12 ord')).toBeTruthy();
    });
  });

  describe('Revenue Chart', () => {
    it('renders revenue chart with correct translations', () => {
      const { getByText } = render(
        <ReportCharts calculations={mockCalculations} reportType="daily" />
      );

      expect(getByText('Revenue by Day')).toBeTruthy();
      expect(getByText('$100')).toBeTruthy();
      expect(getByText('$150')).toBeTruthy();
    });

    it('formats dates correctly for English locale', () => {
      const { getByText } = render(
        <ReportCharts calculations={mockCalculations} reportType="daily" />
      );

      // Should show abbreviated day names for English locale
      // Jan 1, 2024 is a Monday, Jan 2, 2024 is a Tuesday
      expect(getByText('Mon 1')).toBeTruthy();
      expect(getByText('Tue 2')).toBeTruthy();
    });
  });

  describe('Top Revenue Items Chart', () => {
    it('renders top revenue items chart with correct translations', () => {
      const { getByText } = render(
        <ReportCharts calculations={mockCalculations} reportType="daily" />
      );

      expect(getByText('Most Profitable Dishes')).toBeTruthy();
      expect(getByText('$200')).toBeTruthy();
      expect(getByText('$180')).toBeTruthy();
    });
  });

  describe('Peak Hours Chart', () => {
    it('renders peak hours chart with correct translations', () => {
      const { getByText } = render(
        <ReportCharts calculations={mockCalculations} reportType="daily" />
      );

      expect(getByText('Peak Hours')).toBeTruthy();
      expect(getByText('12h - 13h')).toBeTruthy();
      expect(getByText('8 orders')).toBeTruthy();
      expect(getByText('19h - 20h')).toBeTruthy();
      expect(getByText('12 orders')).toBeTruthy();
    });
  });

  describe('Conditional Rendering', () => {
    it('does not render charts when show flags are false', () => {
      const hiddenCalculations = {
        ...mockCalculations,
        showStatusChart: false,
        showTopItems: false,
        showRevenueChart: false,
        showTopRevenueItems: false,
        showPeakHours: false
      };

      const { queryByText } = render(
        <ReportCharts calculations={hiddenCalculations} reportType="daily" />
      );

      expect(queryByText('Status Distribution')).toBeNull();
      expect(queryByText('Most Ordered Dishes')).toBeNull();
      expect(queryByText('Revenue by Day')).toBeNull();
      expect(queryByText('Most Profitable Dishes')).toBeNull();
      expect(queryByText('Peak Hours')).toBeNull();
    });

    it('does not render top items chart when topItems is empty', () => {
      const noTopItemsCalculations = {
        ...mockCalculations,
        topItems: []
      };

      const { queryByText } = render(
        <ReportCharts calculations={noTopItemsCalculations} reportType="daily" />
      );

      expect(queryByText('Most Ordered Dishes')).toBeNull();
    });

    it('does not render revenue chart when revenueByDay is empty', () => {
      const noRevenueCalculations = {
        ...mockCalculations,
        revenueByDay: []
      };

      const { queryByText } = render(
        <ReportCharts calculations={noRevenueCalculations} reportType="daily" />
      );

      expect(queryByText('Revenue by Day')).toBeNull();
    });

    it('does not render top revenue items chart when topRevenueItems is empty', () => {
      const noTopRevenueCalculations = {
        ...mockCalculations,
        topRevenueItems: []
      };

      const { queryByText } = render(
        <ReportCharts calculations={noTopRevenueCalculations} reportType="daily" />
      );

      expect(queryByText('Most Profitable Dishes')).toBeNull();
    });

    it('does not render peak hours chart when peakHours is empty', () => {
      const noPeakHoursCalculations = {
        ...mockCalculations,
        peakHours: []
      };

      const { queryByText } = render(
        <ReportCharts calculations={noPeakHoursCalculations} reportType="daily" />
      );

      expect(queryByText('Peak Hours')).toBeNull();
    });
  });

  describe('Language Switching', () => {
    it('displays French translations when locale is French', () => {
      // Mock French locale
      const i18n = require('../../i18n');
      i18n.t.mockImplementation((key, options) => {
        const frenchTranslations = {
          'reports.charts.statusDistribution': 'Répartition par statut',
          'reports.charts.mostOrderedDishes': 'Plats les plus commandés',
          'reports.charts.revenueByDay': 'Revenus par jour',
          'reports.charts.mostProfitableDishes': 'Plats les plus rentables',
          'reports.charts.peakHours': 'Heures de pointe',
          'reports.charts.status.delivered': 'Livrées',
          'reports.charts.status.ready': 'Prêtes',
          'reports.charts.status.preparing': 'En préparation',
          'reports.charts.status.accepted': 'Acceptées',
          'reports.charts.status.pending': 'En attente',
          'reports.charts.status.cancelled': 'Annulées',
          'reports.charts.units.orders': 'commandes',
          'reports.charts.units.ordersAbbrev': 'cmd'
        };

        let result = frenchTranslations[key] || key;

        if (options) {
          Object.keys(options).forEach(optionKey => {
            const placeholder = `{{${optionKey}}}`;
            result = result.replace(new RegExp(placeholder, 'g'), options[optionKey]);
          });
        }

        return result;
      });
      i18n.locale = 'fr';

      const { getByText } = render(
        <ReportCharts calculations={mockCalculations} reportType="daily" />
      );

      expect(getByText('Répartition par statut')).toBeTruthy();
      expect(getByText('Livrées')).toBeTruthy();
      expect(getByText('Plats les plus commandés')).toBeTruthy();
      expect(getByText('15 cmd')).toBeTruthy();
      expect(getByText('8 commandes')).toBeTruthy();
    });
  });
});

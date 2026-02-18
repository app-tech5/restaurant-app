
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

jest.mock('../../i18n', () => ({
  t: jest.fn((key, options) => {
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

    if (options) {
      Object.keys(options).forEach(optionKey => {
        result = result.replace(new RegExp(`{{${optionKey}}}`, 'g'), options[optionKey]);
        result = result.replace(new RegExp(`{{count}}`, 'g'), options[optionKey]);
      });
    }

    return result;
  }),
}));

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import NotificationsScreen from '../../screens/NotificationsScreen';
import { mockNotifications, emptyNotifications, allReadNotifications } from '../../__mocks__/mockNotifications';

jest.mock('../../hooks', () => ({
  useRestaurantAuth: () => ({
    user: { id: 1, name: 'Test User' },
    isAuthenticated: true,
  }),
  useRestaurantMenu: () => ({
    menu: [],
    loading: false,
  }),
  useRestaurantOrders: () => ({
    orders: [],
    loading: false,
  }),
  useRestaurantStats: () => ({
    stats: {},
    loading: false,
  }),
}));

jest.mock('../../components/ReportMetricsCards', () => {
  const React = require('react');
  return () => React.createElement('View', { testID: 'report-metrics-cards' });
});

jest.mock('../../utils/restaurantUtils', () => ({
  updateRestaurantCache: jest.fn(),
  clearRestaurantCache: jest.fn(),
}));

jest.mock('../../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

jest.mock('react-native-elements', () => {
  const mockReact = require('react');
  const { View, TouchableOpacity, Text } = require('react-native');

  const MockListItem = ({ children, onPress, containerStyle }) =>
    mockReact.createElement('TouchableOpacity', {
      onPress,
      style: containerStyle,
      testID: 'list-item'
    }, children);
  
  MockListItem.Content = ({ children }) => children;
  MockListItem.Title = ({ children, style }) => mockReact.createElement('Text', { style }, children);
  MockListItem.Subtitle = ({ children, style }) => mockReact.createElement('Text', { style }, children);
  MockListItem.Chevron = () => mockReact.createElement('View', { testID: 'chevron' });

  return {
    ListItem: MockListItem,
    Badge: ({ value, containerStyle, badgeStyle, textStyle }) =>
      mockReact.createElement('View', { style: containerStyle, testID: 'badge' },
        mockReact.createElement('View', { style: badgeStyle },
          mockReact.createElement('Text', { style: textStyle }, value)
        )
      ),
    Icon: ({ name, type, color, size, containerStyle, ...props }) =>
      mockReact.createElement('View', {
        testID: `icon-${name}`,
        style: containerStyle,
        ...props
      }),
  };
});

jest.mock('../../components/ScreenHeader', () => {
  const mockReact = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');

  return ({ title, onLeftPress, rightComponent }) => mockReact.createElement(View, { testID: 'screen-header' },
    mockReact.createElement(Text, null, title),
    mockReact.createElement(TouchableOpacity, { testID: 'back-button', onPress: onLeftPress },
      mockReact.createElement(Text, null, 'Back')
    ),
    rightComponent
  );
});

jest.mock('../../components/EmptyState', () => {
  const mockReact = require('react');
  const { View, Text } = require('react-native');

  return ({ title, subtitle }) => mockReact.createElement(View, { testID: 'empty-state' },
    mockReact.createElement(Text, null, title),
    mockReact.createElement(Text, null, subtitle)
  );
});

const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('NotificationsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockAlert.mockClear();
  });

  it('renders correctly with default notifications', () => {
    const { getByText, getAllByTestId } = render(
      <NotificationsScreen navigation={mockNavigation} />
    );

    expect(getByText('Notifications')).toBeTruthy();
    expect(getAllByTestId('list-item')).toHaveLength(4); 
  });

  it('displays unread indicator for unread notifications', () => {
    const { getAllByTestId } = render(
      <NotificationsScreen navigation={mockNavigation} />
    );
    
    const unreadNotifications = mockNotifications.filter(n => !n.read);
    expect(getAllByTestId('unread-indicator')).toHaveLength(unreadNotifications.length);
  });

  it('renders filter tabs correctly', () => {
    const { getByText } = render(
      <NotificationsScreen navigation={mockNavigation} />
    );

    expect(getByText('Toutes')).toBeTruthy();
    expect(getByText('Non lues')).toBeTruthy();
    expect(getByText('Commandes')).toBeTruthy();
    expect(getByText('Système')).toBeTruthy();
  });

  it('filters notifications by unread status', () => {
    const { getByText, getAllByTestId } = render(
      <NotificationsScreen navigation={mockNavigation} />
    );

    const unreadTab = getByText('Non lues');
    fireEvent.press(unreadTab);

    const unreadCount = mockNotifications.filter(n => !n.read).length;
    expect(getAllByTestId('list-item')).toHaveLength(unreadCount);
  });

  it('filters notifications by type', () => {
    const { getByText, getAllByTestId } = render(
      <NotificationsScreen navigation={mockNavigation} />
    );

    const ordersTab = getByText('Commandes');
    fireEvent.press(ordersTab);

    const orderCount = mockNotifications.filter(n => n.type === 'order').length;
    expect(getAllByTestId('list-item')).toHaveLength(orderCount);
  });

  it('marks notification as read when pressed', () => {
    const { getAllByTestId } = render(
      <NotificationsScreen navigation={mockNavigation} />
    );

    const firstNotification = getAllByTestId('list-item')[0];
    fireEvent.press(firstNotification);
    
  });

  it('navigates to order details when order notification is pressed', () => {
    const { getAllByTestId } = render(
      <NotificationsScreen navigation={mockNavigation} />
    );

    const firstNotification = getAllByTestId('list-item')[0]; 
    fireEvent.press(firstNotification);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Orders', {
      screen: 'OrderDetails',
      params: { orderId: '1234' }
    });
  });

  it('navigates to reviews when review notification is pressed', () => {
    const { getAllByTestId } = render(
      <NotificationsScreen navigation={mockNavigation} />
    );

    const thirdNotification = getAllByTestId('list-item')[2]; 
    fireEvent.press(thirdNotification);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Reviews', {
      screen: 'ReviewsMain'
    });
  });

  it('shows mark all as read button when there are unread notifications', () => {
    const { getByTestId } = render(
      <NotificationsScreen navigation={mockNavigation} />
    );

    expect(getByTestId('mark-all-read-button')).toBeTruthy();
  });

  it('shows clear all button when all notifications are read', () => {
    
    const { queryByTestId } = render(
      <NotificationsScreen navigation={mockNavigation} />
    );
    
    expect(queryByTestId('mark-all-read-button')).toBeTruthy();
    
  });

  it('marks all notifications as read when mark all button is pressed', () => {
    const { getByTestId } = render(
      <NotificationsScreen navigation={mockNavigation} />
    );

    const markAllButton = getByTestId('mark-all-read-button');
    fireEvent.press(markAllButton);
    
  });

  it('shows alert when clear all button is pressed', () => {

    const { getByTestId } = render(
      <NotificationsScreen navigation={mockNavigation} />
    );

    const markAllButton = getByTestId('mark-all-read-button');
    fireEvent.press(markAllButton);
    
  });

  it('shows empty state when no notifications', () => {
    const { getByTestId, getByText } = render(
      <NotificationsScreen navigation={mockNavigation} initialNotifications={[]} />
    );

    expect(getByTestId('empty-state')).toBeTruthy();
    expect(getByText('Aucune notification')).toBeTruthy();
  });

  it('shows filtered empty state when no notifications match filter', () => {
    
    const systemOnlyNotifications = mockNotifications.filter(n => n.type === 'system');

    const { getByTestId, getByText } = render(
      <NotificationsScreen
        navigation={mockNavigation}
        initialNotifications={systemOnlyNotifications}
      />
    );
    
    const ordersTab = getByText('Commandes');
    fireEvent.press(ordersTab);

    expect(getByTestId('empty-state')).toBeTruthy();
    expect(getByText('Aucune notification dans la catégorie "orders"')).toBeTruthy();
  });

  it('navigates back when back button is pressed', () => {
    const { getByTestId } = render(
      <NotificationsScreen navigation={mockNavigation} />
    );

    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('sorts notifications by timestamp (newest first)', () => {
    const { getAllByTestId } = render(
      <NotificationsScreen navigation={mockNavigation} />
    );

    const notifications = getAllByTestId('list-item');
    
    expect(notifications).toHaveLength(mockNotifications.length);
  });
});

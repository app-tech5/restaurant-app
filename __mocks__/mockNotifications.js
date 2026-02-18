import i18n from '../i18n';

export const mockNotifications = [
  {
    id: '1',
    type: 'order',
    title: i18n.t('notifications.newOrder'),
    message: i18n.t('notifications.newOrderMessage', { orderNumber: '1234', items: '2 pizzas' }),
    timestamp: new Date(Date.now() - 1000 * 60 * 5), 
    read: false,
    action: 'view_order',
    actionData: { orderId: '1234' }
  },
  {
    id: '2',
    type: 'system',
    title: i18n.t('notifications.maintenanceScheduled'),
    message: i18n.t('notifications.maintenanceMessage'),
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), 
    read: true,
    action: null
  },
  {
    id: '3',
    type: 'review',
    title: i18n.t('notifications.newReview'),
    message: i18n.t('notifications.newReviewMessage', { rating: '5' }),
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), 
    read: false,
    action: 'view_reviews'
  },
  {
    id: '4',
    type: 'order',
    title: i18n.t('notifications.orderReady'),
    message: i18n.t('notifications.orderReadyMessage', { orderNumber: '1230' }),
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), 
    read: true,
    action: 'view_order',
    actionData: { orderId: '1230' }
  }
];

export const generateMockNotifications = (count = 5) => {
  const types = ['order', 'system', 'review'];
  const notifications = [];

  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const isRead = Math.random() > 0.5;
    const timeOffset = Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000); 

    let title, message, action, actionData;

    switch (type) {
      case 'order':
        title = i18n.t('notifications.newOrder');
        message = i18n.t('notifications.newOrderMessage', {
          orderNumber: `${1000 + i}`,
          items: `${Math.floor(Math.random() * 5) + 1} items`
        });
        action = 'view_order';
        actionData = { orderId: `${1000 + i}` };
        break;
      case 'system':
        title = i18n.t('notifications.maintenanceScheduled');
        message = i18n.t('notifications.maintenanceMessage');
        action = null;
        break;
      case 'review':
        title = i18n.t('notifications.newReview');
        message = i18n.t('notifications.newReviewMessage', {
          rating: `${Math.floor(Math.random() * 5) + 1}`
        });
        action = 'view_reviews';
        break;
    }

    notifications.push({
      id: `mock-${i + 1}`,
      type,
      title,
      message,
      timestamp: new Date(Date.now() - timeOffset),
      read: isRead,
      action,
      actionData
    });
  }

  return notifications;
};

export const emptyNotifications = [];

export const allReadNotifications = mockNotifications.map(notification => ({
  ...notification,
  read: true
}));

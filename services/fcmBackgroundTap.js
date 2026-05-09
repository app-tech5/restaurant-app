import { Platform } from 'react-native';

const getMessaging = () => {
  if (Platform.OS === 'web') return null;
  try {
    return require('@react-native-firebase/messaging').default;
  } catch {
    return null;
  }
};

const orderIdFromRemoteData = (data) => {
  if (!data || typeof data !== 'object') return null;
  const id = data.orderId || data.orderID;
  return id != null && id !== '' ? String(id) : null;
};

export const subscribeFcmNotificationOpened = (onOrderId) => {
  const messaging = getMessaging();
  if (!messaging || typeof onOrderId !== 'function') {
    return () => {};
  }

  const handle = (remoteMessage) => {
    const orderId = orderIdFromRemoteData(remoteMessage?.data);
    if (orderId) onOrderId(orderId);
  };

  const unsubscribeOpened = messaging().onNotificationOpenedApp(handle);

  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) handle(remoteMessage);
    })
    .catch(() => {});

  return () => {
    if (typeof unsubscribeOpened === 'function') {
      unsubscribeOpened();
    }
  };
};

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const loadNotificationsModule = () => {
  try {
    return require('expo-notifications');
  } catch (error) {
    return null;
  }
};

const LAST_NOTIFICATION_DATA_KEY = 'lastNotificationData';

const pickOrderId = (data) => {
  if (!data || typeof data !== 'object') return null;
  return data.orderId || data.orderID || data?.actionData?.orderId || null;
};

const saveLastNotificationData = async (data) => {
  if (!data || typeof data !== 'object') return;
  if (!pickOrderId(data)) return;
  try {
    await AsyncStorage.setItem(LAST_NOTIFICATION_DATA_KEY, JSON.stringify(data));
  } catch (error) {
  }
};

const readLastNotificationData = async () => {
  try {
    const raw = await AsyncStorage.getItem(LAST_NOTIFICATION_DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

const clearLastNotificationData = async () => {
  try {
    await AsyncStorage.removeItem(LAST_NOTIFICATION_DATA_KEY);
  } catch (error) {
  }
};

const extractNotificationData = (source) => {
  const directData = source?.notification?.request?.content?.data
    || source?.request?.content?.data
    || source?.content?.data
    || source?.data
    || null;

  const remoteMessageData = source?.notification?.request?.trigger?.remoteMessage?.data
    || source?.request?.trigger?.remoteMessage?.data
    || source?.trigger?.remoteMessage?.data
    || null;

  if (pickOrderId(directData)) return directData;
  if (pickOrderId(remoteMessageData)) return remoteMessageData;
  return directData || remoteMessageData || {};
};

export const getNativePushToken = async () => {
  const Notifications = loadNotificationsModule();
  if (!Notifications) {
    return null;
  }

  try {
    const permission = await Notifications.getPermissionsAsync();
    let finalStatus = permission.status;
    if (finalStatus !== 'granted') {
      const request = await Notifications.requestPermissionsAsync();
      finalStatus = request.status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }

    const devicePushToken = await Notifications.getDevicePushTokenAsync();
    const tokenData = devicePushToken?.data;
    if (!tokenData) {
      return null;
    }

    if (typeof tokenData === 'string') {
      return tokenData;
    }

    if (Platform.OS === 'android' && typeof tokenData === 'object' && tokenData.token) {
      return String(tokenData.token);
    }

    return String(tokenData);
  } catch (error) {
    console.error('Error getting native push token', error);
    return null;
  }
};

export const addNotificationTapListener = (onTap) => {
  const Notifications = loadNotificationsModule();
  if (!Notifications || typeof onTap !== 'function') {
    return () => {};
  }

  const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
    const data = extractNotificationData(response);
    await saveLastNotificationData(data);
    onTap(data);
  });

  return () => {
    if (subscription?.remove) subscription.remove();
  };
};

export const getInitialNotificationData = async () => {
  const Notifications = loadNotificationsModule();
  if (!Notifications) return readLastNotificationData();

  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    const data = extractNotificationData(response);
    if (pickOrderId(data)) {
      await saveLastNotificationData(data);
      return data;
    }
    return readLastNotificationData();
  } catch (error) {
    return readLastNotificationData();
  }
};

export const addNotificationReceivedListener = (onReceive) => {
  const Notifications = loadNotificationsModule();
  if (!Notifications || typeof onReceive !== 'function') {
    return () => {};
  }

  const subscription = Notifications.addNotificationReceivedListener(async (notification) => {
    const data = extractNotificationData(notification);
    await saveLastNotificationData(data);
    onReceive(data);
  });

  return () => {
    if (subscription?.remove) subscription.remove();
  };
};

export const consumeStoredNotificationData = async () => {
  const data = await readLastNotificationData();
  if (pickOrderId(data)) {
    await clearLastNotificationData();
    return data;
  }
  return null;
};

export const getOrderIdFromNotificationData = (data) => pickOrderId(data);

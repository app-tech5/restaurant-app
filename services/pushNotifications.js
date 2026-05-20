import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const loadNotificationsModule = () => {
  try {
    return require('expo-notifications');
  } catch (error) {
    return null;
  }
};

const loadRnfMessaging = () => {
  if (Platform.OS === 'web') return null;
  try {
    return require('@react-native-firebase/messaging').default;
  } catch (error) {
    return null;
  }
};

const LAST_NOTIFICATION_DATA_KEY = 'lastNotificationData';
const LOCAL_ECHO_KEY = '__localForegroundEcho';
let foregroundPresentationConfigured = false;

/** Must match my-backend `fcm.js` android.notification.channelId */
export const ANDROID_DEFAULT_PUSH_CHANNEL_ID = 'default';

let androidChannelsEnsured = false;

/** Android: immediate local notification needs channel on trigger (see expo parseTrigger). */
const immediateNotificationTrigger =
  Platform.OS === 'android' ? { channelId: ANDROID_DEFAULT_PUSH_CHANNEL_ID } : null;

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

const ensureForegroundPresentation = (Notifications) => {
  if (foregroundPresentationConfigured) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  foregroundPresentationConfigured = true;
};

const ORDER_PUSH_TYPES = new Set(['order', 'order_cancelled']);

const skipLocalBannerOrderPush = (data) => data && typeof data === 'object'
  && pickOrderId(data)
  && (!data.type || ORDER_PUSH_TYPES.has(String(data.type)));

export async function ensureAndroidPushChannelsConfigured() {
  if (Platform.OS !== 'android' || androidChannelsEnsured) return;
  const Notifications = loadNotificationsModule();
  if (!Notifications) return;
  try {
    await Notifications.setNotificationChannelAsync(ANDROID_DEFAULT_PUSH_CHANNEL_ID, {
      name: 'Commandes',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
    });
    androidChannelsEnsured = true;
  } catch {
  }
}

export async function scheduleSystemStyleLocalNotification({ title, body, data }) {
  const Notifications = loadNotificationsModule();
  if (!Notifications) return;
  await ensureAndroidPushChannelsConfigured();

  const payload = data && typeof data === 'object' ? { ...data } : {};

  await Notifications.scheduleNotificationAsync({
    content: {
      title: title || 'New order',
      body: body || '',
      ...(Platform.OS === 'ios' ? { sound: 'default' } : {}),
      data: payload,
    },
    trigger: immediateNotificationTrigger,
  });
}

const scheduleForegroundLocalNotification = async (Notifications, source) => {
  const content = source?.request?.content
    ? source.request.content
    : {
      title: source?.data?.title || source?.notification?.title || null,
      body: source?.data?.body || source?.notification?.body || '',
      data: source?.data || {},
    };
  if (!content) return;

  const existingData = content.data && typeof content.data === 'object' ? content.data : {};
  if (existingData[LOCAL_ECHO_KEY]) return;

  await ensureAndroidPushChannelsConfigured();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title || 'New order',
      body: content.body || '',
      ...(Platform.OS === 'ios' ? { sound: 'default' } : {}),
      data: {
        ...existingData,
        [LOCAL_ECHO_KEY]: '1',
      },
    },
    trigger: immediateNotificationTrigger,
  });
};

export const getNativePushToken = async () => {
  const Notifications = loadNotificationsModule();
  if (!Notifications) {
    return null;
  }

  try {
    await ensureAndroidPushChannelsConfigured();

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

/** Only data from the interaction that opened / responded to a notification — not "last push received". */
export const getInitialNotificationData = async () => {
  const Notifications = loadNotificationsModule();
  if (!Notifications) return null;

  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    const data = extractNotificationData(response);
    if (pickOrderId(data)) {
      await saveLastNotificationData(data);
      return data;
    }
    return null;
  } catch {
    return null;
  }
};

export const addNotificationReceivedListener = (onReceive) => {
  const Notifications = loadNotificationsModule();
  if (!Notifications || typeof onReceive !== 'function') {
    return () => {};
  }
  const messaging = loadRnfMessaging();

  ensureForegroundPresentation(Notifications);

  const subscriptionExpo = Notifications.addNotificationReceivedListener(async (notification) => {
    const data = extractNotificationData(notification);
    if (!data?.[LOCAL_ECHO_KEY] && !skipLocalBannerOrderPush(data)) {
      await scheduleForegroundLocalNotification(Notifications, notification);
    }
    await saveLastNotificationData(data);
    onReceive(data);
  });

  const unsubscribeRnf = messaging
    ? messaging().onMessage(async (remoteMessage) => {
      const data = extractNotificationData(remoteMessage);
      if (!data?.[LOCAL_ECHO_KEY] && !skipLocalBannerOrderPush(data)) {
        await scheduleForegroundLocalNotification(Notifications, remoteMessage);
      }
      await saveLastNotificationData(data);
      onReceive(data);
    })
    : null;

  return () => {
    if (subscriptionExpo?.remove) subscriptionExpo.remove();
    if (typeof unsubscribeRnf === 'function') unsubscribeRnf();
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

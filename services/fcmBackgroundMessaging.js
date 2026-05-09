import { Platform } from 'react-native';

/** Register early from App.js. Posts a local notification so a heads-up can show while the app is backgrounded. */
if (Platform.OS !== 'web') {
  try {
    const messaging = require('@react-native-firebase/messaging').default;
    const {
      ensureAndroidPushChannelsConfigured,
      scheduleSystemStyleLocalNotification,
    } = require('./pushNotifications');

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      try {
        await ensureAndroidPushChannelsConfigured();

        const data = remoteMessage?.data ? { ...remoteMessage.data } : {};

        const n = remoteMessage?.notification;
        const orderId = data.orderId || data.orderID;
        const dt = typeof data.title === 'string' ? data.title.trim() : '';
        const db = typeof data.body === 'string' ? data.body.trim() : '';
        const nt = typeof n?.title === 'string' ? n.title.trim() : '';
        const nb = typeof n?.body === 'string' ? n.body.trim() : '';
        const t = dt || nt;
        const b = db || nb;
        const hasPayloadText = !!(t || b);
        if (!hasPayloadText && !orderId) return;

        const title = t || 'New order';
        const body = b || (orderId ? `Order #${orderId}` : '');

        await scheduleSystemStyleLocalNotification({
          title,
          body,
          data,
        });
      } catch {
      }
    });
  } catch {
  }
}

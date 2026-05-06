import { Platform } from 'react-native';

const loadNotificationsModule = () => {
  try {
    return require('expo-notifications');
  } catch (error) {
    return null;
  }
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

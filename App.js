import './utils/hermesAutoOkAlerts';
import './services/fcmBackgroundMessaging';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { RestaurantProvider } from './contexts/RestaurantContext';
import { SettingProvider } from './contexts/SettingContext';
import { OrderIncomingToastProvider } from './contexts/OrderIncomingToastContext';
import { ensureAndroidPushChannelsConfigured } from './services/pushNotifications';
import { installWebScrollFix } from './utils/installWebScrollFix';
import { installWebAlertPolyfill } from './utils/installWebAlertPolyfill';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      installWebScrollFix();
      installWebAlertPolyfill();
      return;
    }
    void ensureAndroidPushChannelsConfigured();
  }, []);

  return (
    <SafeAreaProvider>
      <RestaurantProvider>
        <SettingProvider>
          <OrderIncomingToastProvider>
            <AppNavigator />
          </OrderIncomingToastProvider>
        </SettingProvider>
      </RestaurantProvider>
    </SafeAreaProvider>
  );
}

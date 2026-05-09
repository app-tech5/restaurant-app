import './services/fcmBackgroundMessaging';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { RestaurantProvider } from './contexts/RestaurantContext';
import { SettingProvider } from './contexts/SettingContext';
import { OrderIncomingToastProvider } from './contexts/OrderIncomingToastContext';
import { ensureAndroidPushChannelsConfigured } from './services/pushNotifications';

export default function App() {
  useEffect(() => {
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

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { RestaurantProvider } from './contexts/RestaurantContext';
import { SettingProvider } from './contexts/SettingContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <RestaurantProvider>
        <SettingProvider>
          <AppNavigator />
        </SettingProvider>
      </RestaurantProvider>
    </SafeAreaProvider>
  );
}

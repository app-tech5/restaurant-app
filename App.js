import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { RestaurantProvider } from './contexts/RestaurantContext';
import { SettingProvider } from './contexts/SettingContext';
import { initializeLanguage } from './i18n';

const AppContent = () => {
  useEffect(() => {
    // Initialiser la langue au démarrage de l'app
    initializeLanguage();
  }, []);

  return <AppNavigator />;
};

export default function App() {
  return (
    <SafeAreaProvider>
      <RestaurantProvider>
        <SettingProvider>
          <AppContent />
        </SettingProvider>
      </RestaurantProvider>
    </SafeAreaProvider>
  );
}

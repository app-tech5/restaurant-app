import React, { createContext, useContext } from 'react';
import { useRestaurant } from './RestaurantContext';
import { useSettingsManager } from '../hooks/useSettingsManager';

// Créer le contexte
const SettingContext = createContext();

// Provider du contexte
export function SettingProvider({ children }) {
  const { isAuthenticated } = useRestaurant();

  // Utiliser le hook personnalisé pour gérer la logique des paramètres
  const settingsData = useSettingsManager(isAuthenticated);

  const value = {
    ...settingsData
  };

  return (
    <SettingContext.Provider value={value}>
      {children}
    </SettingContext.Provider>
  );
}

// Hook pour utiliser le contexte
export function useSettings() {
  const context = useContext(SettingContext);
  if (!context) {
    throw new Error('useSettings doit être utilisé dans un SettingProvider');
  }
  return context;
}

// Fonctions utilitaires exportées
export { getSettingsCacheInfo } from '../utils/settingsUtils';

export default SettingContext;

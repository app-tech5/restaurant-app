import React, { createContext, useContext } from 'react';
import { useRestaurant } from './RestaurantContext';
import { useSettingsManager } from '../hooks/useSettingsManager';

const SettingContext = createContext();

export function SettingProvider({ children }) {
  const { isAuthenticated } = useRestaurant();
  
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

export function useSettings() {
  const context = useContext(SettingContext);
  if (!context) {
    throw new Error('useSettings doit être utilisé dans un SettingProvider');
  }
  return context;
}

export { getSettingsCacheInfo } from '../utils/settingsUtils';

export default SettingContext;

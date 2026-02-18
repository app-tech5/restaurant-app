import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './lang/en.json';
import fr from './lang/fr.json';

const i18n = new I18n({
  en,
  fr,
});

i18n.defaultLocale = 'en';
i18n.locale = 'en';

export const initializeLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('userLanguage');
    if (savedLanguage && i18n.translations[savedLanguage]) {
      i18n.locale = savedLanguage;
    }
  } catch (error) {
    console.error('Error loading saved language:', error);
  }
};

export const changeLanguage = (language) => {
  i18n.locale = language;
};

export const getCurrentLanguage = () => {
  return i18n.locale;
};

export const hasTranslation = (key) => {
  return i18n.t(key, { defaultValue: null }) !== null;
};

export default i18n;

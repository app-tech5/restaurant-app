import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import des fichiers de langue
import en from './lang/en.json';
import fr from './lang/fr.json';

// Configuration i18n
const i18n = new I18n({
  en,
  fr,
});

// Configuration par défaut
i18n.defaultLocale = 'en';
i18n.locale = 'en';

// Initialiser la langue depuis AsyncStorage
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

// Fonction utilitaire pour changer de langue
export const changeLanguage = (language) => {
  i18n.locale = language;
};

// Fonction pour obtenir la langue actuelle
export const getCurrentLanguage = () => {
  return i18n.locale;
};

// Fonction pour vérifier si une clé existe
export const hasTranslation = (key) => {
  return i18n.t(key, { defaultValue: null }) !== null;
};

export default i18n;

import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import en from './lang/en.json';
import fr from './lang/fr.json';
import es from './lang/es.json';
import ar from './lang/ar.json';

const i18n = new I18n({ en, fr, es, ar });
i18n.enableFallback = true;
i18n.defaultLocale = 'en';
i18n.locale = 'en';

export const RTL_LOCALES = ['ar'];
export const isRtlLocale = (code) => RTL_LOCALES.includes(String(code || '').split('-')[0]);

export function applyLayoutDirection(locale) {
  const wantRtl = isRtlLocale(locale);
  if (wantRtl !== I18nManager.isRTL) {
    I18nManager.allowRTL(wantRtl);
    I18nManager.forceRTL(wantRtl);
    return { needsReload: true, rtl: wantRtl };
  }
  return { needsReload: false, rtl: wantRtl };
}

export const initializeLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('userLanguage');
    if (savedLanguage && i18n.translations[savedLanguage]) {
      i18n.locale = savedLanguage;
      applyLayoutDirection(savedLanguage);
    }
  } catch (error) {
    console.error('Error loading saved language:', error);
  }
};

export const changeLanguage = async (language) => {
  if (!i18n.translations[language]) return { ok: false };
  i18n.locale = language;
  try {
    await AsyncStorage.setItem('userLanguage', language);
  } catch (_) {
    /* ignore */
  }
  const layout = applyLayoutDirection(language);
  return { ok: true, ...layout };
};

export const getCurrentLanguage = () => i18n.locale;

export const isLanguageSupported = (language) => !!i18n.translations[language];

export const hasTranslation = (key) => {
  return i18n.t(key, { defaultValue: null }) !== null;
};

export default i18n;

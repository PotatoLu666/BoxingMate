import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import zhCN from './locales/zh-CN.json';

const deviceLocale = getLocales()[0]?.languageTag ?? 'en';

// Map device locale to our supported languages
function resolveLanguage(locale: string): string {
  if (locale.startsWith('zh')) return 'zh-CN';
  return 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'zh-CN': { translation: zhCN },
  },
  lng: resolveLanguage(deviceLocale),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;

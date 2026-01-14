import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from '../locales/en.json';
import viTranslations from '../locales/vi.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      vi: {
        translation: viTranslations,
      },
    },
    lng: 'vi', // Set Vietnamese as default language
    fallbackLng: 'vi', // Fallback to Vietnamese if translation is missing
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      // Only check localStorage for user preference
      // If not found, will use default 'vi' (Vietnamese) set above
      // Don't check navigator to avoid using browser language (which might be English)
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    // Return key if translation is missing (instead of showing full path)
    returnEmptyString: false,
    returnNull: false,
    returnObjects: false,
  })
  .then(() => {
    // Ensure Vietnamese is set if no language preference exists or if invalid language is stored
    const storedLang = localStorage.getItem('i18nextLng');
    if (!storedLang || (storedLang !== 'vi' && storedLang !== 'en')) {
      i18n.changeLanguage('vi');
      localStorage.setItem('i18nextLng', 'vi');
    }
    // If current language is not Vietnamese or English, default to Vietnamese
    if (i18n.language !== 'vi' && i18n.language !== 'en') {
      i18n.changeLanguage('vi');
      localStorage.setItem('i18nextLng', 'vi');
    }
  });

export default i18n;

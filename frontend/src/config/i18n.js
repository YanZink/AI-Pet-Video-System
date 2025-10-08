import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

/**
 * i18n configuration following the Medium article approach
 * Loads translations from public/locales/{lng}/{ns}.json
 */

// Get saved language from localStorage or default to English
const savedLanguage = localStorage.getItem('language') || 'en';

i18n
  .use(HttpBackend) // Load translations via HTTP
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    backend: {
      // Path to load translations from
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    lng: savedLanguage, // Default language
    fallbackLng: 'en', // Fallback language if translation is missing

    // Namespaces - correspond to JSON files in locales folder
    ns: [
      'frontend', // Frontend-specific translations
      'common', // Common translations (shared with bot/backend)
      'auth', // Authentication translations
      'videos', // Video-related translations
      'payments', // Payment-related translations
      'errors', // Error messages
      'notifications', // Notification messages
    ],
    defaultNS: 'frontend', // Default namespace

    // Supported languages
    supportedLngs: ['en', 'ru'],

    // React-specific options
    react: {
      useSuspense: true, // Enable suspense mode for loading translations
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'], // Allow these HTML tags in translations
    },

    // Interpolation settings
    interpolation: {
      escapeValue: false, // React already escapes values
      formatSeparator: ',',
    },

    // Debug mode - set to true during development
    debug: process.env.NODE_ENV === 'development',

    // Detection options (optional)
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// Save language to localStorage when it changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
});

export default i18n;

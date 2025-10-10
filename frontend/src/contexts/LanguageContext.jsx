import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { t, i18n } = useTranslation();
  const [language, setLanguageState] = useState(i18n.language || 'en');
  const [isLoading, setIsLoading] = useState(false);

  const setLanguage = async (lng) => {
    if (lng === language) return;

    try {
      setIsLoading(true);
      await i18n.changeLanguage(lng);
      setLanguageState(lng);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setLanguageState(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const translate = (key, options = {}) => {
    return t(key, options);
  };

  const hasTranslation = (key) => {
    return i18n.exists(key);
  };

  const value = {
    language,
    setLanguage,
    t: translate,
    translate,
    hasTranslation,
    isLoading,
    supportedLanguages: ['en', 'ru'],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

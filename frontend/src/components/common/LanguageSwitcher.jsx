import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import styles from './LanguageSwitcher.module.css';

const LanguageSwitcher = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`${styles.langSwitcher} ${className}`}>
      <button
        onClick={() => setLanguage('en')}
        className={`${styles.langButton} ${
          language === 'en' ? styles.active : ''
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('ru')}
        className={`${styles.langButton} ${
          language === 'ru' ? styles.active : ''
        }`}
      >
        RU
      </button>
    </div>
  );
};

export default LanguageSwitcher;

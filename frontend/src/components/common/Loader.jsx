import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import styles from './Loader.module.css';

const Loader = ({ size = 'medium', text }) => {
  const { t } = useLanguage();

  const displayText = text || t('frontend:common.loading');

  return (
    <div className={styles.loader}>
      <div
        className={`${styles.spinner} ${
          styles[`spinner${size.charAt(0).toUpperCase() + size.slice(1)}`]
        }`}
      ></div>
      {displayText && <p className={styles.text}>{displayText}</p>}
    </div>
  );
};

export default Loader;

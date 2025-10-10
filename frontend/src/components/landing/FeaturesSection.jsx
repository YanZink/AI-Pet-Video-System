import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import styles from './FeaturesSection.module.css';

const FeaturesSection = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: '⚡',
      title: t('frontend:features.feature_1_title'),
      desc: t('frontend:features.feature_1_desc'),
    },
    {
      icon: '🚀',
      title: t('frontend:features.feature_2_title'),
      desc: t('frontend:features.feature_2_desc'),
    },
    {
      icon: '✨',
      title: t('frontend:features.feature_3_title'),
      desc: t('frontend:features.feature_3_desc'),
    },
    {
      icon: '📱',
      title: t('frontend:features.feature_4_title'),
      desc: t('frontend:features.feature_4_desc'),
    },
    {
      icon: '🔒',
      title: t('frontend:features.feature_5_title'),
      desc: t('frontend:features.feature_5_desc'),
    },
    {
      icon: '💬',
      title: t('frontend:features.feature_6_title'),
      desc: t('frontend:features.feature_6_desc'),
    },
  ];

  return (
    <section id="features" className={styles.features}>
      <div className={styles.container}>
        <h2 className={styles.title}>{t('frontend:features.title')}</h2>
        <p className={styles.subtitle}>{t('frontend:features.subtitle')}</p>

        <div className={styles.grid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={styles.icon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

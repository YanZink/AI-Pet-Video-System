import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import styles from './StepsSection.module.css';

const StepsSection = () => {
  const { t } = useLanguage();

  const steps = [
    {
      icon: '📸',
      title: t('frontend:steps.step_1_title'),
      description: t('frontend:steps.step_1_desc'),
      gradient: styles.gradientPink,
    },
    {
      icon: '💬',
      title: t('frontend:steps.step_2_title'),
      description: t('frontend:steps.step_2_desc'),
      gradient: styles.gradientPurple,
    },
    {
      icon: '🎬',
      title: t('frontend:steps.step_3_title'),
      description: t('frontend:steps.step_3_desc'),
      gradient: styles.gradientBlue,
    },
  ];

  return (
    <section className={styles.steps}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {steps.map((step, index) => (
            <div key={index} className={styles.stepCard}>
              <div className={styles.card}>
                <div className={`${styles.iconContainer} ${step.gradient}`}>
                  {step.icon}
                </div>

                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>

                <div className={styles.stepNumber}>{index + 1}</div>
              </div>

              {index < steps.length - 1 && (
                <div className={styles.arrow}>
                  <div className={styles.arrowIcon}>→</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StepsSection;

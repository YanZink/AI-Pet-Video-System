import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import styles from './HowItWorks.module.css';

const HowItWorks = () => {
  const { t } = useLanguage();

  const steps = [
    {
      icon: 'iconCamera',
      title: t('frontend:steps.step_1_title'),
      description: t('frontend:steps.step_1_desc'),
      gradient: styles.gradientPink,
    },
    {
      icon: 'iconMessage',
      title: t('frontend:steps.step_2_title'),
      description: t('frontend:steps.step_2_desc'),
      gradient: styles.gradientPurple,
    },
    {
      icon: 'iconVideo',
      title: t('frontend:steps.step_3_title'),
      description: t('frontend:steps.step_3_desc'),
      gradient: styles.gradientBlue,
    },
  ];

  return (
    <section id="how-it-works" className={styles.howItWorks}>
      <div className={styles.container}>
        <h2 className={styles.title}>{t('frontend:steps.title')}</h2>

        <div className={styles.robotWrapper}>
          <div className={styles.robot}>
            <div className={styles.robotGlow}></div>
            <div className={styles.robotFace}>
              <div className={styles.robotIcon}></div>
            </div>
            <div className={styles.photoCard}>
              <div className={styles.photo}></div>
            </div>
          </div>
        </div>

        <div className={styles.grid}>
          {steps.map((step, index) => (
            <div key={index} className={styles.stepCard}>
              <div className={styles.card}>
                <div
                  className={`${styles.iconContainer} ${step.gradient} ${
                    styles[step.icon]
                  }`}
                ></div>

                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>

                <div className={styles.stepNumber}>{index + 1}</div>
              </div>

              {index < steps.length - 1 && (
                <div className={styles.arrow}>
                  <div className={styles.arrowIcon}></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

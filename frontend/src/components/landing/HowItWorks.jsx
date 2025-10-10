import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import styles from './HowItWorks.module.css';

const HowItWorks = () => {
  const { t } = useLanguage();

  return (
    <section id="how-it-works" className={styles.howItWorks}>
      <div className={styles.container}>
        <h2 className={styles.title}>{t('frontend:steps.title')}</h2>

        <div className={styles.robotWrapper}>
          <div className={styles.robot}>
            <div className={styles.robotGlow}></div>
            <div className={styles.robotFace}>
              <div className="text-6xl">🤖</div>
            </div>

            <div className={styles.photoCard}>
              <div className={styles.photo}>🐕</div>
            </div>
          </div>
        </div>

        <div className={styles.stepsGrid}>
          {[
            {
              icon: '📷',
              title: t('frontend:steps.step_1_title'),
              desc: t('frontend:steps.step_1_desc'),
              gradient: styles.gradientPurple,
            },
            {
              icon: '✏️',
              title: t('frontend:steps.step_2_title'),
              desc: t('frontend:steps.step_2_desc'),
              gradient: styles.gradientPink,
            },
            {
              icon: '🎬',
              title: t('frontend:steps.step_3_title'),
              desc: t('frontend:steps.step_3_desc'),
              gradient: styles.gradientBlue,
            },
          ].map((step, index) => (
            <div key={index} className={styles.step}>
              <div className={`${styles.stepIcon} ${step.gradient}`}>
                {step.icon}
              </div>

              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.desc}</p>

              {index < 2 && <div className={styles.arrow}>➜</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

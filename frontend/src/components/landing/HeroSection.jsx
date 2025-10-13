import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../ui/Button';
import styles from './HeroSection.module.css';

const HeroSection = () => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCreateVideo = () => {
    if (isAuthenticated) {
      navigate('/create-request');
    } else {
      navigate('/login');
    }
  };

  return (
    <section className={styles.hero}>
      <div className={styles.background}>
        <div className={styles.stars}>
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className={styles.star}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            >
              ✨
            </div>
          ))}
        </div>

        <div className={styles.floatingShapes}>
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={styles.floatingShape}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              <div className={styles.shape}></div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>
          <div className={styles.textSection}>
            <h1 className={styles.title}>{t('frontend:hero.title')}</h1>
            <p className={styles.subtitle}>{t('frontend:hero.subtitle')}</p>
            <Button
              size="large"
              onClick={handleCreateVideo}
              className="text-lg px-8 py-4 shadow-2xl hover:scale-105 transform transition-all duration-200"
            >
              {t('frontend:hero.cta_primary')}
            </Button>
            <Button
              variant="telegramButton"
              size="large"
              onClick={() =>
                window.open(process.env.REACT_APP_TELEGRAM_BOT_URL, '_blank')
              }
            >
              {t('frontend:dashboard.create_in_telegram')}
            </Button>
          </div>

          <div className={styles.illustration}>
            <div className={styles.illustrationContainer}>
              <div className={styles.videoWindow}>
                <div className={styles.videoContent}>
                  <div className={styles.playButton}>
                    <div className={styles.playButtonCircle}>
                      <div className={styles.playIcon}></div>
                    </div>
                  </div>

                  <div
                    className={`${styles.decorativeElement} ${styles.element1}`}
                  ></div>
                  <div
                    className={`${styles.decorativeElement} ${styles.element2}`}
                  ></div>
                  <div
                    className={`${styles.decorativeElement} ${styles.element3}`}
                  ></div>
                </div>
              </div>

              <div className={styles.notification}>New!</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

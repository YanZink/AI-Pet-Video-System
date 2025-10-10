import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import styles from './Footer.module.css';

const Footer = () => {
  const { t } = useLanguage();

  const handleContactClick = (e) => {
    e.preventDefault();
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer id="contact" className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div>
            <div className={styles.brand}>
              <div className={styles.brandIcon}>
                <span className="text-white text-xl">🐾</span>
              </div>
              <span className={styles.brandText}>AI Pet Video Creator</span>
            </div>
            <p className={styles.tagline}>{t('frontend:footer.tagline')}</p>
          </div>

          <div>
            <h3 className={styles.sectionTitle}>
              {t('frontend:footer.contact_us')}
            </h3>
            <div className={styles.contactList}>
              <a
                href="mailto:zinkovskii1803@gmail.com"
                className={styles.contactLink}
              >
                <span>📧</span>
                <span>zinkovskii1803@gmail.com</span>
              </a>

              <a
                href="https://t.me/Yan_Zink"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactLink}
              >
                <span>✈️</span>
                <span>@Yan_Zink</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className={styles.sectionTitle}>
              {t('frontend:footer.info_title')}
            </h3>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>
                  {t('frontend:footer.price_label')}
                </span>
                <span>{t('frontend:footer.price_value')}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>
                  {t('frontend:footer.processing_time_label')}
                </span>
                <span>{t('frontend:footer.processing_time_value')}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>
                  {t('frontend:footer.max_photos_label')}
                </span>
                <span>{t('frontend:footer.max_photos_value')}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>
                  {t('frontend:footer.supported_formats_label')}
                </span>
                <span>{t('frontend:footer.supported_formats_value')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.divider}>
          <p className={styles.copyright}>
            © 2025 AI Pet Video Creator.{' '}
            {t('frontend:footer.all_rights_reserved')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

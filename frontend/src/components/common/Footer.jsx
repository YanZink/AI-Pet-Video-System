import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

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
    <footer
      id="contact"
      className="bg-black/40 backdrop-blur-sm border-t border-white/10 py-12"
    >
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🐾</span>
              </div>
              <span className="text-white text-xl font-bold">
                AI Pet Video Creator
              </span>
            </div>
            <p className="text-white/70">{t('frontend:footer.tagline')}</p>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">
              {t('frontend:footer.contact_us')}
            </h3>
            <div className="space-y-2">
              <a
                href="mailto:zinkovskii1803@gmail.com"
                className="text-white/70 hover:text-pink-400 transition-colors flex items-center space-x-2"
              >
                <span>📧</span>
                <span>zinkovskii1803@gmail.com</span>
              </a>

              <a
                href="https://t.me/Yan_Zink"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-pink-400 transition-colors flex items-center space-x-2"
              >
                <span>✈️</span>
                <span>@Yan_Zink</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">
              {t('frontend:footer.info_title')}
            </h3>
            <div className="text-white/70 text-sm space-y-1">
              <p>
                <span className="font-medium">
                  {t('frontend:footer.price_label')}
                </span>{' '}
                {t('frontend:footer.price_value')}
              </p>
              <p>
                <span className="font-medium">
                  {t('frontend:footer.processing_time_label')}
                </span>{' '}
                {t('frontend:footer.processing_time_value')}
              </p>
              <p>
                <span className="font-medium">
                  {t('frontend:footer.max_photos_label')}
                </span>{' '}
                {t('frontend:footer.max_photos_value')}
              </p>
              <p>
                <span className="font-medium">
                  {t('frontend:footer.supported_formats_label')}
                </span>{' '}
                {t('frontend:footer.supported_formats_value')}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-white/50 text-sm">
            © 2025 AI Pet Video Creator.{' '}
            {t('frontend:footer.all_rights_reserved')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

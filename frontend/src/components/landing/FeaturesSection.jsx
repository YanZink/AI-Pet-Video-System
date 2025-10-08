import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

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
    <section id="features" className="py-20 relative">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl lg:text-5xl font-bold text-white text-center mb-4">
          {t('frontend:features.title')}
        </h2>
        <p className="text-xl text-white/70 text-center mb-16">
          {t('frontend:features.subtitle')}
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:from-white/20 hover:to-white/10 transition-all duration-300 transform hover:scale-105"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-white text-xl font-bold mb-2">
                {feature.title}
              </h3>
              <p className="text-white/70">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

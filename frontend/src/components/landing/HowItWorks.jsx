import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const HowItWorks = () => {
  const { t } = useLanguage();

  return (
    <section id="how-it-works" className="py-20 relative">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl lg:text-5xl font-bold text-white text-center mb-16">
          {t('frontend:steps.title')}
        </h2>

        {/* Robot with photo illustration */}
        <div className="flex flex-col items-center mb-16">
          <div className="relative w-64 h-64 mb-8">
            {/* Robot illustration (simplified) */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute inset-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <div className="text-6xl">🤖</div>
            </div>

            {/* Photo card */}
            <div className="absolute -bottom-4 -right-4 bg-white rounded-lg p-2 shadow-2xl transform rotate-12 hover:rotate-0 transition-transform duration-300">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-300 to-orange-300 rounded-lg flex items-center justify-center text-3xl">
                🐕
              </div>
            </div>
          </div>
        </div>

        {/* Process steps with icons */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              icon: '📷',
              title: t('frontend:steps.step_1_title'),
              desc: t('frontend:steps.step_1_desc'),
              color: 'purple',
            },
            {
              icon: '✏️',
              title: t('frontend:steps.step_2_title'),
              desc: t('frontend:steps.step_2_desc'),
              color: 'pink',
            },
            {
              icon: '🎬',
              title: t('frontend:steps.step_3_title'),
              desc: t('frontend:steps.step_3_desc'),
              color: 'blue',
            },
          ].map((step, index) => (
            <div key={index} className="text-center">
              {/* Icon circle */}
              <div
                className={`w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-${step.color}-400 to-${step.color}-600 rounded-full flex items-center justify-center text-3xl shadow-lg`}
              >
                {step.icon}
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                {step.title}
              </h3>
              <p className="text-white/70">{step.desc}</p>

              {/* Arrow (except last) */}
              {index < 2 && (
                <div className="hidden md:block absolute left-full top-1/2 transform -translate-y-1/2 text-2xl text-pink-400">
                  ➜
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

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const StepsSection = () => {
  const { t } = useLanguage();

  const steps = [
    {
      icon: '📸',
      title: t('frontend:steps.step_1_title'),
      description: t('frontend:steps.step_1_desc'),
      gradient: 'from-pink-500 to-purple-500',
    },
    {
      icon: '💬',
      title: t('frontend:steps.step_2_title'),
      description: t('frontend:steps.step_2_desc'),
      gradient: 'from-purple-500 to-blue-500',
    },
    {
      icon: '🎬',
      title: t('frontend:steps.step_3_title'),
      description: t('frontend:steps.step_3_desc'),
      gradient: 'from-blue-500 to-cyan-500',
    },
  ];

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="group relative">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 min-h-[280px] flex flex-col">
                {/* Icon */}
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${step.gradient} rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-white mb-4">
                  {step.title}
                </h3>
                <p className="text-white/70 leading-relaxed flex-grow">
                  {step.description}
                </p>

                {/* Step number */}
                <div className="absolute top-4 right-4 text-6xl font-bold text-white/5">
                  {index + 1}
                </div>
              </div>

              {/* Connector arrow (hidden on last item) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 translate-x-1/2 z-10">
                  <div className="text-pink-400 text-3xl animate-pulse">→</div>
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

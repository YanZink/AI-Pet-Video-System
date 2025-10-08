import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const Loader = ({ size = 'md', text }) => {
  const { t } = useLanguage();

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const displayText = text || t('frontend:common.loading');

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div
        className={`${sizes[size]} border-4 border-white/30 border-t-white rounded-full animate-spin`}
      ></div>
      {displayText && <p className="text-white mt-4">{displayText}</p>}
    </div>
  );
};

export default Loader;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../ui/Button';

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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800">
        {/* Stars */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
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

        {/* Floating shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight hero-text whitespace-normal break-words">
              {t('frontend:hero.title')}
            </h1>
            <p className="text-xl lg:text-2xl text-white/80 mb-8 leading-relaxed hero-text">
              {t('frontend:hero.subtitle')}
            </p>
            <Button
              size="lg"
              onClick={handleCreateVideo}
              className="text-lg px-8 py-4 shadow-2xl hover:scale-105 transform transition-all duration-200"
            >
              {t('frontend:hero.cta_primary')}
            </Button>
          </div>

          {/* Right side - 3D Illustration */}
          <div className="relative">
            <div className="relative w-full aspect-square">
              {/* Video window mockup */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl backdrop-blur-sm border-2 border-white/20 p-8 transform rotate-3 hover:rotate-0 transition-all duration-500">
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center overflow-hidden">
                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-pink-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                      <div className="w-0 h-0 border-l-[24px] border-l-white border-y-[14px] border-y-transparent ml-2"></div>
                    </div>
                  </div>

                  {/* Decorative elements */}
                  <div className="absolute top-4 left-4 w-8 h-8 bg-blue-300 rounded-lg animate-bounce"></div>
                  <div
                    className="absolute top-4 right-4 w-4 h-4 bg-yellow-300 rounded-full animate-spin"
                    style={{ animationDuration: '3s' }}
                  ></div>
                  <div
                    className="absolute bottom-4 left-1/2 w-6 h-6 bg-pink-300 rounded-full transform -translate-x-1/2 animate-bounce"
                    style={{ animationDelay: '0.5s' }}
                  ></div>
                </div>
              </div>

              {/* Floating notification */}
              <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 bg-gradient-to-r from-pink-500 to-red-500 text-white px-4 py-2 rounded-full text-sm shadow-lg animate-bounce">
                🚀 New!
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

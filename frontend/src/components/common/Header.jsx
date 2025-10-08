import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../ui/Button';

const Header = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/create-request');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleHomeClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAnchorClick = (anchor) => {
    if (location.pathname !== '/') {
      navigate('/');
    } else {
      const element = document.getElementById(anchor);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-8">
          <Link
            to="/"
            className="flex items-center space-x-2 mr-12"
            onClick={handleHomeClick}
          >
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🐾</span>
            </div>
            <span className="text-white text-xl font-bold">
              AI Pet Video Creator
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-10">
            <Link
              to="/"
              className="text-white hover:text-pink-400 transition-colors"
              onClick={handleHomeClick}
            >
              {t('frontend:nav.home')}
            </Link>
            <button
              onClick={() => handleAnchorClick('how-it-works')}
              className="text-white hover:text-pink-400 transition-colors"
            >
              {t('frontend:nav.how_it_works')}
            </button>
            <button
              onClick={() => handleAnchorClick('features')}
              className="text-white hover:text-pink-400 transition-colors"
            >
              {t('frontend:nav.features')}
            </button>
            <button
              onClick={() => handleAnchorClick('contact')}
              className="text-white hover:text-pink-400 transition-colors"
            >
              {t('frontend:nav.contact')}
            </button>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-2">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded text-sm transition-colors ${
                  language === 'en'
                    ? 'bg-pink-500 text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('ru')}
                className={`px-2 py-1 rounded text-sm transition-colors ${
                  language === 'ru'
                    ? 'bg-pink-500 text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                RU
              </button>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <span className="text-white">
                  {user?.first_name || user?.username || 'User'}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
                >
                  {t(isAdmin ? 'frontend:nav.admin' : 'frontend:nav.dashboard')}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  {t('frontend:nav.logout')}
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  {t('frontend:nav.login')}
                </Button>
                <Button size="sm" onClick={handleGetStarted}>
                  {t('frontend:nav.get_started')}
                </Button>
              </div>
            )}
          </div>

          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-black/90 backdrop-blur-lg rounded-lg mt-2 p-4">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                className="text-white hover:text-pink-400"
                onClick={(e) => {
                  handleHomeClick(e);
                  setIsMenuOpen(false);
                }}
              >
                {t('frontend:nav.home')}
              </Link>
              <button
                onClick={() => handleAnchorClick('how-it-works')}
                className="text-white hover:text-pink-400 text-left"
              >
                {t('frontend:nav.how_it_works')}
              </button>
              <button
                onClick={() => handleAnchorClick('features')}
                className="text-white hover:text-pink-400 text-left"
              >
                {t('frontend:nav.features')}
              </button>
              <button
                onClick={() => handleAnchorClick('contact')}
                className="text-white hover:text-pink-400 text-left"
              >
                {t('frontend:nav.contact')}
              </button>

              {isAuthenticated ? (
                <>
                  <Button
                    onClick={() => {
                      navigate(isAdmin ? '/admin' : '/dashboard');
                      setIsMenuOpen(false);
                    }}
                    className="w-full"
                  >
                    {t(
                      isAdmin ? 'frontend:nav.admin' : 'frontend:nav.dashboard'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full"
                  >
                    {t('frontend:nav.logout')}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigate('/login');
                      setIsMenuOpen(false);
                    }}
                    className="w-full"
                  >
                    {t('frontend:nav.login')}
                  </Button>
                  <Button
                    onClick={() => {
                      handleGetStarted();
                      setIsMenuOpen(false);
                    }}
                    className="w-full"
                  >
                    {t('frontend:nav.get_started')}
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

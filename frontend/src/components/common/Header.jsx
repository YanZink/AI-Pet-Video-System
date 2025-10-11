import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../ui/Button';
import LanguageSwitcher from './LanguageSwitcher';
import styles from './Header.module.css';

const Header = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { t } = useLanguage();
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
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.content}>
          <Link to="/" className={styles.logo} onClick={handleHomeClick}>
            <div className={styles.logoIcon}>
              <span className="text-white text-xl">🐾</span>
            </div>
            <span className={styles.logoText}>AI Pet Video Creator</span>
            <span className={styles.logoTextShort}>AI Pet Video</span>
          </Link>

          <nav className={styles.nav}>
            <Link to="/" className={styles.navLink} onClick={handleHomeClick}>
              {t('frontend:nav.home')}
            </Link>
            <button
              onClick={() => handleAnchorClick('how-it-works')}
              className={styles.navLink}
            >
              {t('frontend:nav.how_it_works')}
            </button>
            <button
              onClick={() => handleAnchorClick('features')}
              className={styles.navLink}
            >
              {t('frontend:nav.features')}
            </button>
            <button
              onClick={() => handleAnchorClick('contact')}
              className={styles.navLink}
            >
              {t('frontend:nav.contact')}
            </button>
          </nav>

          <div className={styles.actions}>
            <LanguageSwitcher className={styles.languageSwitcher} />

            {isAuthenticated ? (
              <div className={styles.userInfo}>
                <span className={styles.userName}>
                  {user?.first_name || user?.username || 'User'}
                </span>
                {isAdmin ? (
                  <>
                    <Button
                      size="small"
                      onClick={() => navigate('/dashboard')}
                      className={`${styles.compactButton} ${styles.navButton}`}
                    >
                      {t('frontend:nav.dashboard')}
                    </Button>
                    <Button
                      size="small"
                      onClick={() => navigate('/admin')}
                      className={`${styles.compactButton} ${styles.navButton}`}
                    >
                      {t('frontend:nav.admin')}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="small"
                    onClick={() => navigate('/dashboard')}
                    className={`${styles.compactButton} ${styles.navButton}`}
                  >
                    {t('frontend:nav.dashboard')}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="small"
                  onClick={handleLogout}
                  className={`${styles.compactButton} ${styles.logoutButton}`}
                >
                  {t('frontend:nav.logout')}
                </Button>
              </div>
            ) : (
              <div className={styles.userInfo}>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => navigate('/login')}
                  className={styles.compactButton}
                >
                  {t('frontend:nav.login')}
                </Button>
                <Button
                  size="small"
                  onClick={handleGetStarted}
                  className={styles.compactButton}
                >
                  {t('frontend:nav.get_started')}
                </Button>
              </div>
            )}
          </div>

          <button
            className={styles.menuButton}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              width="24"
              height="24"
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
          <div className={styles.mobileMenu}>
            <nav className={styles.mobileNav}>
              <Link
                to="/"
                className={styles.mobileNavLink}
                onClick={(e) => {
                  handleHomeClick(e);
                  setIsMenuOpen(false);
                }}
              >
                {t('frontend:nav.home')}
              </Link>
              <button
                onClick={() => handleAnchorClick('how-it-works')}
                className={styles.mobileNavLink}
              >
                {t('frontend:nav.how_it_works')}
              </button>
              <button
                onClick={() => handleAnchorClick('features')}
                className={styles.mobileNavLink}
              >
                {t('frontend:nav.features')}
              </button>
              <button
                onClick={() => handleAnchorClick('contact')}
                className={styles.mobileNavLink}
              >
                {t('frontend:nav.contact')}
              </button>

              <div className={styles.mobileLanguageSwitcher}>
                <LanguageSwitcher />
              </div>

              {isAuthenticated ? (
                <>
                  {isAdmin ? (
                    <>
                      <Button
                        onClick={() => {
                          navigate('/dashboard');
                          setIsMenuOpen(false);
                        }}
                        className={`w-full ${styles.compactButton}`}
                      >
                        {t('frontend:nav.dashboard')}
                      </Button>
                      <Button
                        onClick={() => {
                          navigate('/admin');
                          setIsMenuOpen(false);
                        }}
                        className={`w-full ${styles.compactButton}`}
                      >
                        {t('frontend:nav.admin')}
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => {
                        navigate('/dashboard');
                        setIsMenuOpen(false);
                      }}
                      className={`w-full ${styles.compactButton}`}
                    >
                      {t('frontend:nav.dashboard')}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className={`w-full ${styles.compactButton}`}
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
                    className={`w-full ${styles.compactButton}`}
                  >
                    {t('frontend:nav.login')}
                  </Button>
                  <Button
                    onClick={() => {
                      handleGetStarted();
                      setIsMenuOpen(false);
                    }}
                    className={`w-full ${styles.compactButton}`}
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

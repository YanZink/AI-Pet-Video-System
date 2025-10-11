import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import styles from './AdminSidebar.module.css';

const AdminSidebar = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const menuItems = [
    {
      path: '/admin',
      icon: '📊',
      label: t('frontend:admin.admin_sidebar_dashboard'),
      exact: true,
    },
    {
      path: '/admin/requests',
      icon: '📋',
      label: t('frontend:admin.admin_sidebar_requests'),
    },
  ];

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.menuIcon}>⚙️</span>
          {t('frontend:admin.admin_sidebar_title')}
        </h2>
      </div>

      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`${styles.menuItem} ${
              isActive(item) ? styles.active : ''
            }`}
          >
            <span className={styles.menuIcon}>{item.icon}</span>
            <span className={styles.menuLabel}>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.userInfo}>
        <p className={styles.userText}>
          {t('frontend:admin.admin_sidebar_logged_as')}{' '}
          <span className={styles.userName}>
            {t('frontend:admin.admin_sidebar_role_admin')}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AdminSidebar;

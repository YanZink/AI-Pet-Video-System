import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './AdminSidebar.module.css';

const AdminSidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/admin', icon: '📊', label: 'Dashboard', exact: true },
    { path: '/admin/requests', icon: '📋', label: 'Requests' },
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
          Admin Panel
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
          Logged in as <span className={styles.userName}>Admin</span>
        </p>
      </div>
    </div>
  );
};

export default AdminSidebar;

import React from 'react';
import styles from './StatsCard.module.css';

const StatsCard = ({ title, value, icon, color, onClick }) => {
  const colorClasses = {
    blue: styles.gradientBlue,
    purple: styles.gradientPurple,
    orange: styles.gradientOrange,
    green: styles.gradientGreen,
  };

  return (
    <div className={styles.statsCard} onClick={onClick}>
      <div className={styles.content}>
        <div className={styles.textContent}>
          <p className={styles.title}>{title}</p>
          <p className={styles.value}>{value}</p>
        </div>
        <div
          className={`${styles.iconContainer} ${
            colorClasses[color] || colorClasses.blue
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;

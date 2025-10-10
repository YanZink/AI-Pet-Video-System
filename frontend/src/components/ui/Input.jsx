import React from 'react';
import styles from './Input.module.css';

const Input = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className={styles.inputContainer}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputWrapper}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <input
          className={`
            ${styles.input}
            ${icon ? styles.inputWithIcon : ''}
            ${error ? styles.error : ''}
            ${className}
          `.trim()}
          {...props}
        />
      </div>
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
};

export default Input;

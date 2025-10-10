import React from 'react';
import styles from './Card.module.css';

const Card = ({
  children,
  className = '',
  variant = 'glass',
  elevated = false,
  ...props
}) => {
  const classes = `
    ${styles.card}
    ${styles[variant]}
    ${elevated ? styles.elevated : ''}
    ${className}
  `.trim();

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;

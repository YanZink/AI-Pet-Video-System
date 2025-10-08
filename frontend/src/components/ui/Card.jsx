import React from 'react';

const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

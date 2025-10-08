import React from 'react';

const Input = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-white mb-2 font-medium">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">
            {icon}
          </div>
        )}
        <input
          className={`w-full px-4 py-3 ${
            icon ? 'pl-10' : ''
          } bg-white/10 border ${
            error ? 'border-red-500' : 'border-white/20'
          } rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default Input;

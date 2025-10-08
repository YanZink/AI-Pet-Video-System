import React from 'react';

const StatsCard = ({ title, value, icon, color, onClick }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    orange: 'from-orange-500 to-red-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
  };

  return (
    <div
      className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 cursor-pointer hover:bg-white/15 transition-all duration-300 transform hover:scale-105 ${
        onClick ? 'hover:shadow-lg' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/70 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div
          className={`w-12 h-12 bg-gradient-to-r ${
            colorClasses[color] || colorClasses.blue
          } rounded-2xl flex items-center justify-center text-2xl`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;

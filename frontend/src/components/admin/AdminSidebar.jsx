import React from 'react';
import { Link, useLocation } from 'react-router-dom';

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
    <div className="w-64 bg-white/5 backdrop-blur-sm border-r border-white/10 min-h-screen p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <span className="mr-2">⚙️</span>
          Admin Panel
        </h2>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-4 py-3 rounded-lg transition-all ${
              isActive(item)
                ? 'bg-pink-500 text-white shadow-lg'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="text-xl mr-3">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-8 p-4 bg-white/5 rounded-lg">
        <p className="text-white/60 text-sm">
          Logged in as <span className="text-white font-medium">Admin</span>
        </p>
      </div>
    </div>
  );
};

export default AdminSidebar;

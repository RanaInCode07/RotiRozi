import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const links = [
  { to: '/pos', label: 'POS', icon: '🛒' },
  { to: '/tables', label: 'Tables', icon: '🪑' },
  { to: '/orders', label: 'Orders', icon: '📋' },
  { to: '/kitchen', label: 'Kitchen', icon: '👨‍🍳' },
  { to: '/menu', label: 'Menu', icon: '📖' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-20 lg:w-56 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-4 border-b border-gray-700">
        <h1 className="hidden lg:block text-lg font-bold text-orange-400">RestoPOS</h1>
        <span className="lg:hidden text-2xl">🍽️</span>
      </div>

      <nav className="flex-1 py-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            <span className="text-lg">{link.icon}</span>
            <span className="hidden lg:inline">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <p className="hidden lg:block text-xs text-gray-400 truncate mb-2">
          {user?.name}
        </p>
        <button
          onClick={handleLogout}
          className="text-xs text-red-400 hover:text-red-300"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

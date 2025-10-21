import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Notifications from './Notifications';
import DarkModeToggle from './DarkModeToggle';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/deposit', label: 'Deposit', icon: '💳' },
    { path: '/tickets', label: 'My Tickets', icon: '🎫' },
    { path: '/withdraw', label: 'Withdraw', icon: '💸' },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-gradient-to-b from-purple-600 via-indigo-600 to-blue-600 shadow-2xl rounded-r-3xl`}>

        {/* User Info */}
        <div className="flex flex-col items-center justify-center h-24 px-6 mt-4 bg-white dark:bg-gray-800 rounded-b-3xl shadow-lg">
          <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center text-white text-xl font-bold">
            {user?.id.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-sm text-gray-200">ID: {user?.id.slice(-6)}</span>
        </div>

        {/* Navigation */}
        <nav className="mt-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 mt-2 text-white font-medium rounded-l-full transition-all duration-300 
                hover:bg-white hover:text-purple-600 hover:shadow-lg transform hover:translate-x-2
                ${isActive(item.path) ? 'bg-white text-purple-600 shadow-lg translate-x-2' : ''}`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className="mx-3 text-lg">{item.icon}</span>
              <span className="mx-3">{item.label}</span>
            </Link>
          ))}
          {user?.isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center px-6 py-3 mt-2 text-white font-medium rounded-l-full transition-all duration-300
                hover:bg-white hover:text-purple-600 hover:shadow-lg transform hover:translate-x-2
                ${isActive('/admin') ? 'bg-white text-purple-600 shadow-lg translate-x-2' : ''}`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className="mx-3 text-lg">👨‍💼</span>
              <span className="mx-3">Admin Panel</span>
            </Link>
          )}
        </nav>
      </div>


      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-500 focus:outline-none lg:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <h1 className="ml-2 text-xl font-semibold text-gray-800 dark:text-white">Welcome to LuckyDraw</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">User ID: {user?.id.slice(-8)}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-white bg-primary-600 rounded-md hover:bg-primary-700"
            >
              Logout
            </button>
          </div>
          <DarkModeToggle />
          <Notifications />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div className="container px-6 py-8 mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
    
  );
};

export default Layout;
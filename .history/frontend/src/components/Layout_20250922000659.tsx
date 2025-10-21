import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Notifications from './Notifications';
import DarkModeToggle from './DarkModeToggle';
import { useTranslation } from 'react-i18next'; // Add this import
import LanguageSwitcher from './LanguageSwitcher'; // Add this import

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
      {/* Enhanced Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-indigo-900 to-gray-900 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Sidebar header with logo */}
        <div className="flex items-center justify-between h-20 px-6 from-indigo-900 to-gray-900 shadow-lg">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg mr-3 shadow-md">
              <span className="text-2xl">🎰</span>
            </div>
            <span className="text-xl font-bold text-white">LuckyDraw</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="lg:hidden text-white opacity-70 hover:opacity-100 transition-opacity"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        {/* User profile section */}
        <div className="px-6 py-2 border-b-2 border-indigo-800 shadow-sm">
          <div className="flex items-center">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold shadow-md">
               
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-indigo-900"></div>
            </div>
            <div className="ml-3">
              <p className="text-xs text-indigo-200">ID: {user?.id.slice(-8)}</p>
            </div>
          </div>
        </div>
        
        {/* Navigation items */}
        <nav className="mt-6 px-3">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center px-4 py-4 my-2 text-white rounded-xl transition-all duration-200 ${isActive(item.path) 
                ? 'bg-white/10 shadow-lg' 
                : 'hover:bg-white/5'}`
              }
              onMouseEnter={() => setActiveHover(item.path)}
              onMouseLeave={() => setActiveHover(null)}
              onClick={() => setIsSidebarOpen(false)}
            >
              {isActive(item.path) && (
                <div className="absolute left-0 w-1 h-8 bg-white rounded-r-md"></div>
              )}
              <span className="text-xl mr-4">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              <div className={`absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-xl transition-opacity duration-300 ${activeHover === item.path ? 'opacity-100' : 'opacity-0'}`}></div>
            </Link>
          ))}
          
          {user?.isAdmin && (
            <Link
              to="/admin"
              className={`relative flex items-center px-4 py-4 my-2 text-white rounded-xl transition-all duration-200 ${isActive('/admin') 
                ? 'bg-white/10 shadow-lg' 
                : 'hover:bg-white/5'}`
              }
              onMouseEnter={() => setActiveHover('/admin')}
              onMouseLeave={() => setActiveHover(null)}
              onClick={() => setIsSidebarOpen(false)}
            >
              {isActive('/admin') && (
                <div className="absolute left-0 w-1 h-8 bg-white rounded-r-md"></div>
              )}
              <span className="text-xl mr-4">👨‍💼</span>
              <span className="font-medium">Admin Panel</span>
              <div className={`absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-xl transition-opacity duration-300 ${activeHover === '/admin' ? 'opacity-100' : 'opacity-0'}`}></div>
            </Link>
          )}
        </nav>
        
        {/* Sidebar footer */}
        <div className="absolute bottom-0 w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <DarkModeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-sm text-white bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center mr-6">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-500 focus:outline-none lg:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <h1 className="ml-2 text-md lg:text-xl font-semibold text-gray-800 dark:text-white">{t('welcome')}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <LanguageSwitcher /> {/* Add this */}
           
            <span className="text-sm text-gray-600 dark:text-gray-300">User ID: {user?.id.slice(-8)}</span>
             <Notifications />
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-white bg-primary-600 rounded-md hover:bg-primary-700"
            >
              {t('logout')}
            </button>
          </div>
      
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
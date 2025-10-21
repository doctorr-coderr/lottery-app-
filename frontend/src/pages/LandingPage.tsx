import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-primary-600">LuckyDraw</span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium">
                Login
              </Link>
              <Link to="/register" className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors">
                Register
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-primary-600 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/login" className="text-gray-600 dark:text-gray-300 block px-3 py-2 rounded-md text-base font-medium hover:text-primary-600">
                Login
              </Link>
              <Link to="/register" className="bg-primary-600 text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-700">
                Register
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Welcome to <span className="text-primary-600">LuckyDraw</span>
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Participate in exciting lottery draws with a chance to win amazing prizes. 
            Simple, secure, and fair gaming experience.
          </p>
          
          <div className="mt-10">
            <Link to="/register" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 shadow-lg transform hover:scale-105 transition-all">
              Get Started
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 grid gap-8 md:grid-cols-3">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-primary-600 text-2xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Fair Draws</h3>
            <p className="text-gray-600 dark:text-gray-300">Our system uses secure random number generation to ensure completely fair lottery results.</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-primary-600 text-2xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Secure & Private</h3>
            <p className="text-gray-600 dark:text-gray-300">Your personal information is protected. Only unique IDs are displayed publicly.</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-primary-600 text-2xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Instant Notifications</h3>
            <p className="text-gray-600 dark:text-gray-300">Get notified immediately about draw results, deposit approvals, and more.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 rounded text-sm ${
          i18n.language === 'en' 
            ? 'bg-primary-600 text-white' 
            : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage('am')}
        className={`px-3 py-1 rounded text-sm ${
          i18n.language === 'am' 
            ? 'bg-primary-600 text-white' 
            : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        }`}
      >
        AM
      </button>
    </div>
  );
};

export default LanguageSwitcher;
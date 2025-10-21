import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="relative inline-block text-left">
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="appearance-none px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 rounded-lg
                   bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 
                   focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
      >
        <option value="en">Eng</option>
        <option value="am">አማ</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;

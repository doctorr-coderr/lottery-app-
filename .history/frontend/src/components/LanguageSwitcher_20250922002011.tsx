import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="relative inline-block text-center">
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        className=" px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600
                   bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 
                   focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer w-10"
      >
        <option value="en">Eng</option>
        <option value="am">አማ</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;

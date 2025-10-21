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
        className="appearance-none px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 
                   focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer
                   w-36"   // ✅ wider dropdown
      >
        <option value="en" className="p-3 rounded-md">Eng</option>
        <option value="am" className="p-3 rounded-md">አማ</option>
      </select>
      {/* little dropdown arrow */}
      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
        ▼
      </div>
    </div>
  );
};

export default LanguageSwitcher;

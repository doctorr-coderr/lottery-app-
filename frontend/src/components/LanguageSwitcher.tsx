import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'am' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="
        px-3 py-1 text-sm       /* mobile (default) */
        sm:px-3 sm:py-1.5 sm:text-sm   /* small screens */
        md:px-4 md:py-2 md:text-base   /* medium & up */
        rounded-full font-semibold border-2 border-indigo-400
        text-white shadow-md hover:shadow-lg 
        transition-transform transform 
        focus:outline-none
      "
    >
      {i18n.language === 'en' ? 'Eng' : 'አማ'}
    </button>

  );
};

export default LanguageSwitcher;

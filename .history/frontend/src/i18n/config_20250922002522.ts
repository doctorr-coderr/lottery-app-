import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English translations
const en = {
  translation: {
    // Common
    welcome: "Welcome",
    login: "Login",
    register: "Register",
    logout: "Logout",
    dashboard: "Dashboard",
    deposit: "Deposit",
    withdraw: "Withdraw",
    tickets: "My Tickets",
    balance: "Balance",
    settings: "Settings",
    
    // Auth
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    name: "Full Name",
    createAccount: "Create Account",
    haveAccount: "Already have an account?",
    noAccount: "Don't have an account?",
    
    // Dashboard
    upcomingDraws: "Upcoming Draws",
    recentWinners: "Recent Winners",
    currentBalance: "Current Balance",
    
    // Deposit
    amount: "Amount",
    uploadProof: "Upload Transfer Screenshot",
    submit: "Submit",
    depositHistory: "Deposit History",
    
    // Withdraw
    requestWithdraw: "Request Withdraw",
    withdrawHistory: "Withdraw History",
    minWithdraw: "Minimum withdraw amount: ETB {{amount}}",
    
    // Admin
    adminPanel: "Admin Panel",
    userManagement: "User Management",
    depositManagement: "Deposit Management",
    withdrawManagement: "Withdraw Management",
    drawManagement: "Draw Management",
    
    // Notifications
    notifications: "Notifications",
    markAllRead: "Mark all as read",
    
    // Errors
    error: "Error",
    success: "Success",
  }
};

// Amharic translations
const am = {
  translation: {
    // Common
    welcome: "እንኳን ደህና መጡ",
    login: "ግባ",
    register: "ተመዝገብ",
    logout: "ውጣ",
    dashboard: "ዳሽቦርድ",
    deposit: "የተቀማጭ ገንዘብ",
    withdraw: "ገንዘብ ለማውጣት",
    tickets: "ትኬቶች",
    balance: "ቀሪ ሂሳብ",
    settings: "ማስተካከያዎች",
    
    // Auth
    email: "ኢሜይል",
    password: "የይለፍ ቃል",
    confirmPassword: "የይለፍ ቃል አረጋግጥ",
    name: "ሙሉ ስም",
    createAccount: "መለያ ፍጠር",
    haveAccount: "ቀድሞውኑ መለያ አሎት?",
    noAccount: "መለያ የሎትም?",
    
    // Dashboard
    upcomingDraws: "ተጠባቂ ዕጣዎች",
    recentWinners: "የቅርብ ጊዜ አሸናፊዎች",
    currentBalance: "ቀሪ ሂሳብ",
    
    // Deposit
    amount: "መጠን",
    uploadProof: "የተለዋወጡ ገንዘብ ማስረጃ ጫን",
    submit: "አስገባ",
    depositHistory: "የተቀማጭ ገንዘብ ታሪክ",
    
    // Withdraw
    requestWithdraw: "ገንዘብ ለመውጣት ይጠይቁ",
    withdrawHistory: "የገንዘብ ማውጫ ታሪክ",
    minWithdraw: "ዝርዝር የሚወጣው ዝቅተኛ መጠን: ETB {{amount}}",
    
    // Admin
    adminPanel: "የአስተዳዳሪ ፓናል",
    userManagement: "የተጠቃሚዎች አስተዳደር",
    depositManagement: "የተቀማጭ ገንዘብ አስተዳደር",
    withdrawManagement: "የገንዘብ ማውጫ አስተዳደር",
    drawManagement: "የዕጣ አሰጣጥ አስተዳደር",
    
    // Notifications
    notifications: "ማስታወቂያዎች",
    markAllRead: "ሁሉንም አንብብ",
    
    // Errors
    error: "ስህተት",
    success: "ተሳክቷል",
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: en,
      am: am,
    },
    fallbackLng: "en",
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

  

export default i18n;
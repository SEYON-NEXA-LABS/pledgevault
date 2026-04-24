/**
 * PledgeVault — Localization Dictionary
 * Default: English (en)
 * Support: Tamil (ta)
 */

export type Language = 'en' | 'ta';

export const translations = {
  en: {
    common: {
      pledgevault: 'PledgeVault',
      welcome: 'Welcome',
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      actions: 'Actions',
      status: 'Status',
      date: 'Date',
      all: 'All',
      gold: 'Gold',
      silver: 'Silver',
      management: 'Management',
      newLoan: 'New Loan',
      liveMarket: 'Live Market',
      secureVault: 'Secure Vault Management',
    },
    login: {
      greeting: 'Welcome Back',
      subtitle: 'Sign in to manage your vault',
      emailLabel: 'Email Address',
      emailPlaceholder: 'branch@pledgevault.com',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      button: 'Unlock Workspace',
      authenticating: 'Welcome back! Authenticating...',
      errorTitle: 'Access Denied',
      forgotPassword: 'Forgot password?',
      startTrial: 'Start Free Trial',
      newUser: 'New to PledgeVault?',
    },
    dashboard: {
      title: 'Dashboard',
      marketPulse: 'Market Pulse',
      activeLoans: 'Active Loans',
      overdue: 'Overdue',
      totalValue: 'Total Value',
      customers: 'Customers',
    }
  },
  ta: {
    common: {
      pledgevault: 'PledgeVault',
      welcome: 'வரவேற்கிறோம்',
      loading: 'ஏற்றுகிறது...',
      save: 'சேமி',
      cancel: 'ரத்து செய்',
      delete: 'நீக்கு',
      edit: 'திருத்து',
      actions: 'செயல்கள்',
      status: 'நிலை',
      date: 'தேதி',
      all: 'அனைத்தும்',
      gold: 'தங்கம்',
      silver: 'வெள்ளி',
      management: 'மேலாண்மை',
      newLoan: 'புதிய அடமானம்',
      liveMarket: 'நேரடிச் சந்தை',
      secureVault: 'பாதுகாப்பான மேலாண்மை',
    },
    login: {
      greeting: 'மீண்டும் வருக',
      subtitle: 'உங்கள் கணக்கை அணுக உள்நுழையவும்',
      emailLabel: 'மின்னஞ்சல் முகவரி',
      emailPlaceholder: 'branch@pledgevault.com',
      passwordLabel: 'கடவுச்சொல்',
      passwordPlaceholder: '••••••••',
      button: 'அணுகலைத் திறக்கவும்',
      authenticating: 'வரவேற்கிறோம்! அங்கீகரிக்கிறது...',
      errorTitle: 'அணுகல் மறுக்கப்பட்டது',
      forgotPassword: 'கடவுச்சொல் மறந்தீர்களா?',
      startTrial: 'இலவச சோதனை',
      newUser: 'புதியவரா?',
    },
    dashboard: {
      title: 'தகவல் பலகை',
      marketPulse: 'சந்தை நிலவரம்',
      activeLoans: 'செயலில் உள்ள கடன்கள்',
      overdue: 'காலாவதியானது',
      totalValue: 'மொத்த மதிப்பு',
      customers: 'வாடிக்கையாளர்கள்',
    }
  }
};

export type TranslationKeys = typeof translations.en;

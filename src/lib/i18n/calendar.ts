/**
 * PledgeVault — Localization Dictionary
 * 
 * All translatable text lives here. Currently supports Tamil (ta) and English (en).
 * To add a new language, add a new key to the `dictionaries` object below
 * and populate all fields.
 */

export type Locale = 'ta' | 'en';

export interface CalendarDictionary {
  // Day names (Sun=0 ... Sat=6)
  days: string[];

  // Month names (12 months, mapped to Tamil solar calendar)
  months: string[];

  // Tithi names (30 tithis per lunar month)
  tithis: string[];

  // Moon phase labels
  moonPhases: {
    newMoon: string;
    waxingCrescent: string;
    firstQuarter: string;
    waxingGibbous: string;
    fullMoon: string;
    waningGibbous: string;
    lastQuarter: string;
    waningCrescent: string;
  };

  // Paksha (fortnight) labels
  paksha: {
    shukla: string;  // Waxing
    krishna: string; // Waning
  };

  // Time slot labels
  timeSlots: {
    rahuKaalam: string;
    yamagandam: string;
    gulikaiKalam: string;
  };

  // UI labels
  labels: {
    dailyCalendar: string;
    sunrise: string;
    sunset: string;
    nextFullMoon: string;
    nextNewMoon: string;
    illuminated: string;
    tithi: string;
    active: string;
    days: string; // "days" as in "X days"
  };
}

const ta: CalendarDictionary = {
  days: ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'],

  months: [
    'தை', 'மாசி', 'பங்குனி', 'சித்திரை', 'வைகாசி', 'ஆனி',
    'ஆடி', 'ஆவணி', 'புரட்டாசி', 'ஐப்பசி', 'கார்த்திகை', 'மார்கழி',
  ],

  tithis: [
    'பிரதமை', 'த்விதியை', 'திருதியை', 'சதுர்த்தி', 'பஞ்சமி',
    'சஷ்டி', 'சப்தமி', 'அஷ்டமி', 'நவமி', 'தசமி',
    'ஏகாதசி', 'துவாதசி', 'திரயோதசி', 'சதுர்தசி', 'பௌர்ணமி',
    'பிரதமை', 'த்விதியை', 'திருதியை', 'சதுர்த்தி', 'பஞ்சமி',
    'சஷ்டி', 'சப்தமி', 'அஷ்டமி', 'நவமி', 'தசமி',
    'ஏகாதசி', 'துவாதசி', 'திரயோதசி', 'சதுர்தசி', 'அமாவாசை',
  ],

  moonPhases: {
    newMoon: 'அமாவாசை',
    waxingCrescent: 'வளர்பிறை',
    firstQuarter: 'அரைநிலவு',
    waxingGibbous: 'வளர்பிறை',
    fullMoon: 'பௌர்ணமி',
    waningGibbous: 'தேய்பிறை',
    lastQuarter: 'அரைநிலவு',
    waningCrescent: 'தேய்பிறை',
  },

  paksha: {
    shukla: 'சுக்ல பக்ஷம்',
    krishna: 'கிருஷ்ண பக்ஷம்',
  },

  timeSlots: {
    rahuKaalam: 'ராகு காலம்',
    yamagandam: 'யமகண்டம்',
    gulikaiKalam: 'குளிகை காலம்',
  },

  labels: {
    dailyCalendar: 'நாள்காட்டி',
    sunrise: 'சூரிய உதயம்',
    sunset: 'சூரிய அஸ்தமனம்',
    nextFullMoon: 'அடுத்த பௌர்ணமி',
    nextNewMoon: 'அடுத்த அமாவாசை',
    illuminated: 'ஒளிர்வு',
    tithi: 'திதி',
    active: 'நடப்பு',
    days: 'நாட்கள்',
  },
};

const en: CalendarDictionary = {
  days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

  months: [
    'Thai', 'Maasi', 'Panguni', 'Chithirai', 'Vaigasi', 'Aani',
    'Aadi', 'Aavani', 'Purattasi', 'Aippasi', 'Karthigai', 'Margazhi',
  ],

  tithis: [
    'Prathama', 'Dvitiya', 'Tritiya', 'Chaturthi', 'Panchami',
    'Shashti', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
    'Ekadashi', 'Dvadashi', 'Trayodashi', 'Chaturdashi', 'Pournami',
    'Prathama', 'Dvitiya', 'Tritiya', 'Chaturthi', 'Panchami',
    'Shashti', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
    'Ekadashi', 'Dvadashi', 'Trayodashi', 'Chaturdashi', 'Amavasai',
  ],

  moonPhases: {
    newMoon: 'New Moon',
    waxingCrescent: 'Waxing Crescent',
    firstQuarter: 'First Quarter',
    waxingGibbous: 'Waxing Gibbous',
    fullMoon: 'Full Moon',
    waningGibbous: 'Waning Gibbous',
    lastQuarter: 'Last Quarter',
    waningCrescent: 'Waning Crescent',
  },

  paksha: {
    shukla: 'Shukla Paksha',
    krishna: 'Krishna Paksha',
  },

  timeSlots: {
    rahuKaalam: 'Rahu Kaalam',
    yamagandam: 'Yamagandam',
    gulikaiKalam: 'Gulikai Kalam',
  },

  labels: {
    dailyCalendar: 'Daily Calendar',
    sunrise: 'Sunrise',
    sunset: 'Sunset',
    nextFullMoon: 'Next Full Moon',
    nextNewMoon: 'Next New Moon',
    illuminated: 'illuminated',
    tithi: 'Tithi',
    active: 'ACTIVE',
    days: 'days',
  },
};

// ---- Public API ----

const dictionaries: Record<Locale, CalendarDictionary> = { ta, en };

/** Default locale — change this to switch the entire calendar language */
let currentLocale: Locale = 'ta';

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function getDictionary(locale?: Locale): CalendarDictionary {
  return dictionaries[locale ?? currentLocale];
}

export default dictionaries;

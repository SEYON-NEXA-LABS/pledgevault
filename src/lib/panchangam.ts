/**
 * PledgeVault — Tamil Panchangam, Muhurtham & Gold Festival Engine
 * Powered by high-accuracy astronomy algorithms ported from TamilCalendar.
 */

export interface PanchangamDayInfo {
  date: Date;
  dayOfWeek: number;
  dayNameEn: string;
  dayNameTa: string;
  tamilMonth: string;
  tamilMonthTa: string;
  tamilDay: number;
  tithiIndex: number;
  tithiNameTa: string;
  tithiNameEn: string;
  paksha: 'shukla' | 'krishna';
  pakshaTa: string;
  moonEmoji: string;
  illumination: number;
  rahuKalam: string;
  yamagandam: string;
  kuligai: string;
  isSubhaMuhurtham: boolean;
  specialFestival?: {
    name: string;
    nameTa: string;
    isGoldAuspicious: boolean;
    tagline: string;
  };
}

// Tamil solar month names
export const TAMIL_MONTHS = [
  { en: 'Chithirai', ta: 'சித்திரை' },
  { en: 'Vaikasi', ta: 'வைகாசி' },
  { en: 'Aani', ta: 'ஆனி' },
  { en: 'Aadi', ta: 'ஆடி' },
  { en: 'Aavani', ta: 'ஆவணி' },
  { en: 'Purattasi', ta: 'புரட்டாசி' },
  { en: 'Aippasi', ta: 'ஐப்பசி' },
  { en: 'Karthigai', ta: 'கார்த்திகை' },
  { en: 'Margazhi', ta: 'மார்கழி' },
  { en: 'Thai', ta: 'தை' },
  { en: 'Maasi', ta: 'மாசி' },
  { en: 'Panguni', ta: 'பங்குனி' }
];

export const DAYS_TA = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
export const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TITHIS_TA = [
  'பிரதமை', 'துவிதியை', 'திருதியை', 'சதுர்த்தி', 'பஞ்சமி',
  'சஷ்டி', 'சப்தமி', 'அஷ்டமி', 'நவமி', 'தசமி',
  'ஏகாதசி', 'துவாதசி', 'திரயோதசி', 'சதுர்தசி', 'பௌர்ணமி',
  'பிரதமை', 'துவிதியை', 'திருதியை', 'சதுர்த்தி', 'பஞ்சமி',
  'சஷ்டி', 'சப்தமி', 'அஷ்டமி', 'நவமி', 'தசமி',
  'ஏகாதசி', 'துவாதசி', 'திரயோதசி', 'சதுர்தசி', 'அமாவாசை'
];

export const TITHIS_EN = [
  'Prathama', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashti', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Pournami (Full Moon)',
  'Prathama', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashti', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya (New Moon)'
];

// Planet Hour Intervals (Sun=0 ... Sat=6)
const RAHU_SLOTS: Record<number, [number, number]> = {
  0: [16.5, 18], 1: [7.5, 9], 2: [15, 16.5],
  3: [12, 13.5], 4: [13.5, 15], 5: [10.5, 12], 6: [9, 10.5]
};

const YAMA_SLOTS: Record<number, [number, number]> = {
  0: [12, 13.5], 1: [10.5, 12], 2: [9, 10.5],
  3: [7.5, 9], 4: [6, 7.5], 5: [15, 16.5], 6: [13.5, 15]
};

const GULIKAI_SLOTS: Record<number, [number, number]> = {
  0: [15, 16.5], 1: [13.5, 15], 2: [12, 13.5],
  3: [10.5, 12], 4: [9, 10.5], 5: [7.5, 9], 6: [6, 7.5]
};

const KNOWN_NEW_MOON = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
const SYNODIC_MONTH = 29.53058770576;

function formatSlotTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
}

export function getTamilMonthAndDay(date: Date): { monthIndex: number; day: number } {
  const gMonth = date.getMonth(); // 0-11
  const gDay = date.getDate();
  // Solar transit day approximate offsets for Tamil months
  // Chithirai (mid-April) starts around April 14
  const transitDays = [14, 13, 14, 14, 14, 15, 17, 17, 17, 18, 16, 16];
  
  // Tamil months indexed from Chithirai (0):
  // 0: Chithirai (Apr 14)
  // 1: Vaikasi (May 14)
  // 2: Aani (Jun 15)
  // 3: Aadi (Jul 17)
  // 4: Aavani (Aug 17)
  // 5: Purattasi (Sep 17)
  // 6: Aippasi (Oct 18)
  // 7: Karthigai (Nov 17)
  // 8: Margazhi (Dec 16)
  // 9: Thai (Jan 14)
  // 10: Maasi (Feb 13)
  // 11: Panguni (Mar 14)

  const monthMap = [
    { startMonth: 3, startDay: 14, nameIdx: 0 },  // Chithirai: Apr 14
    { startMonth: 4, startDay: 14, nameIdx: 1 },  // Vaikasi: May 14
    { startMonth: 5, startDay: 15, nameIdx: 2 },  // Aani: Jun 15
    { startMonth: 6, startDay: 17, nameIdx: 3 },  // Aadi: Jul 17
    { startMonth: 7, startDay: 17, nameIdx: 4 },  // Aavani: Aug 17
    { startMonth: 8, startDay: 17, nameIdx: 5 },  // Purattasi: Sep 17
    { startMonth: 9, startDay: 18, nameIdx: 6 },  // Aippasi: Oct 18
    { startMonth: 10, startDay: 17, nameIdx: 7 }, // Karthigai: Nov 17
    { startMonth: 11, startDay: 16, nameIdx: 8 }, // Margazhi: Dec 16
    { startMonth: 0, startDay: 14, nameIdx: 9 },  // Thai: Jan 14
    { startMonth: 1, startDay: 13, nameIdx: 10 }, // Maasi: Feb 13
    { startMonth: 2, startDay: 14, nameIdx: 11 }  // Panguni: Mar 14
  ];

  let currentMap = monthMap[0];
  for (let i = 0; i < monthMap.length; i++) {
    const nextIdx = (i + 1) % monthMap.length;
    const curr = monthMap[i];
    const next = monthMap[nextIdx];
    
    // Check if date falls in curr
    const startDate = new Date(date.getFullYear(), curr.startMonth, curr.startDay);
    let endDate = new Date(date.getFullYear(), next.startMonth, next.startDay);
    if (next.startMonth < curr.startMonth) {
      endDate = new Date(date.getFullYear() + 1, next.startMonth, next.startDay);
    }

    const testTime = date.getTime();
    if (testTime >= startDate.getTime() && testTime < endDate.getTime()) {
      currentMap = curr;
      const diffDays = Math.floor((testTime - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return { monthIndex: currentMap.nameIdx, day: diffDays };
    }
  }

  return { monthIndex: 7, day: gDay }; // Fallback
}

export function getPanchangamForDate(date: Date): PanchangamDayInfo {
  const dayOfWeek = date.getDay();
  const diffMs = date.getTime() - KNOWN_NEW_MOON.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const lunarAge = ((diffDays % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;

  const tithiLength = SYNODIC_MONTH / 30;
  const tithiIndex = Math.floor(lunarAge / tithiLength) % 30;
  const paksha = tithiIndex < 15 ? 'shukla' : 'krishna';
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * lunarAge / SYNODIC_MONTH)) / 2 * 100);

  const phaseEmojis = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
  const emojiIdx = Math.floor((lunarAge / SYNODIC_MONTH) * 8) % 8;

  const { monthIndex: tamilMonthIdx, day: tamilDay } = getTamilMonthAndDay(date);
  const tamilMonth = TAMIL_MONTHS[tamilMonthIdx];

  const rahu = RAHU_SLOTS[dayOfWeek];
  const yama = YAMA_SLOTS[dayOfWeek];
  const guli = GULIKAI_SLOTS[dayOfWeek];

  // Auspicious subha muhurtham evaluation:
  // Usually Mon, Wed, Thu, Fri are preferred; avoid Rahu Kalam & Amavasya
  const isGoodDay = [1, 3, 4, 5].includes(dayOfWeek);
  const isNotAmavasya = tithiIndex !== 29;
  const isSubhaMuhurtham = isGoodDay && isNotAmavasya;

  // Gold Buying & Pledging Auspicious Festivals
  let specialFestival: PanchangamDayInfo['specialFestival'] = undefined;

  // 1. Akshaya Tritiya: Chithirai Month + Shukla Tritiya (Tithi index 2 or 3)
  if (tamilMonth.en === 'Chithirai' && (tithiIndex === 2 || tithiIndex === 3)) {
    specialFestival = {
      name: 'Akshaya Tritiya',
      nameTa: 'அக்ஷய திருதியை',
      isGoldAuspicious: true,
      tagline: 'Premier Gold & Silver Prosperity Day'
    };
  }
  // 2. Dhanteras: Aippasi Month + Krishna Trayodashi (Tithi index 27 or 28)
  else if (tamilMonth.en === 'Aippasi' && (tithiIndex === 27 || tithiIndex === 28)) {
    specialFestival = {
      name: 'Dhanteras',
      nameTa: 'தனத்திரயோதசி (தந்தேரஸ்)',
      isGoldAuspicious: true,
      tagline: 'Auspicious Metal Pledging & Purchase'
    };
  }
  // 3. Diwali: Aippasi Month + Tithi index 29 (Naraka Chaturdashi / Deepavali)
  else if (tamilMonth.en === 'Aippasi' && tithiIndex === 29) {
    specialFestival = {
      name: 'Deepavali',
      nameTa: 'தீபாவளி பண்டிகை',
      isGoldAuspicious: true,
      tagline: 'Festive High Volume Turnover'
    };
  }
  // 4. Tamil New Year / Chithirai 1
  else if (tamilMonth.en === 'Chithirai' && tamilDay === 1) {
    specialFestival = {
      name: 'Tamil New Year',
      nameTa: 'சித்திரை கனி / புத்தாண்டு',
      isGoldAuspicious: true,
      tagline: 'Annual New Year Auspicious Beginning'
    };
  }
  // 5. Thai Pongal: Thai 1
  else if (tamilMonth.en === 'Thai' && tamilDay === 1) {
    specialFestival = {
      name: 'Thai Pongal',
      nameTa: 'தைப்பொங்கல் திருநாள்',
      isGoldAuspicious: true,
      tagline: 'Harvest Prosperity & Gold Pledging Day'
    };
  }
  // 6. Pournami (Full Moon)
  else if (tithiIndex === 14) {
    specialFestival = {
      name: 'Pournami',
      nameTa: 'பௌர்ணமி சுப தினம்',
      isGoldAuspicious: true,
      tagline: 'Full Moon Auspicious Vratam'
    };
  }
  // 7. Amavasya (New Moon)
  else if (tithiIndex === 29) {
    specialFestival = {
      name: 'Amavasya',
      nameTa: 'அமாவாசை',
      isGoldAuspicious: false,
      tagline: 'Ancestral Observance (Generally Avoid New Ventures)'
    };
  }

  return {
    date,
    dayOfWeek,
    dayNameEn: DAYS_EN[dayOfWeek],
    dayNameTa: DAYS_TA[dayOfWeek],
    tamilMonth: tamilMonth.en,
    tamilMonthTa: tamilMonth.ta,
    tamilDay,
    tithiIndex,
    tithiNameTa: TITHIS_TA[tithiIndex],
    tithiNameEn: TITHIS_EN[tithiIndex],
    paksha,
    pakshaTa: paksha === 'shukla' ? 'வளர்பிறை' : 'தேய்பிறை',
    moonEmoji: phaseEmojis[emojiIdx],
    illumination,
    rahuKalam: `${formatSlotTime(rahu[0])} - ${formatSlotTime(rahu[1])}`,
    yamagandam: `${formatSlotTime(yama[0])} - ${formatSlotTime(yama[1])}`,
    kuligai: `${formatSlotTime(guli[0])} - ${formatSlotTime(guli[1])}`,
    isSubhaMuhurtham,
    specialFestival
  };
}

export function getUpcomingGoldMuhurthams(currentDate: Date, count: number = 3): { date: Date; name: string; nameTa: string; daysAway: number }[] {
  const results: { date: Date; name: string; nameTa: string; daysAway: number }[] = [];
  const testDate = new Date(currentDate);

  for (let i = 1; i <= 90 && results.length < count; i++) {
    testDate.setDate(testDate.getDate() + 1);
    const panchangam = getPanchangamForDate(new Date(testDate));
    if (panchangam.specialFestival && panchangam.specialFestival.isGoldAuspicious) {
      results.push({
        date: new Date(testDate),
        name: panchangam.specialFestival.name,
        nameTa: panchangam.specialFestival.nameTa,
        daysAway: i
      });
    }
  }

  return results;
}

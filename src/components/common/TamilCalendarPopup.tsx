'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Sun, Moon, Star, AlertTriangle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getDictionary } from '@/lib/i18n/calendar';

// ---- Rahu / Yama / Gulikai Slots (day-of-week indexed) ----
const RAHU_KALAM_SLOTS: Record<number, [number, number]> = {
  0: [16.5, 18], 1: [7.5, 9], 2: [15, 16.5],
  3: [12, 13.5], 4: [13.5, 15], 5: [10.5, 12], 6: [9, 10.5],
};

const YAMAGANDAM_SLOTS: Record<number, [number, number]> = {
  0: [12, 13.5], 1: [10.5, 12], 2: [9, 10.5],
  3: [7.5, 9], 4: [6, 7.5], 5: [15, 16.5], 6: [13.5, 15],
};

const GULIKAI_SLOTS: Record<number, [number, number]> = {
  0: [15, 16.5], 1: [13.5, 15], 2: [12, 13.5],
  3: [10.5, 12], 4: [9, 10.5], 5: [7.5, 9], 6: [6, 7.5],
};

// ---- Lunar Phase Calculation ----
const KNOWN_NEW_MOON = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
const SYNODIC_MONTH = 29.53058770576;

const PHASE_EMOJIS: Record<string, string> = {
  'new': '🌑', 'waxing-crescent': '🌒', 'first-quarter': '🌓', 'waxing-gibbous': '🌔',
  'full': '🌕', 'waning-gibbous': '🌖', 'last-quarter': '🌗', 'waning-crescent': '🌘',
};

type PhaseKey = 'newMoon' | 'waxingCrescent' | 'firstQuarter' | 'waxingGibbous' | 'fullMoon' | 'waningGibbous' | 'lastQuarter' | 'waningCrescent';

interface MoonPhaseInfo {
  phaseId: string;
  phaseKey: PhaseKey;
  emoji: string;
  tithiIndex: number;
  paksha: 'shukla' | 'krishna';
  illumination: number;
  daysToNextFullMoon: number;
  daysToNextNewMoon: number;
}

function getMoonPhase(date: Date): MoonPhaseInfo {
  const diffMs = date.getTime() - KNOWN_NEW_MOON.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const lunarAge = ((diffDays % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;

  const tithiLength = SYNODIC_MONTH / 30;
  const tithiIndex = Math.floor(lunarAge / tithiLength) % 30;
  const paksha = tithiIndex < 15 ? 'shukla' as const : 'krishna' as const;

  const illumination = Math.round((1 - Math.cos(2 * Math.PI * lunarAge / SYNODIC_MONTH)) / 2 * 100);

  let phaseId: string;
  let phaseKey: PhaseKey;

  if (lunarAge < 1.85) { phaseId = 'new'; phaseKey = 'newMoon'; }
  else if (lunarAge < 7.38) { phaseId = 'waxing-crescent'; phaseKey = 'waxingCrescent'; }
  else if (lunarAge < 9.23) { phaseId = 'first-quarter'; phaseKey = 'firstQuarter'; }
  else if (lunarAge < 13.84) { phaseId = 'waxing-gibbous'; phaseKey = 'waxingGibbous'; }
  else if (lunarAge < 15.69) { phaseId = 'full'; phaseKey = 'fullMoon'; }
  else if (lunarAge < 22.15) { phaseId = 'waning-gibbous'; phaseKey = 'waningGibbous'; }
  else if (lunarAge < 24.00) { phaseId = 'last-quarter'; phaseKey = 'lastQuarter'; }
  else { phaseId = 'waning-crescent'; phaseKey = 'waningCrescent'; }

  return {
    phaseId, phaseKey, emoji: PHASE_EMOJIS[phaseId], tithiIndex, paksha, illumination,
    daysToNextNewMoon: Math.round(SYNODIC_MONTH - lunarAge),
    daysToNextFullMoon: lunarAge < (SYNODIC_MONTH/2) ? Math.round((SYNODIC_MONTH/2) - lunarAge) : Math.round(SYNODIC_MONTH + (SYNODIC_MONTH/2) - lunarAge),
  };
}

// ---- Calendar Helpers ----
function getTamilMonthIndex(date: Date): number {
  const month = date.getMonth();
  const day = date.getDate();
  const transitions = [14, 13, 14, 14, 14, 15, 17, 17, 17, 18, 16, 16];
  return day >= transitions[month] ? month : (month + 11) % 12;
}

function formatHour(h: number): string {
  const hour = Math.floor(h);
  const min = Math.round((h - hour) * 60);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${min.toString().padStart(2, '0')} ${period}`;
}

const isAuspicious = (date: Date) => {
  const d = date.getDate();
  const m = date.getMonth();
  // Sample Auspicious Days (Subha Muhurtham) for May 2026
  if (m === 4) return [4, 11, 22, 25, 27].includes(d);
  if (m === 3) return [14, 16, 26, 30].includes(d);
  return d % 7 === 0; // Fallback logic
};

interface TamilCalendarPopupProps {
  onClose: () => void;
}

export default function TamilCalendarPopup({ onClose }: TamilCalendarPopupProps) {
  const [view, setView] = useState<'day' | 'month'>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const popupRef = useRef<HTMLDivElement>(null);

  const t = getDictionary('ta');
  const en = getDictionary('en');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const moonInfo = getMoonPhase(now);
  const dayOfWeek = now.getDay();
  
  // ---- Month Grid Logic ----
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  return (
    <div className="tamil-calendar-popup shadow-premium" ref={popupRef}>
      <div className="popup-header">
        <div className="view-toggle">
          <button className={view === 'day' ? 'active' : ''} onClick={() => setView('day')}>Today</button>
          <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>Month</button>
        </div>
        <button className="close-btn" onClick={onClose}><X size={18} /></button>
      </div>

      <div className="calendar-content">
        {view === 'day' ? (
          <div className="day-view animate-fade-in">
            <div className="date-hero">
              <span className="big-date">{now.getDate()}</span>
              <div className="hero-text">
                <span className="day-name">{en.days[dayOfWeek]}</span>
                <span className="tamil-info">{t.days[dayOfWeek]} • {t.months[getTamilMonthIndex(now)]}</span>
              </div>
            </div>

            <div className="lunar-strip">
              <span className="moon-emoji">{moonInfo.emoji}</span>
              <div className="lunar-details">
                <span className="tithi-name">{t.moonPhases[moonInfo.phaseKey]} • {t.tithis[moonInfo.tithiIndex]}</span>
                <span className="tithi-sub">{en.moonPhases[moonInfo.phaseKey]} • {moonInfo.illumination}% illum.</span>
              </div>
            </div>

            <div className="muhurtham-slots">
              <div className="slot-item">
                <span className="label">{t.timeSlots.rahuKaalam}</span>
                <span className="value">{formatHour(RAHU_KALAM_SLOTS[dayOfWeek][0])} - {formatHour(RAHU_KALAM_SLOTS[dayOfWeek][1])}</span>
              </div>
              <div className="slot-item">
                <span className="label">{t.timeSlots.yamagandam}</span>
                <span className="value">{formatHour(YAMAGANDAM_SLOTS[dayOfWeek][0])} - {formatHour(YAMAGANDAM_SLOTS[dayOfWeek][1])}</span>
              </div>
            </div>
            
            {isAuspicious(now) && (
              <div className="auspicious-banner">
                <Star size={14} fill="currentColor" /> Highly Auspicious Day (Subha Muhurtham)
              </div>
            )}
          </div>
        ) : (
          <div className="month-view animate-fade-in">
            <div className="month-nav">
              <button onClick={prevMonth}><ChevronLeft size={18} /></button>
              <span className="month-title">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              <button onClick={nextMonth}><ChevronRight size={18} /></button>
            </div>
            <div className="calendar-grid">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={`label-${i}`} className="grid-label">{d}</div>)}
              {Array(firstDayOfMonth).fill(null).map((_, i) => <div key={`empty-${i}`} className="grid-day empty" />)}
              {days.map(d => {
                const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
                const isToday = d === now.getDate() && currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear();
                const auspicious = isAuspicious(dateObj);
                const phase = getMoonPhase(dateObj);
                const isHighlight = phase.phaseId === 'full' || phase.phaseId === 'new';

                return (
                  <div key={d} className={`grid-day ${isToday ? 'today' : ''} ${auspicious ? 'auspicious' : ''} ${isHighlight ? 'lunar-event' : ''}`}>
                    <span className="day-number">{d}</span>
                    {auspicious && <span className="muhurtham-dot" title="Subha Muhurtham" />}
                    {isHighlight && <span className="lunar-dot" title={phase.phaseId === 'full' ? 'Full Moon' : 'New Moon'}>{phase.emoji}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

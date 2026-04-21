'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Sun, Moon, Star, AlertTriangle } from 'lucide-react';
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

  const illumination = Math.round(
    (1 - Math.cos(2 * Math.PI * lunarAge / SYNODIC_MONTH)) / 2 * 100
  );

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

  const halfCycle = SYNODIC_MONTH / 2;

  return {
    phaseId,
    phaseKey,
    emoji: PHASE_EMOJIS[phaseId],
    tithiIndex,
    paksha,
    illumination,
    daysToNextNewMoon: Math.round(SYNODIC_MONTH - lunarAge),
    daysToNextFullMoon: lunarAge < halfCycle
      ? Math.round(halfCycle - lunarAge)
      : Math.round(SYNODIC_MONTH + halfCycle - lunarAge),
  };
}

// ---- Calendar Helpers ----

function getTamilYear(date: Date): number {
  const month = date.getMonth();
  const day = date.getDate();
  const year = date.getFullYear();
  return (month > 3 || (month === 3 && day >= 14)) ? year + 31 : year + 30;
}

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

function formatTimeSlot(slot: [number, number]): string {
  return `${formatHour(slot[0])} – ${formatHour(slot[1])}`;
}

function isActiveNow(slot: [number, number], now: Date): boolean {
  const currentHour = now.getHours() + now.getMinutes() / 60;
  return currentHour >= slot[0] && currentHour < slot[1];
}

// ---- Component ----

export default function DailyCalendarCard() {
  const [now, setNow] = useState(new Date());
  const t = getDictionary('ta'); // Primary language
  const en = getDictionary('en'); // Secondary (English fallback)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const dayOfWeek = now.getDay();
  const moonInfo = getMoonPhase(now);
  const rahuSlot = RAHU_KALAM_SLOTS[dayOfWeek];
  const yamaSlot = YAMAGANDAM_SLOTS[dayOfWeek];
  const gulikaiSlot = GULIKAI_SLOTS[dayOfWeek];
  const rahuActive = isActiveNow(rahuSlot, now);
  const yamaActive = isActiveNow(yamaSlot, now);
  const isSpecialDay = moonInfo.phaseId === 'new' || moonInfo.phaseId === 'full';

  const formattedDate = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="card daily-calendar-card" style={{ animationDelay: '0.4s' }}>
      <div className="card-header">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} style={{ color: 'var(--brand-primary)' }} />
          {en.labels.dailyCalendar}
        </h3>
        <div className="card-header-actions">
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{formattedTime}</span>
        </div>
      </div>

      <div className="card-body" style={{ padding: '0' }}>
        {/* Date Header */}
        <div style={{
          padding: '20px 24px', textAlign: 'center',
          background: 'linear-gradient(135deg, var(--sidebar-bg), var(--sidebar-bg-dark))', color: 'white',
        }}>
          <div style={{
            fontSize: '42px', fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1, marginBottom: '4px',
            color: 'var(--brand-primary)', // Using solid brand color for clarity
          }}>
            {now.getDate()}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, opacity: 0.9, marginBottom: '2px' }}>{en.days[dayOfWeek]}</div>
          <div style={{ fontSize: '13px', opacity: 0.7 }}>{formattedDate}</div>
          <div style={{
            marginTop: '8px', padding: '4px 14px', display: 'inline-block',
            background: 'var(--status-active-bg)', borderRadius: 'var(--radius-full)',
            fontSize: '13px', color: 'var(--brand-deep)', fontWeight: 600,
          }}>
            {t.days[dayOfWeek]} • {t.months[getTamilMonthIndex(now)]} {getTamilYear(now)}
          </div>
        </div>

        {/* Moon Phase Section */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border-light)',
          display: 'flex', alignItems: 'center', gap: '14px',
          background: isSpecialDay
            ? (moonInfo.phaseId === 'full' ? 'rgba(212, 168, 67, 0.06)' : 'rgba(26, 60, 52, 0.04)')
            : 'transparent',
        }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', flexShrink: 0,
            background: moonInfo.phaseId === 'full' ? 'var(--brand-glow)' : moonInfo.phaseId === 'new' ? 'rgba(0,0,0,0.08)' : 'var(--bg-input)',
          }}>
            {moonInfo.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {t.moonPhases[moonInfo.phaseKey]}
              {isSpecialDay && (
                <span className={`badge ${moonInfo.phaseId === 'full' ? 'gold' : 'closed'}`} style={{ fontSize: '10px', padding: '2px 8px', background: moonInfo.phaseId === 'full' ? 'var(--brand-primary)' : '' }}>
                  {moonInfo.phaseId === 'full' ? t.moonPhases.fullMoon : t.moonPhases.newMoon}
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {en.moonPhases[moonInfo.phaseKey]} • {moonInfo.illumination}% {en.labels.illuminated}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              {t.labels.tithi}: <strong style={{ color: 'var(--text-secondary)' }}>{t.tithis[moonInfo.tithiIndex]}</strong> ({en.tithis[moonInfo.tithiIndex]}) • {t.paksha[moonInfo.paksha]}
            </div>
          </div>
        </div>

        {/* Upcoming Moon Events */}
        <div style={{ padding: '10px 20px', display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ flex: 1, padding: '8px 10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t.labels.nextFullMoon}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand-primary)', marginTop: '2px' }}>
              🌕 {moonInfo.daysToNextFullMoon} {t.labels.days}
            </div>
          </div>
          <div style={{ flex: 1, padding: '8px 10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t.labels.nextNewMoon}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              🌑 {moonInfo.daysToNextNewMoon} {t.labels.days}
            </div>
          </div>
        </div>

        {/* Time Slots */}
        <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Rahu Kaalam */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
            background: rahuActive ? 'var(--status-overdue-bg)' : 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            border: rahuActive ? '1px solid rgba(220, 53, 69, 0.2)' : '1px solid transparent',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
              background: rahuActive ? 'rgba(220, 53, 69, 0.15)' : 'rgba(220, 53, 69, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <AlertTriangle size={14} style={{ color: 'var(--status-overdue)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t.timeSlots.rahuKaalam}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatTimeSlot(rahuSlot)}</div>
            </div>
            {rahuActive && <span className="badge overdue" style={{ fontSize: '10px', padding: '2px 7px' }}>{t.labels.active}</span>}
          </div>

          {/* Yamagandam */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
            background: yamaActive ? 'var(--status-pending-bg)' : 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            border: yamaActive ? '1px solid rgba(255, 193, 7, 0.2)' : '1px solid transparent',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
              background: yamaActive ? 'rgba(255, 193, 7, 0.15)' : 'rgba(255, 193, 7, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Moon size={14} style={{ color: 'var(--status-pending)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t.timeSlots.yamagandam}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatTimeSlot(yamaSlot)}</div>
            </div>
            {yamaActive && <span className="badge pending" style={{ fontSize: '10px', padding: '2px 7px' }}>{t.labels.active}</span>}
          </div>

          {/* Gulikai Kalam */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
            background: 'var(--bg-input)', borderRadius: 'var(--radius-md)',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
              background: 'rgba(108, 117, 125, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Star size={14} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t.timeSlots.gulikaiKalam}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatTimeSlot(gulikaiSlot)}</div>
            </div>
          </div>

          {/* Sunrise / Sunset */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 10px', background: 'var(--brand-glow)', borderRadius: 'var(--radius-md)',
            }}>
              <Sun size={14} style={{ color: 'var(--brand-primary)' }} />
              <div>
                <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.labels.sunrise}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-deep)' }}>6:05 AM</div>
              </div>
            </div>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 10px', background: 'rgba(26, 60, 52, 0.06)', borderRadius: 'var(--radius-md)',
            }}>
              <Moon size={14} style={{ color: 'var(--sidebar-bg)' }} />
              <div>
                <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t.labels.sunset}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sidebar-bg)' }}>6:22 PM</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

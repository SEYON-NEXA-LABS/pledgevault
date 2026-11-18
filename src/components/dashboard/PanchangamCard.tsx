'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  Moon, 
  Sun, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Gem
} from 'lucide-react';
import { 
  getPanchangamForDate, 
  getUpcomingGoldMuhurthams, 
  PanchangamDayInfo,
  TAMIL_MONTHS
} from '@/lib/panchangam';

export default function PanchangamCard() {
  const [view, setView] = useState<'day' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayPanchangam: PanchangamDayInfo = getPanchangamForDate(now);
  const viewingPanchangam: PanchangamDayInfo = getPanchangamForDate(selectedDate);
  const upcomingGoldEvents = getUpcomingGoldMuhurthams(now, 2);

  // Month Grid Calculation
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => setSelectedDate(new Date(year, month - 1, 1));
  const nextMonth = () => setSelectedDate(new Date(year, month + 1, 1));

  return (
    <div className="pv-card p-0 overflow-hidden border-t-4 border-t-amber-500 shadow-sm transition-all hover:shadow-md">
      {/* Header Bar */}
      <div className="p-3.5 border-b border-border bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
            <Sparkles size={15} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <span>Tamil Panchangam & Muhurtham</span>
              <span className="text-muted-foreground/60">•</span>
              <span className="text-[9px] font-bold text-muted-foreground">தினம் & முகூர்த்தம்</span>
            </div>
            <div className="text-xs font-black text-foreground">
              {viewingPanchangam.tamilMonthTa} {viewingPanchangam.tamilDay} ({viewingPanchangam.dayNameTa})
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border">
          <button 
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${view === 'day' ? 'bg-background shadow-xs text-foreground font-black' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => { setView('day'); setSelectedDate(now); }}
          >
            Day
          </button>
          <button 
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${view === 'month' ? 'bg-background shadow-xs text-foreground font-black' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setView('month')}
          >
            Month
          </button>
        </div>
      </div>

      {/* Content Body */}
      {view === 'day' ? (
        <div className="p-4 space-y-4">
          {/* Day Hero Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex flex-col items-center justify-center font-black shadow-md shadow-amber-500/20">
                <span className="text-[10px] leading-none uppercase font-bold opacity-80">{viewingPanchangam.tamilMonth.slice(0, 3)}</span>
                <span className="text-lg leading-tight font-black">{viewingPanchangam.tamilDay}</span>
              </div>
              <div>
                <div className="text-sm font-black text-foreground flex items-center gap-2">
                  <span>{viewingPanchangam.dayNameEn}, {viewingPanchangam.date.getDate()} {viewingPanchangam.date.toLocaleString('default', { month: 'short' })}</span>
                </div>
                <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <span>{todayPanchangam.moonEmoji}</span>
                  <span>{viewingPanchangam.pakshaTa} {viewingPanchangam.tithiNameTa}</span>
                  <span className="opacity-50">({viewingPanchangam.tithiNameEn})</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              {viewingPanchangam.isSubhaMuhurtham ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck size={12} /> சுப தினம்
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                  சாதாரண நாள்
                </span>
              )}
            </div>
          </div>

          {/* Special Festival / Gold Alert Badge */}
          {viewingPanchangam.specialFestival && (
            <div className={`p-3 rounded-xl border flex items-center gap-3 ${viewingPanchangam.specialFestival.isGoldAuspicious ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200' : 'bg-muted/40 border-border text-foreground'}`}>
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                <Gem size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black">{viewingPanchangam.specialFestival.nameTa}</span>
                  <span className="text-[10px] font-bold opacity-75">({viewingPanchangam.specialFestival.name})</span>
                </div>
                <div className="text-[11px] font-medium opacity-90 truncate">{viewingPanchangam.specialFestival.tagline}</div>
              </div>
            </div>
          )}

          {/* Auspicious & Inauspicious Timings Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-destructive/5 border border-destructive/15">
              <div className="text-[9px] font-black uppercase tracking-wider text-destructive">ராகு காலம் (Rahu)</div>
              <div className="text-xs font-black text-foreground mt-0.5">{viewingPanchangam.rahuKalam}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <div className="text-[9px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">எமகண்டம் (Yama)</div>
              <div className="text-xs font-black text-foreground mt-0.5">{viewingPanchangam.yamagandam}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
              <div className="text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">குளிகை (Kuligai)</div>
              <div className="text-xs font-black text-foreground mt-0.5">{viewingPanchangam.kuligai}</div>
            </div>
          </div>

          {/* Upcoming Gold Buying & Pledging Events */}
          {upcomingGoldEvents.length > 0 && (
            <div className="pt-2 border-t border-border">
              <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Sparkles size={11} className="text-amber-500" /> Upcoming Gold Milestones
              </div>
              <div className="flex flex-col gap-1.5">
                {upcomingGoldEvents.map((evt, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{evt.nameTa}</span>
                      <span className="text-[10px] text-muted-foreground font-semibold">({evt.name})</span>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
                      in {evt.daysAway} days
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Month View Calendar Grid */
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <button className="pv-btn pv-btn-ghost p-1.5 h-auto text-muted-foreground hover:text-foreground" onClick={prevMonth}>
              <ChevronLeft size={16} />
            </button>
            <div className="text-center">
              <div className="text-xs font-black text-foreground">
                {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </div>
              <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                {viewingPanchangam.tamilMonthTa} மாதம் ({viewingPanchangam.tamilMonth})
              </div>
            </div>
            <button className="pv-btn pv-btn-ghost p-1.5 h-auto text-muted-foreground hover:text-foreground" onClick={nextMonth}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-muted-foreground">
            {['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ', 'ச'].map((d, i) => (
              <div key={i} className="py-1">{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {Array(firstDayOfWeek).fill(null).map((_, i) => (
              <div key={`empty-${i}`} className="h-9 rounded-lg" />
            ))}
            {daysArray.map((dayNum) => {
              const dateObj = new Date(year, month, dayNum);
              const info = getPanchangamForDate(dateObj);
              const isToday = dayNum === now.getDate() && month === now.getMonth() && year === now.getFullYear();
              const isSelected = dayNum === selectedDate.getDate();
              const hasFestival = !!info.specialFestival;

              return (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDate(dateObj)}
                  className={`h-9 rounded-lg flex flex-col items-center justify-center relative transition-all text-xs font-bold ${
                    isSelected 
                      ? 'bg-amber-500 text-white font-black shadow-xs' 
                      : isToday 
                        ? 'border-2 border-primary text-primary font-black bg-primary/5' 
                        : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <span className="leading-none">{dayNum}</span>
                  <span className={`text-[8px] leading-tight ${isSelected ? 'text-white/80' : 'text-muted-foreground/80'}`}>
                    {info.tamilDay}
                  </span>
                  {hasFestival && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-1 right-1" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold pt-2 border-t border-border">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> விசேஷம் / முகூர்த்தம்
            </span>
            <button 
              className="text-primary hover:underline font-black"
              onClick={() => { setSelectedDate(now); setView('day'); }}
            >
              Back to Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

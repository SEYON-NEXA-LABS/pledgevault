'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Menu, 
  ChevronDown, 
  MapPin, 
  LayoutDashboard, 
  Check, 
  ShieldCheck, 
  UserCircle2,
  Building2,
  Calendar,
  LogOut,
  Search as SearchIcon
} from 'lucide-react';
import { settingsStore } from '@/lib/store';
import { authStore } from '@/lib/authStore';
import TamilCalendarPopup from '../common/TamilCalendarPopup';
import LiveRateTicker from '../common/LiveRateTicker';
import UniversalSearch from '../common/UniversalSearch';
import TrialBanner from './TrialBanner';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { translations, Language } from '@/lib/i18n/translations';

interface HeaderProps {
  onMenuClick?: () => void;
  settings?: any;
}

export default function Header({ onMenuClick, settings: propSettings }: HeaderProps) {
  const [settings, setSettings] = useState(propSettings || settingsStore.get());
  const [auth, setAuth] = useState(authStore.get());
  const [isIdentityOpen, setIsIdentityOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const identityRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const isSuperadmin = auth.role === 'superadmin';
  const isManager = auth.role === 'manager' || (auth.role as string) === 'admin';

  useEffect(() => {
    if (propSettings) {
      setSettings(propSettings);
    }
  }, [propSettings]);

  useEffect(() => {
    const handleSync = () => {
      setSettings(settingsStore.get());
      setAuth(authStore.get());
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('pv_settings_updated', handleSync);
    window.addEventListener('pv_auth_updated', handleSync);
    window.addEventListener('keydown', handleKeyDown);

    const handleClickOutside = (event: MouseEvent) => {
      if (identityRef.current && !identityRef.current.contains(event.target as Node)) {
        setIsIdentityOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('pv_settings_updated', handleSync);
      window.removeEventListener('pv_auth_updated', handleSync);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const getActiveBranchName = () => {
    if (settings.activeBranchId === 'firm') return t.branches.allBranches;
    if (!settings.branches || !Array.isArray(settings.branches)) return t.branches.mainBranch;
    
    const found = settings.branches.find((b: any) => b.id === settings.activeBranchId);
    if (found) return found.name;

    // Fallback: If we have branches but none match the ID, it might be the first one
    return settings.branches.length > 0 ? settings.branches[0].name : t.branches.mainBranch;
  };

  const lang: Language = (settings.language || 'en') as Language;
  const t = translations[lang] || translations.en;

  const activeBranchName = getActiveBranchName();
  const canSwitchBranch = (settings.branches?.length || 0) > 0 || isManager || isSuperadmin;
  const roleName = isSuperadmin ? t.sidebar.superadmin : (isManager ? t.sidebar.manager : t.sidebar.staff);

  const handleLanguageChange = (lang: 'en' | 'ta') => {
    const updated = { ...settings, language: lang };
    setSettings(updated);
    settingsStore.save(updated);
    window.dispatchEvent(new Event('pv_settings_updated'));
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <>
      <TrialBanner />
      <header className="header-bar">
        <div className="header-bar-left">
          <button className="pv-btn pv-btn-ghost pv-btn-icon" onClick={onMenuClick}>
            <Menu size={18} />
          </button>

          <div className="identity-container" ref={identityRef}>
            <button 
              className={`identity-btn ${isIdentityOpen ? 'active' : ''}`}
              onClick={() => canSwitchBranch && setIsIdentityOpen(!isIdentityOpen)}
              disabled={!canSwitchBranch}
            >
              <div className="role-icon">
                {isSuperadmin ? <ShieldCheck size={16} /> : <UserCircle2 size={16} />}
              </div>
              <div className="identity-txt">
                <span className="role-label">{roleName}</span>
                <span className="branch-label">{activeBranchName}</span>
              </div>
              {canSwitchBranch && (
                <ChevronDown size={14} style={{ 
                  transition: 'transform 0.2s', transform: isIdentityOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }} />
              )}
            </button>

            {isIdentityOpen && (
              <div className="pv-card identity-dropdown anim-fade-in">
                <div className="dropdown-header">
                   <Building2 size={12} />
                   <span>{isSuperadmin ? 'System Console' : 'Branch Console'}</span>
                </div>
                
                <div className="flex flex-col gap-1 mt-3">
                  {(isManager || isSuperadmin) && (
                    <button
                      className={`pv-btn pv-btn-ghost w-full justify-start h-10 ${settings.activeBranchId === 'firm' ? 'active' : ''}`}
                      onClick={() => {
                        settingsStore.save({ activeBranchId: 'firm' });
                        window.dispatchEvent(new Event('storage'));
                        setIsIdentityOpen(false);
                      }}
                    >
                      <LayoutDashboard size={14} />
                      <span>{t.common.all}</span>
                    </button>
                  )}

                  {settings.branches?.map((branch: any) => (
                    <button
                      key={branch.id}
                      className={`pv-btn pv-btn-ghost w-full justify-start h-auto py-3 px-4 ${settings.activeBranchId === branch.id ? 'active' : ''}`}
                      onClick={() => {
                        settingsStore.save({ activeBranchId: branch.id });
                        window.dispatchEvent(new Event('storage'));
                        setIsIdentityOpen(false);
                      }}
                    >
                      <MapPin size={14} />
                      <div className="flex flex-col items-start">
                        <span className="text-[13px] font-bold">{branch.name}</span>
                        <span className="text-[11px] opacity-60 font-bold uppercase">{branch.location}</span>
                      </div>
                      {settings.activeBranchId === branch.id && <Check size={14} className="ml-auto" />}
                    </button>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <button 
                    className="pv-btn pv-btn-ghost w-full justify-start text-destructive hover:bg-destructive/10 h-10 px-4"
                    onClick={handleSignOut}
                  >
                    <LogOut size={14} className="flex-shrink-0" />
                    <span>{t.common.signOut}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="header-bar-right">
          <div className="ticker-wrapper">
            <LiveRateTicker />
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex bg-muted/50 rounded-xl p-1 mr-1 border border-border/30">
              <button 
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-tighter transition-all cursor-pointer ${settings.language === 'en' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => handleLanguageChange('en')}
              >
                EN
              </button>
              <button 
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-tighter transition-all cursor-pointer ${settings.language === 'ta' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => handleLanguageChange('ta')}
              >
                தமிழ்
              </button>
            </div>
            <button 
              className="search-trigger"
              onClick={() => setIsSearchOpen(true)}
            >
              <SearchIcon size={14} />
              <span className="hidden sm:inline">{t.common.search}</span>
              <kbd className="hidden sm:flex">⌘K</kbd>
            </button>

            <button className="pv-btn pv-btn-ghost pv-btn-icon" title={t.common.notifications}>
              <Bell size={18} />
            </button>

            <div className="relative">
                <button 
                  className={`pv-btn pv-btn-ghost pv-btn-icon ${showCalendar ? 'active' : ''}`}
                  title={t.common.calendar}
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <Calendar size={18} />
                </button>
              {showCalendar && (
                <div className="absolute top-[calc(100%+12px)] right-0 z-1000">
                   <TamilCalendarPopup onClose={() => setShowCalendar(false)} />
                </div>
              )}
            </div>
          </div>
        </div>

        <UniversalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </header>
    </>
  );
}

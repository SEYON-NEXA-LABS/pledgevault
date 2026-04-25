'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { loanStore, settingsStore } from '@/lib/store';
import { supabaseService } from '@/lib/supabase/service';
import { authStore } from '@/lib/authStore';
import { metalRateService } from '@/lib/supabase/metalRateService';
import Sidebar from './Sidebar';
import Header from './Header';
import { subscriptionStore } from '@/lib/subscriptionStore';
import MobileBottomNav from './MobileBottomNav';
import { ChevronRight } from 'lucide-react';
import { translations, Language } from '@/lib/i18n/translations';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [overdueCount, setOverdueCount] = useState(0);
  const [totalLoans, setTotalLoans] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [showMandatorySelector, setShowMandatorySelector] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);

  const isPublicPage = pathname === '/login' || pathname === '/start-trial';
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    setMounted(true);
    
    // Initial Load Lang
    const s = settingsStore.get();
    if (s.language) setLang(s.language as Language);

    // Sync Lang
    const syncLang = () => {
      const updated = settingsStore.get();
      if (updated.language) setLang(updated.language as Language);
    };
    window.addEventListener('pv_settings_updated', syncLang);
    
    // Check for persisted sidebar state
    const savedSidebarState = localStorage.getItem('pv_sidebar_open');
    if (savedSidebarState !== null) {
      setSidebarOpen(savedSidebarState === 'true');
    } else if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    
    async function initializeLiveState() {
      if (isPublicPage) {
        setIsHydrating(false);
        return;
      }

      const auth = authStore.get();
      if (!auth.isAuthenticated) {
        setIsHydrating(false);
        return;
      }

      try {
        setIsHydrating(true);
        const profile = await supabaseService.getUserProfile(auth.userId as string);
        const liveSettings = await supabaseService.getSettings(auth.firmId as string);

        if (liveSettings) {
          const allBranches = liveSettings.branches || [];
          setBranches(allBranches);

          let targetBranchId = settingsStore.get().activeBranchId;

          if (auth.role === 'manager' || auth.role === 'superadmin') {
            if (!targetBranchId) targetBranchId = 'firm';
          } else if (auth.role === 'staff') {
            if (profile?.defaultBranchId) {
              targetBranchId = profile.defaultBranchId;
            } else if (!targetBranchId || targetBranchId === 'firm') {
              setShowMandatorySelector(true);
            }
          }

          settingsStore.save({ 
            ...liveSettings, 
            activeBranchId: targetBranchId 
          });

          // Single Theme Logic (Always Emerald/Gold)
          document.documentElement.setAttribute('data-theme', 'emerald');

          if (authStore.isManager() || authStore.isSuperadmin()) {
             metalRateService.autoSyncIfStale().catch(e => console.warn('Daily market sync check failed:', e));
          }

          const stats = await supabaseService.getDashboardStats(auth.firmId as string, targetBranchId);
          setOverdueCount(stats.overdueCount || 0);
          setTotalLoans(stats.totalActiveLoans || 0);

          if (auth.firmId) {
            const subscription = await supabaseService.getActiveSubscription(auth.firmId);
            if (subscription) {
              subscriptionStore.set({
                planId: subscription.planId,
                status: subscription.status,
                endDate: subscription.endDate
              });
            } else {
              subscriptionStore.set({ planId: 'free', status: 'active', endDate: null });
            }
          }
        }
      } catch (err) {
        console.error('Core app hydration failed:', err);
      } finally {
        setTimeout(() => setIsHydrating(false), 500);
      }
    }

    initializeLiveState();

    // Close sidebar on mobile when navigating
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && sidebarOpen) {
      setSidebarOpen(false);
    }

    return () => window.removeEventListener('pv_settings_updated', syncLang);
  }, [pathname, isPublicPage]);

  if (!mounted) return null;

  const t = translations[lang] || translations.en;

  // Hydration / Loading Splash Screen
  if (isHydrating && !isPublicPage) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-background gap-8 animate-in fade-in duration-700">
        <div className="relative">
          <div className="w-24 h-24 border-2 border-primary/10 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-primary/20">
               🪙
            </div>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black tracking-tight mb-2">{t.common.pledgevault}</h2>
          <div className="flex items-center gap-2 justify-center">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
          </div>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-4 opacity-40">
            {t.common.secureVault}
          </p>
        </div>
      </div>
    );
  }

  const auth = authStore.get();
  const currentSettings = settingsStore.get();

  return (
    <div className="app-layout">
      {!isPublicPage && (
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          overdueCount={overdueCount}
          totalLoans={totalLoans}
        />
      )}
      <main className={`main-content ${isPublicPage ? 'full-width' : (sidebarOpen ? 'expanded' : 'collapsed')}`}>
        {!isPublicPage && (
          <Header 
            settings={currentSettings} 
            onMenuClick={() => {
              const newState = !sidebarOpen;
              setSidebarOpen(newState);
              localStorage.setItem('pv_sidebar_open', String(newState));
            }} 
          />
        )}
        <div className={isPublicPage ? '' : 'page-content'}>
          {children}
        </div>
      </main>
      {!isPublicPage && <MobileBottomNav />}

      {/* Mandatory Branch Selector for Staff */}
      {showMandatorySelector && !isPublicPage && (
        <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="pv-card sm:max-w-[440px] w-full text-center p-12 shadow-2xl border-primary/20">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner">
                🏠
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-3">{t.branches.branchIdentity}</h2>
            <p className="text-muted-foreground font-bold text-sm leading-relaxed mb-10 opacity-70">
              {t.branches.selectReportingBranch}
            </p>
            
            <div className="flex flex-col gap-3">
              {branches.map(branch => (
                <button
                  key={branch.id}
                  onClick={() => {
                    settingsStore.save({ activeBranchId: branch.id });
                    window.dispatchEvent(new Event('storage'));
                    setShowMandatorySelector(false);
                  }}
                  className="pv-btn pv-btn-outline w-full justify-between h-auto py-5 px-6 rounded-2xl group transition-all hover:bg-primary/5 hover:border-primary/30 hover:scale-[1.02]"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-black text-base">{branch.name}</span>
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">{branch.location}</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <ChevronRight size={16} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

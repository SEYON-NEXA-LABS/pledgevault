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

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [overdueCount, setOverdueCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [showMandatorySelector, setShowMandatorySelector] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    setMounted(true);
    
    async function initializeLiveState() {
      // Prevent logic from running on login page or if not authenticated
      if (isLoginPage) {
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
        // 1. Fetch User Profile for Role & Branch Defaulting
        const profile = await supabaseService.getUserProfile(auth.userId as string);
        
        // 2. Hydrate Global Settings (Branches, Rates, Shop Name)
        const liveSettings = await supabaseService.getSettings();
        if (liveSettings) {
          const allBranches = liveSettings.branches || [];
          setBranches(allBranches);

          // 3. Logic: Managers default to ALL, Staff default to assigned branch
          let targetBranchId = settingsStore.get().activeBranchId;

          if (auth.role === 'manager' || auth.role === 'superadmin') {
            // Managers default to "firm" (All Branches) unless they've already picked one
            if (!targetBranchId) targetBranchId = 'firm';
          } else if (auth.role === 'staff') {
            // Staff default to their specific assigned branch
            if (profile?.defaultBranchId) {
              targetBranchId = profile.defaultBranchId;
            } else if (!targetBranchId || targetBranchId === 'firm') {
              // Staff MUST pick a branch if no default exists
              setShowMandatorySelector(true);
            }
          }

          settingsStore.save({ 
            ...liveSettings, 
            activeBranchId: targetBranchId 
          });

          // 3b. White-Labeling Injection: Override brand colors if firm has custom branding
          const primaryColor = liveSettings.brandingConfig?.primaryColor;
          if (primaryColor) {
            const root = document.documentElement;
            root.style.setProperty('--brand-primary', primaryColor);
            root.style.setProperty('--primary-brand', primaryColor);
            root.style.setProperty('--brand-deep', primaryColor); // Simpler fallback for now
            // Add a soft glow version
            root.style.setProperty('--brand-glow', `${primaryColor}26`); // 15% opacity hex hack
          }
          if (authStore.isManager()) {
             metalRateService.getLiveRates().catch(e => console.warn('Global market sync failed:', e));
          }

          // 5. Fetch Live Dashboard Metrics (like Overdue Count)
          const stats = await supabaseService.getDashboardStats(auth.firmId as string, targetBranchId);
          setOverdueCount(stats.overdueCount || 0);

          // 6. Hydrate Subscription Status
          if (auth.firmId) {
            const subscription = await supabaseService.getActiveSubscription(auth.firmId);
            if (subscription) {
              subscriptionStore.set({
                planId: subscription.planId,
                status: subscription.status,
                endDate: subscription.endDate
              });
            } else {
              // Fallback to free if no active sub found (shouldn't happen for trialists)
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
  }, [pathname, isLoginPage]);

  if (!mounted) return null;

  // Hydration / Loading Splash Screen
  if (isHydrating && !isLoginPage) {
    return (
      <div style={{ 
        height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', gap: '24px'
      }}>
        <div style={{ position: 'relative', width: '80px', height: '80px' }}>
          <div className="spin" style={{ 
            position: 'absolute', inset: 0, border: '4px solid var(--border-light)',
            borderTopColor: 'var(--primary-brand)', borderRadius: '50%'
          }} />
          <div style={{ 
            position: 'absolute', inset: '12px', background: 'var(--bg-card)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
          }}>
            🪙
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', margin: '0 0 4px 0' }}>Unlocking Vault</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', margin: 0 }}>Preparing your secure workspace...</p>
        </div>
      </div>
    );
  }

  const auth = authStore.get();
  const currentSettings = settingsStore.get();

  return (
    <div className="app-layout">
      {!isLoginPage && (
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          overdueCount={overdueCount}
        />
      )}
      <main className={`main-content ${isLoginPage ? 'full-width' : ''}`}>
        {!isLoginPage && <Header settings={currentSettings} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />}
        <div className={isLoginPage ? '' : 'page-content'}>
          {children}
        </div>
      </main>

      {/* Mandatory Branch Selector for Staff (Replaces obsolete Modal) */}
      {showMandatorySelector && !isLoginPage && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(20px)', background: 'rgba(16, 123, 136, 0.4)', zIndex: 9999 }}>
          <div className="card anim-fade-in" style={{ maxWidth: '400px', padding: '40px', textAlign: 'center', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ 
              width: '64px', height: '64px', background: 'var(--status-active-bg)', color: 'var(--primary-teal-dark)', 
              borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              margin: '0 auto 24px auto', fontSize: '24px' 
            }}>
              🏠
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 12px 0' }}>Assign Your Branch</h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '15px', marginBottom: '32px', lineHeight: 1.6 }}>
              Welcome back! Please select your current reporting branch to access the dashboard.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {branches.map(branch => (
                <button
                  key={branch.id}
                  onClick={() => {
                    settingsStore.save({ activeBranchId: branch.id });
                    window.dispatchEvent(new Event('storage'));
                    setShowMandatorySelector(false);
                  }}
                  className="btn btn-outline"
                  style={{ 
                    justifyContent: 'space-between', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border)',
                    background: 'var(--bg-primary)', transition: 'all 0.2s', fontWeight: 700
                  }}
                >
                  <span>{branch.name}</span>
                  <span style={{ fontSize: '10px', opacity: 0.6, fontWeight: 400 }}>{branch.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

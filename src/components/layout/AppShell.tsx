'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { loanStore, settingsStore } from '@/lib/store';
import { supabaseService } from '@/lib/supabase/service';
import { authStore } from '@/lib/authStore';
import Sidebar from './Sidebar';
import Header from './Header';
import BranchSwitcherModal from './BranchSwitcherModal';

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
        }

        // 4. Fetch Live Dashboard Metrics (like Overdue Count)
        const stats = await supabaseService.getDashboardStats();
        setOverdueCount(stats.overdueCount || 0);
      } catch (err) {
        console.error('Core app hydration failed:', err);
      } finally {
        // Small artificial delay for smooth transition if it finishes too fast
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
        height: '100vh', 
        width: '100vw', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        gap: '24px'
      }}>
        <div style={{ position: 'relative', width: '80px', height: '80px' }}>
          <div className="spin" style={{ 
            position: 'absolute',
            inset: 0,
            border: '4px solid var(--border-light)',
            borderTopColor: 'var(--primary-brand)',
            borderRadius: '50%'
          }} />
          <div style={{ 
            position: 'absolute',
            inset: '12px',
            background: 'var(--bg-card)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            🪙
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '20px', 
            margin: '0 0 4px 0',
            color: 'var(--text-primary)'
          }}>
            Unlocking Vault
          </h2>
          <p style={{ 
            fontSize: '14px', 
            color: 'var(--text-tertiary)',
            margin: 0
          }}>
            Preparing your secure workspace...
          </p>
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
        {!isLoginPage && <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />}
        <div className={isLoginPage ? '' : 'page-content'}>
          {children}
        </div>
      </main>

      {!isLoginPage && !isHydrating && (
        <BranchSwitcherModal
          isOpen={showMandatorySelector}
          onClose={() => setShowMandatorySelector(false)}
          branches={branches}
          activeBranchId={currentSettings.activeBranchId}
          isMandatory={true}
        />
      )}
    </div>
  );
}

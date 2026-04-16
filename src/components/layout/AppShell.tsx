'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { seedDemoData, loanStore } from '@/lib/store';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [overdueCount, setOverdueCount] = useState(0);

  const isLoginPage = pathname === '/login';

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Seed demo data on first load
    seedDemoData();

    // Get overdue count
    const overdue = loanStore.getOverdue();
    setOverdueCount(overdue.length);
  }, []);

  if (!mounted) return null;

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
    </div>
  );
}

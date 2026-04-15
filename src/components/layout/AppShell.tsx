'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { seedDemoData, loanStore } from '@/lib/store';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    // Seed demo data on first load
    seedDemoData();

    // Get overdue count
    const overdue = loanStore.getOverdue();
    setOverdueCount(overdue.length);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        overdueCount={overdueCount}
      />
      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}

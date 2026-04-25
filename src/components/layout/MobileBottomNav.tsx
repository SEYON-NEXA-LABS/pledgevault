'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  HandCoins,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react';
import { authStore } from '@/lib/authStore';

const navItems = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/loans', label: 'Loans', icon: HandCoins },
  { href: '/customers', label: 'People', icon: Users },
  { href: '/reports', label: 'Stats', icon: BarChart3 },
  { href: '/settings', label: 'More', icon: Settings },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const auth = authStore.get();
  
  if (!auth.isAuthenticated || authStore.isSuperadmin()) return null;

  return (
    <div className="md:hidden">
      {/* Floating Action Button for New Loan */}
      <Link 
        href="/loans/new" 
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center z-[60] active:scale-90 transition-transform border-4 border-background"
      >
        <HandCoins size={24} />
      </Link>

      <nav className="mobile-bottom-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-primary/10' : ''}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

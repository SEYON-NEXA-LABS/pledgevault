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
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  HandCoins,
  Users,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  Menu,
  BarChart3,
  Building2,
  User,
  CreditCard,
  ShieldCheck,
  Zap,
  Activity,
  CircleDollarSign,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { authStore } from '@/lib/authStore';
import { settingsStore } from '@/lib/store';
import { ChevronDown } from 'lucide-react';
import { translations, Language } from '@/lib/i18n/translations';

const navItems = [
  { href: '/', label: 'dashboard', icon: LayoutDashboard },
  { href: '/loans', label: 'loans', icon: HandCoins },
  { href: '/customers', label: 'customers', icon: Users },
  { href: '/branches', label: 'branches', icon: Building2 },
  { href: '/collections', label: 'collections', icon: CircleDollarSign },
  { href: '/reports', label: 'reports', icon: BarChart3 },
  { href: '/settings', label: 'settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  overdueCount?: number;
  totalLoans?: number;
}

export default function Sidebar({ isOpen, onToggle, overdueCount = 0, totalLoans = 0 }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [lang, setLang] = React.useState<Language>('ta');
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>(['settings']);

  React.useEffect(() => {
    // Initial Load
    const s = settingsStore.get();
    if (s.language) setLang(s.language as Language);

    // Sync listener
    const sync = () => {
      const updated = settingsStore.get();
      if (updated.language) setLang(updated.language as Language);
    };
    window.addEventListener('pv_settings_updated', sync);
    return () => window.removeEventListener('pv_settings_updated', sync);
  }, []);

  const t = translations[lang] || translations.en;
  const settings = settingsStore.get();
  const auth = authStore.get();
  const isManager = authStore.isManager() || authStore.isSuperadmin();

  // Auto-expand settings if we are on a settings page
  React.useEffect(() => {
    if (pathname.startsWith('/settings')) {
      if (!expandedGroups.includes('settings')) {
        setExpandedGroups(prev => [...prev, 'settings']);
      }
    }
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      const [paramKey, paramVal] = query.split('=');
      return pathname === path && searchParams.get(paramKey) === paramVal;
    }
    if (href === '/settings') {
      return pathname === '/settings' && !searchParams.get('tab');
    }
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onToggle}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''} glass-card`}>
        {/* Logo Section */}
        <div className="h-24 flex items-center justify-center px-8 border-b border-sidebar-border/50">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/10 shadow-lg overflow-hidden">
            <img src="/android-chrome-192x192.png" alt="Logo" className="w-10 h-10 object-contain" />
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {!authStore.isSuperadmin() ? (
            <>
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${active ? 'active' : ''}`}
                  >
                    <item.icon size={20} />
                    <span>{(t.sidebar as any)[item.label]}</span>
                    {(item as any).isElite && (
                      <span className="ml-auto bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-md">
                        ELITE
                      </span>
                    )}
                    {item.href === '/loans' && (
                      <div className="ml-auto flex items-center gap-1.5">
                        {overdueCount > 0 && (
                          <span className="bg-destructive text-white text-[11px] font-bold px-2 py-0.5 rounded-md min-w-[20px] text-center shadow-sm" title="Overdue">
                            {overdueCount}
                          </span>
                        )}
                        {totalLoans > 0 && (
                          <span className="bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-md min-w-[20px] text-center" title="Total Active">
                            {totalLoans}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </>
          ) : (
            <>
              <Link href="/superadmin" className={`sidebar-link ${pathname === '/superadmin' ? 'active' : ''}`}>
                <ShieldCheck size={20} />
                <span>System Overview</span>
              </Link>
              <Link href="/superadmin/firms" className={`sidebar-link ${pathname.startsWith('/superadmin/firms') ? 'active' : ''}`}>
                <Building2 size={20} />
                <span>Firm Management</span>
              </Link>
              <Link href="/superadmin/subscriptions" className={`sidebar-link ${pathname.startsWith('/superadmin/subscriptions') ? 'active' : ''}`}>
                <Zap size={20} />
                <span>Subscriptions</span>
              </Link>
              <Link href="/superadmin/integrity" className={`sidebar-link ${pathname.startsWith('/superadmin/integrity') ? 'active' : ''}`}>
                <Activity size={20} />
                <span>Integrity</span>
              </Link>
            </>
          )}
        </nav>

        {/* Footer User Profile */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-extrabold">
              {auth.userName?.substring(0, 1) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">
                {auth.userName || 'User'}
              </div>
              <div className="text-[10px] font-black text-primary uppercase tracking-wider">
                {authStore.isSuperadmin() ? t.sidebar.superadmin : (authStore.isManager() ? t.sidebar.manager : t.sidebar.staff)}
              </div>
            </div>
            <button className="pv-btn pv-btn-ghost w-9 h-9 p-0 text-muted-foreground hover:text-destructive shrink-0" onClick={handleSignOut} title={t.common.signOut}>
              <LogOut size={18} className="shrink-0" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

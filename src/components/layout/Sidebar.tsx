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
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { authStore } from '@/lib/authStore';
import { settingsStore } from '@/lib/store';
import { ChevronDown } from 'lucide-react';
import { translations, Language } from '@/lib/i18n/translations';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/loans', label: 'Loans', icon: HandCoins },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/branches', label: 'Branches', icon: Building2, isElite: true },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

// Removed configGroups constant to calculate dynamically inside Sidebar component

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  overdueCount?: number;
}

export default function Sidebar({ isOpen, onToggle, overdueCount = 0 }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>(['settings']);

  const auth = authStore.get();
  const settings = settingsStore.get();
  const lang: Language = (settings as any).language || 'en';
  const t = translations[lang];
  const isManager = authStore.isManager() || authStore.isSuperadmin();

  const dynamicConfigGroups = [
    {
      id: 'settings',
      label: 'Configuration',
      icon: Settings,
      children: [
        { href: '/settings', label: 'My Profile', icon: User },
        ...(isManager ? [
          { href: '/settings?tab=general', label: 'Shop Settings', icon: Building2 },
          { href: '/settings?tab=subscription', label: 'Subscriptions', icon: CreditCard },
          { href: '/settings?tab=team', label: 'Team & Access', icon: Shield },
        ] : [])
      ]
    }
  ];

  // Auto-expand settings if we are on a settings page
  React.useEffect(() => {
    if (pathname.startsWith('/settings')) {
      if (!expandedGroups.includes('settings')) {
        setExpandedGroups(prev => [...prev, 'settings']);
      }
    }
  }, [pathname]);

  const toggleGroup = (groupId: string) => {
    // Group toggling disabled as we moved to a flat structure
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  React.useEffect(() => {
    // Legacy branding logic removed. System now uses centralized OKLCH engine.
  }, []);

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
        <div className="h-24 flex items-center gap-4 px-8 border-b border-sidebar-border/50">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            {authStore.isSuperadmin() ? <ShieldCheck size={24} /> : <Shield size={24} />}
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight leading-none mb-1">
              {authStore.isSuperadmin() ? 'PledgeVault' : (settings.shopName || 'PledgeVault')}
            </h1>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">
               {t.common.management}
            </p>
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
                    <span>{item.label}</span>
                    {(item as any).isElite && (
                      <span className="ml-auto bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-md">
                        ELITE
                      </span>
                    )}
                    {item.href === '/loans' && overdueCount > 0 && (
                      <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                        {overdueCount}
                      </span>
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
                {authStore.isSuperadmin() ? 'Superadmin' : (authStore.isManager() ? 'Manager' : 'Staff')}
              </div>
            </div>
            <button className="pv-btn pv-btn-ghost w-9 h-9 p-0 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={handleSignOut} title="Sign Out">
              <LogOut size={18} className="flex-shrink-0" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

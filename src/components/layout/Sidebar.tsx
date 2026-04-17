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
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { authStore } from '@/lib/authStore';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/loans', label: 'Loans', icon: HandCoins },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
];

const configItems = [
  { href: '/settings', label: 'General Settings', icon: Settings },
  { href: '/settings?tab=subscription', label: 'Subscriptions', icon: CreditCard },
  { href: '/settings/team', label: 'Team & Access', icon: Shield },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  overdueCount?: number;
}

export default function Sidebar({ isOpen, onToggle, overdueCount = 0 }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const auth = authStore.get();

  React.useEffect(() => {
    const applyBranding = async () => {
      if (auth.isAuthenticated && auth.firmId) {
        try {
          // In a real app, this could be cached in a store
          const { data: firm } = await supabase
            .from('firms')
            .select('branding_config')
            .eq('id', auth.firmId)
            .single();
          
          if (firm?.branding_config?.primary_color) {
            document.documentElement.style.setProperty('--primary-brand', firm.branding_config.primary_color);
            // Derive a hover color (simulated here)
            document.documentElement.style.setProperty('--primary-hover', firm.branding_config.primary_color + 'e6');
          }
        } catch (err) {
          console.error('Failed to apply branding:', err);
        }
      }
    };
    applyBranding();
  }, [auth.isAuthenticated, auth.firmId]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isActive = (href: string) => {
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
          style={{
            display: 'none',
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Shield size={22} />
          </div>
          <div className="sidebar-logo-text">
            <h1>PledgeVault</h1>
            <p>Loan Management</p>
          </div>
          <button
            className="sidebar-collapse-btn"
            onClick={onToggle}
            style={{
              marginLeft: 'auto',
              color: 'var(--sidebar-text)',
              padding: '4px',
              borderRadius: 'var(--radius-sm)',
              display: 'none',
            }}
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* Main Navigation (Staff & Filtered Admins) */}
        {!authStore.isSuperadmin() && (
          <>
            <div className="sidebar-section">
              <span className="sidebar-section-title">Main Menu</span>
            </div>
            <nav className="sidebar-nav">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                  {item.href === '/loans' && overdueCount > 0 && (
                    <span className="badge">{overdueCount}</span>
                  )}
                </Link>
              ))}
            </nav>
          </>
        )}

        {/* Firm Configuration (Manager & Superadmin) */}
        {(authStore.isManager() || authStore.isSuperadmin()) && (
          <>
            <div className="sidebar-section" style={{ marginTop: '20px' }}>
              <span className="sidebar-section-title">Configuration</span>
            </div>
            <nav className="sidebar-nav">
              {configItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </>
        )}

        {/* Platform Administration (Superadmin only) */}
        {authStore.isSuperadmin() && (
          <>
            <div className="sidebar-section" style={{ marginTop: '20px' }}>
              <span className="sidebar-section-title">Superadmin Console</span>
            </div>
            <nav className="sidebar-nav">
              <Link
                href="/superadmin"
                className={`sidebar-link ${pathname === '/superadmin' ? 'active' : ''}`}
              >
                <ShieldCheck size={20} />
                <span>System Overview</span>
              </Link>
              <Link
                href="/superadmin/firms"
                className={`sidebar-link ${pathname.startsWith('/superadmin/firms') ? 'active' : ''}`}
              >
                <Building2 size={20} />
                <span>Firm Management</span>
              </Link>
              <Link
                href="/superadmin/subscriptions"
                className={`sidebar-link ${pathname.startsWith('/superadmin/subscriptions') ? 'active' : ''}`}
              >
                <Zap size={20} />
                <span>Manage Subscriptions</span>
              </Link>
              <Link
                href="/superadmin/integrity"
                className={`sidebar-link ${pathname.startsWith('/superadmin/integrity') ? 'active' : ''}`}
              >
                <Activity size={20} />
                <span>Integrity Check</span>
              </Link>
            </nav>
          </>
        )}

        {/* Footer */}
        <div className="sidebar-footer">
            <div style={{ position: 'absolute', top: '-18px', left: '20px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.5px' }}>
              v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}
            </div>
            <div className="sidebar-avatar">
              <User size={18} />
            </div>
            <div className="sidebar-user-info">
              <div className="name">{authStore.get().userName || 'User'}</div>
              <div className="role">
                {authStore.isSuperadmin() ? 'Superadmin' : 
                 authStore.isManager() ? 'Manager' : 'Staff Member'}
              </div>
            </div>
            <button className="logout-btn" onClick={handleSignOut} title="Sign Out">
              <LogOut size={18} />
            </button>
          </div>

      </aside>
    </>
  );
}

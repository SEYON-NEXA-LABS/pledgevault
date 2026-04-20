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
import { ChevronDown } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/loans', label: 'Loans', icon: HandCoins },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
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
    setExpandedGroups(prev => 
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  React.useEffect(() => {
    const applyBranding = async () => {
      if (auth.isAuthenticated && auth.firmId) {
        try {
          const { data: firm } = await supabase
            .from('firms')
            .select('branding_config')
            .eq('id', auth.firmId)
            .single();
          
          if (firm?.branding_config?.primary_color) {
            document.documentElement.style.setProperty('--primary-brand', firm.branding_config.primary_color);
            document.documentElement.style.setProperty('--primary-hover', firm.branding_config.primary_color + 'e6');
          }
        } catch (err) {
          console.error('Failed to apply branding:', err);
        }
      }
    };
    applyBranding();
  }, [auth.isAuthenticated, auth.firmId]);

  const isActive = (href: string) => {
    // 1. Precise check for Tabs (query params)
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      const [paramKey, paramVal] = query.split('=');
      return pathname === path && searchParams.get(paramKey) === paramVal;
    }

    // 2. Exact match for Base Settings to avoid overlap with tabs
    if (href === '/settings') {
      return pathname === '/settings' && !searchParams.get('tab');
    }

    // 3. Fallback to startsWith for other pages (like /loans/...)
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
          <div className="sidebar-logo-icon" style={{ 
            background: authStore.isSuperadmin() ? 'var(--gold-gradient)' : 
                        authStore.isManager() ? 'linear-gradient(135deg, var(--primary-brand), var(--accent-peach))' : 'var(--bg-primary)',
            color: authStore.isManager() || authStore.isSuperadmin() ? '#FFFFFF' : 'var(--primary-teal-dark)'
          }}>
            {authStore.isSuperadmin() ? <ShieldCheck size={22} /> : <Shield size={22} />}
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
                  style={{
                    '--active-bar': 'var(--accent-peach)'
                  } as React.CSSProperties}
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

        {/* Unified Settings & Configuration (Everyone) */}
        <div className="sidebar-section" style={{ marginTop: '20px' }}>
          <span className="sidebar-section-title">Account & Shop</span>
        </div>
        <nav className="sidebar-nav">
          {dynamicConfigGroups.map((group) => (
            <div key={group.id} className="sidebar-group">
              <button 
                className={`sidebar-link group-header ${expandedGroups.includes(group.id) ? 'expanded' : ''}`}
                onClick={() => toggleGroup(group.id)}
              >
                <group.icon size={20} />
                <span>{group.label}</span>
                <ChevronDown size={14} style={{ marginLeft: 'auto', transform: expandedGroups.includes(group.id) ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              
              {expandedGroups.includes(group.id) && (
                <div className="sidebar-submenu">
                  {group.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`sidebar-link sub-item ${isActive(child.href) ? 'active' : ''}`}
                      style={{
                        '--active-bar': 'var(--accent-peach)'
                      } as React.CSSProperties}
                    >
                      <child.icon size={16} />
                      <span>{child.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

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
            <div className="sidebar-avatar" style={{ 
              boxShadow: authStore.isSuperadmin() ? '0 0 15px var(--gold-glow)' : 'none',
              border: authStore.isSuperadmin() ? '1px solid var(--gold)' : 'none'
            }}>
              <User size={18} />
            </div>
            <div className="sidebar-user-info">
              <div className="name">{auth.userName || 'User'}</div>
              <div className="role" style={{ color: 'var(--primary-brand)', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '1px' }}>
                {authStore.isSuperadmin() ? 'Superadmin' : 
                 authStore.isManager() ? 'Manager' : 'Staff'}
              </div>
              <div className="email" style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {auth.email}
              </div>
            </div>
            <button className="logout-btn" onClick={handleSignOut} title="Sign Out">
              <LogOut size={18} />
            </button>
            <div style={{ position: 'absolute', bottom: '4px', right: '16px', fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.5px' }}>
              v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}
            </div>
          </div>

      </aside>
    </>
  );
}

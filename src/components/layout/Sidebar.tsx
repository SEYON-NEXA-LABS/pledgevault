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
  User,
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

        {/* Navigation */}
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

        {authStore.isAdmin() && (
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

        {/* Footer */}
        <div className="sidebar-footer">
            <div className="sidebar-avatar">
              <User size={18} />
            </div>
            <div className="sidebar-user-info">
              <div className="name">{authStore.get().userName || 'User'}</div>
              <div className="role">{authStore.get().role === 'admin' ? 'Admin' : 'Branch Staff'}</div>
            </div>
            <button className="logout-btn" onClick={handleSignOut} title="Sign Out">
              <LogOut size={18} />
            </button>
          </div>

      </aside>
    </>
  );
}

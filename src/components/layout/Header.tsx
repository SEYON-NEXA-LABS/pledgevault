import React from 'react';
import { Search, Bell, Menu, ChevronDown } from 'lucide-react';
import { settingsStore } from '@/lib/store';
import BranchSwitcherModal from './BranchSwitcherModal';

interface HeaderProps {
  greeting?: string;
  onMenuClick?: () => void;
}

export default function Header({ greeting, onMenuClick }: HeaderProps) {
  const [settings, setSettings] = React.useState(settingsStore.get());
  const [showSwitcher, setShowSwitcher] = React.useState(false);

  React.useEffect(() => {
    // Listen for storage changes to update header context
    const handleStorageChange = () => setSettings(settingsStore.get());
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const activeBranch = settings.branches.find(b => b.id === settings.activeBranchId);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <header className="header-bar">
      <div className="header-bar-left">
        <button
          className="btn btn-ghost mobile-menu-btn"
          onClick={onMenuClick}
          style={{ display: 'none' }}
        >
          <Menu size={20} />
        </button>
        <div className="header-greeting">
          {greeting || getGreeting()} <span>👋</span>
        </div>
        <div className="header-context">
          <span className="firm-tag">{settings.shopName || 'PledgeVault'}</span>
          <span className="context-divider">|</span>
          <button 
            className="branch-tag-btn" 
            onClick={() => settings.branches.length > 1 && setShowSwitcher(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-primary)', 
              cursor: settings.branches.length > 1 ? 'pointer' : 'default',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => settings.branches.length > 1 && (e.currentTarget.style.background = 'var(--bg-input)')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="branch-name" style={{ fontWeight: 600 }}>
              {settings.activeBranchId === 'firm' ? 'All Branches' : (activeBranch ? activeBranch.name : 'Select Branch')}
            </span>
            {settings.branches.length > 1 && <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} />}
          </button>
        </div>

        <BranchSwitcherModal 
          isOpen={showSwitcher}
          onClose={() => setShowSwitcher(false)}
          branches={settings.branches}
          activeBranchId={settings.activeBranchId}
        />
      </div>
      <div className="header-bar-right">
        <div className="header-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search loans, customers..."
            id="global-search"
          />
        </div>
        <button className="header-icon-btn" id="notifications-btn">
          <Bell size={20} />
          <span className="notification-dot" />
        </button>
      </div>
    </header>
  );
}

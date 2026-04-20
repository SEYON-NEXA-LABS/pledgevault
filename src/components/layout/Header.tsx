import React from 'react';
import { Search, Bell, Menu, ChevronDown } from 'lucide-react';
import { settingsStore } from '@/lib/store';
import { authStore } from '@/lib/authStore';
import BranchSwitcherModal from './BranchSwitcherModal';

interface HeaderProps {
  greeting?: string;
  onMenuClick?: () => void;
}

export default function Header({ greeting, onMenuClick }: HeaderProps) {
  const [settings, setSettings] = React.useState(settingsStore.get());
  const [auth, setAuth] = React.useState(authStore.get());
  const [showSwitcher, setShowSwitcher] = React.useState(false);

  const isSuperadmin = auth.role === 'superadmin';

  React.useEffect(() => {
    // Listen for storage changes to update header context
    const handleStorageChange = () => setSettings(settingsStore.get());
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pv_settings_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pv_settings_updated', handleStorageChange);
    };
  }, []);

  const getActiveBranch = () => {
    if (settings.activeBranchId === 'firm') return { name: 'All Branches' };
    const found = settings.branches.find(b => b.id === settings.activeBranchId);
    if (found) return found;
    if (settings.branches.length === 1) return settings.branches[0];
    if (settings.branches.length === 0) return { name: 'Main Branch' };
    return null;
  };

  const activeBranch = getActiveBranch();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const canSwitchBranch = settings.branches.length > 1 || auth.role === 'manager';

  return (
    <header 
      className={`header-bar ${authStore.isManager() ? 'manager-theme' : 'staff-theme'}`}
      style={{
        background: authStore.isManager() ? 'var(--primary-teal)' : 'var(--bg-card)',
        color: authStore.isManager() ? 'white' : 'var(--text-primary)',
        transition: 'all 0.3s ease',
        borderBottom: authStore.isManager() ? 'none' : '1px solid var(--border)'
      }}
    >
      <div className="header-bar-left">
        <button
          className="btn btn-ghost mobile-menu-btn"
          onClick={onMenuClick}
          style={{ display: 'none', color: authStore.isManager() ? 'white' : 'inherit' }}
        >
          <Menu size={20} />
        </button>
        <div className="header-greeting" style={{ color: authStore.isManager() ? 'rgba(255,255,255,0.9)' : 'inherit' }}>
          {greeting || getGreeting()} <span>👋</span>
        </div>
        <div className="header-context" style={{ display: 'flex', alignItems: 'center', marginLeft: '12px' }}>
          {isSuperadmin ? (
            <span className="firm-tag" style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', color: '#B8922F', background: '#E8C973' }}>
              System Administration
            </span>
          ) : (
            <>
              <span className="role-badge" style={{ 
                padding: '6px 12px', 
                borderRadius: 'var(--radius-md)', 
                fontSize: '11px', 
                fontWeight: 800, 
                textTransform: 'uppercase',
                marginRight: '12px',
                background: authStore.isManager() ? 'rgba(255, 255, 255, 0.2)' : 'rgba(16, 123, 136, 0.1)',
                color: authStore.isManager() ? 'white' : 'var(--primary-brand)',
                border: `1px solid ${authStore.isManager() ? 'rgba(255,255,255,0.3)' : 'var(--primary-brand)'}`,
                backdropFilter: authStore.isManager() ? 'blur(4px)' : 'none'
              }}>
                {authStore.isManager() ? 'Manager' : 'Staff'}
              </span>
              <div 
                style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: authStore.isManager() ? 'rgba(255,255,255,0.1)' : 'var(--bg-input)', 
                border: `1px solid ${authStore.isManager() ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '4px 6px 4px 12px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px', color: authStore.isManager() ? 'white' : 'var(--text-primary)' }}>
                  {settings.shopName || 'PledgeVault'}
                </span>
              </div>
              
              <div style={{ width: '1px', height: '16px', background: authStore.isManager() ? 'rgba(255,255,255,0.3)' : 'var(--border)', margin: '0 10px' }} />
              
              <button 
                className="branch-tag-btn" 
                onClick={() => canSwitchBranch && setShowSwitcher(true)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: canSwitchBranch ? (authStore.isManager() ? 'rgba(255,255,255,0.1)' : 'var(--bg-card)') : 'transparent', 
                  border: canSwitchBranch ? `1px solid ${authStore.isManager() ? 'rgba(255,255,255,0.2)' : 'var(--border)'}` : 'none',
                  color: authStore.isManager() ? 'white' : 'var(--text-primary)', 
                  cursor: canSwitchBranch ? 'pointer' : 'default',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ 
                  width: '6px', 
                  height: '6px', 
                  borderRadius: '50%', 
                  background: 'var(--status-active)',
                  boxShadow: '0 0 0 2px var(--status-active-bg)'
                }} />
                <span className="branch-name" style={{ fontSize: '13px', fontWeight: 500 }}>
                  {activeBranch ? activeBranch.name : 'Select Branch'}
                </span>
                {canSwitchBranch && <ChevronDown size={14} style={{ color: authStore.isManager() ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)', marginLeft: '2px' }} />}
              </button>
            </div>
            </>
          )}
        </div>

        <BranchSwitcherModal 
          isOpen={showSwitcher}
          onClose={() => setShowSwitcher(false)}
          branches={settings.branches}
          activeBranchId={settings.activeBranchId}
        />
      </div>
      <div className="header-bar-right">
        <div className={`header-search ${authStore.isManager() ? 'manager-search' : ''}`} style={{ 
          background: authStore.isManager() ? 'rgba(0,0,0,0.1)' : 'var(--bg-input)',
          border: authStore.isManager() ? 'none' : '1px solid var(--border)'
        }}>
          <Search size={18} style={{ color: authStore.isManager() ? 'white' : 'inherit' }} />
          <input
            type="text"
            placeholder="Search loans, customers..."
            id="global-search"
            style={{ color: authStore.isManager() ? 'white' : 'inherit' }}
          />
        </div>
        <button className="header-icon-btn" id="notifications-btn" style={{ color: authStore.isManager() ? 'white' : 'inherit' }}>
          <Bell size={20} />
          <span className="notification-dot" />
        </button>
      </div>
    </header>
  );
}

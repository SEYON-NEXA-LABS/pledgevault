import React from 'react';
import { Search, Bell, Menu, ChevronDown, Calendar, MapPin, LayoutDashboard, Check } from 'lucide-react';
import { settingsStore } from '@/lib/store';
import { authStore } from '@/lib/authStore';
import TamilCalendarPopup from '../common/TamilCalendarPopup';
import LiveRateTicker from '../common/LiveRateTicker';
import TrialBanner from './TrialBanner';

interface HeaderProps {
  greeting?: string;
  onMenuClick?: () => void;
  settings?: any;
}

export default function Header({ greeting, onMenuClick, settings: propSettings }: HeaderProps) {
  const [settings, setSettings] = React.useState(propSettings || settingsStore.get());
  const [auth, setAuth] = React.useState(authStore.get());
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = React.useState(false);
  const [showCalendar, setShowCalendar] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const isSuperadmin = auth.role === 'superadmin';

  React.useEffect(() => {
    if (propSettings) {
      setSettings(propSettings);
    }
  }, [propSettings]);

  React.useEffect(() => {
    // Listen for storage changes to update header context
    const handleStorageChange = () => setSettings(settingsStore.get());
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pv_settings_updated', handleStorageChange);

    // Click outside handler for dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pv_settings_updated', handleStorageChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getActiveBranch = () => {
    if (settings.activeBranchId === 'firm') return { name: 'All Branches' };
    const found = settings.branches.find((b: any) => b.id === settings.activeBranchId);
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
    <>
      <TrialBanner />
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
                  background: authStore.isManager() ? 'rgba(255, 255, 255, 0.2)' : 'var(--status-active-bg)',
                  color: authStore.isManager() ? 'white' : 'var(--brand-deep)',
                  border: `1px solid ${authStore.isManager() ? 'rgba(255,255,255,0.3)' : 'var(--brand-primary)'}`,
                  backdropFilter: authStore.isManager() ? 'blur(4px)' : 'none'
                }}>
                  {authStore.isManager() ? 'Manager' : 'Staff'}
                </span>
                <div 
                  ref={dropdownRef}
                  style={{ 
                    position: 'relative',
                    display: 'flex', 
                    alignItems: 'center', 
                    background: authStore.isManager() ? 'rgba(255,255,255,0.1)' : 'var(--bg-input)', 
                    border: `1px solid ${authStore.isManager() ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '4px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <button 
                    className="branch-tag-btn" 
                    onClick={() => canSwitchBranch && setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      background: 'transparent',
                      border: 'none',
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
                    <span className="branch-name" style={{ fontSize: '13px', fontWeight: 600 }}>
                      {activeBranch ? activeBranch.name : 'Select Branch'}
                    </span>
                    {canSwitchBranch && <ChevronDown size={14} style={{ 
                      color: authStore.isManager() ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)', 
                      marginLeft: '2px',
                      transform: isBranchDropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease'
                    }} />}
                  </button>
  
                  {isBranchDropdownOpen && (
                    <div className="branch-dropdown" style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      width: '260px',
                      background: authStore.isManager() ? 'rgba(18, 98, 76, 0.95)' : 'white',
                      backdropFilter: 'blur(16px)',
                      border: `1px solid ${authStore.isManager() ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`,
                      borderRadius: '16px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                      padding: '8px',
                      zIndex: 1000,
                      animation: 'slideIn 0.2s ease'
                    }}>
                      {/* Global Overview for Managers */}
                      {authStore.isManager() && (
                        <button
                          onClick={() => {
                            settingsStore.save({ activeBranchId: 'firm' });
                            window.dispatchEvent(new Event('storage'));
                            setIsBranchDropdownOpen(false);
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: 'none',
                            background: settings.activeBranchId === 'firm' ? 'rgba(255,255,255,0.15)' : 'transparent',
                            color: authStore.isManager() ? 'white' : 'var(--text-primary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textAlign: 'left'
                          }}
                        >
                          <LayoutDashboard size={14} />
                          <span style={{ fontSize: '13px', fontWeight: 600, flex: 1 }}>Global Overview</span>
                          {settings.activeBranchId === 'firm' && <Check size={14} />}
                        </button>
                      )}
  
                      {settings.branches.map((branch: any) => (
                        <button
                          key={branch.id}
                          onClick={() => {
                            settingsStore.save({ activeBranchId: branch.id });
                            window.dispatchEvent(new Event('storage'));
                            setIsBranchDropdownOpen(false);
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: 'none',
                            background: settings.activeBranchId === branch.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                            color: authStore.isManager() ? 'white' : 'var(--text-primary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textAlign: 'left',
                            marginTop: '2px'
                          }}
                        >
                          <MapPin size={14} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600 }}>{branch.name}</div>
                            <div style={{ fontSize: '10px', opacity: 0.7 }}>{branch.location}</div>
                          </div>
                          {settings.activeBranchId === branch.id && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="header-bar-right">
          {authStore.isManager() && (
            <div style={{ marginRight: '16px' }}>
              <LiveRateTicker />
            </div>
          )}
          <div className={`header-search ${authStore.isManager() ? 'manager-search' : ''}`} style={{ 
            background: authStore.isManager() ? 'rgba(0,0,0,0.1)' : 'var(--bg-card)',
            border: authStore.isManager() ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border)',
            width: '240px'
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
          <div style={{ position: 'relative' }}>
            <button 
              className={`header-icon-btn ${showCalendar ? 'active' : ''}`}
              onClick={() => setShowCalendar(!showCalendar)}
              style={{ color: authStore.isManager() ? 'white' : 'inherit' }}
            >
              <Calendar size={20} />
            </button>
            {showCalendar && (
              <TamilCalendarPopup onClose={() => setShowCalendar(false)} />
            )}
          </div>
        </div>
      </header>
    </>
  );
}

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, redirect, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Settings as SettingsIcon,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
  Building,
  Coins,
  RefreshCw,
  GitBranch,
  Plus,
  CreditCard,
  LayoutDashboard,
  Users,
  UserPlus,
  Trash2,
  Building2,
  HandCoins,
  HandMetal,
  ShieldCheck,
  ChevronRight,
  Database,
  ArrowRight,
  User,
  Info,
  ExternalLink
} from 'lucide-react';
import { supabaseService } from '@/lib/supabase/service';
import { settingsStore } from '@/lib/store';
import { supabase } from '@/lib/supabase/client';
import { ShopSettings, PlanTier } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import SubscriptionTab from '@/components/settings/SubscriptionTab';
import TeamTab from '@/components/settings/TeamTab';
import ProfileTab from '@/components/settings/ProfileTab';
import { authStore } from '@/lib/authStore';

type SettingsTab = 'profile' | 'general' | 'subscription' | 'team';

function SettingsContent() {
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const isManager = authStore.isManager() || authStore.isSuperadmin();
  const [currentPlan, setCurrentPlan] = useState<PlanTier>('free');
  const [firmId, setFirmId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab') as SettingsTab;
    if (tab === 'general' && !isManager) {
      setActiveTab('profile');
      return;
    }
    setActiveTab(tab || 'profile');
  }, [searchParams, isManager]);

  useEffect(() => {
    setMounted(true);
    setSettings(settingsStore.get());
    fetchFirmInfo();
  }, []);

  const fetchFirmInfo = async () => {
    const auth = authStore.get();
    if (!auth.userId || !auth.firmId) return;

    try {
      setFirmId(auth.firmId);
      
      // Fetch Plan info directly from profile or fetch firm if needed
      const profile = await supabaseService.getUserProfile(auth.userId);
      if (profile?.firms?.plan) {
        setCurrentPlan(profile.firms.plan as PlanTier);
      }

      // Sync local settings with DB
      const liveSettings = await supabaseService.getSettings();
      if (liveSettings) {
        setSettings(liveSettings);
        settingsStore.save(liveSettings);
      }
    } catch (err) {
      console.error('Error fetching firm info:', err);
    }
  };

  const handleUpgrade = async (newPlan: PlanTier) => {
    if (!firmId) return;

    try {
      const { error } = await supabase
        .from('firms')
        .update({ plan: newPlan })
        .eq('id', firmId);

      if (!error) {
        setCurrentPlan(newPlan);
      }
    } catch (err) {
      console.error('Update plan error:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value),
    }));
  };

  const handleSave = () => {
    settingsStore.save(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSyncRates = async () => {
    setSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const mockGoldRate = 7200 + Math.floor(Math.random() * 200 - 100);
    const mockSilverRate = 90 + Math.floor(Math.random() * 10 - 5);

    setSettings(prev => ({
      ...prev,
      goldRate24K: mockGoldRate,
      silverRate999: mockSilverRate
    }));
    
    setSyncing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddBranch = async () => {
    const branchName = prompt('Enter Branch Name:');
    if (!branchName) return;
    const branchCode = prompt('Enter Branch Code (e.g. SLM01):');
    if (!branchCode) return;
    const location = prompt('Enter Location/City:');
    const license = prompt('Enter Branch License Number (Optional):');

    try {
      if (!firmId) throw new Error('Firm ID missing');
      
      const newBranch = await supabaseService.createBranch({
        firmId: firmId || '',
        name: branchName,
        code: branchCode.toUpperCase(),
        location: location || '',
        licenseNumber: license || ''
      } as any);

      setSettings(prev => {
        const updated = { ...prev, branches: [...prev.branches, newBranch] };
        settingsStore.save(updated);
        return updated;
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert('Failed to add branch: ' + err.message);
    }
  };

  const handleDeleteBranch = async (id: string, name: string) => {
    if (settings.activeBranchId === id) {
      alert('Cannot delete the currently active branch.');
      return;
    }
    if (!confirm(`Are you sure you want to delete branch "${name}"? This will fail if there are active loans in this branch.`)) return;

    try {
      await supabaseService.deleteBranch(id);
      setSettings(prev => {
        const updated = { ...prev, branches: prev.branches.filter(b => b.id !== id) };
        settingsStore.save(updated);
        return updated;
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert('Delete failed. Ensure branch has no associated records.');
    }
  };

  if (!mounted) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>;
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Settings</h2>
          <p className="subtitle">Manage metrics and shop configurations</p>
        </div>
        {activeTab === 'general' && (
          <div className="page-header-right">
            <button className="btn btn-teal" onClick={handleSave}>
              <Save size={18} /> Save Settings
            </button>
          </div>
        )}
      </div>

      <div className="tabs-navigation">
        <button 
          className={`tab-link ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={18} /> My Profile
        </button>
        {isManager && (
          <>
            <button 
              className={`tab-link ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <Building size={18} /> General
            </button>
            <button 
              className={`tab-link ${activeTab === 'subscription' ? 'active' : ''}`}
              onClick={() => setActiveTab('subscription')}
            >
              <CreditCard size={18} /> Subscriptions
            </button>
            <button 
              className={`tab-link ${activeTab === 'team' ? 'active' : ''}`}
              onClick={() => setActiveTab('team')}
            >
              <Users size={18} /> Team & Access
            </button>
          </>
        )}
      </div>

      {saved && (
        <div
          className="toast success"
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            zIndex: 1000,
          }}
        >
          <CheckCircle size={18} /> Settings saved successfully!
        </div>
      )}

      {activeTab === 'profile' && (
        <ProfileTab />
      )}

      {activeTab === 'general' && isManager && (
        <div className="settings-grid">
          {/* Shop Information */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={18} style={{ color: 'var(--primary-teal-dark)' }} />
                Shop Information
              </h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Shop Name</label>
                <input
                  type="text"
                  name="shopName"
                  className="form-input"
                  value={settings.shopName}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  name="shopAddress"
                  className="form-input"
                  value={settings.shopAddress}
                  onChange={handleChange}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Support Email / Phone</label>
                  <input
                    type="text"
                    name="shopPhone"
                    className="form-input"
                    value={settings.shopPhone}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label" style={{ margin: 0 }}>GST Number (GSTIN)</label>
                    <a 
                      href="https://razorpay.com/gst-number-search/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ fontSize: '11px', color: 'var(--brand-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                    >
                      Verify on Razorpay <ExternalLink size={10} />
                    </a>
                  </div>
                  <input
                    type="text"
                    name="gstNumber"
                    className="form-input"
                    placeholder="e.g., 33AAAAA0000A1Z5"
                    value={settings.gstNumber || ''}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Shop Registration No.</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    className="form-input"
                    value={settings.registrationNumber || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Info size={14} style={{ color: 'var(--primary-teal-dark)', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-tertiary)', lineHeight: '1.4' }}>
                  <strong>Note:</strong> A complete registration includes a digital copy of your certificate. Document upload (PDF) will be available once storage is configured.
                </p>
              </div>
            </div>
          </div>

          {/* Global Rates */}
          <div className="card">
            <div className="card-header">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Coins size={18} style={{ color: 'var(--primary-teal-dark)' }} />
                  Loan Appraisals (MCX)
                </h3>
                <button 
                  className={`btn btn-sm ${syncing ? 'loading' : 'btn-outline-teal'}`}
                  onClick={handleSyncRates}
                  disabled={syncing}
                  style={{ fontSize: '12px' }}
                >
                  <RefreshCw size={14} className={syncing ? 'spin' : ''} />
                  {syncing ? 'Syncing...' : 'Sync Live Rates'}
                </button>
              </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Gold 24K Rate (₹)</label>
                  <input
                    type="number"
                    name="goldRate24K"
                    className="form-input"
                    value={settings.goldRate24K}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Silver 999 Rate (₹)</label>
                  <input
                    type="number"
                    name="silverRate999"
                    className="form-input"
                    value={settings.silverRate999}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div
                style={{
                  background: 'var(--bg-hover)',
                  padding: '12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  marginTop: '10px',
                  display: 'flex',
                  gap: '12px',
                  border: '1px solid var(--border-light)'
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, color: 'var(--primary-brand)' }} />
                Updates will impact only new loans. Active contracts retain original appraisal rates.
              </div>
            </div>
          </div>

          {/* Loan Defaults */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} style={{ color: 'var(--primary-teal-dark)' }} />
                Policies & Risk
              </h3>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Monthly Interest (%)</label>
                  <input
                    type="number"
                    name="defaultInterestRate"
                    className="form-input"
                    value={settings.defaultInterestRate}
                    onChange={handleChange}
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Standard Tenure (Mos)</label>
                  <input
                    type="number"
                    name="defaultTenure"
                    className="form-input"
                    value={settings.defaultTenure}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Max Gold LTV (%)</label>
                  <input
                    type="number"
                    name="defaultLtvGold"
                    className="form-input"
                    value={settings.defaultLtvGold}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Silver LTV (%)</label>
                  <input
                    type="number"
                    name="defaultLtvSilver"
                    className="form-input"
                    value={settings.defaultLtvSilver}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-hover)', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} color="var(--brand-primary)" /> Staff Permissions
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                    <input 
                      type="checkbox" 
                      name="allowStaffOverridesInterest" 
                      checked={settings.allowStaffOverridesInterest} 
                      onChange={handleChange}
                    />
                    Allow Staff to override Interest Rates
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
                    <input 
                      type="checkbox" 
                      name="allowStaffOverridesLtv" 
                      checked={settings.allowStaffOverridesLtv} 
                      onChange={handleChange}
                    />
                    Allow Staff to override LTV %
                  </label>
                </div>
              </div>
            </div>
          </div>



          {/* Multi-Branch Management */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GitBranch size={18} style={{ color: 'var(--primary-teal-dark)' }} />
                Branch Locations
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link href="/branches" className="btn btn-sm btn-outline-teal">
                   Manage Dashboard <ArrowRight size={14} />
                </Link>
                <button className="btn btn-sm btn-gold" onClick={handleAddBranch}>
                  <Plus size={14} /> Add Branch
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Global Context (Manager View)</label>
                <select 
                  name="activeBranchId" 
                  className="form-input" 
                  value={settings.activeBranchId}
                  onChange={handleChange}
                >
                  <option value="firm">Whole Firm Overview</option>
                  {settings.branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {settings.branches.map(b => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{b.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        {b.code} • {b.location}
                        {b.licenseNumber && <span style={{ marginLeft: '8px', color: 'var(--brand-primary)', fontWeight: 600 }}>Lic: {b.licenseNumber}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {settings.activeBranchId === b.id && <span className="badge teal" style={{ background: 'var(--status-active-bg)', color: 'var(--primary-teal-dark)', fontSize: '10px' }}>Active</span>}
                      {settings.branches.length > 1 && (
                        <button 
                          onClick={() => handleDeleteBranch(b.id, b.name)}
                          style={{ background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer', padding: '4px', opacity: 0.7 }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subscription' && (
        <SubscriptionTab 
          currentPlan={currentPlan} 
          onUpgrade={handleUpgrade}
          firmName={settings.shopName}
        />
      )}

      {activeTab === 'team' && (
        <TeamTab />
      )}

      <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '13px', color: 'var(--text-tertiary)' }}>
        PledgeVault v1.0.0 • Secure Cloud Storage Active
      </div>

      <style jsx>{`
        .tabs-navigation {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 2px;
        }

        .tab-link {
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          font-weight: 600;
          font-size: 15px;
          padding: 12px 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          transition: all 0.2s;
        }

        .tab-link:hover {
          color: var(--text-secondary);
        }

        .tab-link.active {
          color: var(--primary-teal-dark);
        }

        .tab-link.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 3px;
          background: var(--primary-brand);
          border-radius: 2px;
        }
      `}</style>
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading Settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

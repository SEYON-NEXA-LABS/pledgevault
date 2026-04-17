'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, redirect, useSearchParams } from 'next/navigation';
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
  ArrowRight
} from 'lucide-react';
import { supabaseService } from '@/lib/supabase/service';
import { settingsStore } from '@/lib/store';
import { supabase } from '@/lib/supabase/client';
import { ShopSettings, PlanTier } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import SubscriptionTab from '@/components/settings/SubscriptionTab';

type SettingsTab = 'general' | 'subscription';

function SettingsContent() {
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [currentPlan, setCurrentPlan] = useState<PlanTier>('free');
  const [firmId, setFirmId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab') as SettingsTab;
    if (tab === 'subscription') setActiveTab('subscription');
  }, [searchParams]);

  useEffect(() => {
    setMounted(true);
    setSettings(settingsStore.get());
    fetchFirmInfo();
  }, []);

  const fetchFirmInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('firm_id')
      .eq('id', user.id)
      .single();

    if (profile?.firm_id) {
      setFirmId(profile.firm_id);
      const { data: firm } = await supabase
        .from('firms')
        .select('plan')
        .eq('id', profile.firm_id)
        .single();
      
      if (firm?.plan) {
        setCurrentPlan(firm.plan as PlanTier);
      }

      // Fetch branches from Supabase
      const sub = await supabaseService.getActiveSubscription(profile.firm_id);
      if (sub) {
        const isExpired = new Date(sub.endDate) < new Date();
      }

      const branchData = await supabaseService.getBranches(profile.firm_id);
      setSettings(prev => ({
        ...prev,
        branches: branchData
      }));
    }
  };

  const handleUpgrade = async (newPlan: PlanTier) => {
    if (!firmId) return;

    const { error } = await supabase
      .from('firms')
      .update({ plan: newPlan })
      .eq('id', firmId);

    if (!error) {
      setCurrentPlan(newPlan);
      // Optional: Add a success notification or direct redirect
    } else {
      console.error('Update plan error:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
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

    try {
      if (!firmId) throw new Error('Firm ID missing');
      
      const newBranch = await supabaseService.createBranch({
        firmId: firmId || '',
        name: branchName,
        code: branchCode.toUpperCase(),
        location: location || ''
      } as any);

      setSettings(prev => ({
        ...prev,
        branches: [...prev.branches, newBranch]
      }));
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
      setSettings(prev => ({
        ...prev,
        branches: prev.branches.filter(b => b.id !== id)
      }));
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
          <p className="subtitle">Manage your shop configurations and subscription</p>
        </div>
        {activeTab === 'general' && (
          <div className="page-header-right">
            <button className="btn btn-gold" onClick={handleSave}>
              <Save size={18} /> Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="tabs-navigation">
        <button 
          className={`tab-link ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <SettingsIcon size={18} /> General Settings
        </button>
        <button 
          className={`tab-link ${activeTab === 'subscription' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscription')}
        >
          <CreditCard size={18} /> Subscription & Billing
        </button>
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

      {activeTab === 'general' ? (
        <div className="settings-grid">
          {/* Shop Information */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={18} style={{ color: 'var(--gold)' }} />
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
                  <label className="form-label">Phone Label</label>
                  <input
                    type="text"
                    name="shopPhone"
                    className="form-input"
                    value={settings.shopPhone}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">License Number</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    className="form-input"
                    value={settings.licenseNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Global Rates */}
          <div className="card">
            <div className="card-header">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Coins size={18} style={{ color: 'var(--gold)' }} />
                  Today&apos;s Rates (per gram)
                </h3>
                <button 
                  className={`btn btn-sm ${syncing ? 'loading' : 'btn-outline'}`}
                  onClick={handleSyncRates}
                  disabled={syncing}
                  style={{ fontSize: '12px' }}
                >
                  <RefreshCw size={14} className={syncing ? 'spin' : ''} />
                  {syncing ? 'Syncing MCX...' : 'Sync Live Rates'}
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
                  background: 'var(--bg-input)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  marginTop: '10px',
                  display: 'flex',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                Updated rates will reflect in all new loans created. Existing loans will keep the rate they were created with.
              </div>
            </div>
          </div>

          {/* Loan Defaults */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} style={{ color: 'var(--gold)' }} />
                Loan Defaults
              </h3>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Interest Rate (% / month)</label>
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
                  <label className="form-label">Default Tenure (months)</label>
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
                  <label className="form-label">Default Gold LTV (%)</label>
                  <input
                    type="number"
                    name="defaultLtvGold"
                    className="form-input"
                    value={settings.defaultLtvGold}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Default Silver LTV (%)</label>
                  <input
                    type="number"
                    name="defaultLtvSilver"
                    className="form-input"
                    value={settings.defaultLtvSilver}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Branch Management */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GitBranch size={18} style={{ color: 'var(--gold)' }} />
                Branch Management
              </h3>
              <button className="btn btn-sm btn-outline" onClick={handleAddBranch}>
                <Plus size={14} /> Add Branch
              </button>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Active Branch</label>
                <select 
                  name="activeBranchId" 
                  className="form-input" 
                  value={settings.activeBranchId}
                  onChange={handleChange}
                >
                  {settings.branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>
              <div style={{ marginTop: '16px' }}>
                {settings.branches.map(b => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{b.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Code: {b.code} • {b.location}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {settings.activeBranchId === b.id && <span className="badge active">Selected</span>}
                      {settings.branches.length > 1 && (
                        <button 
                          onClick={() => handleDeleteBranch(b.id, b.name)}
                          style={{ background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer', padding: '4px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <SubscriptionTab 
          currentPlan={currentPlan} 
          onUpgrade={handleUpgrade}
          firmName={settings.shopName}
        />
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
          color: var(--gold);
        }

        .tab-link.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--gold);
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

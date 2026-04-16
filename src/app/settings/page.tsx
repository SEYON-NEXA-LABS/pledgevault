'use client';

import React, { useState, useEffect } from 'react';
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
  Plus
} from 'lucide-react';
import { settingsStore } from '@/lib/store';
import { supabaseService } from '@/lib/supabase/service';
import { supabase } from '@/lib/supabase/client';
import { ShopSettings } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/constants';

export default function SettingsPage() {
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSettings(settingsStore.get());
  }, []);

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
    // Simulate network delay for MCX API
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // In a real app, this would be a fetch call to a service like gold-api.com
    // or a dedicated MCX scraper service.
    // For now, we simulate a small update to demonstrate functionality.
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

  const handleAddBranch = () => {
    const branchName = prompt('Enter Branch Name:');
    if (!branchName) return;
    const branchCode = prompt('Enter Branch Code (e.g. SLM01):');
    if (!branchCode) return;

    const newBranch = {
      id: 'br_' + Date.now(),
      name: branchName,
      location: 'New Location',
      code: branchCode
    };

    setSettings(prev => ({
      ...prev,
      branches: [...prev.branches, newBranch]
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };



  if (!mounted) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>;
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Settings</h2>
          <p className="subtitle">Configure your shop details and loan parameters</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-gold" onClick={handleSave}>
            <Save size={18} /> Save Changes
          </button>
        </div>
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
                  {settings.activeBranchId === b.id && <span className="badge active">Selected</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-tertiary)' }}>
        PledgeVault v1.0.0 • Secure Cloud Storage Active
      </div>
    </>
  );
}

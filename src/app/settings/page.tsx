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
  Lock,
  RefreshCw,
  GitBranch,
  Cloud,
  Download,
  Upload,
  Plus,
  Database,
  Globe,
  ArrowUp,
  Info
} from 'lucide-react';
import { settingsStore, customerStore, loanStore, paymentStore } from '@/lib/store';
import { supabaseService } from '@/lib/supabase/service';
import { supabase } from '@/lib/supabase/client';
import { ShopSettings } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/constants';

export default function SettingsPage() {
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [isCloudConfigured, setIsCloudConfigured] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSettings(settingsStore.get());
    
    // Check if cloud is configured
    const hasConfig = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    setIsCloudConfigured(hasConfig);
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

  const handleExportData = () => {
    const data = {
      customers: localStorage.getItem('pv_customers'),
      loans: localStorage.getItem('pv_loans'),
      payments: localStorage.getItem('pv_payments'),
      settings: localStorage.getItem('pv_settings'),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pledgevault_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.customers) localStorage.setItem('pv_customers', data.customers);
        if (data.loans) localStorage.setItem('pv_loans', data.loans);
        if (data.payments) localStorage.setItem('pv_payments', data.payments);
        if (data.settings) localStorage.setItem('pv_settings', data.settings);
        alert('Data imported successfully! The page will now reload.');
        window.location.reload();
      } catch (err) {
        alert('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleMigrateToCloud = async () => {
    if (!confirm('This will upload all your local customers, loans, and payments to Supabase. Continue?')) return;
    
    setMigrating(true);
    try {
      const localCustomers = customerStore.getAll();
      const localLoans = loanStore.getAll();
      const localPayments = paymentStore.getAll();
      const localSettings = settingsStore.get();

      // Migrate Settings
      await supabaseService.updateSettings(localSettings);

      // Migrate Customers
      for (const c of localCustomers) {
        await supabaseService.createCustomer(c);
      }

      // Migrate Loans & Items
      for (const l of localLoans) {
        await supabaseService.createLoan(l);
      }

      // Migrate Payments
      for (const p of localPayments) {
        await supabaseService.createPayment(p);
      }

      alert('Migration successful! All data has been uploaded to the cloud.');
    } catch (err) {
      console.error(err);
      alert('Migration failed. Check console for details.');
    } finally {
      setMigrating(false);
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

        {/* Data & Cloud Redundancy */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cloud size={18} style={{ color: 'var(--gold)' }} />
              Cloud & Redundancy
            </h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <button className="btn btn-outline" onClick={handleExportData} style={{ flexDirection: 'column', padding: '20px', height: 'auto', gap: '12px' }}>
                <Download size={24} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>Backup Data</div>
                  <div style={{ fontSize: '11px', fontWeight: 400, opacity: 0.7 }}>Export to JSON</div>
                </div>
              </button>
              <label className="btn btn-outline" style={{ flexDirection: 'column', padding: '20px', height: 'auto', gap: '12px', cursor: 'pointer' }}>
                <input type="file" accept=".json" onChange={handleImportData} style={{ display: 'none' }} />
                <Upload size={24} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>Restore Data</div>
                  <div style={{ fontSize: '11px', fontWeight: 400, opacity: 0.7 }}>Import from JSON</div>
                </div>
              </label>
            </div>
            <div
              style={{
                background: 'rgba(212, 168, 67, 0.1)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                color: 'var(--gold-dark)',
                marginTop: '16px',
                display: 'flex',
                gap: '8px',
              }}
            >
              <Info size={16} style={{ flexShrink: 0 }} />
              Pro Sync is coming soon. Use local backup/restore for multi-device sync today.
            </div>
          </div>
        </div>

        {/* Supabase Connectivity */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} style={{ color: isCloudConfigured ? 'var(--status-active)' : 'var(--text-tertiary)' }} />
              Supabase Connectivity
            </h3>
            <span className={`badge ${isCloudConfigured ? 'active' : 'pending'}`}>
              {isCloudConfigured ? 'Configured' : 'Not Configured'}
            </span>
          </div>
          <div className="card-body">
            {!isCloudConfigured ? (
              <div 
                style={{ 
                  background: 'rgba(220, 53, 69, 0.05)', 
                  padding: '16px', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid rgba(220, 53, 110, 0.1)',
                  fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', color: 'var(--status-overdue)', fontWeight: 700 }}>
                  <AlertCircle size={18} /> Environment Variables Missing
                </div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  To enable cloud sync, add the following to your <code>.env.local</code> file:
                </p>
                <pre style={{ 
                  background: '#000', 
                  color: '#0f0', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  marginTop: '10px',
                  fontSize: '11px',
                  overflowX: 'auto'
                }}>
{`NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key`}
                </pre>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '50%', 
                    background: 'var(--status-active-bg)', 
                    color: 'var(--status-active)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <Globe size={24} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>Cloud Sync Active</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Connected to Supabase PostgreSQL</div>
                  </div>
                </div>
                
                <button 
                  className={`btn btn-primary ${migrating ? 'loading' : ''}`} 
                  onClick={handleMigrateToCloud}
                  disabled={migrating}
                  style={{ width: '100%', gap: '12px', padding: '16px' }}
                >
                  <ArrowUp size={18} />
                  {migrating ? 'Migrating Data...' : 'Migrate Local Data to Cloud'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-tertiary)' }}>
        PledgeVault v1.0.0 • All data is stored locally in your browser.
      </div>
    </>
  );
}

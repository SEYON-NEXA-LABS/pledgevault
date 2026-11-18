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
  Archive,
  RotateCcw,
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
  MessageSquare,
  Smartphone,
  Cpu,
  User,
  Info,
  ExternalLink
} from 'lucide-react';
import { supabaseService } from '@/lib/supabase/service';
import { settingsStore } from '@/lib/store';
import { supabase } from '@/lib/supabase/client';
import { ShopSettings, PlanTier } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import { metalRateService } from '@/lib/supabase/metalRateService';
import { isValidPhoneNumber, formatPhoneWithCountryCode } from '@/lib/whatsapp';
import SubscriptionTab from '@/components/settings/SubscriptionTab';
import TeamTab from '@/components/settings/TeamTab';
import ProfileTab from '@/components/settings/ProfileTab';
import { authStore } from '@/lib/authStore';
import { translations, Language } from '@/lib/i18n/translations';

type SettingsTab = 'profile' | 'general' | 'subscription' | 'team';

function SettingsContent() {
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const isAdmin = authStore.isAdmin() || authStore.isSuperadmin();
  const [currentPlan, setCurrentPlan] = useState<PlanTier>('free');
  const [firmId, setFirmId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const auth = authStore.get();
  const lang: Language = (settings.language || 'en') as Language;
  const t = translations[lang];
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab') as SettingsTab;
    if (tab === 'general' && !isAdmin) {
      setActiveTab('profile');
      return;
    }
    setActiveTab(tab || 'profile');
  }, [searchParams, isAdmin]);

  const [resetMode, setResetMode] = useState(false);

  useEffect(() => {
    if (searchParams.get('reset') === 'true') {
      setResetMode(true);
      setActiveTab('profile');
    }
  }, [searchParams]);

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
      const liveSettings = await supabaseService.getSettings(auth.firmId as string);
      if (liveSettings) {
        // If rates are 0 in DB (new shop), fallback to live market rates
        if (!liveSettings.goldRate24K || liveSettings.goldRate24K === 0) {
          const live = await metalRateService.getLiveRates();
          if (live) {
            liveSettings.goldRate24K = live.gold24k;
            liveSettings.goldRate22K = live.gold22k;
            liveSettings.silverRate999 = live.silver;
          }
        }
        setSettings(liveSettings);
        settingsStore.save(liveSettings, true);
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

  const handleSave = async () => {
    // Validate Shop Phone if provided
    if (settings.shopPhone && settings.shopPhone.trim()) {
      const phoneCheck = isValidPhoneNumber(settings.shopPhone);
      if (!phoneCheck.valid) {
        alert(`Support Contact Error: ${phoneCheck.error}`);
        return;
      }
    }

    try {
      const formattedSettings = {
        ...settings,
        shopPhone: settings.shopPhone ? formatPhoneWithCountryCode(settings.shopPhone) : settings.shopPhone
      };

      // 1. Save to local store for instant UI reactivity
      settingsStore.save(formattedSettings, true);
      
      // 2. Persist to Supabase database (updates firms and shop_settings tables)
      await supabaseService.updateSettings(formattedSettings);
      setSettings(formattedSettings);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('Failed to persist settings:', err);
      alert('Failed to save settings: ' + err.message);
    }
  };

  const handleSyncRates = async () => {
    setSyncing(true);
    try {
      const live = await metalRateService.getLiveRates();
      if (live && live.gold24k) {
        const newGold24K = live.gold24k;
        const newSilver999 = live.silver;
        const newGold22K = live.gold22k || Math.round(newGold24K * (22 / 24));

        const updated = {
          ...settings,
          goldRate24K: newGold24K,
          goldRate22K: newGold22K,
          silverRate999: newSilver999,
        };

        setSettings(updated);
        settingsStore.save(updated, true);
        await supabaseService.updateSettings(updated);
        window.dispatchEvent(new Event('pv_settings_updated'));
      }
    } catch (err) {
      console.error('Failed to sync live rates:', err);
    } finally {
      setSyncing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleAddBranch = async () => {
    const branchName = prompt('Enter Branch Name:');
    if (!branchName) return;
    const branchCode = prompt('Enter Branch Code (e.g. SLM01):');
    if (!branchCode) return;
    const location = prompt('Enter Location/City:');
    const phone = prompt('Enter Branch Phone Number (Mandatory 10 digits):');
    if (!phone) return;
    const phoneCheck = isValidPhoneNumber(phone);
    if (!phoneCheck.valid) {
      alert(`Invalid Branch Phone: ${phoneCheck.error}`);
      return;
    }
    const license = prompt('Enter Branch License Number (Optional):');

    try {
      if (!firmId) throw new Error('Firm ID missing');
      
      const newBranch = await supabaseService.createBranch({
        firmId: firmId || '',
        name: branchName,
        code: branchCode.toUpperCase(),
        location: location || '',
        phone: formatPhoneWithCountryCode(phone),
        licenseNumber: license || ''
      } as any);

      setSettings(prev => {
        const updated = { ...prev, branches: [...prev.branches, newBranch] };
        settingsStore.save(updated, true);
        return updated;
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert('Failed to add branch: ' + err.message);
    }
  };

  const handleToggleBranchStatus = async (id: string, name: string, currentStatus: boolean) => {
    const action = currentStatus ? 'archive' : 'activate';
    if (currentStatus && settings.activeBranchId === id) {
      alert('Cannot archive the currently active branch.');
      return;
    }
    
    if (!confirm(`Are you sure you want to ${action} branch "${name}"?`)) return;

    try {
      if (currentStatus) {
        await supabaseService.archiveBranch(id);
      } else {
        await supabaseService.unarchiveBranch(id);
      }

      setSettings(prev => {
        const updatedBranches = prev.branches.map(b => 
          b.id === id ? { ...b, isActive: !currentStatus } : b
        );
        const updated = { ...prev, branches: updatedBranches };
        settingsStore.save(updated, true);
        return updated;
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(`Failed to ${action} branch. ` + err.message);
    }
  };

  if (!mounted) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>;
  }

  return (
    <>
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div className="page-header-left">
          <h2 style={{ fontSize: '32px' }}>{t.settings.title}</h2>
          <p className="subtitle" style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>{t.common.management}</p>
        </div>
        {activeTab === 'general' && (
          <div className="page-header-right">
            <button className="pv-btn pv-btn-gold" onClick={handleSave}>
              <Save size={18} /> Save Settings
            </button>
          </div>
        )}
      </div>

      <div className="tabs-navigation w-full overflow-x-auto no-scrollbar" style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        <button 
          className={`pv-btn shrink-0 ${activeTab === 'profile' ? 'pv-btn-primary' : 'pv-btn-outline'}`}
          onClick={() => setActiveTab('profile')}
          style={{ height: '44px', borderRadius: '12px 12px 0 0', borderBottom: 'none' }}
        >
          <User size={18} /> <span className="text-xs font-black uppercase tracking-tight">{t.sidebar.settings}</span>
        </button>
        {isAdmin && (
          <>
            <button 
              className={`pv-btn shrink-0 ${activeTab === 'general' ? 'pv-btn-primary' : 'pv-btn-outline'}`}
              onClick={() => setActiveTab('general')}
              style={{ height: '44px', borderRadius: '12px 12px 0 0', borderBottom: 'none' }}
            >
              <Building size={18} /> <span className="text-xs font-black uppercase tracking-tight">{t.settings.general}</span>
            </button>
            <button 
              className={`pv-btn shrink-0 ${activeTab === 'subscription' ? 'pv-btn-primary' : 'pv-btn-outline'}`}
              onClick={() => setActiveTab('subscription')}
              style={{ height: '44px', borderRadius: '12px 12px 0 0', borderBottom: 'none' }}
            >
              <CreditCard size={18} /> <span className="text-xs font-black uppercase tracking-tight">{t.settings.subscription}</span>
            </button>
            <button 
              className={`pv-btn shrink-0 ${activeTab === 'team' ? 'pv-btn-primary' : 'pv-btn-outline'}`}
              onClick={() => setActiveTab('team')}
              style={{ height: '44px', borderRadius: '12px 12px 0 0', borderBottom: 'none' }}
            >
              <Users size={18} /> <span className="text-xs font-black uppercase tracking-tight">{t.settings.team}</span>
            </button>
          </>
        )}
      </div>

      {resetMode && (
        <div className="pv-card mb-8 border-brand-primary bg-brand-primary/5 flex items-center gap-4 p-6 anim-in">
          <Shield size={24} className="text-brand-primary" />
          <div>
            <h4 className="font-black text-brand-primary uppercase tracking-tight">Security Action Required</h4>
            <p className="text-xs font-bold text-muted-foreground">You've accessed this page via a password reset link. Please update your security credentials below.</p>
          </div>
        </div>
      )}

      {saved && (
        <div className="pv-card pv-glass anim-fade-in" style={{ 
          position: 'fixed', bottom: '32px', right: '32px', zIndex: 1000, 
          padding: '16px 24px', background: 'var(--status-active-bg)', color: 'var(--brand-primary)', 
          fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px', borderColor: 'var(--brand-primary)' 
        }}>
          <CheckCircle size={18} /> Settings saved successfully!
        </div>
      )}

      {activeTab === 'profile' && (
        <ProfileTab />
      )}

      {activeTab === 'general' && isAdmin && (
        <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '32px' }}>
          {/* Shop Information */}
          <div className="pv-card">
            <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '20px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: 800 }}>
                <Building size={20} style={{ color: 'var(--primary)' }} />
                Shop Information
              </h3>
            </div>
            <div className="flex flex-col gap-5">
              <div className="pv-input-group">
                <label>Shop Name <span className="text-destructive">*</span></label>
                <input type="text" name="shopName" className="pv-input" value={settings.shopName} onChange={handleChange} required />
              </div>
              <div className="pv-input-group">
                <label>Legal Address <span className="text-destructive">*</span></label>
                <input type="text" name="shopAddress" className="pv-input" value={settings.shopAddress} onChange={handleChange} required />
              </div>
              <div className="pv-input-group">
                <label>Support Contact <span className="text-destructive">*</span></label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="tel" 
                    name="shopPhone" 
                    className="pv-input font-bold" 
                    value={settings.shopPhone || ''} 
                    onChange={handleChange} 
                    placeholder="+91 98765 43210"
                    maxLength={16}
                    pattern="[0-9+\s-]{10,16}"
                    required 
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="pv-input-group">
                  <label>GST Number</label>
                  <input type="text" name="gstNumber" className="pv-input" value={settings.gstNumber || ''} onChange={handleChange} />
                </div>
                <div className="pv-input-group">
                  <label>Registration No.</label>
                  <input type="text" name="registrationNumber" className="pv-input" value={settings.registrationNumber || ''} onChange={handleChange} />
                </div>
              </div>
            </div>
          </div>

          {/* Global Rates */}
          <div className="pv-card">
            <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: 800 }}>
                  <Coins size={20} style={{ color: 'var(--primary)' }} />
                  Loan Appraisals
                </h3>
                <button 
                  className={`pv-btn pv-btn-sm pv-btn-outline ${syncing ? 'loading' : ''}`}
                  onClick={handleSyncRates}
                  disabled={syncing}
                >
                  <RefreshCw size={14} className={syncing ? 'spin' : ''} />
                  Sync Live Rates
                </button>
              </div>
            <div className="flex flex-col gap-5">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="pv-input-group">
                  <label>Gold 24K (Market Base)</label>
                  <input type="number" name="goldRate24K" className="pv-input" value={settings.goldRate24K} onChange={handleChange} />
                </div>
                <div className="pv-input-group">
                  <label>Gold 22K (916 Reference)</label>
                  <input type="text" className="pv-input bg-muted/30 font-black" readOnly value={`₹${Math.round((settings.goldRate24K || 0) * (22/24)).toLocaleString('en-IN')}`} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="pv-input-group">
                  <label>Silver 999 (Fine Silver)</label>
                  <input type="number" name="silverRate999" className="pv-input" value={settings.silverRate999} onChange={handleChange} />
                </div>
                <div className="pv-input-group">
                  <label>Currency Unit</label>
                  <input type="text" className="pv-input bg-muted/30" readOnly value="INR (₹)" />
                </div>
              </div>
              <div style={{ background: 'var(--primary)/5', padding: '16px', borderRadius: '16px', display: 'flex', gap: '12px', color: 'var(--primary)', border: '1px solid var(--primary)/20' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 600 }}>Updates will impact only new loans. Active contracts retain original rates.</p>
              </div>
            </div>
          </div>

          {/* Loan Defaults */}
          <div className="pv-card">
            <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '20px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: 800 }}>
                <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />
                Policies & Risk
              </h3>
            </div>
            <div className="flex flex-col gap-5">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="pv-input-group">
                  <label>Monthly Interest (%)</label>
                  <input type="number" name="defaultInterestRate" className="pv-input" value={settings.defaultInterestRate} onChange={handleChange} />
                </div>
                <div className="pv-input-group">
                  <label>Standard Tenure (Months)</label>
                  <input type="number" name="defaultTenure" className="pv-input" value={settings.defaultTenure} onChange={handleChange} />
                </div>
              </div>
              <div style={{ padding: '20px', background: 'var(--muted)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--foreground)', marginBottom: '16px' }}>
                  Staff Permissions
                </h4>
                <div className="flex flex-col gap-3">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                    <input type="checkbox" name="allowStaffOverridesInterest" checked={settings.allowStaffOverridesInterest} onChange={handleChange} />
                    Allow Interest Overrides
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                    <input type="checkbox" name="allowStaffOverridesLtv" checked={settings.allowStaffOverridesLtv} onChange={handleChange} />
                    Allow LTV Overrides
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp & Customer Messaging Gateway */}
          <div className="pv-card">
            <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '20px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: 800 }}>
                <MessageSquare size={20} style={{ color: 'var(--primary)' }} />
                WhatsApp & Customer Messaging
              </h3>
            </div>
            <div className="flex flex-col gap-5">
              <div className="pv-input-group">
                <label>Messaging Engine Mode</label>
                <select 
                  name="whatsappProvider" 
                  className="pv-input font-bold" 
                  value={settings.whatsappProvider || 'manual'} 
                  onChange={handleChange}
                >
                  <option value="manual">Manual Direct Link (Free — Desktop App & WhatsApp Web)</option>
                  <option value="cloud_api">Meta Cloud API (Official — 1,000 Free Messages/Month)</option>
                  <option value="openwa">Self-Hosted OpenWA (Docker on Local PC / VPS — Unlimited)</option>
                </select>
              </div>

              {/* Mode: Manual Direct / Desktop app */}
              {(settings.whatsappProvider === 'manual' || !settings.whatsappProvider) && (
                <div style={{ padding: '16px', background: 'var(--muted)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                    <input 
                      type="checkbox" 
                      name="whatsappPreferDesktopApp" 
                      checked={settings.whatsappPreferDesktopApp ?? true} 
                      onChange={handleChange} 
                    />
                    Prefer Opening Native WhatsApp Desktop App directly (<code style={{ fontSize: '12px', background: 'var(--card)', padding: '2px 6px', borderRadius: '4px' }}>whatsapp://</code>)
                  </label>
                  <p style={{ margin: '8px 0 0 28px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    When enabled, clicking &quot;WhatsApp&quot; on customer receipts or due loans opens the installed WhatsApp Desktop application immediately on Windows/Mac without an intermediate browser tab.
                  </p>
                </div>
              )}

              {/* Mode: Meta Cloud API */}
              {settings.whatsappProvider === 'cloud_api' && (
                <div className="flex flex-col gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 text-primary font-black text-sm">
                    <Smartphone size={16} /> Meta Cloud API Setup (1,000 Free Utility Conversations/Month)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="pv-input-group">
                      <label>Phone Number ID</label>
                      <input 
                        type="text" 
                        name="whatsappCloudPhoneNumberId" 
                        placeholder="e.g. 10982348234" 
                        className="pv-input" 
                        value={settings.whatsappCloudPhoneNumberId || ''} 
                        onChange={handleChange} 
                      />
                    </div>
                    <div className="pv-input-group">
                      <label>WhatsApp Business Account ID (WABA)</label>
                      <input 
                        type="text" 
                        name="whatsappCloudWabaId" 
                        placeholder="e.g. 98234729384" 
                        className="pv-input" 
                        value={settings.whatsappCloudWabaId || ''} 
                        onChange={handleChange} 
                      />
                    </div>
                  </div>
                  <div className="pv-input-group">
                    <label>Permanent Access Token</label>
                    <input 
                      type="password" 
                      name="whatsappCloudAccessToken" 
                      placeholder="EAAG..." 
                      className="pv-input" 
                      value={settings.whatsappCloudAccessToken || ''} 
                      onChange={handleChange} 
                    />
                  </div>
                </div>
              )}

              {/* Mode: OpenWA Docker Gateway */}
              {settings.whatsappProvider === 'openwa' && (
                <div className="flex flex-col gap-4 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-sm">
                    <Cpu size={16} /> OpenWA Docker Gateway (Self-Hosted on Shop PC / Cloudflare Tunnel)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                    <div className="pv-input-group">
                      <label>OpenWA Gateway URL</label>
                      <input 
                        type="text" 
                        name="whatsappOpenwaUrl" 
                        placeholder="http://localhost:2785 or https://wa.yourshop.com" 
                        className="pv-input" 
                        value={settings.whatsappOpenwaUrl || ''} 
                        onChange={handleChange} 
                      />
                    </div>
                    <div className="pv-input-group">
                      <label>Session ID</label>
                      <input 
                        type="text" 
                        name="whatsappOpenwaSessionId" 
                        placeholder="main" 
                        className="pv-input" 
                        value={settings.whatsappOpenwaSessionId || ''} 
                        onChange={handleChange} 
                      />
                    </div>
                  </div>
                  <div className="pv-input-group">
                    <label>API Key (Optional)</label>
                    <input 
                      type="password" 
                      name="whatsappOpenwaApiKey" 
                      placeholder="Leave blank if no auth key set in Docker" 
                      className="pv-input" 
                      value={settings.whatsappOpenwaApiKey || ''} 
                      onChange={handleChange} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Multi-Branch Management */}
          <div className="pv-card">
            <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: 800 }}>
                <GitBranch size={20} style={{ color: 'var(--primary)' }} />
                Branch Locations
              </h3>
              <button className="pv-btn pv-btn-gold pv-btn-sm" onClick={handleAddBranch}>
                <Plus size={14} /> Add Branch
              </button>
            </div>
            <div className="flex flex-col gap-5">
              <div className="pv-input-group">
                <label>Admin Context</label>
                <select name="activeBranchId" className="pv-input" value={settings.activeBranchId || 'firm'} onChange={handleChange}>
                  <option value="firm">All Branches</option>
                  {settings.branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-3">
                {settings.branches.map(b => (
                  <div key={b.id} className={`flex justify-between items-center p-4 rounded-xl border ${b.isActive === false ? 'bg-destructive/5 border-destructive/20 opacity-70' : 'bg-muted/50 border-border'}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-extrabold text-sm">{b.name}</div>
                        {b.isActive === false && <span className="text-[9px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-black uppercase">Archived</span>}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-bold uppercase">{b.code} • {b.location}</div>
                      <div className="text-[10px] text-primary font-bold mt-0.5">{b.phone || 'No phone set'}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {settings.activeBranchId === b.id && <span className="badge active">Active</span>}
                      <button 
                        onClick={() => handleToggleBranchStatus(b.id, b.name, b.isActive !== false)} 
                        className={`p-2 rounded-xl transition-all ${b.isActive === false ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-destructive/10 text-destructive hover:bg-destructive/20'}`}
                        title={b.isActive === false ? 'Unarchive Branch' : 'Archive Branch'}
                      >
                        {b.isActive === false ? <RotateCcw size={16} /> : <Archive size={16} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Architecture Section */}
      {activeTab === 'general' && isAdmin && (
        <div className="mt-8 px-1">
          <div className="pv-card p-8 bg-muted/10 border-dashed border-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h3 className="font-black text-xs uppercase tracking-widest">System Architecture</h3>
                <p className="text-[11px] text-muted-foreground font-bold">PledgeVault Cloud Environment</p>
              </div>
              <div className="flex items-center gap-3">
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase opacity-40 tracking-tight">Active Deployment</span>
                    <span className="font-mono text-sm font-black text-primary">
                      v{process.env.NEXT_PUBLIC_APP_VERSION || '0.2.0'} <span className="text-xs text-muted-foreground font-semibold">({process.env.NEXT_PUBLIC_APP_BUILD || 'dev'})</span>
                    </span>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                    <Database size={18} />
                 </div>
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

      <div className="mt-10 py-10 text-center text-[12px] text-muted-foreground font-bold uppercase tracking-widest border-t border-border flex flex-col items-center gap-2 justify-center">
        <div>PledgeVault Enterprise • Secure Cloud Infrastructure</div>
        <div className="text-[10px] opacity-75 font-black normal-case tracking-normal">
          A Product of <a href="https://nvisionsystems.in" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">nVision Systems</a>
        </div>
      </div>
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-20 text-muted-foreground">
        <RefreshCw className="spin mr-2" size={20} />
        <span className="font-bold uppercase tracking-wider text-xs">Loading Secure Settings...</span>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}

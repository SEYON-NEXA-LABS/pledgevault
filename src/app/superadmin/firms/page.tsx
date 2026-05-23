'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Users, 
  Layers, 
  ChevronRight, 
  MoreVertical,
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Zap,
  Activity,
  Filter,
  CheckCircle,
  X,
  Palette,
  Loader2,
  Calendar,
  Clock,
  CreditCard,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { supabaseService } from '@/lib/supabase/service';
import { formatCurrency, formatDate, SUBSCRIPTION_PLANS } from '@/lib/constants';

export default function FirmManagementPage() {
  const [firms, setFirms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  
  // Console details states
  const [editingFirm, setEditingFirm] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'billing'>('overview');
  const [completeDetails, setCompleteDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [recordingSub, setRecordingSub] = useState(false);
  const [extendingId, setExtendingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFirms() {
      try {
        const data = await supabaseService.getFirmsDetailed();
        setFirms(data || []);
      } catch (err) {
        console.error('Error fetching firms:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFirms();
  }, []);

  const handleOpenConsole = async (firm: any) => {
    setEditingFirm(firm);
    setShowEditModal(true);
    setActiveTab('overview');
    setLoadingDetails(true);
    setCompleteDetails(null);
    try {
      const details = await supabaseService.getFirmCompleteDetails(firm.id);
      setCompleteDetails(details);
    } catch (err) {
      console.error('Failed to fetch complete firm details:', err);
      alert('Failed to load full firm details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFirm) return;
    setUpdating(true);
    try {
      const firmUpdates = {
        name: editingFirm.name,
        slug: editingFirm.slug,
        short_code: editingFirm.shortCode,
        branding_config: editingFirm.brandingConfig
      };

      const settingsUpdates = {
        shop_address: completeDetails?.settings?.shopAddress || '',
        shop_phone: completeDetails?.settings?.shopPhone || '',
        gst_number: completeDetails?.settings?.gstNumber || '',
        registration_number: completeDetails?.settings?.registrationNumber || '',
        license_number: completeDetails?.settings?.licenseNumber || ''
      };

      await supabaseService.updateFirmDetailsBySuperadmin(editingFirm.id, firmUpdates, settingsUpdates);

      // Refresh console view
      const details = await supabaseService.getFirmCompleteDetails(editingFirm.id);
      setCompleteDetails(details);

      // Refresh directory
      const data = await supabaseService.getFirmsDetailed();
      setFirms(data || []);

      alert('Business profile and shop settings updated successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to update firm details: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateSubscriptionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingFirm) return;
    setRecordingSub(true);
    
    const formData = new FormData(e.currentTarget);
    const planId = formData.get('planId') as any;
    const interval = formData.get('interval') as any;
    const amount = Number(formData.get('amount'));
    const method = formData.get('method') as any;

    const startDate = new Date();
    const endDate = new Date();
    if (interval === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
    else endDate.setFullYear(endDate.getFullYear() + 1);

    try {
      await supabaseService.createSubscription({
        firmId: editingFirm.id,
        planId: planId,
        interval: interval,
        amount: amount,
        currency: 'INR',
        paymentMethod: method,
        status: 'active',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      // Refresh console
      const details = await supabaseService.getFirmCompleteDetails(editingFirm.id);
      setCompleteDetails(details);
      
      // Refresh directory list
      const data = await supabaseService.getFirmsDetailed();
      setFirms(data || []);

      alert('Subscription plan and billing status updated successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to record subscription: ' + err.message);
    } finally {
      setRecordingSub(false);
    }
  };

  const handleExtendFromConsole = async () => {
    if (!editingFirm) return;
    const activeSub = completeDetails?.subscriptions?.find((s: any) => s.status === 'active');
    const extensionStatus = supabaseService.canExtendSubscription(activeSub);
    
    if (!extensionStatus.allowed) {
      alert(extensionStatus.reason || 'Cannot extend subscription.');
      return;
    }

    if (!confirm("Extend this firm's subscription/trial by 7 days?")) return;
    
    setExtendingId(editingFirm.id);
    try {
      await supabaseService.extendSubscription(editingFirm.id, 7);
      
      // Refresh console
      const details = await supabaseService.getFirmCompleteDetails(editingFirm.id);
      setCompleteDetails(details);

      // Refresh directory list
      const data = await supabaseService.getFirmsDetailed();
      setFirms(data || []);

      alert('Subscription extended successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to extend subscription.');
    } finally {
      setExtendingId(null);
    }
  };

  const handleExtendTrial = async (firmId: string, activeSub: any) => {
    const extensionStatus = supabaseService.canExtendSubscription(activeSub);
    if (!extensionStatus.allowed) {
      alert(extensionStatus.reason || 'Cannot extend subscription.');
      return;
    }

    if (!confirm("Extend this firm's active subscription by 7 days?")) return;
    
    setExtendingId(firmId);
    try {
      await supabaseService.extendSubscription(firmId, 7);
      
      // Refresh directory
      const data = await supabaseService.getFirmsDetailed();
      setFirms(data || []);
      
      alert('Subscription extended successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to extend subscription.');
    } finally {
      setExtendingId(null);
    }
  };

  const filteredFirms = firms.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterPlan === 'all' || f.plan === filterPlan;
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Link href="/superadmin" className="pv-btn pv-btn-outline pv-btn-sm" style={{ marginBottom: '12px' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
             <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px', margin: 0 }}>Firm Management</h1>
             <span className="pv-badge" style={{ verticalAlign: 'middle', background: 'var(--brand-deep)', color: 'white' }}>{firms.length} Total Shops</span>
          </div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '15px', marginTop: '4px', fontWeight: 600 }}>Oversee all registered pawn shops, monitor growth, and manage accounts.</p>
        </div>
        <div>
           <Link href="/superadmin/onboarding" className="pv-btn pv-btn-gold">
             <Plus size={18} /> Onboard New Firm
           </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="pv-card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input 
            type="text" 
            placeholder="Search firms by name..." 
            className="pv-input"
            style={{ paddingLeft: '48px', width: '100%' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <Filter size={18} style={{ color: 'var(--text-tertiary)' }} />
           <select 
             className="pv-input" 
             style={{ width: '160px' }}
             value={filterPlan}
             onChange={e => setFilterPlan(e.target.value)}
           >
             <option value="all">All Plans</option>
             <option value="free">Standard (Free)</option>
             <option value="starter">Starter</option>
             <option value="pro">Pro (Growth)</option>
             <option value="elite">Elite (Enterprise)</option>
           </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '100px', textAlign: 'center' }}>
          <Loader2 className="spin" size={32} style={{ color: 'var(--brand-primary)' }} />
          <p style={{ marginTop: '16px', color: 'var(--text-tertiary)', fontWeight: 700 }}>Syncing firm directory...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
          {filteredFirms.length === 0 ? (
            <div className="pv-card" style={{ padding: '80px', textAlign: 'center', gridColumn: '1 / -1' }}>
              <Building2 size={48} style={{ color: 'var(--border)', marginBottom: '16px', marginInline: 'auto' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 800 }}>No firms found</h3>
              <p style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Adjust your search or filter to find specific shops.</p>
            </div>
          ) : (
            filteredFirms.map((firm) => {
              const activeSub = firm.subscriptions?.find((s: any) => s.status === 'active');
              const extensionStatus = supabaseService.canExtendSubscription(activeSub);
              
              return (
              <div key={firm.id} className="pv-card anim-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                   <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => handleOpenConsole(firm)}>
                      <div style={{ width: '48px', height: '48px', background: 'var(--bg-primary)', color: 'var(--brand-primary)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '20px', border: '1px solid var(--border)' }}>
                        {firm.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{firm.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px', fontWeight: 500 }}>
                          <MapPin size={14} /> ID: {firm.id.slice(0, 8).toUpperCase()}
                        </div>
                      </div>
                   </div>
                   <div className={`badge ${firm.plan || 'free'}`} style={{ fontWeight: 800 }}>
                     {(firm.plan || 'free').toUpperCase()}
                   </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      <Layers size={14} />
                      <span>{firm.branches?.[0]?.count || 0} Branches</span>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      <Users size={14} />
                      <span>{firm.profiles?.[0]?.count || 0} Staff</span>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      <ShieldCheck size={14} />
                      <span>{formatDate(firm.createdAt)}</span>
                   </div>
                   {activeSub && (
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--status-active)', fontWeight: 800 }}>
                        <Zap size={14} />
                        <span>Ends {formatDate(activeSub.end_date || activeSub.endDate)}</span>
                     </div>
                   )}
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                   <Link href={`/superadmin/subscriptions?firmId=${firm.id}`} className="pv-btn pv-btn-outline pv-btn-sm" style={{ padding: '6px 10px', fontSize: '12px' }}>
                      <CreditCard size={14} /> Ledger
                   </Link>
                   <button 
                     className="pv-btn pv-btn-outline pv-btn-sm" 
                     style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--gold)', borderColor: 'var(--gold)' }} 
                     onClick={() => handleOpenConsole(firm)}
                   >
                      <Layers size={14} /> Console
                   </button>
                   <button 
                     className="pv-btn pv-btn-outline pv-btn-sm" 
                     style={{ 
                       padding: '6px 10px', fontSize: '12px',
                       background: extensionStatus.allowed ? 'var(--status-active-bg)' : 'var(--bg-primary)', 
                       color: extensionStatus.allowed ? 'var(--status-active)' : 'var(--text-tertiary)', 
                       borderColor: extensionStatus.allowed ? 'var(--status-active)' : 'var(--border)',
                       cursor: extensionStatus.allowed ? 'pointer' : 'not-allowed'
                     }}
                     onClick={() => handleExtendTrial(firm.id, activeSub)}
                     disabled={extendingId === firm.id || !extensionStatus.allowed}
                   >
                      {extendingId === firm.id ? (
                        <Loader2 size={14} className="spin" />
                      ) : (
                        <Zap size={14} />
                      )}
                      {extensionStatus.allowed ? 'Ext 7D' : 'Limit'}
                   </button>
                   <Link href="/superadmin/integrity" className="pv-btn pv-btn-outline pv-btn-sm" style={{ padding: '6px 10px', fontSize: '12px', marginLeft: 'auto' }}>
                      <Activity size={14} />
                   </Link>
                </div>
              </div>
              );
            })
          )}
        </div>
      )}

      {/* Unified Firm Console Modal */}
      {showEditModal && editingFirm && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="pv-card pv-glass anim-fade-in" style={{ 
            maxWidth: '850px', 
            width: '95%', 
            maxHeight: '90vh', 
            overflow: 'hidden', 
            padding: 0, 
            display: 'flex', 
            flexDirection: 'column',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
          }}>
            {/* Header */}
            <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)' }}>{editingFirm.name}</h3>
                  <span className={`badge ${editingFirm.plan || 'free'}`} style={{ fontWeight: 800 }}>
                    {(editingFirm.plan || 'free').toUpperCase()}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>ID: {editingFirm.id}</p>
              </div>
              <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px', borderRadius: '50%' }} onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Tabs Menu */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)' }}>
              {[
                { id: 'overview', label: 'Console Overview', icon: <Layers size={16} /> },
                { id: 'settings', label: 'Shop Profile & Identity', icon: <Building2 size={16} /> },
                { id: 'billing', label: 'Subscriptions & Billing', icon: <Zap size={16} /> }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as any)}
                  style={{
                    padding: '16px 24px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === t.id ? '2px solid var(--gold)' : '2px solid transparent',
                    color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    fontWeight: activeTab === t.id ? 800 : 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
              {loadingDetails ? (
                <div style={{ padding: '60px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader2 className="spin" size={36} style={{ color: 'var(--brand-primary)' }} />
                  <p style={{ marginTop: '16px', color: 'var(--text-tertiary)', fontWeight: 700 }}>Synthesizing complete business records...</p>
                </div>
              ) : (
                <>
                  {/* Overview Tab */}
                  {activeTab === 'overview' && completeDetails && (
                    <div style={{ animation: 'anim-fade-in 0.2s', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                      
                      {/* Stats row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <div className="pv-glass" style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase' }}>Active Branches</div>
                          <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '4px', color: 'var(--brand-primary)' }}>{completeDetails.branches?.length || 0}</div>
                        </div>
                        <div className="pv-glass" style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase' }}>Registered Staff</div>
                          <div style={{ fontSize: '24px', fontWeight: 900, marginTop: '4px', color: 'var(--gold)' }}>{completeDetails.staff?.length || 0}</div>
                        </div>
                        <div className="pv-glass" style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase' }}>Onboarding Date</div>
                          <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '8px' }}>{formatDate(editingFirm.createdAt)}</div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
                        {/* Left Column: Metadata */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: 800, margin: 0, textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.5px' }}>Business Credentials</h4>
                          <div className="pv-glass" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>URL Slug</span>
                              <span style={{ fontWeight: 800, color: 'var(--brand-primary)' }}>/{completeDetails.firm?.slug}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Short Prefix</span>
                              <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{completeDetails.firm?.shortCode || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Address</span>
                              <span style={{ fontWeight: 700, textAlign: 'right', maxWidth: '180px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={completeDetails.settings?.shopAddress}>
                                {completeDetails.settings?.shopAddress || 'Not set'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Phone</span>
                              <span style={{ fontWeight: 700 }}>{completeDetails.settings?.shopPhone || 'Not set'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>GSTIN</span>
                              <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{completeDetails.settings?.gstNumber || 'Not registered'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Lists */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          
                          {/* Branches list */}
                          <div>
                            <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 12px 0', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.5px' }}>Branches</h4>
                            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                              {completeDetails.branches?.length === 0 ? (
                                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>No branches onboarded.</div>
                              ) : (
                                completeDetails.branches.map((b: any) => (
                                  <div key={b.id} style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                      <div style={{ fontSize: '13px', fontWeight: 800 }}>{b.name} <small style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>({b.code})</small></div>
                                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{b.location || 'No location set'}</div>
                                    </div>
                                    <span className="pv-badge" style={{ 
                                      background: b.isActive ? 'var(--status-active-bg)' : 'var(--bg-primary)', 
                                      color: b.isActive ? 'var(--status-active)' : 'var(--text-tertiary)',
                                      fontWeight: 800,
                                      fontSize: '10px'
                                    }}>
                                      {b.isActive ? 'ACTIVE' : 'ARCHIVED'}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Staff list */}
                          <div>
                            <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 12px 0', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.5px' }}>Users & Staff Directory</h4>
                            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                              {completeDetails.staff?.length === 0 ? (
                                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>No staff profiles registered.</div>
                              ) : (
                                completeDetails.staff.map((s: any) => (
                                  <div key={s.id} style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                      <div style={{ fontSize: '13px', fontWeight: 800 }}>{s.fullName}</div>
                                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{s.email || 'Registered User'}</div>
                                    </div>
                                    <span className="pv-badge" style={{ 
                                      background: s.role === 'admin' ? 'var(--brand-deep)' : 'var(--bg-primary)', 
                                      color: s.role === 'admin' ? 'white' : 'var(--text-secondary)',
                                      fontWeight: 800,
                                      fontSize: '10px'
                                    }}>
                                      {s.role.toUpperCase()}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>
                  )}

                  {/* Edit Profile Tab */}
                  {activeTab === 'settings' && completeDetails && (
                    <form onSubmit={handleSaveChanges} style={{ animation: 'anim-fade-in 0.2s', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      
                      {/* Row 1: Basic Identity */}
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 16px 0', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Business Identity</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div className="pv-input-group">
                            <label>Firm Name</label>
                            <input 
                              required
                              className="pv-input"
                              value={editingFirm.name || ''}
                              onChange={e => setEditingFirm({ ...editingFirm, name: e.target.value })}
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                            <div className="pv-input-group">
                              <label>URL Slug</label>
                              <input 
                                required
                                className="pv-input"
                                value={editingFirm.slug || ''}
                                onChange={e => setEditingFirm({ ...editingFirm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                              />
                            </div>
                            <div className="pv-input-group">
                              <label>Short Code</label>
                              <input 
                                required
                                maxLength={4}
                                className="pv-input"
                                value={editingFirm.shortCode || ''}
                                onChange={e => setEditingFirm({ ...editingFirm, shortCode: e.target.value.toUpperCase() })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Contact & Taxes */}
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 16px 0', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Contact & Tax Registrations</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px', marginBottom: '16px' }}>
                          <div className="pv-input-group">
                            <label>Shop Address</label>
                            <input 
                              className="pv-input"
                              placeholder="Business Headquarters location"
                              value={completeDetails.settings?.shopAddress || ''}
                              onChange={e => setCompleteDetails({
                                ...completeDetails,
                                settings: { ...completeDetails.settings, shopAddress: e.target.value }
                              })}
                            />
                          </div>
                          <div className="pv-input-group">
                            <label>Shop Phone</label>
                            <input 
                              className="pv-input"
                              placeholder="Contact number"
                              value={completeDetails.settings?.shopPhone || ''}
                              onChange={e => setCompleteDetails({
                                ...completeDetails,
                                settings: { ...completeDetails.settings, shopPhone: e.target.value }
                              })}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                          <div className="pv-input-group">
                            <label>GSTIN</label>
                            <input 
                              className="pv-input"
                              placeholder="GST Number"
                              value={completeDetails.settings?.gstNumber || ''}
                              onChange={e => setCompleteDetails({
                                ...completeDetails,
                                settings: { ...completeDetails.settings, gstNumber: e.target.value.toUpperCase() }
                              })}
                            />
                          </div>
                          <div className="pv-input-group">
                            <label>Registration Number</label>
                            <input 
                              className="pv-input"
                              placeholder="Reg Number"
                              value={completeDetails.settings?.registrationNumber || ''}
                              onChange={e => setCompleteDetails({
                                ...completeDetails,
                                settings: { ...completeDetails.settings, registrationNumber: e.target.value.toUpperCase() }
                              })}
                            />
                          </div>
                          <div className="pv-input-group">
                            <label>License Number</label>
                            <input 
                              className="pv-input"
                              placeholder="Global fall-back license"
                              value={completeDetails.settings?.licenseNumber || ''}
                              onChange={e => setCompleteDetails({
                                ...completeDetails,
                                settings: { ...completeDetails.settings, licenseNumber: e.target.value.toUpperCase() }
                              })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Row 3: Branding */}
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 16px 0', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>White-Label Customization</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
                          <div className="pv-input-group">
                            <label>Primary Brand Color</label>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                              {[
                                { name: 'Pacific', color: '#107B88' },
                                { name: 'Emerald', color: '#065f46' },
                                { name: 'Royal', color: '#7f1d1d' },
                                { name: 'Navy', color: '#1e3a8a' },
                                { name: 'Onyx', color: '#111827' }
                              ].map(theme => (
                                <div 
                                  key={theme.color}
                                  onClick={() => setEditingFirm({
                                    ...editingFirm,
                                    brandingConfig: { ...editingFirm.brandingConfig, primaryColor: theme.color }
                                  })}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: theme.color,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: editingFirm.brandingConfig?.primaryColor === theme.color ? '2px solid var(--gold)' : '1px solid var(--border)'
                                  }}
                                >
                                  {editingFirm.brandingConfig?.primaryColor === theme.color && <CheckCircle size={14} style={{ color: 'white' }} />}
                                </div>
                              ))}
                              <input 
                                type="color"
                                value={editingFirm.brandingConfig?.primaryColor || '#107B88'}
                                onChange={e => setEditingFirm({
                                  ...editingFirm,
                                  brandingConfig: { ...editingFirm.brandingConfig, primaryColor: e.target.value }
                                })}
                                style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer' }}
                              />
                            </div>
                          </div>
                          <div className="pv-input-group">
                            <label>Branded Login Greeting</label>
                            <input 
                              className="pv-input"
                              value={editingFirm.brandingConfig?.loginGreeting || ''}
                              onChange={e => setEditingFirm({
                                ...editingFirm,
                                brandingConfig: { ...editingFirm.brandingConfig, loginGreeting: e.target.value }
                              })}
                            />
                          </div>
                        </div>
                      </div>

                      <div style={{ background: 'var(--status-overdue-bg)', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', color: 'var(--status-overdue)', border: '1px solid var(--status-overdue)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={18} />
                        <span>Changing short codes or URLs may disrupt local branch numbering and customer landing links. Use care.</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                        <button type="button" className="pv-btn pv-btn-outline" onClick={() => setShowEditModal(false)}>Cancel</button>
                        <button type="submit" className="pv-btn pv-btn-gold" disabled={updating}>
                          {updating ? <Loader2 className="spin" size={18} /> : 'Save Profile & Settings'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Billing & Subscriptions Tab */}
                  {activeTab === 'billing' && completeDetails && (
                    <div style={{ animation: 'anim-fade-in 0.2s', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                      
                      {/* Active Sub Header */}
                      <div className="pv-glass" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase' }}>Active Platform Plan</span>
                          <h3 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', margin: '4px 0 8px 0', textTransform: 'uppercase' }}>
                            {(editingFirm.plan || 'free')} Plan
                          </h3>
                          
                          {/* Active sub end date */}
                          {completeDetails.subscriptions?.find((s: any) => s.status === 'active') ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--status-active)', fontWeight: 700 }}>
                              <Clock size={14} />
                              <span>Valid until {formatDate(completeDetails.subscriptions.find((s: any) => s.status === 'active').endDate)}</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 700 }}>
                              <X size={14} />
                              <span>No active subscription found (Standard Free Plan limits apply)</span>
                            </div>
                          )}
                        </div>

                        {/* Extend subscription */}
                        {(() => {
                          const activeSub = completeDetails.subscriptions?.find((s: any) => s.status === 'active');
                          const extensionStatus = supabaseService.canExtendSubscription(activeSub);
                          return (
                            <button
                              type="button"
                              className="pv-btn pv-btn-outline"
                              style={{
                                background: extensionStatus.allowed ? 'var(--status-active-bg)' : 'transparent',
                                color: extensionStatus.allowed ? 'var(--status-active)' : 'var(--text-tertiary)',
                                borderColor: extensionStatus.allowed ? 'var(--status-active)' : 'var(--border)',
                                cursor: extensionStatus.allowed ? 'pointer' : 'not-allowed',
                                fontWeight: 800
                              }}
                              disabled={extendingId === editingFirm.id || !extensionStatus.allowed}
                              onClick={handleExtendFromConsole}
                            >
                              {extendingId === editingFirm.id ? (
                                <Loader2 size={16} className="spin" />
                              ) : (
                                <Zap size={16} />
                              )}
                              {extensionStatus.allowed ? 'Extend Plan 7 Days' : extensionStatus.reason || 'Extensions Locked'}
                            </button>
                          );
                        })()}
                      </div>

                      {/* Sub creation form */}
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 16px 0', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.5px' }}>Modify Plan / Record Payment</h4>
                        <form onSubmit={handleCreateSubscriptionSubmit} className="pv-glass" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="pv-input-group">
                              <label>Target Plan Tier</label>
                              <select 
                                name="planId" 
                                required 
                                className="pv-input"
                                defaultValue={editingFirm.plan || 'pro'}
                                onChange={e => {
                                  // Automatically update the suggested amount field
                                  const tier = e.target.value;
                                  const intervalSelect = document.getElementById('console-sub-interval') as HTMLSelectElement;
                                  const amountInput = document.getElementById('console-sub-amount') as HTMLInputElement;
                                  if (intervalSelect && amountInput) {
                                    const isYearly = intervalSelect.value === 'yearly';
                                    const subPlan = SUBSCRIPTION_PLANS.find(p => p.id === tier);
                                    if (subPlan) {
                                      amountInput.value = String(isYearly ? subPlan.yearlyPrice : subPlan.monthlyPrice);
                                    }
                                  }
                                }}
                              >
                                {SUBSCRIPTION_PLANS.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="pv-input-group">
                              <label>Billing Period</label>
                              <select 
                                id="console-sub-interval"
                                name="interval" 
                                required 
                                className="pv-input"
                                onChange={e => {
                                  const interval = e.target.value;
                                  const tierSelect = document.querySelector('select[name="planId"]') as HTMLSelectElement;
                                  const amountInput = document.getElementById('console-sub-amount') as HTMLInputElement;
                                  if (tierSelect && amountInput) {
                                    const tier = tierSelect.value;
                                    const subPlan = SUBSCRIPTION_PLANS.find(p => p.id === tier);
                                    if (subPlan) {
                                      amountInput.value = String(interval === 'yearly' ? subPlan.yearlyPrice : subPlan.monthlyPrice);
                                    }
                                  }
                                }}
                              >
                                <option value="monthly">Monthly billing</option>
                                <option value="yearly">Yearly billing</option>
                              </select>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="pv-input-group">
                              <label>Amount (₹)</label>
                              <input 
                                id="console-sub-amount"
                                type="number" 
                                name="amount" 
                                required 
                                placeholder="Suggested: ₹2499" 
                                className="pv-input"
                                defaultValue={SUBSCRIPTION_PLANS.find(p => p.id === (editingFirm.plan || 'pro'))?.monthlyPrice || 2499}
                              />
                            </div>
                            <div className="pv-input-group">
                              <label>Payment Mode / Source</label>
                              <select name="method" required className="pv-input">
                                <option value="cash">Direct Cash</option>
                                <option value="upi">UPI (Manual confirmation)</option>
                                <option value="netbanking">Direct Bank Transfer</option>
                                <option value="trial">System Granted Trial</option>
                              </select>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <button type="submit" className="pv-btn pv-btn-gold" style={{ width: '100%', gap: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} disabled={recordingSub}>
                              {recordingSub ? <Loader2 size={16} className="spin" /> : <CreditCard size={16} />}
                              {recordingSub ? 'Recording subscription updates...' : 'Save & Activate New Plan Tier'}
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Sub logs history */}
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 12px 0', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.5px' }}>Billing & Subscriptions Logs</h4>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px', background: 'rgba(0,0,0,0.01)' }}>
                          {completeDetails.subscriptions?.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>No payment logs recorded.</div>
                          ) : (
                            <table className="pv-table" style={{ margin: 0 }}>
                              <thead>
                                <tr>
                                  <th style={{ fontSize: '11px', padding: '10px 16px' }}>Plan</th>
                                  <th style={{ fontSize: '11px', padding: '10px 16px' }}>Billing</th>
                                  <th style={{ fontSize: '11px', padding: '10px 16px' }}>Amount</th>
                                  <th style={{ fontSize: '11px', padding: '10px 16px' }}>Method</th>
                                  <th style={{ fontSize: '11px', padding: '10px 16px' }}>Start - Expiry</th>
                                  <th style={{ fontSize: '11px', padding: '10px 16px' }}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {completeDetails.subscriptions.map((sub: any) => (
                                  <tr key={sub.id}>
                                    <td style={{ fontSize: '12px', padding: '10px 16px', fontWeight: 800 }}>{(sub.planId || 'free').toUpperCase()}</td>
                                    <td style={{ fontSize: '12px', padding: '10px 16px' }}>{sub.interval}</td>
                                    <td style={{ fontSize: '12px', padding: '10px 16px', fontWeight: 700 }}>{formatCurrency(sub.amount)}</td>
                                    <td style={{ fontSize: '10px', padding: '10px 16px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{sub.paymentMethod}</td>
                                    <td style={{ fontSize: '11px', padding: '10px 16px', color: 'var(--text-secondary)' }}>
                                      {formatDate(sub.startDate)} - {formatDate(sub.endDate)}
                                    </td>
                                    <td style={{ fontSize: '11px', padding: '10px 16px' }}>
                                      <span className="pv-badge" style={{ 
                                        background: sub.status === 'active' ? 'var(--status-active-bg)' : 'var(--bg-primary)',
                                        color: sub.status === 'active' ? 'var(--status-active)' : 'var(--text-tertiary)',
                                        fontWeight: 800,
                                        fontSize: '10px'
                                      }}>
                                        {sub.status.toUpperCase()}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>

                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

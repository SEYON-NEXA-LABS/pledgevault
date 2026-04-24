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
  Fingerprint
} from 'lucide-react';
import Link from 'next/link';
import { supabaseService } from '@/lib/supabase/service';
import { formatCurrency, formatDate } from '@/lib/constants';

export default function FirmManagementPage() {
  const [firms, setFirms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [editingFirm, setEditingFirm] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);
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

  const handleUpdateBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFirm) return;
    setUpdating(true);
    try {
      // 1. Update branding config
      await supabaseService.updateFirmBranding(editingFirm.id, editingFirm.brandingConfig);
      
      // 2. Update metadata
      await supabaseService.updateFirmMetadata(editingFirm.id, {
        name: editingFirm.name,
        slug: editingFirm.slug,
        shortCode: editingFirm.shortCode
      });

      // 3. Refresh list
      const data = await supabaseService.getFirmsDetailed();
      setFirms(data || []);
      setShowEditModal(false);
    } catch (err) {
      alert('Failed to update firm info');
    } finally {
      setUpdating(false);
    }
  };

  const handleExtendTrial = async (firmId: string) => {
    if (!confirm('Extend this firm\'s active subscription by 7 days?')) return;
    
    setExtendingId(firmId);
    try {
      await supabaseService.extendSubscription(firmId, 7);
      
      // Refresh list
      const data = await supabaseService.getFirmsDetailed();
      setFirms(data || []);
      
      alert('Subscription extended successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to extend subscription. Ensure the firm has an active subscription.');
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
             <option value="pro">Premium (Growth)</option>
             <option value="enterprise">Enterprise</option>
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
                   <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      <div style={{ width: '48px', height: '48px', background: 'var(--bg-primary)', color: 'var(--brand-primary)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '20px', border: '1px solid var(--border)' }}>
                        {firm.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{firm.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px', fontWeight: 500 }}>
                          <MapPin size={14} /> Coimbatore, TN
                        </div>
                      </div>
                   </div>
                   <div className="pv-badge" style={{ 
                     background: firm.plan === 'enterprise' ? '#E0F2FE' : (firm.plan === 'pro' ? 'var(--status-active-bg)' : 'var(--bg-primary)'),
                     color: firm.plan === 'enterprise' ? '#0369A1' : (firm.plan === 'pro' ? 'var(--status-active)' : 'var(--text-tertiary)'),
                     fontWeight: 800
                   }}>
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
                   {activeSub && (activeSub.plan_id === 'elite' || activeSub.plan_id === 'pro') && (
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--status-active)', fontWeight: 800 }}>
                        <Zap size={14} />
                        <span>Ends {formatDate(activeSub.end_date)}</span>
                     </div>
                   )}
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                   <Link href={`/superadmin/subscriptions?firmId=${firm.id}`} className="pv-btn pv-btn-outline pv-btn-sm" style={{ padding: '6px 10px', fontSize: '12px' }}>
                      <Zap size={14} /> Sub
                   </Link>
                   <button 
                     className="pv-btn pv-btn-outline pv-btn-sm" 
                     style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--gold)', borderColor: 'var(--gold)' }} 
                     onClick={() => {
                       setEditingFirm(firm);
                       setShowEditModal(true);
                     }}
                   >
                      <Palette size={14} /> Style
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
                     onClick={() => handleExtendTrial(firm.id)}
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

      {showEditModal && editingFirm && (
        <div className="modal-overlay">
          <div className="pv-card" style={{ maxWidth: '500px', padding: 0 }}>
             <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Edit Business Identity</h3>
                <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }} onClick={() => setShowEditModal(false)}><X size={20} /></button>
             </div>
             
             <form onSubmit={handleUpdateBranding}>
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   
                   <div className="pv-input-group">
                      <label>Firm Name</label>
                      <input 
                        className="pv-input" 
                        value={editingFirm.name || ''} 
                        onChange={e => setEditingFirm({...editingFirm, name: e.target.value})}
                      />
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="pv-input-group">
                        <label>URL Slug</label>
                        <input 
                          className="pv-input" 
                          value={editingFirm.slug || ''} 
                          onChange={e => setEditingFirm({...editingFirm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                        />
                      </div>
                      <div className="pv-input-group">
                        <label>Short Code</label>
                        <input 
                          className="pv-input" 
                          maxLength={4}
                          value={editingFirm.shortCode || ''} 
                          onChange={e => setEditingFirm({...editingFirm, shortCode: e.target.value.toUpperCase()})}
                        />
                      </div>
                   </div>

                   <div className="pv-input-group">
                      <label>Primary Brand Color</label>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
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
                              brandingConfig: { ...editingFirm.brandingConfig, primary_color: theme.color }
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
                              border: editingFirm.brandingConfig?.primary_color === theme.color ? '2px solid var(--gold)' : '1px solid var(--border)'
                            }}
                          >
                            {editingFirm.brandingConfig?.primary_color === theme.color && <CheckCircle size={14} style={{ color: 'white' }} />}
                          </div>
                        ))}
                        <input 
                          type="color"
                          value={editingFirm.brandingConfig?.primary_color || '#107B88'}
                          onChange={e => setEditingFirm({
                            ...editingFirm, 
                            brandingConfig: { ...editingFirm.brandingConfig, primary_color: e.target.value }
                          })}
                          style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer' }}
                        />
                      </div>
                   </div>

                   <div className="pv-input-group">
                      <label>Login Greeting</label>
                      <input 
                        className="pv-input" 
                        value={editingFirm.brandingConfig?.login_greeting || ''} 
                        onChange={e => setEditingFirm({
                          ...editingFirm, 
                          brandingConfig: { ...editingFirm.brandingConfig, login_greeting: e.target.value }
                        })}
                      />
                   </div>

                   <div style={{ background: 'var(--status-overdue-bg)', padding: '12px', borderRadius: '8px', fontSize: '13px', color: 'var(--status-overdue)', border: '1px solid var(--status-overdue)', fontWeight: 700 }}>
                      Warning: Changing Slugs or Short Codes impact loan numbering.
                   </div>
                </div>

                <div style={{ padding: '20px 24px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                   <button type="button" className="pv-btn pv-btn-outline" onClick={() => setShowEditModal(false)}>Cancel</button>
                   <button type="submit" className="pv-btn pv-btn-gold" disabled={updating}>
                      {updating ? <Loader2 className="spin" size={18} /> : 'Apply Identity Changes'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}


    </div>
  );
}

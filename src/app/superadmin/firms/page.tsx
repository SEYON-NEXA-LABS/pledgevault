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

  const filteredFirms = firms.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterPlan === 'all' || f.plan === filterPlan;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="admin-page" style={{ padding: '32px' }}>
      <div className="admin-header" style={{ marginBottom: '32px' }}>
        <div className="header-info">
          <Link href="/superadmin" className="btn btn-ghost btn-sm" style={{ marginBottom: '12px' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px' }}>Firm Management</h1>
             <span className="badge" style={{ verticalAlign: 'middle' }}>{firms.length} Total Shops</span>
          </div>
          <p className="subtitle">Oversee all registered pawn shops, monitor growth, and manage accounts.</p>
        </div>
        <div className="header-actions">
           <Link href="/superadmin/onboarding" className="btn btn-gold">
             <Plus size={18} /> Onboard New Firm
           </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-container card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div className="search-box" style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input 
            type="text" 
            placeholder="Search firms by name..." 
            className="form-input"
            style={{ paddingLeft: '48px', width: '100%' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <Filter size={18} color="var(--text-tertiary)" />
           <select 
             className="form-input" 
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
          <div className="spin-box"><Activity className="spin" size={32} color="var(--accent)" /></div>
          <p style={{ marginTop: '16px', color: 'var(--text-tertiary)' }}>Syncing firm directory...</p>
        </div>
      ) : (
        <div className="firms-grid">
          {filteredFirms.length === 0 ? (
            <div className="card" style={{ padding: '80px', textAlign: 'center', gridColumn: '1 / -1' }}>
              <Building2 size={48} color="var(--border)" style={{ marginBottom: '16px' }} />
              <h3>No firms found</h3>
              <p style={{ color: 'var(--text-tertiary)' }}>Adjust your search or filter to find specific shops.</p>
            </div>
          ) : (
            filteredFirms.map((firm) => (
              <div key={firm.id} className="firm-mgmt-card card animate-in">
                <div className="card-top">
                   <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      <div className="firm-initials">
                        {firm.name.charAt(0)}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>{firm.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                          <MapPin size={14} /> Coimbatore, TN
                        </div>
                      </div>
                   </div>
                   <div className={`plan-badge ${firm.plan}`}>
                     {firm.plan.toUpperCase()}
                   </div>
                </div>

                <div className="card-metrics">
                   <div className="metric">
                      <Layers size={14} />
                      <span>{firm.branches?.[0]?.count || 0} Branches</span>
                   </div>
                   <div className="metric">
                      <Users size={14} />
                      <span>{firm.profiles?.[0]?.count || 0} Staff</span>
                   </div>
                   <div className="metric">
                      <ShieldCheck size={14} />
                      <span>Joined {formatDate(firm.created_at)}</span>
                   </div>
                </div>

                <div className="card-footer-actions">
                   <Link href={`/superadmin/subscriptions?firmId=${firm.id}`} className="mini-action">
                      <Zap size={14} /> Subscription
                   </Link>
                   <button 
                     className="mini-action" 
                     style={{ background: 'var(--bg-gold-light)', color: 'var(--gold-dark)', borderColor: 'var(--gold-light)' }} 
                     onClick={() => {
                       setEditingFirm({
                         ...firm,
                         shortCode: firm.short_code,
                         brandingConfig: firm.branding_config
                       });
                       setShowEditModal(true);
                     }}
                   >
                      <Palette size={14} /> Edit Identity
                   </button>
                   <Link href="/superadmin/integrity" className="mini-action" style={{ marginLeft: 'auto' }}>
                      <Activity size={14} />
                   </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Identity Modal */}
      {showEditModal && editingFirm && (
        <div className="modal-overlay">
          <div className="modal-content animate-in" style={{ maxWidth: '500px' }}>
             <div className="modal-header">
                <h3>Edit Business Identity</h3>
                <button className="btn-close" onClick={() => setShowEditModal(false)}><X size={20} /></button>
             </div>
             
             <form onSubmit={handleUpdateBranding}>
                <div className="form-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   
                   <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>FIRM NAME</label>
                      <input 
                        className="form-input" 
                        value={editingFirm.name || ''} 
                        onChange={e => setEditingFirm({...editingFirm, name: e.target.value})}
                      />
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>URL SLUG</label>
                        <input 
                          className="form-input" 
                          value={editingFirm.slug || ''} 
                          onChange={e => setEditingFirm({...editingFirm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>SHORT CODE</label>
                        <input 
                          className="form-input" 
                          maxLength={4}
                          value={editingFirm.shortCode || ''} 
                          onChange={e => setEditingFirm({...editingFirm, shortCode: e.target.value.toUpperCase()})}
                        />
                      </div>
                   </div>

                   <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>PRIMARY BRAND COLOR</label>
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
                            {editingFirm.brandingConfig?.primary_color === theme.color && <CheckCircle size={14} color="white" />}
                          </div>
                        ))}
                        <input 
                          type="color"
                          value={editingFirm.brandingConfig?.primary_color || '#107B88'}
                          onChange={e => setEditingFirm({
                            ...editingFirm, 
                            brandingConfig: { ...editingFirm.brandingConfig, primary_color: e.target.value }
                          })}
                          style={{ width: '32px', height: '32px', border: 'none', background: 'none' }}
                        />
                      </div>
                   </div>

                   <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>LOGIN GREETING</label>
                      <input 
                        className="form-input" 
                        value={editingFirm.brandingConfig?.login_greeting || ''} 
                        onChange={e => setEditingFirm({
                          ...editingFirm, 
                          brandingConfig: { ...editingFirm.brandingConfig, login_greeting: e.target.value }
                        })}
                      />
                   </div>

                   <div style={{ background: '#FFF9EB', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#B8922F', border: '1px solid #FFEBB8' }}>
                      <b>Warning:</b> Changing Slugs or Short Codes may impact existing links and loan numbering formats.
                   </div>
                </div>

                <div className="form-footer" style={{ padding: '20px', background: 'var(--bg-hover)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                   <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
                   <button type="submit" className="btn btn-gold" disabled={updating}>
                      {updating ? 'Saving...' : 'Apply Identity Changes'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .firms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 24px;
        }

        .firm-mgmt-card {
          padding: 24px;
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .firm-mgmt-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08);
          border-color: var(--accent-light);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .firm-initials {
          width: 48px;
          height: 48px;
          background: var(--bg-gold-light);
          color: var(--gold-dark);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 20px;
          border: 1px solid var(--gold-light);
        }

        .plan-badge {
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .plan-badge.enterprise { background: #E0F2FE; color: #0369A1; }
        .plan-badge.pro { background: #F0FDF4; color: #15803D; }
        .plan-badge.free { background: #F4F4F2; color: #666; }

        .card-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding: 16px;
          background: var(--bg-hover);
          border-radius: 12px;
        }

        .metric {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .card-footer-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }

        .mini-action {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-tertiary);
          text-decoration: none;
          padding: 6px 10px;
          border-radius: 8px;
          transition: all 0.2s;
          background: #fff;
          border: 1px solid var(--border);
        }

        .mini-action:hover {
          color: var(--accent);
          border-color: var(--accent);
          background: var(--bg-hover);
        }

        .icon-btn.mini {
          margin-left: auto;
          background: transparent;
          border: none;
          padding: 4px;
          color: var(--text-tertiary);
          cursor: pointer;
        }

        .spin { animation: rotate 1.5s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .animate-in {
          animation: slideUp 0.4s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .modal-content {
          background: #fff;
          border-radius: 20px;
          width: 100%;
          box-shadow: 0 30px 60px -12px rgba(0,0,0,0.25);
          overflow: hidden;
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .btn-close {
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
        }

        .form-input {
          width: 100%;
          padding: 10px 16px;
          border: 1px solid var(--border);
          border-radius: 10px;
          font-size: 14px;
        }

        .btn-ghost {
          background: transparent;
          border: 1px solid var(--border);
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  ArrowRight, 
  History, 
  Plus, 
  Building2, 
  Package, 
  Coins, 
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { translations, Language } from '@/lib/i18n/translations';
import { settingsStore } from '@/lib/store';
import { supabaseService } from '@/lib/supabase/service';
import { authStore } from '@/lib/authStore';
import { formatCurrency, formatDate } from '@/lib/constants';
import EliteUpgradeGate from '@/components/shared/EliteUpgradeGate';
import { PlanTier } from '@/lib/types';

export default function TransfersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<PlanTier>('free');
  const [transfers, setTransfers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fromBranchId: '',
    toBranchId: '',
    entityType: 'loan',
    entityId: '',
    amount: 0,
    weight: 0,
    remarks: ''
  });

  const auth = authStore.get();
  const settings = settingsStore.get();
  const lang: Language = (settings.language || 'en') as Language;
  const t = translations[lang];

  useEffect(() => {
    fetchInitialData();
  }, [auth.firmId]);

  const fetchInitialData = async () => {
    if (!auth.firmId) return;
    setLoading(true);
    try {
      const profile = await supabaseService.getUserProfile(auth.userId as string);
      const plan = (profile?.firms?.plan as PlanTier) || 'free';
      setCurrentPlan(plan);

      if (plan === 'elite') {
        const [history, branchList] = await Promise.all([
          supabaseService.getTransferHistory(auth.firmId),
          supabaseService.getBranches(auth.firmId)
        ]);
        setTransfers(history);
        setBranches(branchList);
      }
    } catch (err) {
      console.error('Failed to load transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fromBranchId || !formData.toBranchId) return;
    if (formData.fromBranchId === formData.toBranchId) {
      alert('Source and destination branches must be different.');
      return;
    }

    setSubmitting(true);
    try {
      await supabaseService.createTransfer({
        ...formData,
        firmId: auth.firmId,
        createdBy: auth.userId
      });
      
      setIsModalOpen(false);
      setFormData({ fromBranchId: '', toBranchId: '', entityType: 'loan', entityId: '', amount: 0, weight: 0, remarks: '' });
      fetchInitialData();
    } catch (err: any) {
      alert('Transfer failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 className="spin" size={32} />
        <p>Accessing Audit-Secure Transfer Vault...</p>
      </div>
    );
  }

  if (currentPlan !== 'elite') {
    return (
      <EliteUpgradeGate 
        featureName="Inter-Branch Asset Transfers"
        featureDescription="Securely move loans, physical gold, and financial assets between locations with full audit tracking. Required for jewelry chains with multiple branches."
      />
    );
  }

  return (
    <div className="transfers-page anim-fade-in">
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div className="page-header-left">
          <h2 style={{ fontSize: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <ArrowLeftRight className="text-primary" size={32} />
            {t.branches.transfers}
          </h2>
          <p className="subtitle" style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Elite tracking for multi-branch movements</p>
        </div>
        <div className="page-header-right">
          <button className="pv-btn pv-btn-gold" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> {t.dashboard.initiate}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
        {/* Transfer History Table */}
        <div className="flex flex-col gap-8">
          {/* Desktop Transfer History Table */}
          <div className="pv-card hidden md:block" style={{ padding: 0 }}>
            <div className="card-header" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <History size={18} className="text-primary" />
                {t.dashboard.movement}
              </h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="pv-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Source</th>
                    <th>Destination</th>
                    <th>Status</th>
                    <th>Amount/Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>
                        No transfers recorded yet.
                      </td>
                    </tr>
                  ) : transfers.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontSize: '13px' }}>{formatDate(t.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' }}>
                          {t.entityType === 'loan' && <Package size={14} className="text-primary" />}
                          {t.entityType === 'gold' && <Coins size={14} style={{ color: 'var(--gold)' }} />}
                          {t.entityType}
                        </div>
                      </td>
                      <td style={{ fontSize: '14px', fontWeight: 700 }}>{t.from?.name}</td>
                      <td style={{ fontSize: '14px', fontWeight: 700 }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <ArrowRight size={14} className="text-muted-foreground" />
                           {t.to?.name}
                         </div>
                      </td>
                      <td>
                        <span className="pv-badge" style={{ background: 'var(--status-active-bg)', color: 'var(--status-active)', fontWeight: 800 }}>
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800 }}>
                        {t.amount > 0 ? formatCurrency(t.amount) : (t.weight > 0 ? `${t.weight}g` : '-')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile View for Transfer History */}
          <div className="mobile-cards">
             {transfers.length === 0 ? (
               <div className="py-20 text-center opacity-30">
                 <History size={40} className="mx-auto mb-4" />
                 <p className="text-xs font-black uppercase tracking-widest">No Movements Recorded</p>
               </div>
             ) : transfers.map((t) => (
               <div key={t.id} className="pv-card flex flex-col gap-4 p-5 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${t.entityType === 'gold' ? 'bg-gold/10 text-gold' : 'bg-primary/10 text-primary'}`}>
                        {t.entityType === 'loan' ? <Package size={16} /> : <Coins size={16} />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{t.entityType}</span>
                    </div>
                    <span className="badge active text-[9px] font-black uppercase tracking-widest">{t.status}</span>
                  </div>

                  <div className="flex flex-col gap-3 py-2">
                     <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black uppercase opacity-30">From</span>
                           <span className="text-sm font-bold">{t.from?.name}</span>
                        </div>
                        <ArrowRight size={14} className="text-muted-foreground opacity-30" />
                        <div className="flex flex-col items-end">
                           <span className="text-[10px] font-black uppercase opacity-30">To</span>
                           <span className="text-sm font-bold">{t.to?.name}</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-border/50 pt-4 mt-2">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase opacity-40">Value/Weight</span>
                        <span className="text-sm font-black text-primary">
                          {t.amount > 0 ? formatCurrency(t.amount) : (t.weight > 0 ? `${t.weight}g` : '-')}
                        </span>
                     </div>
                     <span className="text-[10px] font-bold text-muted-foreground">{formatDate(t.createdAt)}</span>
                  </div>
               </div>
             ))}
          </div>
        </div>

        {/* Info & Guidelines */}
        <div className="flex flex-col gap-6">
          <div className="pv-card" style={{ color: 'var(--text-tertiary)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 800, color: 'var(--brand-vibrant)' }}>Elite Audit Security</h4>
            <p style={{ fontSize: '13px', opacity: 0.8, lineHeight: 1.6 }}>
              All inter-branch transfers are cryptographically logged and cannot be deleted. This ensures absolute transparency for tax audits and internal security.
            </p>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <div style={{ display: 'flex', gap: '10px', fontSize: '12px', fontWeight: 700 }}>
                  <CheckCircle2 size={16} className="text-brand-vibrant" />
                  Source Branch Inventory -
               </div>
               <div style={{ display: 'flex', gap: '10px', fontSize: '12px', fontWeight: 700 }}>
                  <CheckCircle2 size={16} className="text-brand-vibrant" />
                  Target Branch Inventory +
               </div>
            </div>
          </div>

          <div className="pv-card" style={{ borderStyle: 'dashed' }}>
             <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 800 }}>Compliance Note</h4>
             <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>
               Physical gold transfers should only be performed by authorized managers. Ensure the transport manifest is signed by both branches.
             </p>
          </div>
        </div>
      </div>

      {/* New Transfer Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="pv-card anim-fade-in" style={{ width: '100%', maxWidth: '500px', padding: 0 }}>
            <div className="modal-header" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{t.dashboard.initiate}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateTransfer}>
              <div style={{ padding: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div className="pv-input-group">
                    <label>Source Branch</label>
                    <select 
                      className="pv-input" 
                      required 
                      value={formData.fromBranchId} 
                      onChange={e => setFormData({...formData, fromBranchId: e.target.value})}
                    >
                      <option value="">Select Branch</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="pv-input-group">
                    <label>Target Branch</label>
                    <select 
                      className="pv-input" 
                      required 
                      value={formData.toBranchId} 
                      onChange={e => setFormData({...formData, toBranchId: e.target.value})}
                    >
                      <option value="">Select Branch</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="pv-input-group" style={{ marginBottom: '24px' }}>
                  <label>Asset Type</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      type="button" 
                      className={`pv-btn flex-1 ${formData.entityType === 'loan' ? 'pv-btn-gold' : 'pv-btn-outline'}`}
                      onClick={() => setFormData({...formData, entityType: 'loan', amount: 0, weight: 0})}
                    >
                      Loan Record
                    </button>
                    <button 
                      type="button" 
                      className={`pv-btn flex-1 ${formData.entityType === 'gold' ? 'pv-btn-gold' : 'pv-btn-outline'}`}
                      onClick={() => setFormData({...formData, entityType: 'gold', entityId: '', amount: 0})}
                    >
                      Physical Gold
                    </button>
                  </div>
                </div>

                {formData.entityType === 'loan' ? (
                  <div className="pv-input-group" style={{ marginBottom: '24px' }}>
                    <label>Loan Number / ID</label>
                    <input 
                      className="pv-input" 
                      placeholder="e.g., PV-2024-0412" 
                      required 
                      value={formData.entityId} 
                      onChange={e => setFormData({...formData, entityId: e.target.value})}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div className="pv-input-group">
                      <label>Gold Weight (g)</label>
                      <input 
                        type="number" 
                        step="0.001" 
                        className="pv-input" 
                        required 
                        value={formData.weight} 
                        onChange={e => setFormData({...formData, weight: parseFloat(e.target.value)})} 
                      />
                    </div>
                    <div className="pv-input-group">
                      <label>Valuation (₹)</label>
                      <input 
                        type="number" 
                        className="pv-input" 
                        required 
                        value={formData.amount} 
                        onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} 
                      />
                    </div>
                  </div>
                )}

                <div className="pv-input-group">
                  <label>Transfer Remarks / Reason</label>
                  <textarea 
                    className="pv-input" 
                    style={{ height: '80px', resize: 'none', paddingTop: '12px' }}
                    placeholder="e.g., Relocating vault stock for security maintenance..."
                    value={formData.remarks}
                    onChange={e => setFormData({...formData, remarks: e.target.value})}
                  ></textarea>
                </div>
              </div>

              <div style={{ padding: '24px 32px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="pv-btn pv-btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="pv-btn pv-btn-gold" disabled={submitting}>
                  {submitting ? <Loader2 className="spin" size={18} /> : 'Complete Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

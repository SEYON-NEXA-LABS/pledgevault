'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Search, 
  Filter, 
  LayoutGrid, 
  List as ListIcon,
  Crown,
  Info,
  Loader2,
  X
} from 'lucide-react';
import { supabaseService } from '@/lib/supabase/service';
import { authStore } from '@/lib/authStore';
import BranchCard from '@/components/branches/BranchCard';
import EliteUpgradeGate from '@/components/shared/EliteUpgradeGate';
import { PlanTier } from '@/lib/types';

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<PlanTier>('free');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [newBranch, setNewBranch] = useState({
    name: '',
    code: '',
    location: ''
  });

  const auth = authStore.get();
  const isManager = authStore.isManager() || authStore.isSuperadmin();

  useEffect(() => {
    fetchInitialData();
  }, [auth.firmId]);

  const fetchInitialData = async () => {
    if (!auth.firmId) return;
    setLoading(true);
    try {
      // 1. Check Plan
      const profile = await supabaseService.getUserProfile(auth.userId as string);
      const plan = (profile?.firms?.plan as PlanTier) || 'free';
      setCurrentPlan(plan);

      // 2. Fetch Branches (if elite or just to show what they have)
      const data = await supabaseService.getSettings(auth.firmId as string);
      if (data?.branches) {
        setBranches(data.branches);
      }
    } catch (err) {
      console.error('Failed to load branches data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name || !newBranch.code) return;

    setSubmitting(true);
    try {
      const added = await supabaseService.createBranch({
        firmId: auth.firmId || '',
        name: newBranch.name,
        code: newBranch.code.toUpperCase(),
        location: newBranch.location
      } as any);

      setBranches([...branches, added]);
      setIsModalOpen(false);
      setNewBranch({ name: '', code: '', location: '' });
    } catch (err: any) {
      alert('Failed to add branch: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBranch = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete branch "${name}"?`)) return;
    
    try {
      await supabaseService.deleteBranch(id);
      setBranches(branches.filter(b => b.id !== id));
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 className="spin" size={32} />
        <p>Loading chain management dashboard...</p>
      </div>
    );
  }

  // Elite Plan Gate
  if (currentPlan !== 'elite') {
    return (
      <EliteUpgradeGate 
        featureName="Multi-Branch Management"
        featureDescription="The dedicated Branches Dashboard is reserved for Elite partners managing large networks. Centralize your operations, track inter-branch movements, and scale your legacy."
      />
    );
  }

  return (
    <div className="branches-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>
            <Building2 className="header-icon" />
            Branch Networks
          </h2>
          <p className="subtitle">Managing {branches.length} locations across your firm</p>
        </div>
        <div className="page-header-right">
          <button className="pv-btn pv-btn-gold" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> New Branch
          </button>
        </div>
      </div>

      <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: '16px' }}>
        <div className="search-box" style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input type="text" className="pv-input" style={{ paddingLeft: '44px' }} placeholder="Search by name, code or city..." />
        </div>
        <div className="toolbar-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="pv-btn pv-btn-outline" style={{ width: '44px', padding: 0 }}><Filter size={18} /></button>
          <div className="view-toggle" style={{ display: 'flex', background: 'var(--bg-primary)', padding: '4px', borderRadius: '12px' }}>
            <button className="view-btn active" style={{ height: '36px', width: '36px', borderRadius: '8px', border: 'none', background: 'white', color: 'var(--brand-primary)', boxShadow: 'var(--shadow-sm)' }}><LayoutGrid size={18} /></button>
            <button className="view-btn" style={{ height: '36px', width: '36px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text-tertiary)' }}><ListIcon size={18} /></button>
          </div>
        </div>
      </div>

      <div className="branches-grid">
        {branches.map(branch => (
          <BranchCard 
            key={branch.id} 
            branch={branch} 
            isManager={isManager}
            onDelete={handleDeleteBranch}
          />
        ))}
      </div>

      {/* Add Branch Modal */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(26, 60, 52, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="pv-card" style={{ width: '100%', maxWidth: '500px', padding: 0, overflow: 'hidden', animation: 'fadeInScale 0.3s ease' }}>
            <div className="modal-header" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Register New Branch</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddBranch}>
              <div style={{ padding: '32px' }}>
                <div className="pv-input-group" style={{ marginBottom: '20px' }}>
                  <label>Official Branch Name</label>
                  <input 
                    className="pv-input"
                    required
                    placeholder="e.g., Coimbatore West"
                    value={newBranch.name}
                    onChange={e => setNewBranch({...newBranch, name: e.target.value})}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div className="pv-input-group">
                    <label>Branch Code (Unique)</label>
                    <input 
                      className="pv-input"
                      required
                      placeholder="e.g., CBE01"
                      maxLength={6}
                      value={newBranch.code}
                      onChange={e => setNewBranch({...newBranch, code: e.target.value})}
                    />
                  </div>
                  <div className="pv-input-group">
                    <label>Primary Location</label>
                    <input 
                      className="pv-input"
                      placeholder="City or Area"
                      value={newBranch.location}
                      onChange={e => setNewBranch({...newBranch, location: e.target.value})}
                    />
                  </div>
                </div>
                <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '16px', display: 'flex', gap: '12px', color: 'var(--brand-primary)', fontSize: '12px', marginBottom: '24px' }}>
                  <Info size={16} />
                  <span>The branch code is used as a suffix for loan numbers and financial records.</span>
                </div>
              </div>
              <div style={{ padding: '24px 32px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="pv-btn pv-btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="pv-btn pv-btn-gold" disabled={submitting}>
                  {submitting ? <Loader2 className="spin" size={18} /> : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}

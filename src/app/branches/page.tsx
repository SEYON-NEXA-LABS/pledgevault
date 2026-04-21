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
      const data = await supabaseService.getSettings();
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
          <button className="btn btn-gold btn-lg" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> New Branch
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search by name, code or city..." />
        </div>
        <div className="toolbar-actions">
          <button className="btn-icon"><Filter size={18} /></button>
          <div className="view-toggle">
            <button className="view-btn active"><LayoutGrid size={18} /></button>
            <button className="view-btn"><ListIcon size={18} /></button>
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
        <div className="modal-overlay">
          <div className="modal-card anim-slide-up">
            <div className="modal-header">
              <h3>Register New Branch</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddBranch}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Official Branch Name</label>
                  <input 
                    required
                    placeholder="e.g., Coimbatore West"
                    value={newBranch.name}
                    onChange={e => setNewBranch({...newBranch, name: e.target.value})}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Branch Code (Unique)</label>
                    <input 
                      required
                      placeholder="e.g., CBE01"
                      maxLength={6}
                      value={newBranch.code}
                      onChange={e => setNewBranch({...newBranch, code: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Primary Location</label>
                    <input 
                      placeholder="City or Area"
                      value={newBranch.location}
                      onChange={e => setNewBranch({...newBranch, location: e.target.value})}
                    />
                  </div>
                </div>
                <div className="info-box">
                  <Info size={16} />
                  <span>The branch code is used as a suffix for loan numbers and financial records.</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-teal" disabled={submitting}>
                  {submitting ? <Loader2 className="spin" size={18} /> : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .branches-page {
          padding-bottom: 60px;
        }

        .loading-state {
          height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: #9A9FA5;
        }

        .header-icon {
          margin-right: 12px;
          color: #107B88;
        }

        .toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          gap: 16px;
        }

        .search-box {
          flex: 1;
          max-width: 400px;
          background: #fff;
          border: 1px solid #E8E8E3;
          border-radius: 14px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 12px;
          color: #9A9FA5;
        }

        .search-box input {
          border: none;
          padding: 12px 0;
          width: 100%;
          outline: none;
          font-size: 14px;
          color: #1A3C34;
        }

        .toolbar-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .view-toggle {
          display: flex;
          background: #F4F4F2;
          padding: 4px;
          border-radius: 10px;
        }

        .view-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: transparent;
          color: #9A9FA5;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 8px;
        }

        .view-btn.active {
          background: #fff;
          color: #107B88;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .branches-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(26, 60, 52, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-card {
          background: #fff;
          width: 100%;
          max-width: 500px;
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 32px 64px -16px rgba(0,0,0,0.2);
        }

        .modal-header {
          padding: 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #F4F4F2;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: #1A3C34;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: #9A9FA5;
          cursor: pointer;
        }

        .modal-body {
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .modal-body label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #6F767E;
          margin-bottom: 8px;
        }

        .modal-body input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #E8E8E3;
          border-radius: 12px;
          background: #F8F8F5;
          outline: none;
          transition: border-color 0.2s;
        }

        .modal-body input:focus {
          border-color: #107B88;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .info-box {
          background: #F0FBFC;
          padding: 16px;
          border-radius: 16px;
          display: flex;
          gap: 12px;
          color: #107B88;
          font-size: 12px;
          line-height: 1.5;
        }

        .modal-footer {
          padding: 24px 32px;
          background: #F8F8F5;
          border-top: 1px solid #F4F4F2;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .anim-slide-up {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}

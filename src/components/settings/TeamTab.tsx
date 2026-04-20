'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Mail, 
  Shield, 
  User, 
  X,
  Loader2,
  AlertCircle,
  Building2
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { addStaffMemberAction, removeStaffMemberAction } from '@/app/settings/team/actions';
import { formatDate } from '@/lib/constants';
import { authStore } from '@/lib/authStore';
import { supabaseService } from '@/lib/supabase/service';

export default function TeamTab() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    branchId: '',
    role: 'staff' as 'staff' | 'manager'
  });

  const fetchTeam = async () => {
    const auth = authStore.get();
    if (!auth.firmId) return;

    setLoading(true);
    try {
      // 1. Fetch available branches for the form
      const branchData = await supabaseService.getBranches(auth.firmId);
      setBranches(branchData);

      // 2. Fetch team using modernized service
      const teamData = await supabaseService.getFirmTeam(auth.firmId);
      setTeam(teamData);
    } catch (err) {
      console.error('Error fetching team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await addStaffMemberAction(formData);
    if (result.success) {
      setShowModal(false);
      setFormData({ fullName: '', email: '', password: '', branchId: '', role: 'staff' });
      fetchTeam();
    } else {
      setError(result.error);
    }
    setSubmitting(false);
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the team?`)) return;
    
    const result = await removeStaffMemberAction(id);
    if (result.success) {
      fetchTeam();
    } else {
      alert(`Failed to remove: ${result.error}`);
    }
  };

  return (
    <div className="team-tab-content anim-fade-in">
      <div className="tab-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h3 style={{ margin: 0 }}>Team & Access</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', margin: '4px 0 0 0' }}>Manage staff accounts and permissions</p>
        </div>
        <button className="btn btn-teal" onClick={() => setShowModal(true)}>
          <UserPlus size={18} /> Add Team Member
        </button>
      </div>

      <div className="team-grid">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="member-skeleton pulse" style={{ height: '180px', background: 'var(--bg-input)', borderRadius: '24px' }} />)
        ) : (
          team.map(member => (
            <div key={member.id} className="member-card card" style={{ borderRadius: '24px' }}>
              <div className="member-top" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div className="member-avatar" style={{ 
                  width: '44px', height: '44px', 
                  background: 'var(--status-active-bg)', 
                  color: 'var(--primary-teal-dark)', 
                  borderRadius: '14px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: '800',
                  fontSize: '18px'
                }}>
                  {member.fullName?.[0] || '?'}
                </div>
                <div className={`role-badge ${member.role}`} style={{ 
                  padding: '6px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px',
                  background: member.role === 'manager' ? 'var(--sidebar-bg-dark)' : 'var(--bg-primary)',
                  color: member.role === 'manager' ? 'var(--primary-brand)' : 'var(--text-tertiary)',
                  border: `1px solid ${member.role === 'manager' ? 'var(--primary-brand)' : 'var(--border-light)'}`
                }}>
                   {member.role === 'manager' ? <Shield size={12} /> : <User size={12} />}
                   {member.role === 'manager' ? 'MANAGER' : 'STAFF'}
                </div>
              </div>
              
              <div className="member-info">
                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '800' }}>{member.fullName}</h4>
                {member.email ? (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={14} style={{ opacity: 0.7 }} /> {member.email}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={14} style={{ opacity: 0.4 }} /> Email hidden for privacy
                  </div>
                )}
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)', padding: '6px 10px', borderRadius: '8px', width: 'fit-content' }}>
                  <Building2 size={13} style={{ color: 'var(--primary-brand)' }} /> {member.branches?.name || 'Firm Overview'}
                </div>
              </div>

              <div className="member-footer" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                {member.role !== 'manager' ? (
                  <button 
                    className="btn-text-danger" 
                    style={{ background: 'transparent', border: 'none', color: '#ff4d4f', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: 0 }}
                    onClick={() => handleRemove(member.id, member.fullName)}
                  >
                    <Trash2 size={14} /> Remove Member
                  </button>
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600' }}>Primary Account Holder</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '440px', borderRadius: '32px', padding: '32px' }}>
            <div className="modal-header" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '800' }}>Add Team Member</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddMember}>
              <div className="modal-body" style={{ gap: '20px', display: 'flex', flexDirection: 'column' }}>
                {error && <div className="alert error" style={{ borderRadius: '14px' }}>{error}</div>}
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} style={{ borderRadius: '12px' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ borderRadius: '12px' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ borderRadius: '12px' }} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} style={{ borderRadius: '12px' }}>
                      <option value="staff">Staff Member</option>
                      <option value="manager">Lead Manager</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Branch Access</label>
                    <select className="form-input" value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} style={{ borderRadius: '12px' }}>
                      <option value="">Global Overview</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: '32px', gap: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-teal" disabled={submitting}>
                  {submitting ? <Loader2 className="spin" size={18} /> : 'Invite Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        .member-skeleton {
          background: var(--bg-input);
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}

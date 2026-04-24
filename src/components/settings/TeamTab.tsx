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
  Building2,
  Eye,
  Edit2,
  Power,
  CheckCircle2,
  MoreVertical
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { addStaffMemberAction, removeStaffMemberAction } from '@/app/settings/team/actions';
import { formatDate } from '@/lib/constants';
import { authStore } from '@/lib/authStore';
import { supabaseService } from '@/lib/supabase/service';

export default function TeamTab() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [viewingMember, setViewingMember] = useState<any | null>(null);
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
      const branchData = await supabaseService.getBranches(auth.firmId);
      setBranches(branchData);
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
      setShowAddModal(false);
      setFormData({ fullName: '', email: '', password: '', branchId: '', role: 'staff' });
      fetchTeam();
    } else {
      setError(result.error);
    }
    setSubmitting(false);
  };

  const handleToggleStatus = async (member: any) => {
    try {
      const newStatus = !member.isActive;
      await supabaseService.updateMemberStatus(member.id, newStatus);
      setTeam(prev => prev.map(m => m.id === member.id ? { ...m, isActive: newStatus } : m));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setSubmitting(true);
    try {
      await supabaseService.updateMemberProfile(editingMember.id, {
        full_name: editingMember.fullName,
        role: editingMember.role,
        default_branch_id: editingMember.defaultBranchId || null
      });
      setEditingMember(null);
      fetchTeam();
    } catch (err) {
      alert('Failed to update member');
    } finally {
      setSubmitting(false);
    }
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
    <div className="anim-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Team & Access</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', margin: '4px 0 0 0', fontWeight: 600 }}>Manage staff accounts and permissions</p>
        </div>
        <button className="pv-btn pv-btn-gold" onClick={() => setShowAddModal(true)}>
          <UserPlus size={18} /> Add Team Member
        </button>
      </div>

      <div className="pv-card" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="pv-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Branch</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3].map(i => (
                  <tr key={i}><td colSpan={5}><div className="skeleton pulse" style={{ height: '40px', margin: '10px 0' }} /></td></tr>
                ))
              ) : team.map(member => (
                <tr key={member.id} style={{ opacity: member.isActive === false ? 0.6 : 1 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '36px', height: '36px', 
                        background: member.isActive === false ? 'var(--bg-input)' : 'var(--status-active-bg)', 
                        color: member.isActive === false ? 'var(--text-tertiary)' : 'var(--primary-teal-dark)', 
                        borderRadius: '10px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontWeight: '800', fontSize: '14px'
                      }}>
                        {member.fullName?.[0] || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>{member.fullName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{member.email || 'No email'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={`pv-badge`} style={{ 
                      background: member.role === 'manager' ? 'var(--brand-deep)' : 'var(--bg-primary)',
                      color: member.role === 'manager' ? 'var(--gold)' : 'var(--text-tertiary)',
                      fontWeight: 800
                    }}>
                       {member.role === 'manager' ? <Shield size={10} /> : <User size={10} />}
                       {member.role.toUpperCase()}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={13} style={{ color: 'var(--primary-brand)' }} />
                      {member.branches?.name || 'All Branches'}
                    </div>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleToggleStatus(member)}
                      className="pv-badge"
                      style={{
                        background: member.isActive === false ? 'var(--status-overdue-bg)' : 'var(--status-active-bg)',
                        color: member.isActive === false ? 'var(--status-overdue)' : 'var(--status-active)',
                        cursor: 'pointer',
                        border: 'none',
                        fontWeight: 800
                      }}
                    >
                      <Power size={12} />
                      {member.isActive === false ? 'DISABLED' : 'ACTIVE'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button className="pv-btn pv-btn-outline pv-btn-sm" onClick={() => setViewingMember(member)} title="View Details"><Eye size={16} /></button>
                      <button className="pv-btn pv-btn-outline pv-btn-sm" onClick={() => setEditingMember(member)} title="Edit Member"><Edit2 size={16} /></button>
                      {member.role !== 'manager' && (
                        <button className="pv-btn pv-btn-outline pv-btn-sm" style={{ color: 'var(--status-overdue)', borderColor: 'var(--status-overdue)' }} onClick={() => handleRemove(member.id, member.fullName)} title="Remove"><Trash2 size={16} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="pv-card" style={{ maxWidth: '440px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '800' }}>Add Team Member</h3>
              <button style={{ background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddMember}>
              <div style={{ gap: '20px', display: 'flex', flexDirection: 'column' }}>
                {error && <div className="pv-badge" style={{ background: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', width: '100%', justifyContent: 'center', padding: '12px' }}>{error}</div>}
                <div className="pv-input-group">
                  <label>Full Name</label>
                  <input className="pv-input" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div className="pv-input-group">
                  <label>Email Address</label>
                  <input className="pv-input" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="pv-input-group">
                  <label>Password</label>
                  <input className="pv-input" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="pv-input-group">
                    <label>Role</label>
                    <select className="pv-input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                      <option value="staff">Staff Member</option>
                      <option value="manager">Lead Manager</option>
                    </select>
                  </div>
                  <div className="pv-input-group">
                    <label>Branch Access</label>
                    <select className="pv-input" value={formData.branchId || ''} onChange={e => setFormData({...formData, branchId: e.target.value})}>
                      <option value="">Global Overview</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="pv-btn pv-btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="pv-btn pv-btn-gold" disabled={submitting}>
                  {submitting ? <Loader2 className="spin" size={18} /> : 'Invite Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '440px', borderRadius: '32px', padding: '32px' }}>
            <div className="modal-header" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '800' }}>Edit Member</h3>
              <button className="btn-icon" onClick={() => setEditingMember(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateMember}>
              <div style={{ gap: '20px', display: 'flex', flexDirection: 'column' }}>
                <div className="pv-input-group">
                  <label>Full Name</label>
                  <input 
                    className="pv-input" 
                    required 
                    value={editingMember.fullName} 
                    onChange={e => setEditingMember({...editingMember, fullName: e.target.value})} 
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="pv-input-group">
                    <label>Role</label>
                    <select 
                      className="pv-input" 
                      value={editingMember.role || ''} 
                      onChange={e => setEditingMember({...editingMember, role: e.target.value as any})} 
                    >
                      <option value="staff">Staff Member</option>
                      <option value="manager">Lead Manager</option>
                    </select>
                  </div>
                  <div className="pv-input-group">
                    <label>Branch Access</label>
                    <select 
                      className="pv-input" 
                      value={editingMember.defaultBranchId || ''} 
                      onChange={e => setEditingMember({...editingMember, defaultBranchId: e.target.value})} 
                    >
                      <option value="">Global Overview</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="pv-btn pv-btn-outline" onClick={() => setEditingMember(null)}>Cancel</button>
                <button type="submit" className="pv-btn pv-btn-gold" disabled={submitting}>
                  {submitting ? <Loader2 className="spin" size={18} /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Member Modal */}
      {viewingMember && (
        <div className="modal-overlay">
          <div className="pv-card" style={{ maxWidth: '440px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '800' }}>Member Profile</h3>
              <button style={{ background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => setViewingMember(null)}><X size={20} /></button>
            </div>
            <div style={{ gap: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ 
                  width: '64px', height: '64px', borderRadius: '20px', 
                  background: 'var(--status-active-bg)', color: 'var(--status-active)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: '24px', fontWeight: '800' 
                }}>
                  {viewingMember.fullName?.[0]}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{viewingMember.fullName}</h4>
                  <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '14px', fontWeight: 600 }}>{viewingMember.email}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                 <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                   <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase' }}>Role</div>
                   <div style={{ fontSize: '14px', fontWeight: 800, textTransform: 'capitalize' }}>{viewingMember.role}</div>
                 </div>
                 <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                   <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase' }}>Member Since</div>
                   <div style={{ fontSize: '14px', fontWeight: 800 }}>{formatDate(viewingMember.createdAt)}</div>
                 </div>
                 <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '16px', gridColumn: 'span 2', border: '1px solid var(--border)' }}>
                   <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase' }}>Assigned Branch</div>
                   <div style={{ fontSize: '14px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <Building2 size={16} style={{ color: 'var(--brand-primary)' }} />
                     {viewingMember.branches?.name || 'All Branches'}
                   </div>
                 </div>
              </div>
            </div>
            <div style={{ marginTop: '32px' }}>
              <button className="pv-btn pv-btn-gold" style={{ width: '100%' }} onClick={() => setViewingMember(null)}>Close Profile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

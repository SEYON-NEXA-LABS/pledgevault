'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Mail, 
  Shield, 
  User, 
  ChevronRight, 
  X,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { addStaffMemberAction, removeStaffMemberAction } from './actions';
import { formatDate } from '@/lib/constants';

export default function TeamSettingsPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });

  const fetchTeam = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('role', { ascending: true }); // Admin first
    
    setTeam(data || []);
    setLoading(false);
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
      setFormData({ fullName: '', email: '', password: '' });
      fetchTeam();
    } else {
      setError(result.error);
    }
    setSubmitting(false);
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the team? They will lose access immediately.`)) return;
    
    const result = await removeStaffMemberAction(id);
    if (result.success) {
      fetchTeam();
    } else {
      alert(`Failed to remove: ${result.error}`);
    }
  };

  return (
    <div className="team-container">
      <div className="team-header">
        <div>
          <h1>Team Management</h1>
          <p>Manage staff accounts and permissions for your branch</p>
        </div>
        <button className="btn btn-gold" onClick={() => setShowModal(true)}>
          <UserPlus size={18} /> Add Team Member
        </button>
      </div>

      <div className="team-grid">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="member-skeleton" />)
        ) : (
          team.map(member => (
            <div key={member.id} className="member-card">
              <div className="member-top">
                <div className="member-avatar">
                  {member.full_name[0]}
                </div>
                <div className={`role-badge ${member.role}`}>
                  {member.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                  {member.role.toUpperCase()}
                </div>
              </div>
              
              <div className="member-info">
                <h3>{member.full_name}</h3>
                <div className="member-email">
                  <Mail size={14} /> {member.email || 'No email provided'}
                </div>
                <div className="member-date">Joined {formatDate(member.created_at)}</div>
              </div>

              <div className="member-footer">
                {member.role !== 'admin' && (
                  <button className="remove-btn" onClick={() => handleRemove(member.id, member.full_name)}>
                    <Trash2 size={16} /> Remove Member
                  </button>
                )}
                {member.role === 'admin' && <span className="admin-notice">Primary Account</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Member Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Staff Member</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            
            <form className="modal-form" onSubmit={handleAddMember}>
              {error && <div className="error-pill"><AlertCircle size={16} /> {error}</div>}
              
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  className="form-input"
                  placeholder="Employee Name"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input 
                  className="form-input"
                  type="email"
                  placeholder="staff@shop.com"
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Login Password</label>
                <input 
                  className="form-input"
                  type="password"
                  placeholder="Min 8 characters"
                  required
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-gold" disabled={submitting}>
                  {submitting ? <Loader2 className="spin" /> : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .team-container {
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .team-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }

        .team-header h1 {
          font-size: 28px;
          color: #1A3C34;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }

        .team-header p {
          color: #6F767E;
          font-size: 15px;
        }

        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .member-card {
          background: #fff;
          border: 1px solid #E8E8E3;
          border-radius: 20px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .member-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.05);
        }

        .member-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .member-avatar {
          width: 48px;
          height: 48px;
          background: #F4F4F2;
          color: #1A3C34;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 800;
        }

        .role-badge {
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .role-badge.admin { background: #1A3C34; color: var(--gold); }
        .role-badge.staff { background: #F4F4F2; color: #6F767E; }

        .member-info h3 {
          margin: 0 0 8px;
          font-size: 18px;
          color: #1A3C34;
        }

        .member-email {
          color: #6F767E;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .member-date {
          color: #9A9FA5;
          font-size: 12px;
        }

        .member-footer {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #F4F4F2;
        }

        .remove-btn {
          width: 100%;
          background: transparent;
          border: 1px solid #FEF2F2;
          color: #DC2626;
          padding: 10px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .remove-btn:hover {
          background: #FEF2F2;
        }

        .admin-notice {
          display: block;
          text-align: center;
          color: #9A9FA5;
          font-size: 12px;
          font-style: italic;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          width: 100%;
          max-width: 440px;
          background: #fff;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .error-pill {
          padding: 12px;
          background: #FEF2F2;
          color: #DC2626;
          border-radius: 12px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .member-skeleton {
          height: 200px;
          background: #F4F4F2;
          border-radius: 20px;
          animation: pulse 1.5s infinite linear;
        }

        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }

        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

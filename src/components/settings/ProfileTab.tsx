'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Key, 
  Shield, 
  Building2, 
  Save, 
  Loader2, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { authStore } from '@/lib/authStore';
import { supabaseService } from '@/lib/supabase/service';

export default function ProfileTab() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      const auth = authStore.get();
      if (!auth.userId) return;

      try {
        const data = await supabaseService.getUserProfile(auth.userId);
        if (data) {
          setProfile(data);
          setFullName(data.fullName || '');
        }
      } catch (err) {
        console.error('Profile fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await supabaseService.updateUserProfile(profile.id, { full_name: fullName });
      setMessage({ type: 'success', text: 'Profile details updated!' });
      
      // Update local storage name
      const current = authStore.get();
      authStore.set({ ...current, userName: fullName });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Security credentials updated!' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <Loader2 className="spin" size={32} color="var(--primary-brand)" />
        <p style={{ marginTop: '16px', color: 'var(--text-tertiary)' }}>Syncing profile data...</p>
      </div>
    );
  }

  return (
    <div className="profile-tab-content anim-fade-in">
      <div className="tab-section-header" style={{ marginBottom: '32px' }}>
        <h3 style={{ margin: 0 }}>Personal Profile</h3>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', margin: '4px 0 0 0' }}>Manage your identity and security settings</p>
      </div>

      <div className="profile-grid">
        {/* Profile Info */}
        <div className="card" style={{ borderRadius: '24px' }}>
          <div className="card-header">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-primary)' }}>
              <User size={20} style={{ color: 'var(--primary-teal-dark)' }} />
              Account Identity
            </h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  style={{ borderRadius: '12px' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Access (Private)</label>
                <div style={{ padding: '12px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '12px', fontSize: '14px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mail size={14} style={{ opacity: 0.6 }} /> {profile?.email}
                </div>
              </div>
              
              <div className="info-box" style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '16px', marginTop: '24px', border: '1px solid var(--border-light)' }}>
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Account Permission</span>
                  <span className={`badge ${profile?.role}`} style={{ 
                    fontSize: '10px', fontWeight: '900', padding: '4px 8px', borderRadius: '6px',
                    background: profile?.role === 'manager' ? 'var(--sidebar-bg-dark)' : 'var(--bg-hover)',
                    color: profile?.role === 'manager' ? 'var(--primary-brand)' : 'var(--text-tertiary)'
                  }}>
                    {profile?.role?.toUpperCase()}
                  </span>
                </div>
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Organization</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary-teal-dark)' }}>{profile?.firms?.name}</span>
                </div>
              </div>

              <button type="submit" className="btn btn-teal" style={{ width: '100%', marginTop: '32px' }} disabled={saving}>
                {saving ? <Loader2 className="spin" size={18} /> : <><Save size={18} /> Update Profile</>}
              </button>
            </form>
          </div>
        </div>

        {/* Security / Password */}
        <div className="card" style={{ borderRadius: '24px' }}>
          <div className="card-header">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-primary)' }}>
              <Shield size={20} style={{ color: 'var(--primary-teal-dark)' }} />
              Security & Credentials
            </h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="At least 6 characters" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  minLength={6}
                  style={{ borderRadius: '12px' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Re-type New Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  style={{ borderRadius: '12px' }}
                />
              </div>

              {message && (
                <div className={`alert ${message.type}`} style={{ padding: '14px', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
                  {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  {message.text}
                </div>
              )}

              <button type="submit" className="btn btn-outline-teal" style={{ width: '100%', marginTop: '32px' }} disabled={saving || !newPassword}>
                <Key size={18} /> Regenerate Password
              </button>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        .profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }
      `}</style>
    </div>
  );
}

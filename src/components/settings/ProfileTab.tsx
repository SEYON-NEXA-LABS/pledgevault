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
  AlertCircle,
  LogOut
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { authStore } from '@/lib/authStore';
import { supabaseService } from '@/lib/supabase/service';
import { useRouter } from 'next/navigation';

export default function ProfileTab() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

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
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <Loader2 className="spin" size={32} style={{ color: 'var(--brand-primary)' }} />
        <p style={{ marginTop: '16px', color: 'var(--text-tertiary)', fontWeight: 700 }}>Syncing profile data...</p>
      </div>
    );
  }

  return (
    <div className="anim-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Personal Profile</h3>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', margin: '4px 0 0 0', fontWeight: 600 }}>Manage your identity and security settings</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Profile Info */}
        <div className="pv-card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-primary)', fontSize: '16px', fontWeight: 800 }}>
              <User size={20} style={{ color: 'var(--brand-primary)' }} />
              Account Identity
            </h4>
          </div>
          <div style={{ padding: '24px' }}>
            <form onSubmit={handleUpdateProfile}>
              <div className="pv-input-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  className="pv-input" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                />
              </div>
              <div className="pv-input-group">
                <label>Email Access (Private)</label>
                <div style={{ padding: '12px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '14px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                  <Mail size={14} style={{ opacity: 0.6 }} /> {profile?.email}
                </div>
              </div>
              
              <div style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '16px', marginTop: '24px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Account Role</span>
                  <span className={`pv-badge`} style={{ 
                    background: profile?.role === 'manager' ? 'var(--brand-deep)' : 'var(--bg-hover)',
                    color: profile?.role === 'manager' ? 'var(--gold)' : 'var(--text-tertiary)',
                    fontWeight: 800
                  }}>
                    {profile?.role?.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Organization</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--brand-primary)' }}>{profile?.firms?.name}</span>
                </div>
              </div>

              <button type="submit" className="pv-btn pv-btn-primary" style={{ width: '100%', marginTop: '32px' }} disabled={saving}>
                {saving ? <Loader2 className="spin" size={18} /> : <><Save size={18} /> Update Profile</>}
              </button>
            </form>
          </div>
        </div>

        {/* Security / Password */}
        <div className="pv-card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-primary)', fontSize: '16px', fontWeight: 800 }}>
              <Shield size={20} style={{ color: 'var(--brand-primary)' }} />
              Security & Credentials
            </h4>
          </div>
          <div style={{ padding: '24px' }}>
            <form onSubmit={handleChangePassword}>
              <div className="pv-input-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  className="pv-input" 
                  placeholder="At least 6 characters" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  minLength={6}
                />
              </div>
              <div className="pv-input-group">
                <label>Re-type New Password</label>
                <input 
                  type="password" 
                  className="pv-input" 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>

              {message && (
                <div className="pv-badge" style={{ 
                  width: '100%', 
                  marginTop: '20px', 
                  padding: '12px', 
                  background: message.type === 'success' ? 'var(--status-active-bg)' : 'var(--status-overdue-bg)',
                  color: message.type === 'success' ? 'var(--status-active)' : 'var(--status-overdue)',
                  justifyContent: 'center',
                  fontWeight: 800
                }}>
                  {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  {message.text}
                </div>
              )}

              <button type="submit" className="pv-btn pv-btn-outline" style={{ width: '100%', marginTop: '32px' }} disabled={saving || !newPassword}>
                <Key size={18} /> Regenerate Password
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="pv-card" style={{ marginTop: '40px', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--status-overdue)' }}>Sign Out</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>End your current session securely</p>
          </div>
          <button onClick={handleSignOut} className="pv-btn pv-btn-outline" style={{ color: 'var(--status-overdue)', borderColor: 'var(--status-overdue)', background: 'transparent' }}>
            <LogOut size={18} className="flex-shrink-0" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

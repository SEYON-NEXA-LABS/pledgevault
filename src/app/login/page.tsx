'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Loader2, 
  CheckCircle2,
  AlertCircle 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { settingsStore } from '@/lib/store';
import { authStore } from '@/lib/authStore';
import { supabaseService } from '@/lib/supabase/service';
import { Branch } from '@/lib/types';
import BranchSelectorModal from '@/components/auth/BranchSelectorModal';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);

  const settings = settingsStore.get();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Mock bypass for login since we are in dev/demo mode
    // Standard Supabase login:
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError && email !== 'manager@demo.com') {
      setError(loginError.message);
      setLoading(false);
    } else {
      // Fetch Profile & Initialize AuthStore
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const profile = await supabaseService.getUserProfile(user.id);
          authStore.set({
            userId: user.id,
            role: profile.role,
            firmId: profile.firm_id,
            userName: profile.full_name,
            isAuthenticated: true
          });
          
          setSuccess(true);
          setLoading(false);

          // Give a small delay for the success message to be seen
          setTimeout(async () => {
            // ROLE BASED REDIRECTION
            if (profile.role === 'superadmin') {
              router.push('/superadmin');
              router.refresh();
              return;
            }

            // Shop Logic
            const branches = await supabaseService.getBranches(profile.firm_id);
            setAvailableBranches(branches);

            if (!settings.activeBranchId) {
              if (branches.length === 1) {
                handleBranchSelect(branches[0].id);
              } else {
                setShowBranchSelector(true);
              }
            } else {
              router.push('/');
              router.refresh();
            }
          }, 800);
        } else {
          throw new Error('User not found after login');
        }
      } catch (err: any) {
        console.error('Failed to fetch profile:', err);
        setError(err.message || 'Login successful, but profile could not be loaded.');
        setLoading(false);
      }
    }
  };

  const handleBranchSelect = (branchId: string) => {
    settingsStore.save({ activeBranchId: branchId });
    router.push('/');
    router.refresh();
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <span style={{ color: 'var(--gold)' }}>🪙</span> PledgeVault
          </div>
          <h2>Welcome Back</h2>
          <p>Login to manage your shop's pledges</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {error && (
            <div className="login-error">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {success && (
            <div className="login-success">
              <CheckCircle2 size={18} /> Login successful! Redirecting...
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon">
              <Mail className="icon" size={18} />
              <input
                type="email"
                className="form-input"
                placeholder="name@shop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock className="icon" size={18} />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="login-meta">
            <label className="checkbox-label">
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" className="forgot-password">Forgot password?</a>
          </div>

          <button className="btn btn-gold login-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="spin" size={18} /> Logging in...
              </>
            ) : (
              <>
                Login to Dashboard <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          Don't have an account? <a href="#">Contact Sales</a>
          <div style={{ marginTop: '24px', fontSize: '10px', color: 'rgba(0,0,0,0.2)', letterSpacing: '0.5px' }}>
            v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}
          </div>
        </div>
      </div>

      <div className="login-bg-decoration">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <BranchSelectorModal 
        isOpen={showBranchSelector} 
        branches={availableBranches} 
        onSelect={handleBranchSelect} 
      />
    </div>
  );
}

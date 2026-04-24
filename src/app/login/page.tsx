'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Gem,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Monitor,
  Smartphone,
  LockKeyhole,
  Sparkles,
  Trophy
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { settingsStore } from '@/lib/store';
import { authStore } from '@/lib/authStore';
import { supabaseService } from '@/lib/supabase/service';
import { Branch } from '@/lib/types';
import BranchSelectorModal from '@/components/auth/BranchSelectorModal';
import { translations, Language } from '@/lib/i18n/translations';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [branding, setBranding] = useState<{name: string, greeting: string}>({
    name: translations.en.common.pledgevault,
    greeting: translations.en.login.greeting
  });
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  useEffect(() => {
    const fetchBranding = async () => {
      const params = new URLSearchParams(window.location.search);
      const shopSlug = params.get('shop');
      if (shopSlug) {
        const data = await supabaseService.getFirmBranding(shopSlug);
        if (data) {
          setBranding({ name: data.name, greeting: data.branding.loginGreeting || 'Welcome Back' });
          if (data.branding.primaryColor) {
            document.documentElement.style.setProperty('--primary-brand', data.branding.primaryColor);
            document.documentElement.style.setProperty('--primary-hover', data.branding.primaryColor + 'e6');
          }
        }
      }
    };
    fetchBranding();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
    } else {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const profile = await supabaseService.getUserProfile(user.id);
          authStore.set({
            userId: user.id,
            role: profile.role,
            firmId: profile.firmId,
            userName: profile.fullName,
            email: user.email,
            isAuthenticated: true
          });
          
          setSuccess(true);
          setLoading(false);

          setTimeout(async () => {
            if (profile.role === 'superadmin') {
              router.push('/superadmin');
              return;
            }

            const branches = await supabaseService.getBranches(profile.firmId);
            setAvailableBranches(branches);

            if (profile.role === 'manager' || profile.role === 'admin') {
              settingsStore.save({ activeBranchId: 'firm' });
              router.push('/');
              return;
            }

            if (profile.role === 'staff' && profile.defaultBranchId) {
              settingsStore.save({ activeBranchId: profile.defaultBranchId });
              router.push('/');
              return;
            }

            if (branches.length === 1) {
              handleBranchSelect(branches[0].id);
            } else if (branches.length > 1) {
              setShowBranchSelector(true);
            } else {
              router.push('/');
            }
          }, 800);
        }
      } catch (err: any) {
        setError(err.message || 'Login successful, but profile could not be loaded.');
        setLoading(false);
      }
    }
  };

  const handleDevLogin = async (role: 'manager' | 'staff') => {
    const creds = {
      manager: { email: 'admin@yourfirm.com', pass: 'password123' },
      staff: { email: 'staff@yourfirm.com', pass: 'password123' }
    };
    
    setEmail(creds[role].email);
    setPassword(creds[role].pass);
    
    // Small delay to show the values being filled before submitting
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    }, 100);
  };

  const handleBranchSelect = (branchId: string) => {
    settingsStore.save({ activeBranchId: branchId });
    router.push('/');
  };

  return (
    <div className="login-screen">
      <div className="login-card-dual anim-in">
        <div className="login-pane-brand">
          <div className="brand-zone">
            <div className="brand-logo-large">
               <span className="logo-spark">✨</span>
               <div className="logo-circle">🪙</div>
            </div>
            <div className="brand-info">
               <h1 className="logo-name-large">{branding.name}</h1>
               <p className="logo-tagline">{t.common.secureVault}</p>
            </div>
          </div>
          {/* Abstract Background Shapes */}
          <div className="abstract-shape shape-1" />
          <div className="abstract-shape shape-2" />
        </div>

        <div className="login-pane-form">
          <div className="right-header">
             <div className="lang-switcher-top">
                <button 
                  type="button" 
                  className={lang === 'en' ? 'active' : ''} 
                  onClick={() => setLang('en')}
                >
                  EN
                </button>
                <button 
                  type="button" 
                  className={`lang-ta ${lang === 'ta' ? 'active' : ''}`} 
                  onClick={() => setLang('ta')}
                >
                  தமிழ்
                </button>
             </div>
             <div className={`header-text ${lang === 'ta' ? 'lang-ta' : ''}`}>
                <h2>{lang === 'en' ? branding.greeting : t.login.greeting}</h2>
                <p>{t.login.subtitle}</p>
             </div>
          </div>

          <form onSubmit={handleLogin} className={`login-form-modern ${lang === 'ta' ? 'lang-ta' : ''}`}>
            {error && (
              <div className="alert-modern error">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert-modern success">
                <CheckCircle2 size={14} />
                <span>{t.login.authenticating}</span>
              </div>
            )}

            <div className="pv-input-group">
               <div className="input-icon-label">
                  <Mail size={16} />
                  <label>{t.login.emailLabel}</label>
               </div>
               <input 
                className="pv-input input-modern-underline"
                type="email" 
                placeholder={t.login.emailPlaceholder} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
               />
            </div>

            <div className="pv-input-group">
               <div className="input-icon-label">
                  <LockKeyhole size={16} />
                  <label>{t.login.passwordLabel}</label>
               </div>
               <input 
                className="pv-input input-modern-underline"
                type="password" 
                placeholder={t.login.passwordPlaceholder} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
               />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => alert('Password reset will be sent to your registered email address.')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand-primary)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {t.login.forgotPassword}
              </button>
            </div>

            <button className="pv-btn pv-btn-primary" style={{ width: '100%', height: '56px', marginTop: '24px', borderRadius: 'var(--radius-md)', fontSize: '15px' }} disabled={loading}>
              {loading ? (
                <Loader2 className="spin" size={20} />
              ) : (
                <>
                  {t.login.button} <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Start Trial CTA */}
          <div style={{
            marginTop: '32px',
            padding: '20px 24px',
            background: 'var(--brand-soft)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {t.login.newUser}
              </span>
            </div>
            <Link
              href="/start-trial"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--brand-primary)',
                fontSize: '13px',
                fontWeight: 800,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {t.login.startTrial} <ArrowRight size={14} />
            </Link>
          </div>
          <footer style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
             <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700' }}>
                <span>© 2026 {t.common.pledgevault}</span>
                <span>•</span>
                <span>v3.5.2</span>
             </div>
          </footer>

          {process.env.NODE_ENV === 'development' && (
            <div className="dev-login-zone">
              <div className="dev-title">
                <Sparkles size={10} /> <span>Dev Shortcuts</span>
              </div>
              <div className="dev-btns">
                <button type="button" onClick={() => handleDevLogin('manager')} className="dev-btn manager">
                  <ShieldCheck size={12} /> Manager
                </button>
                <button type="button" onClick={() => handleDevLogin('staff')} className="dev-btn staff">
                  <Monitor size={12} /> Staff
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <BranchSelectorModal 
        isOpen={showBranchSelector} 
        branches={availableBranches} 
        onSelect={handleBranchSelect} 
      />
    </div>
  );
}

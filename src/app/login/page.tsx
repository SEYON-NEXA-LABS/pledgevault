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
  Trophy,
  Download,
  Zap,
  Building2,
  HandCoins,
  Shield
} from 'lucide-react';
import InstallButton from '@/components/pwa/InstallButton';
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

            if (profile.role === 'admin') {
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

  const handleDevLogin = async (role: 'admin' | 'staff') => {
    const creds = {
      admin: { email: 'admin@yourfirm.com', pass: 'password123' },
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
        <div className="login-pane-brand relative overflow-hidden flex flex-col justify-between p-12">
          {/* Animated Background Gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-emerald-900" />
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gold/20 blur-[100px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white/10 blur-[80px]" />
          
          <div className="brand-zone relative z-10">
            <div className="brand-logo-large mb-8">
               <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl overflow-hidden">
                 <img src="/android-chrome-192x192.png" alt="Logo" className="w-12 h-12 object-contain" />
               </div>
               <div className="flex flex-col">
                 <h1 className="logo-name-large text-4xl">{branding.name}</h1>
                 <p className="logo-tagline text-white/60 tracking-[0.3em] font-bold text-[10px] uppercase">
                   {t.common.secureVault}
                 </p>
               </div>
            </div>
            
            <div className="space-y-8 max-w-sm">
               <div className="flex items-start gap-4 text-white/90">
                 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 shadow-lg">
                   <ShieldCheck size={22} className="text-gold" />
                 </div>
                 <div className="flex flex-col gap-1">
                   <h3 className="text-sm font-bold text-white tracking-tight">Audit-Ready Compliance</h3>
                   <p className="text-[12px] text-white/60 leading-relaxed font-medium">
                     Enterprise-grade security with immutable audit trails for every transaction and pledge.
                   </p>
                 </div>
               </div>

               <div className="flex items-start gap-4 text-white/90">
                 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 shadow-lg">
                   <Zap size={22} className="text-gold" />
                 </div>
                 <div className="flex flex-col gap-1">
                   <h3 className="text-sm font-bold text-white tracking-tight">Precision Appraisal</h3>
                   <p className="text-[12px] text-white/60 leading-relaxed font-medium">
                     Real-time Gold & Silver rate synchronization ensuring accurate valuations and minimized risk.
                   </p>
                 </div>
               </div>

               <div className="flex items-start gap-4 text-white/90">
                 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 shadow-lg">
                   <Building2 size={22} className="text-gold" />
                 </div>
                 <div className="flex flex-col gap-1">
                   <h3 className="text-sm font-bold text-white tracking-tight">Multi-Branch Command</h3>
                   <p className="text-[12px] text-white/60 leading-relaxed font-medium">
                     Centralized management for multiple branches with unified reporting and inter-branch transfers.
                   </p>
                 </div>
               </div>

               <div className="flex items-start gap-4 text-white/90">
                 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 shadow-lg">
                   <HandCoins size={22} className="text-gold" />
                 </div>
                 <div className="flex flex-col gap-1">
                   <h3 className="text-sm font-bold text-white tracking-tight">Lifecycle Loan Management</h3>
                   <p className="text-[12px] text-white/60 leading-relaxed font-medium">
                     End-to-end tracking from instant payout to automated interest accrual and overdue notifications.
                   </p>
                 </div>
               </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col gap-6">
             <InstallButton variant="full" className="w-fit" />
             {/* <div className="flex items-center gap-4 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                <span>Certified Financial Platform</span>
                <span>•</span>
                <span>ISO 27001</span>
             </div> */}
          </div>
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
                <span className="font-mono lowercase opacity-60">Build: {process.env.NEXT_PUBLIC_APP_VERSION || 'dev'}</span>
             </div>
          </footer>

          {process.env.NODE_ENV === 'development' && (
            <div className="dev-login-zone">
              <div className="dev-title">
                <Sparkles size={10} /> <span>Dev Shortcuts</span>
              </div>
              <div className="dev-btns">
                <button type="button" onClick={() => handleDevLogin('admin')} className="dev-btn admin">
                  <Shield size={16} /> Admin Login
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

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
  Shield,
  Eye,
  EyeOff
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
  const [showPassword, setShowPassword] = useState(false);
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
  const [shopQuery, setShopQuery] = useState('');
  const t = translations[lang];

  useEffect(() => {
    const fetchBranding = async () => {
      const params = new URLSearchParams(window.location.search);
      const demoRole = params.get('demo');
      if (demoRole === 'admin' || demoRole === 'staff') {
        setEmail(demoRole === 'admin' ? 'admin@yourfirm.com' : 'staff@yourfirm.com');
        setPassword('password123');
      }

      const shopSlug = params.get('shop');
      if (shopSlug) {
        setShopQuery(`?shop=${shopSlug}`);
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
              settingsStore.save({ activeBranchId: 'firm' }, true);
              router.push('/');
              return;
            }

            if (profile.role === 'staff' && profile.defaultBranchId) {
              settingsStore.save({ activeBranchId: profile.defaultBranchId }, true);
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
    settingsStore.save({ activeBranchId: branchId }, true);
    router.push('/');
  };

  return (
    <div className="login-screen">
      <div className="login-card-dual anim-in">
        <div className="login-pane-brand relative flex flex-col justify-between p-16">
          {/* Animated Background Gradients */}
          <div className="absolute inset-0 bg-linear-to-br from-primary via-primary to-emerald-950" />

          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gold/20 blur-[120px] animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-white/5 blur-[100px]" />

          
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
            
            <div className="space-y-6 max-w-md my-auto">
               <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xl">
                 <h2 className="text-2xl font-black text-white mb-2 leading-tight">Digital Gold & Silver Pawn Management</h2>
                 <p className="text-white/80 text-sm font-medium leading-relaxed mb-6">
                   Modernize your shop with offline-first pledge tracking, automated interest engines, thermal receipt printing, and live MCX market rate sync.
                 </p>
                 <Link 
                   href="/home" 
                   className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 transition-all shadow-md shadow-gold/20"
                 >
                   Explore Full Project Overview <ArrowRight size={14} />
                 </Link>
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

        <div className="login-pane-form no-scrollbar">

          {/* Decorative Background Elements */}
          <div className="login-form-blob blob-1" />
          <div className="login-form-blob blob-2" />

          <div className="mx-auto w-full max-w-[440px] flex flex-col justify-center flex-1 py-4 md:py-8">
            {/* Mobile Brand Presence (visible only on small screens) */}
            <div className="mobile-brand-header lg:hidden">
               <div className="mobile-logo-wrap">
                  <img src="/android-chrome-192x192.png" alt="Logo" />
               </div>
               <div className="flex flex-col">
                  <h1 className="mobile-brand-name">{branding.name}</h1>
                  <p className="mobile-tagline">{t.common.secureVault}</p>
               </div>
            </div>

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

          <form onSubmit={handleLogin} className={`login-form-modern ${lang === 'ta' ? 'lang-ta' : ''}`} style={{ gap: '16px' }}>

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
               <div className="relative flex items-center">
                 <input 
                  className="pv-input input-modern-underline w-full pr-10"
                  type={showPassword ? "text" : "password"} 
                  placeholder={t.login.passwordPlaceholder} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                 />
                 <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-hidden p-1 rounded-md"
                  tabIndex={-1}
                 >
                   {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                 </button>
               </div>
            </div>

             <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
               <Link
                 href={`/forgot-password${shopQuery}`}
                 style={{
                   color: 'var(--brand-primary)',
                   fontSize: '12px',
                   fontWeight: 700,
                   textDecoration: 'none',
                   opacity: loading ? 0.5 : 1,
                   pointerEvents: loading ? 'none' : 'auto'
                 }}
               >
                 {t.login.forgotPassword}
               </Link>
             </div>

            <button className="pv-btn pv-btn-primary" style={{ width: '100%', height: '60px', marginTop: '32px', borderRadius: 'var(--radius-md)', fontSize: '16px' }} disabled={loading}>
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
          <div className="login-cta-box">
            <div className="login-cta-text">
              <span className="cta-label">{t.login.newUser}</span>
              <span className="cta-main">Ready to modernize your firm?</span>
            </div>
            <Link href="/start-trial" className="cta-link">
              {t.login.startTrial} <ArrowRight size={16} />
            </Link>
          </div>

          <footer style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
             <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', flexWrap: 'wrap' }}>
                <span>© 2026 <a href="https://nvisionsystems.in" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>NVision Systems Pvt Ltd.</a></span>
                <span>•</span>
                <span className="font-mono lowercase opacity-60">
                   {process.env.NEXT_PUBLIC_APP_VERSION || (process.env.NODE_ENV === 'development' ? 'dev' : '')}
                </span>
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
    </div>


      <BranchSelectorModal 
        isOpen={showBranchSelector} 
        branches={availableBranches} 
        onSelect={handleBranchSelect} 
      />
    </div>
  );
}

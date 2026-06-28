'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  LockKeyhole, 
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Zap,
  Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseService } from '@/lib/supabase/service';
import { translations, Language } from '@/lib/i18n/translations';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  const [branding, setBranding] = useState({
    name: translations.en.common.pledgevault,
  });

  useEffect(() => {
    const fetchBranding = async () => {
      const params = new URLSearchParams(window.location.search);
      const shopSlug = params.get('shop');
      if (shopSlug) {
        const data = await supabaseService.getFirmBranding(shopSlug);
        if (data) {
          setBranding({ name: data.name });
          if (data.branding.primaryColor) {
            document.documentElement.style.setProperty('--primary-brand', data.branding.primaryColor);
            document.documentElement.style.setProperty('--primary-hover', data.branding.primaryColor + 'e6');
          }
        }
      }
    };
    fetchBranding();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError(lang === 'en' ? 'Please enter a new password.' : 'தயவுசெய்து புதிய கடவுச்சொல்லை உள்ளிடவும்.');
      return;
    }
    if (password !== confirmPassword) {
      setError(lang === 'en' ? 'Passwords do not match.' : 'கடவுச்சொற்கள் பொருந்தவில்லை.');
      return;
    }
    if (password.length < 6) {
      setError(lang === 'en' ? 'Password must be at least 6 characters.' : 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);

        // Sign out current temp session for clean slate
        await supabase.auth.signOut();
        
        // Premium redirect back to login
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card-dual anim-in">
        
        {/* Left branding pane */}
        <div className="login-pane-brand relative flex flex-col justify-between p-16">
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
            
            <div className="space-y-10 max-w-md">
               {[
                 { icon: <ShieldCheck size={26} />, title: "Cryptographic Protection", desc: "Your session token is cryptographically verified to authenticate this reset request in real-time." },
                 { icon: <Zap size={26} />, title: "Immediate Account Lockout", desc: "Updating your credentials terminates all other active sessions across your platform for security." }
               ].map((feature, i) => (
                 <div key={i} className="flex items-start gap-5 text-white group cursor-default">
                   <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 shadow-2xl transition-all group-hover:bg-white/20 group-hover:scale-110">
                     <span className="text-gold">{feature.icon}</span>
                   </div>
                   <div className="flex flex-col gap-1.5">
                     <h3 className="text-base font-bold text-white tracking-tight">{feature.title}</h3>
                     <p className="text-[13px] text-white/60 leading-relaxed font-medium">
                       {feature.desc}
                     </p>
                   </div>
                 </div>
               ))}
            </div>
          </div>

          <div className="relative z-10 text-white/40 text-[10px] font-bold uppercase tracking-widest">
            <span>Platform Security Standards Enforced</span>
          </div>
        </div>

        {/* Right form pane */}
        <div className="login-pane-form no-scrollbar">
          <div className="login-form-blob blob-1" />
          <div className="login-form-blob blob-2" />

          <div className="mx-auto w-full max-w-[440px] flex flex-col justify-center flex-1 py-4 md:py-8">
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
                <h2>{lang === 'en' ? 'Reset Password' : 'கடவுச்சொல்லை மீட்டமை'}</h2>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 600, marginTop: '4px' }}>
                  {lang === 'en' 
                    ? "Establish new secure credentials for your vault workspace below." 
                    : "கீழே உங்கள் பணிமனைக்கான புதிய பாதுகாப்பான கடவுச்சொல்லை அமைக்கவும்."}
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className={`login-form-modern ${lang === 'ta' ? 'lang-ta' : ''}`} style={{ gap: '20px' }}>
              {error && (
                <div className="alert-modern error animate-shake">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              {success ? (
                <div className="alert-modern success py-6 flex flex-col items-center text-center gap-3 anim-fade-in" style={{ borderRadius: '16px' }}>
                  <CheckCircle2 size={36} className="text-emerald-500 animate-bounce" />
                  <div className="font-extrabold text-sm text-emerald-800">
                    {lang === 'en' ? 'Password Safely Reset!' : 'கடவுச்சொல் மாற்றப்பட்டது!'}
                  </div>
                  <p className="text-xs font-bold text-emerald-700/80 leading-relaxed px-4">
                    {lang === 'en' 
                      ? "Your security credentials have been updated in the cloud. Redirecting to portal..." 
                      : "மின்னஞ்சல் பாதுகாப்பு கடவுச்சொல் வெற்றிகரமாக மாற்றப்பட்டது. பக்கத்திற்கு மாற்றப்படுகிறது..."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="pv-input-group">
                     <div className="input-icon-label">
                        <LockKeyhole size={16} />
                        <label>{lang === 'en' ? 'New Password' : 'புதிய கடவுச்சொல்'}</label>
                     </div>
                     <input 
                      className="pv-input input-modern-underline"
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                     />
                  </div>

                  <div className="pv-input-group">
                     <div className="input-icon-label">
                        <LockKeyhole size={16} />
                        <label>{lang === 'en' ? 'Confirm New Password' : 'புதிய கடவுச்சொல்லை உறுதிசெய்'}</label>
                     </div>
                     <input 
                      className="pv-input input-modern-underline"
                      type="password" 
                      placeholder="••••••••" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                     />
                  </div>

                  <button className="pv-btn pv-btn-primary" style={{ width: '100%', height: '60px', marginTop: '20px', borderRadius: 'var(--radius-md)', fontSize: '16px' }} disabled={loading}>
                    {loading ? (
                      <Loader2 className="spin" size={20} />
                    ) : (
                      <>
                        {lang === 'en' ? 'Update Credentials' : 'கடவுச்சொல்லை மாற்று'} <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                <Link
                  href="/login"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--text-tertiary)',
                    fontSize: '13px',
                    fontWeight: 800,
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    textTransform: 'uppercase',
                    tracking: '0.05em'
                  } as any}
                  className="hover:text-primary"
                >
                  <ArrowLeft size={16} /> {lang === 'en' ? 'Back to Login' : 'உள்நுழைய திரும்பவும்'}
                </Link>
              </div>
            </form>

            <footer style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
               <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', flexWrap: 'wrap' }}>
                  <span>© 2026 {t.common.pledgevault}</span>
                  <span>•</span>
                  <span>A Product of <a href="https://nvisionsystems.in" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>nVision Systems</a></span>
                  <span>•</span>
                  <span className="font-mono lowercase opacity-60">
                     {process.env.NEXT_PUBLIC_APP_VERSION || (process.env.NODE_ENV === 'development' ? 'dev' : '')}
                  </span>
               </div>
            </footer>
          </div>
        </div>

      </div>
    </div>
  );
}

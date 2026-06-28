'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  LockKeyhole, 
  Mail, 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Building2,
  HandCoins,
  Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseService } from '@/lib/supabase/service';
import { translations, Language } from '@/lib/i18n/translations';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError(lang === 'en' ? 'Please enter your email address first.' : 'தயவுசெய்து உங்கள் மின்னஞ்சல் முகவரியை உள்ளிடவும்.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
        
        // Premium redirect delay back to login page
        setTimeout(() => {
          router.push('/login');
        }, 3500);
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
                 { icon: <ShieldCheck size={26} />, title: "Secure Cryptographic Signatures", desc: "Every reset link carries unique high-security tokens that expire immediately upon use or timeout." },
                 { icon: <Zap size={26} />, title: "Instant Link Delivery", desc: "Platform delivery pipelines trigger SMS and Email routes within milliseconds for secure credential recovery." }
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
            <span>Enterprise Security Protocols Verified</span>
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
                <h2>{lang === 'en' ? 'Password Recovery' : 'கடவுச்சொல் மீட்பு'}</h2>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 600, marginTop: '4px' }}>
                  {lang === 'en' 
                    ? "Enter your email address and we'll send you a secure link to reset your password." 
                    : "உங்கள் மின்னஞ்சல் முகவரியை உள்ளிடவும், கடவுச்சொல்லை மீட்டமைப்பதற்கான இணைப்பை அனுப்புவோம்."}
                </p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className={`login-form-modern ${lang === 'ta' ? 'lang-ta' : ''}`} style={{ gap: '20px' }}>
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
                    {lang === 'en' ? 'Recovery Email Transmitted!' : 'மீட்பு மின்னஞ்சல் அனுப்பப்பட்டது!'}
                  </div>
                  <p className="text-xs font-bold text-emerald-700/80 leading-relaxed px-4">
                    {lang === 'en' 
                      ? "A cryptographic reset link has been dispatched to your email address. Redirecting to workspace gate..." 
                      : "கடவுச்சொல்லை மாற்றுவதற்கான பாதுகாப்பு இணைப்பு அனுப்பப்பட்டுள்ளது. பக்கத்திற்கு மாற்றப்படுகிறது..."}
                  </p>
                </div>
              ) : (
                <>
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

                  <button className="pv-btn pv-btn-primary" style={{ width: '100%', height: '60px', marginTop: '20px', borderRadius: 'var(--radius-md)', fontSize: '16px' }} disabled={loading}>
                    {loading ? (
                      <Loader2 className="spin" size={20} />
                    ) : (
                      <>
                        {lang === 'en' ? 'Send Recovery Link' : 'மீட்பு இணைப்பை அனுப்புக'} <ArrowRight size={18} />
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

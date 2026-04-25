'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, 
  UserPlus, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Gem,
  Sparkles,
  Lock,
  Mail,
  Globe,
  Phone
} from 'lucide-react';
import { registerTrialAction } from './actions';
import { supabase } from '@/lib/supabase/client';
import { authStore } from '@/lib/authStore';
import { supabaseService } from '@/lib/supabase/service';
import { settingsStore } from '@/lib/store';

export default function StartTrial() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    fullName: '',
    email: '',
    password: '',
    phone: ''
  });

  const handleRegister = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    const res: any = await registerTrialAction(formData);

    if (res.success) {
      // AUTO LOGIN LOGIC
      try {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (loginError) throw loginError;

        // Initialize Auth Store
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
          
          settingsStore.save({ activeBranchId: 'firm' });
          
          // Redirect to Dashboard
          setStep(3); // Success Step
          setTimeout(() => {
            window.location.href = '/'; // Hard redirect to ensure clean state with new session
          }, 2000);
        }
      } catch (err: any) {
        console.error('Auto-login failed:', err);
        setError('Acccount created, but login failed. Please go to the login page.');
      } finally {
        setLoading(false);
      }
    } else {
      setError(res.error || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="trial-container">
      <div className="trial-decoration">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div className="trial-card">
        {/* Progress Bar */}
        <div className="trial-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            {step > 1 ? <CheckCircle size={16} /> : '1'}
          </div>
          <div className={`progress-line ${step > 1 ? 'filled' : ''}`} />
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            {step > 2 ? <CheckCircle size={16} /> : '2'}
          </div>
          <div className={`progress-line ${step > 2 ? 'filled' : ''}`} />
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            {step >= 3 ? <Sparkles size={16} /> : '3'}
          </div>
        </div>

        <div className="trial-header">
          <div className="trial-badge">
            <Gem size={14} />
            <span>30-Day Elite Trial</span>
          </div>
          <h1>{step === 1 ? 'Tell us about your shop' : step === 2 ? 'Create your owner account' : 'Welcome to the inner circle!'}</h1>
          <p>
            {step === 1 ? 'Let\'s set the foundation for your digital jewel vault.' : 
             step === 2 ? 'You will be the primary administrator of this firm.' : 
             'Initializing your secure environment...'}
          </p>
        </div>

        {error && (
          <div className="trial-error">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {step === 1 && (
          <div className="step-view">
            <div className="form-group">
              <label>Business Name</label>
              <div className="input-box">
                <Building2 size={18} className="emerald-icon" />
                <input 
                  placeholder="e.g., Diamond & Gold Plaza" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Location (City / Area)</label>
              <div className="input-box">
                <Globe size={18} className="emerald-icon" />
                <input 
                  placeholder="e.g., T. Nagar, Chennai" 
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Business Phone Number</label>
              <div className="input-box">
                <Phone size={18} className="emerald-icon" />
                <input 
                  placeholder="e.g., +91 98765 43210" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <button className="pv-btn btn-gold btn-full" onClick={() => formData.name && formData.phone && setStep(2)}>
              Next: Owner Details <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="step-view">
            <div className="form-group">
              <label>Your Full Name</label>
              <div className="input-box">
                <UserPlus size={18} className="emerald-icon" />
                <input 
                  placeholder="Admin / Owner Name" 
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-box">
                <Mail size={18} className="emerald-icon" />
                <input 
                  type="email"
                  placeholder="name@business.com" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Create Password</label>
              <div className="input-box">
                <Lock size={18} className="emerald-icon" />
                <input 
                  type="password"
                  placeholder="Minimum 8 characters" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <div className="trial-actions">
              <button className="pv-btn pv-btn-ghost" onClick={() => setStep(1)}>Back</button>
              <button className="pv-btn btn-gold" onClick={handleRegister} disabled={loading}>
                {loading ? <><Loader2 className="spin" size={18} /> Setting up...</> : <>Start My Free Trial <ArrowRight size={18} /></>}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-view success-view">
            <div className="success-icon">
              <Sparkles size={48} className="sparkle-anim" />
            </div>
            <h2>Registration Successful</h2>
            <p>Your 30-day Elite Trial has been initialized. You are being redirected to your dashboard.</p>
            <div className="loading-dots">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        )}

        <div className="trial-footer">
          <div>
            Already have an account? <Link href="/login">Login here</Link>
          </div>
          <div className="trial-version">
            Build ID: {process.env.NEXT_PUBLIC_APP_VERSION || 'dev'}
          </div>
        </div>
      </div>

      <style jsx>{`
        .trial-container {
          min-height: 100vh;
          background: #0D2621;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
          font-family: 'Outfit', sans-serif;
        }

        .trial-decoration {
          position: absolute;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
        }

        .blob {
          position: absolute;
          filter: blur(100px);
          opacity: 0.25;
          border-radius: 50%;
          animation: float 20s infinite ease-in-out;
        }

        .blob-1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, #107B88 0%, transparent 70%);
          top: -200px;
          right: -100px;
        }

        .blob-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #D4AF37 0%, transparent 70%);
          bottom: -150px;
          left: -100px;
          animation-delay: -5s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -30px) scale(1.05); }
        }

        .trial-card {
          background: #ffffff;
          width: 100%;
          max-width: 480px;
          border-radius: 40px;
          padding: 60px 48px;
          box-shadow: 0 40px 120px rgba(0,0,0,0.5);
          position: relative;
          z-index: 1;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .trial-progress {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 48px;
        }

        .progress-step {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #f0f0f0;
          color: #999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid transparent;
        }

        .progress-line.filled {
          background: #107B88;
        }

        .progress-step.active {
          background: #107B88;
          color: #D4AF37;
          box-shadow: 0 0 25px rgba(16, 123, 136, 0.3);
          transform: scale(1.15);
          border-color: #D4AF37;
        }

        .progress-line {
          width: 40px;
          height: 3px;
          background: #f0f0f0;
          border-radius: 3px;
        }

        .trial-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #0D2621;
          color: #D4AF37;
          padding: 10px 20px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 24px;
          border: 1px solid rgba(212, 175, 55, 0.3);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }

        .trial-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .trial-header h1 {
          font-size: 36px;
          font-weight: 900;
          background: linear-gradient(135deg, #0D2621 0%, #107B88 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 12px;
          letter-spacing: -1.5px;
          line-height: 1.1;
        }

        .trial-header p {
          color: #6F767E;
          font-size: 16px;
          line-height: 1.6;
          font-weight: 500;
        }

        .form-group {
          margin-bottom: 28px;
        }

        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #0D2621;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.8;
        }

        .input-box {
          position: relative;
          display: flex;
          align-items: center;
          background: #F8F8F6;
          border-radius: 16px;
          padding: 0 18px;
          border: 2px solid transparent;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: #4A6670;
        }

        .input-box:hover {
          background: #F1F1EE;
        }

        .input-box:focus-within {
          border-color: #D4AF37;
          background: #fff;
          box-shadow: 0 10px 30px rgba(212, 175, 55, 0.15);
          transform: translateY(-2px);
        }

        .emerald-icon {
          color: #107B88;
          filter: drop-shadow(0 2px 4px rgba(16, 123, 136, 0.1));
        }

        .input-box input {
          width: 100%;
          height: 54px;
          background: none;
          border: none;
          outline: none;
          font-size: 16px;
          padding-left: 14px;
          color: #0D2621;
          font-weight: 600;
        }

        .trial-actions {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 16px;
          margin-top: 40px;
        }

        .btn-gold {
          background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%) !important;
          color: #ffffff !important;
          border: none !important;
          font-weight: 800 !important;
          letter-spacing: 0.5px;
          box-shadow: 0 8px 25px rgba(212, 175, 55, 0.4);
        }

        .btn-gold:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 12px 30px rgba(212, 175, 55, 0.5);
        }

        .btn-gold:active {
          transform: translateY(0) scale(0.98);
        }

        .btn-full {
          width: 100%;
          margin-top: 8px;
        }

        .trial-footer {
          margin-top: 48px;
          padding-top: 32px;
          border-top: 1px solid #f0f0f0;
          text-align: center;
          font-size: 15px;
          color: #6F767E;
          font-weight: 500;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }

        .trial-version {
          font-size: 10px;
          font-weight: 700;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: var(--font-mono);
        }

        .trial-footer a {
          color: #107B88;
          font-weight: 800;
          text-decoration: none;
          margin-left: 4px;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .trial-footer a:hover {
          border-bottom-color: #107B88;
        }

        .trial-error {
          background: #FFF5F5;
          color: #E53E3E;
          padding: 16px 20px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
          border: 1px solid rgba(229, 62, 62, 0.1);
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }

        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        .success-view {
          text-align: center;
          padding: 40px 0;
        }

        .success-icon {
          color: #D4AF37;
          margin-bottom: 32px;
          filter: drop-shadow(0 10px 20px rgba(212, 175, 55, 0.3));
        }

        .sparkle-anim {
          animation: bounce 2s infinite ease-in-out;
        }

        @keyframes bounce {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.2) rotate(15deg); }
        }

        .loading-dots span {
          animation: dotFade 1.4s infinite;
          opacity: 0;
          font-size: 48px;
          color: #D4AF37;
          margin: 0 4px;
        }

        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes dotFade {
          0%, 100% { opacity: 0.2; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-10px); }
        }

        .spin {
          animation: rotate 1s linear infinite;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

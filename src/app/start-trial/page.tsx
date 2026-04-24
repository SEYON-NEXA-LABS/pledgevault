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
  Globe
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
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className="progress-line" />
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className="progress-line" />
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
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
                <Building2 size={18} />
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
                <Globe size={18} />
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
                <Phone size={18} />
                <input 
                  placeholder="e.g., +91 98765 43210" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <button className="btn btn-gold btn-full" onClick={() => formData.name && formData.phone && setStep(2)}>
              Next: Owner Details <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="step-view">
            <div className="form-group">
              <label>Your Full Name</label>
              <div className="input-box">
                <UserPlus size={18} />
                <input 
                  placeholder="Manager / Owner Name" 
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-box">
                <Mail size={18} />
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
                <Lock size={18} />
                <input 
                  type="password"
                  placeholder="Minimum 8 characters" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <div className="trial-actions">
              <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-gold" onClick={handleRegister} disabled={loading}>
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
          Already have an account? <Link href="/login">Login here</Link>
        </div>
      </div>

      <style jsx>{`
        .trial-container {
          min-height: 100vh;
          background: #0D2621;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
          font-family: 'Outfit', sans-serif;
        }

        .trial-decoration {
          position: absolute;
          width: 100%;
          height: 100%;
          z-index: 0;
        }

        .blob {
          position: absolute;
          filter: blur(80px);
          opacity: 0.2;
          border-radius: 50%;
        }

        .blob-1 {
          width: 500px;
          height: 500px;
          background: #107B88;
          top: -100px;
          right: -100px;
        }

        .blob-2 {
          width: 400px;
          height: 400px;
          background: #D4AF37;
          bottom: -100px;
          left: -100px;
        }

        .trial-card {
          background: #ffffff;
          width: 100%;
          max-width: 500px;
          border-radius: 32px;
          padding: 50px 40px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.4);
          position: relative;
          z-index: 1;
        }

        .trial-progress {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 40px;
        }

        .progress-step {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #f0f0f0;
          color: #999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          transition: all 0.3s ease;
        }

        .progress-step.active {
          background: #D4AF37;
          color: #fff;
          box-shadow: 0 4px 10px rgba(212, 175, 55, 0.3);
        }

        .progress-line {
          width: 40px;
          height: 2px;
          background: #f0f0f0;
        }

        .trial-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(212, 175, 55, 0.1);
          color: #B8860B;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 24px;
        }

        .trial-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .trial-header h1 {
          font-size: 28px;
          font-weight: 800;
          color: #1A3C34;
          margin-bottom: 12px;
          letter-spacing: -0.5px;
        }

        .trial-header p {
          color: #6F767E;
          font-size: 15px;
          line-height: 1.5;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #1A3C34;
          margin-bottom: 8px;
        }

        .input-box {
          position: relative;
          display: flex;
          align-items: center;
          background: #F4F4F2;
          border-radius: 12px;
          padding: 0 16px;
          border: 1px solid transparent;
          transition: all 0.3s ease;
          color: #4A6670;
        }

        .input-box:focus-within {
          border-color: #107B88;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(16, 123, 136, 0.1);
        }

        .input-box input {
          width: 100%;
          height: 48px;
          background: none;
          border: none;
          outline: none;
          font-size: 15px;
          padding-left: 12px;
          color: #1A3C34;
        }

        .trial-actions {
          display: grid;
          grid-template-columns: 100px 1fr;
          gap: 12px;
          margin-top: 32px;
        }

        .btn-full {
          width: 100%;
          margin-top: 24px;
        }

        .trial-footer {
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid #f0f0f0;
          text-align: center;
          font-size: 14px;
          color: #6F767E;
        }

        .trial-footer a {
          color: #107B88;
          font-weight: 700;
          text-decoration: none;
        }

        .trial-error {
          background: #FEF2F2;
          color: #DC2626;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }

        .success-view {
          text-align: center;
          padding: 20px 0;
        }

        .success-icon {
          color: #D4AF37;
          margin-bottom: 24px;
        }

        .sparkle-anim {
          animation: bounce 2s infinite ease-in-out;
        }

        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .loading-dots span {
          animation: dotFade 1.4s infinite;
          opacity: 0;
          font-size: 32px;
          color: #D4AF37;
        }

        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes dotFade {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
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

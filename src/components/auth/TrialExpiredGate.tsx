'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Lock, CreditCard, ChevronRight, LogOut, ShieldAlert } from 'lucide-react';
import { subscriptionStore } from '@/lib/subscriptionStore';
import { authStore } from '@/lib/authStore';
import { supabase } from '@/lib/supabase/client';

export default function TrialExpiredGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [subscription, setSubscription] = useState(subscriptionStore.get());

  useEffect(() => {
    setMounted(true);
    const handleUpdate = () => setSubscription(subscriptionStore.get());
    window.addEventListener('pv_subscription_updated', handleUpdate);
    return () => window.removeEventListener('pv_subscription_updated', handleUpdate);
  }, []);

  if (!mounted) return <>{children}</>;

  const auth = authStore.get();
  const isSuperadmin = auth.role === 'superadmin';
  const isExpired = subscriptionStore.isExpired();
  
  // Exemptions
  const isExemptRoute = 
    pathname === '/login' || 
    pathname === '/start-trial' ||
    pathname.startsWith('/settings');

  const shouldBlock = isExpired && !isSuperadmin && !isExemptRoute;

  if (!shouldBlock) {
    return <>{children}</>;
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="trial-gate-overlay">
      <div className="gate-container anim-pop-in">
        <div className="gate-header">
          <div className="gate-icon">
            <Lock size={32} />
          </div>
          <div className="gate-badge">TRIAL ENDED</div>
        </div>

        <h1 className="gate-title">Access Restricted</h1>
        <p className="gate-message">
          Your 30-day Elite Trial has expired. To continue managing your loans, branches, and customers, please upgrade to a production plan.
        </p>

        <div className="gate-stats">
          <div className="stat-item">
            <span className="stat-value">Elite</span>
            <span className="stat-label">Previous Plan</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">0 Days</span>
            <span className="stat-label">Remaining</span>
          </div>
        </div>

        <div className="gate-actions">
          <button 
            onClick={() => router.push('/settings?tab=subscription')}
            className="btn-premium"
          >
            <CreditCard size={18} />
            <span>Select a Plan & Reactivate</span>
            <ChevronRight size={18} />
          </button>
          
          <button onClick={handleSignOut} className="btn-secondary">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="gate-footer">
          <ShieldAlert size={14} />
          <span>Your data is safe and will be accessible immediately after reactivation.</span>
        </div>
      </div>

      <style jsx>{`
        .trial-gate-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(13, 18, 17, 0.95);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: 'Outfit', sans-serif;
        }

        .gate-container {
          background: #1A2221;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-top: 4px solid #107B88;
          border-radius: 32px;
          padding: 48px;
          max-width: 480px;
          width: 100%;
          text-align: center;
          box-shadow: 0 40px 100px -20px rgba(0,0,0,0.5);
        }

        .gate-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
        }

        .gate-icon {
          width: 72px;
          height: 72px;
          background: rgba(16, 123, 136, 0.1);
          color: #107B88;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 24px;
          border: 1px solid rgba(16, 123, 136, 0.2);
        }

        .gate-badge {
          background: #991b1b;
          color: white;
          font-size: 10px;
          font-weight: 900;
          padding: 4px 12px;
          border-radius: 100px;
          letter-spacing: 1px;
        }

        .gate-title {
          font-family: 'AudioWide', cursive;
          font-size: 28px;
          color: white;
          margin: 0 0 16px 0;
        }

        .gate-message {
          color: #94a3b8;
          font-size: 15px;
          line-height: 1.6;
          margin: 0 0 32px 0;
        }

        .gate-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 20px;
          padding: 16px;
          margin-bottom: 40px;
        }

        .stat-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-value {
          color: white;
          font-size: 18px;
          font-weight: 700;
        }

        .stat-label {
          color: #64748b;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-divider {
          width: 1px;
          height: 32px;
          background: rgba(255,255,255,0.1);
          margin: 0 24px;
        }

        .gate-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 32px;
        }

        .btn-premium {
          background: linear-gradient(135deg, #107B88 0%, #1FB7C6 100%);
          color: white;
          border: none;
          padding: 16px 24px;
          border-radius: 16px;
          font-size: 15px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 10px 20px -5px rgba(16, 123, 136, 0.4);
        }

        .btn-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px -5px rgba(16, 123, 136, 0.5);
        }

        .btn-secondary {
          background: transparent;
          color: #94a3b8;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 12px;
          border-radius: 12px;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }

        .gate-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 11px;
          color: #64748b;
          line-height: 1.4;
        }

        .anim-pop-in {
          animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Clock, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { subscriptionStore } from '@/lib/subscriptionStore';
import { authStore } from '@/lib/authStore';

export default function TrialBanner() {
  const [mounted, setMounted] = useState(false);
  const [subscription, setSubscription] = useState(subscriptionStore.get());
  
  useEffect(() => {
    setMounted(true);
    
    const handleUpdate = () => {
      setSubscription(subscriptionStore.get());
    };
    
    window.addEventListener('pv_subscription_updated', handleUpdate);
    return () => window.removeEventListener('pv_subscription_updated', handleUpdate);
  }, []);

  if (!mounted) return null;

  const isActiveStaff = authStore.isStaff();
  const isManager = authStore.isManager();
  const daysLeft = subscriptionStore.getDaysRemaining();
  const isTrial = subscriptionStore.isTrial();
  const isExpired = subscriptionStore.isExpired();

  // Show to all roles if it's a trial or recently expired
  if (!isTrial && !isExpired) return null;

  return (
    <div className={`trial-banner ${isExpired ? 'expired' : daysLeft <= 3 ? 'urgent' : ''}`}>
      <div className="banner-content">
        <div className="banner-text">
          {isExpired ? (
            <>
              <Clock size={16} className="shake" />
              <span><strong>Trial Expired.</strong> {isManager ? 'Renew access to continue record management.' : 'Contact your manager to renew access.'}</span>
            </>
          ) : (
            <>
              <Sparkles size={16} className="sparkle" />
              <span><strong>{daysLeft} Days Remaining</strong> in {isActiveStaff ? "your shop's" : "your"} 14-Day Elite Trial.</span>
            </>
          )}
        </div>
        
        {isManager && (
          <Link href="/settings?tab=subscription" className="banner-cta">
            <Zap size={14} />
            {isExpired ? 'Renew Subscription' : 'Upgrade to Pro'}
            <ArrowRight size={14} />
          </Link>
        )}
      </div>

      <style jsx>{`
        .trial-banner {
          background: linear-gradient(90deg, #107B88 0%, #1FB7C6 100%);
          color: white;
          padding: 8px 16px;
          position: relative;
          z-index: 100;
          font-family: 'Outfit', sans-serif;
          animation: slideDown 0.5s ease;
        }

        .trial-banner.urgent {
          background: linear-gradient(90deg, #B8860B 0%, #D4AF37 100%);
        }

        .trial-banner.expired {
          background: linear-gradient(90deg, #991b1b 0%, #ef4444 100%);
        }

        .banner-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
        }

        .banner-text {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
        }

        .banner-cta {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(4px);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          transition: all 0.2s;
        }

        .banner-cta:hover {
          background: white;
          color: #107B88;
        }

        .trial-banner.urgent .banner-cta:hover {
          color: #B8860B;
        }

        .trial-banner.expired .banner-cta:hover {
          color: #991b1b;
        }

        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }

        .sparkle {
          animation: pulse 2s infinite;
        }

        .shake {
          animation: shake 0.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }

        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }

        @media (max-width: 768px) {
          .banner-content {
            flex-direction: column;
            gap: 8px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

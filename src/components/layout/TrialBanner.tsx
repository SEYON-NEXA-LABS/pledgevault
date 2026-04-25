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
  const isAdmin = authStore.isAdmin();
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
              <span><strong>TRIAL EXPIRED.</strong> {isAdmin ? 'Renew access to continue record management.' : 'Contact your administrator to renew access.'}</span>
            </>
          ) : (
            <>
              <Sparkles size={16} className="animate-pulse" />
              <span><strong>{daysLeft} DAYS REMAINING</strong> in {isActiveStaff ? "your shop's" : "your"} 30-Day Elite Trial.</span>
            </>
          )}
        </div>
        
        {isAdmin && (
          <Link href="/settings?tab=subscription" className="banner-cta">
            <Zap size={12} />
            {isExpired ? 'Renew Now' : 'Upgrade to Pro'}
            <ArrowRight size={12} />
          </Link>
        )}
      </div>
    </div>
  );
}

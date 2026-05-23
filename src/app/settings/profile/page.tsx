'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function RedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const reset = searchParams.get('reset');
    const target = reset === 'true' ? '/settings?tab=profile&reset=true' : '/settings?tab=profile';
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      background: 'var(--bg-primary)', 
      color: 'var(--text-secondary)', 
      gap: '16px'
    }}>
      <Loader2 className="spin" size={32} style={{ color: 'var(--brand-primary)' }} />
      <span style={{ fontSize: '14px', fontWeight: 800, uppercase: true, tracking: '0.1em' } as any}>
        Redirecting to Profile Settings...
      </span>
    </div>
  );
}

export default function SettingsProfileRedirectPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Loader2 className="spin" size={32} style={{ color: 'var(--brand-primary)' }} />
      </div>
    }>
      <RedirectHandler />
    </Suspense>
  );
}

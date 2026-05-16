'use client';

import { useEffect } from 'react';
import { offlineStore } from '@/lib/offlineStore';

export default function PWARegistration() {
  useEffect(() => {
    // Clean up old cached rates (older than 7 days)
    offlineStore.clearOldRates(168).catch(err => 
      console.warn('Failed to cleanup old rates:', err)
    );

    if ('serviceWorker' in navigator) {
      // 1. Handle Controller Change (Reload when new SW takes over)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      // 2. Register Service Worker with Version Injection
      const register = () => {
        const version = process.env.NEXT_PUBLIC_APP_VERSION || Date.now().toString();
        navigator.serviceWorker
          .register(`/sw.js?v=${version}`)
          .then((registration) => {
            console.log(`PledgeVault SW [${version}] registered: `, registration.scope);
            
            // Trigger cache cleanup
            if (registration.active) {
              registration.active.postMessage({ type: 'CLEANUP_CACHE' });
            }
            
            // Check for updates every 1 hour
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000);

            // Listen for service worker updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('New PledgeVault SW available, will activate on next visit');
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.log('PledgeVault SW failed: ', err);
          });
      };

      if (document.readyState === 'complete') {
        register();
      } else {
        window.addEventListener('load', register);
      }

      // Sync market rates on mount and when coming back online
      const syncMarketRates = async () => {
        if (!window.navigator.onLine) return;
        
        try {
          const response = await fetch('/api/market-rates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          }).catch(() => null);

          if (response?.ok) {
            const data = await response.json();
            
            if (data.success && data.data) {
              await offlineStore.saveMarketRates({
                gold24k: data.data.gold_24k,
                gold22k: data.data.gold_22k,
                silver: data.data.silver,
              });
              
              console.log('✅ Market rates cached for offline use');
            }
          }
        } catch (err) {
          console.warn('Failed to sync market rates:', err);
        }
      };

      // Initial sync on mount
      syncMarketRates();

      // Sync on coming back online
      window.addEventListener('online', syncMarketRates);

      return () => {
        window.removeEventListener('online', syncMarketRates);
      };
    }
  }, []);

  return null;
}

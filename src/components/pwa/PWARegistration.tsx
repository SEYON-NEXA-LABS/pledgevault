'use client';

import { useEffect } from 'react';

export default function PWARegistration() {
  useEffect(() => {
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
            
            // Check for updates every 1 hour
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000);
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
    }
  }, []);

  return null;
}

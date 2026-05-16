'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { offlineStore } from '@/lib/offlineStore';

interface CachedRates {
  gold24k: number;
  gold22k: number;
  silver: number;
  timestamp: number;
}

export default function OfflineModal() {
  const [isOffline, setIsOffline] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [cachedRates, setCachedRates] = useState<CachedRates | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [nextSyncTime, setNextSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // 1. Initial Check
    const checkStatus = async () => {
      const params = new URLSearchParams(window.location.search);
      const isTestMode = params.get('testOffline') === 'true';
      const isCurrentlyOffline = isTestMode || !window.navigator.onLine;
      
      setIsOffline(isCurrentlyOffline);

      // Load cached data if offline
      if (isCurrentlyOffline) {
        const rates = await offlineStore.getLatestMarketRates() as CachedRates | null;
        setCachedRates(rates);
        
        const lastSync = await offlineStore.getLastSyncTime();
        setLastSyncTime(lastSync);
        
        // Calculate next sync time (23 hours from last sync)
        if (lastSync) {
          const nextSync = new Date(lastSync + 23 * 60 * 60 * 1000);
          setNextSyncTime(nextSync);
        }
      }
    };
    
    checkStatus();

    // 2. Standard Event Listeners
    const handleOnline = () => {
      setIsOffline(false);
      setIsReconnecting(false);
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. Heartbeat Check (Every 5 seconds)
    const interval = setInterval(() => {
      const online = window.navigator.onLine;
      if (!online && !isOffline) {
        setIsOffline(true);
      } else if (online && isOffline && !isReconnecting) {
        setIsOffline(false);
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOffline, isReconnecting]);

  const handleRetry = () => {
    setIsReconnecting(true);
    setTimeout(() => {
      if (window.navigator.onLine) {
        setIsOffline(false);
        setIsReconnecting(false);
      } else {
        setIsReconnecting(false);
      }
    }, 1500);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const hoursAgo = (timestamp: number) => {
    const hours = Math.floor((Date.now() - timestamp) / (60 * 60 * 1000));
    if (hours < 1) return 'just now';
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  if (!isOffline) return null;

  return (
    <div className="offline-backdrop">
      {/* Backdrop */}
      <div className="offline-backdrop__overlay" />

      {/* Modal */}
      <div className="offline-modal-card anim-scale-in">
        {/* SVG Illustration */}
        <div className="offline-svg-wrap">
          <svg className="offline-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 550" width="100%" height="100%">
            <defs>
              <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.03" />
              </pattern>
              <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFE58F" />
                <stop offset="30%" stopColor="#FFD666" />
                <stop offset="70%" stopColor="#D4B106" />
                <stop offset="100%" stopColor="#874D00" />
              </linearGradient>
              <linearGradient id="gold-light" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFF1B8" />
                <stop offset="100%" stopColor="#D4B106" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <style>{`
              @keyframes pulseGlow {
                0% { opacity: 0.3; transform: scale(0.98); }
                50% { opacity: 0.6; transform: scale(1.02); }
                100% { opacity: 0.3; transform: scale(0.98); }
              }
              @keyframes floatAsset {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
                100% { transform: translateY(0px); }
              }
              @keyframes rotateSpinner {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes signalAlert {
                0% { opacity: 0.3; }
                50% { opacity: 1; }
                100% { opacity: 0.3; }
              }
              .glow-circle { transform-origin: 200px 180px; animation: pulseGlow 4s ease-in-out infinite; }
              .illustration-group { transform-origin: 200px 180px; animation: floatAsset 5s ease-in-out infinite; }
              .spinner-svg { transform-origin: 200px 320px; animation: rotateSpinner 1.5s linear infinite; }
              .wifi-error { animation: signalAlert 2s infinite; }
            `}</style>

            <rect width="400" height="550" fill="#0B1528" />
            <rect width="400" height="550" fill="url(#grid)" />
            <circle cx="200" cy="180" r="70" fill="#D4B106" opacity="0.4" filter="url(#glow)" className="glow-circle" />
            <rect x="115" y="95" width="170" height="170" rx="24" transform="rotate(45 200 180)" fill="none" stroke="#FFD666" strokeWidth="1.5" opacity="0.15" />

            <g className="illustration-group">
              <g transform="translate(145, 185)">
                <path d="M 0,0 L 0,25 A 25,10 0 0,0 50,25 L 50,0 Z" fill="url(#gold)" opacity="0.8"/>
                <ellipse cx="25" cy="0" rx="25" ry="10" fill="url(#gold-light)" stroke="#FFF1B8" strokeWidth="0.5"/>
                <path d="M 0,12 L 0,37 A 25,10 0 0,0 50,37 L 50,12 Z" fill="url(#gold)" opacity="0.9"/>
                <ellipse cx="25" cy="12" rx="25" ry="10" fill="url(#gold-light)" stroke="#FFF1B8" strokeWidth="0.5"/>
                <path d="M 0,24 L 0,49 A 25,10 0 0,0 50,49 L 50,24 Z" fill="url(#gold)"/>
                <ellipse cx="25" cy="24" rx="25" ry="10" fill="url(#gold-light)" stroke="#FFF1B8" strokeWidth="0.5"/>
              </g>
              <g transform="translate(175, 155)">
                <path d="M 0,0 L 0,30 A 25,10 0 0,0 50,30 L 50,0 Z" fill="url(#gold)" opacity="0.7"/>
                <ellipse cx="25" cy="0" rx="25" ry="10" fill="url(#gold-light)" stroke="#FFF1B8" strokeWidth="0.5"/>
                <path d="M 0,15 L 0,45 A 25,10 0 0,0 50,45 L 50,15 Z" fill="url(#gold)"/>
                <ellipse cx="25" cy="15" rx="25" ry="10" fill="url(#gold-light)" stroke="#FFF1B8" strokeWidth="0.5"/>
              </g>
              <g transform="translate(195, 175)">
                <polygon points="35,0 95,15 70,40 10,25" fill="url(#gold-light)" />
                <polygon points="10,25 70,40 65,65 5,50" fill="url(#gold)" />
                <polygon points="70,40 95,15 90,40 65,65" fill="#874D00" opacity="0.6" />
              </g>
            </g>

            <circle cx="200" cy="320" r="18" fill="none" stroke="#FFD666" strokeWidth="3" strokeDasharray="70 30" className="spinner-svg" />

            <text x="200" y="390" textAnchor="middle" fontSize="22" fontWeight="800" fill="#FFFFFF" letterSpacing="0.5">WE ARE CURRENTLY</text>
            <text x="200" y="420" textAnchor="middle" fontSize="26" fontWeight="900" fill="#FFD666" letterSpacing="1">OFFLINE</text>
            
            <text x="200" y="460" textAnchor="middle" fontSize="14" fontWeight="400" fill="#A0AEC0">Gold loan services temporarily unavailable.</text>
            <text x="200" y="482" textAnchor="middle" fontSize="14" fontWeight="400" fill="#A0AEC0">Working quickly to reconnect!</text>

            <g transform="translate(110, 520)" className="wifi-error">
              <g fill="none" stroke="#FF4D4F" strokeWidth="2.5" strokeLinecap="round">
                <path d="M0,0 A18,18 0 0,1 24,0" opacity="0.4"/>
                <path d="M4,5 A12,12 0 0,1 20,5" />
                <path d="M8,10 A6,6 0 0,1 16,10" />
                <circle cx="12" cy="15" r="1.5" fill="#FF4D4F" stroke="none" />
              </g>
            </g>
          </svg>
        </div>

        <div className="offline-content-padding">
          {/* Cached Rates Info */}
          {cachedRates && (
            <div className="offline-rates-panel">
              <div className="offline-header">📊 Last Known Rates</div>
              
              <div className="offline-rates-grid">
                <div className="offline-rate-card">
                  <div className="offline-rate-label">Gold 24K</div>
                  <div className="offline-rate-value">₹{cachedRates.gold24k.toLocaleString()}</div>
                </div>
                <div className="offline-rate-card">
                  <div className="offline-rate-label">Gold 22K</div>
                  <div className="offline-rate-value">₹{cachedRates.gold22k.toLocaleString()}</div>
                </div>
                <div className="offline-rate-card">
                  <div className="offline-rate-label">Silver</div>
                  <div className="offline-rate-value">₹{cachedRates.silver.toLocaleString()}</div>
                </div>
              </div>

              <div className="offline-meta">
                Cached {hoursAgo(cachedRates.timestamp)} • Updated {formatDate(cachedRates.timestamp)} at {formatTime(cachedRates.timestamp)}
              </div>

              {nextSyncTime && (
                <div className="offline-next-sync">
                  Next sync: {nextSyncTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
              )}
            </div>
          )}
          <button
            className="pv-btn pv-btn-gold offline-cta"
            onClick={handleRetry}
            disabled={isReconnecting}
          >
            {isReconnecting ? (
              <RefreshCw size={20} className="spin" />
            ) : (
              <span>Try Reconnecting Now</span>
            )}
          </button>
          
          <div className="offline-sec-meta">Secure Offline Protection Active</div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface InstallButtonProps {
  variant?: 'minimal' | 'full';
  className?: string;
}

export default function InstallButton({ variant = 'minimal', className = '' }: InstallButtonProps) {
  const { isInstallable, isInstalled, showInstallPrompt } = usePWAInstall();

  const [showiOSGuide, setShowiOSGuide] = React.useState(false);

  // If already installed, hide it
  if (isInstalled) return null;

  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  const handleManualClick = () => {
    if (isInstallable) {
      showInstallPrompt();
    } else if (isIOS) {
      setShowiOSGuide(true);
    } else {
      alert("To install: Open this in Chrome/Safari and look for 'Add to Home Screen' in the menu.");
    }
  };

  if (variant === 'minimal') {
    return (
      <button 
        onClick={handleManualClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider hover:bg-primary/20 transition-all active:scale-95 ${className}`}
        title="Install App"
      >
        <Smartphone size={14} />
        <span>Install App</span>
      </button>
    );
  }

  return (
    <>
      <button 
        onClick={handleManualClick}
        className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-white text-primary font-bold shadow-2xl hover:scale-105 transition-all active:scale-95 group ${className}`}
      >
        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <Download size={22} />
        </div>
        <div className="flex flex-col items-start leading-tight">
          <span className="text-lg">Install PledgeVault</span>
          <span className="text-[10px] opacity-60 uppercase tracking-widest">{isInstallable ? 'One-tap install' : 'Setup instructions'}</span>
        </div>
      </button>

      {/* iOS Install Guide Modal */}
      {showiOSGuide && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="pv-card w-full max-w-[400px] overflow-hidden animate-in slide-in-from-bottom duration-500">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10">
              <h3 className="font-black uppercase tracking-widest text-xs">Install on iOS</h3>
              <button onClick={() => setShowiOSGuide(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-8 flex flex-col gap-8">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 shadow-inner">
                  <Share size={20} />
                </div>
                <div>
                  <div className="font-bold text-base mb-1">1. Tap the Share button</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">Located at the bottom of your Safari browser.</p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 shadow-inner">
                  <PlusSquare size={20} />
                </div>
                <div>
                  <div className="font-bold text-base mb-1">2. Add to Home Screen</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">Scroll down and tap the "Add to Home Screen" option.</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-primary/5 border-t border-primary/10 text-center">
              <button 
                onClick={() => setShowiOSGuide(false)}
                className="pv-btn pv-btn-gold w-full py-4 text-sm"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

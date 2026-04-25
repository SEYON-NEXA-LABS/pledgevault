'use client';

import React from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface InstallButtonProps {
  variant?: 'minimal' | 'full';
  className?: string;
}

export default function InstallButton({ variant = 'minimal', className = '' }: InstallButtonProps) {
  const { isInstallable, isInstalled, showInstallPrompt } = usePWAInstall();

  // If already installed, hide it
  if (isInstalled) return null;

  // For minimal variant (Header), hide if not installable to avoid clutter
  if (variant === 'minimal' && !isInstallable) return null;

  const handleManualClick = () => {
    if (isInstallable) {
      showInstallPrompt();
    } else {
      alert("To install PledgeVault:\n\n1. Open this page in Chrome or Edge.\n2. Look for the 'Install' icon in the address bar.\n\nOn iOS/Safari:\n1. Tap the 'Share' icon (square with arrow).\n2. Scroll down and tap 'Add to Home Screen'.");
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
  );
}

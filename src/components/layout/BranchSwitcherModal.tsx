'use client';

import React from 'react';
import { Building2, X, MapPin, Check, LayoutDashboard } from 'lucide-react';
import { Branch } from '@/lib/types';
import { settingsStore } from '@/lib/store';
import { authStore } from '@/lib/authStore';

interface BranchSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  activeBranchId: string;
  isMandatory?: boolean;
}

export default function BranchSwitcherModal({ isOpen, onClose, branches, activeBranchId, isMandatory = false }: BranchSwitcherModalProps) {
  if (!isOpen) return null;

  const handleSelect = (branchId: string) => {
    settingsStore.save({ activeBranchId: branchId });
    // Trigger a storage event for the Header to pick up the change
    window.dispatchEvent(new Event('storage'));
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100, backgroundColor: 'rgba(5, 15, 15, 0.85)', backdropFilter: 'blur(8px)' }} onClick={() => !isMandatory && onClose()}>
      <div className="modal-content" style={{ 
        maxWidth: '520px', 
        borderRadius: '40px', 
        padding: '40px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Mockup Header: Centered Building Icon & Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            width: '64px', 
            height: '84px', 
            borderRadius: '32px', 
            background: 'var(--status-pending-bg)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '20px',
            color: '#D4A843'
          }}>
            <Building2 size={32} />
          </div>
          
          <h2 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '32px', 
            fontWeight: 700, 
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            margin: '0 0 12px 0'
          }}>
            Select Your Branch
          </h2>
          
          <p style={{ 
            fontSize: '16px', 
            color: 'var(--text-secondary)',
            maxWidth: '300px',
            margin: '0 auto',
            lineHeight: 1.5
          }}>
            Choose the location you are managing today to access its portfolio.
          </p>
        </div>

        <div style={{ width: '100%', height: '1px', background: 'var(--border-light)', marginBottom: '24px' }} />

        <div className="modal-body" style={{ maxHeight: '45vh', overflowY: 'auto', paddingRight: '4px' }}>
          <div className="branch-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Global Firm Option for Managers */}
            {authStore.isManager() && (
              <button
                className={`branch-item ${activeBranchId === 'firm' ? 'active' : ''}`}
                onClick={() => handleSelect('firm')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '18px 24px',
                  background: activeBranchId === 'firm' ? 'var(--status-active-bg)' : 'var(--bg-primary)',
                  border: `2px solid ${activeBranchId === 'firm' ? 'var(--primary-brand)' : 'transparent'}`,
                  borderRadius: '24px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '14px', 
                  background: activeBranchId === 'firm' ? 'var(--primary-brand)' : 'var(--bg-card)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: activeBranchId === 'firm' ? 'white' : 'var(--primary-brand)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <LayoutDashboard size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>Global Firm Overview</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>All branches consolidated view</div>
                </div>
                {activeBranchId === 'firm' && (
                  <div style={{ color: 'var(--primary-brand)' }}>
                    <Check size={22} />
                  </div>
                )}
              </button>
            )}

            {branches.map((branch) => (
              <button
                key={branch.id}
                className={`branch-item ${activeBranchId === branch.id ? 'active' : ''}`}
                onClick={() => handleSelect(branch.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '18px 24px',
                  background: activeBranchId === branch.id ? 'var(--status-active-bg)' : 'var(--bg-primary)',
                  border: `2px solid ${activeBranchId === branch.id ? 'var(--primary-brand)' : 'transparent'}`,
                  borderRadius: '24px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '14px', 
                  background: activeBranchId === branch.id ? 'var(--primary-brand)' : 'var(--bg-card)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: activeBranchId === branch.id ? 'white' : 'var(--primary-brand)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <MapPin size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>{branch.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{branch.location || 'Local Office'} • {branch.code}</div>
                </div>
                {activeBranchId === branch.id && (
                  <div style={{ color: 'var(--primary-brand)' }}>
                    <Check size={22} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: '100%', height: '1px', background: 'var(--border-light)', margin: '24px 0' }} />

        {/* Mockup Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <div style={{ 
            width: '20px', 
            height: '20px', 
            borderRadius: '50%', 
            border: '2px solid var(--status-active)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--status-active)'
          }}>
            <Check size={12} strokeWidth={3} />
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            You can switch branches later in Settings.
          </p>
        </div>
      </div>
    </div>
  );
}

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
}

export default function BranchSwitcherModal({ isOpen, onClose, branches, activeBranchId }: BranchSwitcherModalProps) {
  if (!isOpen) return null;

  const handleSelect = (branchId: string) => {
    settingsStore.save({ activeBranchId: branchId });
    // Trigger a storage event for the Header to pick up the change
    window.dispatchEvent(new Event('storage'));
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="icon-circle gold">
              <Building2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0 }}>Select Branch</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>
                Switch your active operational location
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '16px' }}>
          <div className="branch-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Global Firm Option for Managers */}
            {authStore.isManager() && (
              <button
                className={`branch-item ${activeBranchId === 'firm' ? 'active' : ''}`}
                onClick={() => handleSelect('firm')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  background: activeBranchId === 'firm' ? 'var(--bg-gold-light)' : 'var(--bg-input)',
                  border: `1px solid ${activeBranchId === 'firm' ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginBottom: '10px'
                }}
              >
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '10px', 
                  background: activeBranchId === 'firm' ? 'var(--gold)' : 'var(--sidebar-bg)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <LayoutDashboard size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>Global Firm Overview</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>All branches consolidated view</div>
                </div>
                {activeBranchId === 'firm' && (
                  <div style={{ color: 'var(--gold)' }}>
                    <Check size={20} />
                  </div>
                )}
              </button>
            )}

            {/* Branch Divider for Managers */}
            {authStore.isManager() && <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '4px' }}>Specific Branches</div>}

            {branches.map((branch) => (
              <button
                key={branch.id}
                className={`branch-item ${activeBranchId === branch.id ? 'active' : ''}`}
                onClick={() => handleSelect(branch.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  background: activeBranchId === branch.id ? 'var(--bg-gold-light)' : 'var(--bg-input)',
                  border: `1px solid ${activeBranchId === branch.id ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '10px', 
                  background: activeBranchId === branch.id ? 'var(--gold)' : 'var(--bg-card)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: activeBranchId === branch.id ? 'white' : 'var(--gold)'
                }}>
                  <MapPin size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{branch.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{branch.location || 'Local Office'} • {branch.code}</div>
                </div>
                {activeBranchId === branch.id && (
                  <div style={{ color: 'var(--gold)' }}>
                    <Check size={20} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            All operations (New Loans, Payments) will be recorded for the selected branch.
          </p>
        </div>
      </div>
    </div>
  );
}

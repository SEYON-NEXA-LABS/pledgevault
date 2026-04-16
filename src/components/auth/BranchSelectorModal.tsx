'use client';

import React from 'react';
import { 
  Building2, 
  MapPin, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Branch } from '@/lib/types';

interface BranchSelectorModalProps {
  branches: Branch[];
  onSelect: (branchId: string) => void;
  isOpen: boolean;
}

export default function BranchSelectorModal({ branches, onSelect, isOpen }: BranchSelectorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container branch-selector-modal">
        <div className="modal-header">
          <div className="icon-circle gold">
            <Building2 size={24} />
          </div>
          <h2>Select Your Branch</h2>
          <p>Choose the location you are managing today to access its portfolio.</p>
        </div>

        <div className="branch-list">
          {branches.map((branch) => (
            <button 
              key={branch.id} 
              className="branch-option-card"
              onClick={() => onSelect(branch.id)}
            >
              <div className="branch-info">
                <div className="branch-icon">
                  <span className="code">{branch.code}</span>
                </div>
                <div className="branch-details">
                  <div className="name">{branch.name}</div>
                  <div className="location">
                    <MapPin size={12} /> {branch.location}
                  </div>
                </div>
              </div>
              <div className="arrow">
                <ArrowRight size={18} />
              </div>
            </button>
          ))}
        </div>

        <div className="modal-footer">
          <p>
            <CheckCircle2 size={14} style={{ color: 'var(--status-active)' }} />
            You can switch branches later in Settings.
          </p>
        </div>
      </div>
    </div>
  );
}

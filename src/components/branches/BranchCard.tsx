'use client';

import React from 'react';
import { MapPin, Phone, Hash, ArrowRight, Activity, Building, Trash2 } from 'lucide-react';

interface BranchCardProps {
  branch: {
    id: string;
    name: string;
    code: string;
    location: string;
    isActive?: boolean;
    activeLoans?: number;
    goldWeight?: number;
  };
  onDelete?: (id: string, name: string) => void;
  isManager?: boolean;
}

export default function BranchCard({ branch, onDelete, isManager }: BranchCardProps) {
  return (
    <div className="branch-card">
      <div className="branch-card-header">
        <div className="branch-info">
          <div className="branch-icon">
            <Building size={20} />
          </div>
          <div>
            <h3>{branch.name}</h3>
            <span className="branch-id">{branch.code}</span>
          </div>
        </div>
        {isManager && (
          <button 
            className="delete-btn" 
            onClick={() => onDelete?.(branch.id, branch.name)}
            title="Delete Branch"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="branch-details">
        <div className="detail-item">
          <MapPin size={14} />
          <span>{branch.location || 'No Location Set'}</span>
        </div>
        <div className="detail-item">
          <Activity size={14} />
          <span>{branch.isActive !== false ? 'Operating' : 'Inactive'}</span>
        </div>
      </div>

      <div className="branch-metrics">
        <div className="metric">
          <span className="label">Active Loans</span>
          <span className="value">{branch.activeLoans || '15+'}</span>
        </div>
        <div className="metric">
          <span className="label">Gold Stock</span>
          <span className="value">{branch.goldWeight || '420'}g</span>
        </div>
      </div>

      <div className="branch-card-footer">
        <button className="btn btn-sm btn-outline-teal btn-full">
          Branch Dashboard <ArrowRight size={14} />
        </button>
      </div>

      <style jsx>{`
        .branch-card {
          background: #fff;
          border-radius: 24px;
          padding: 24px;
          border: 1px solid #E8E8E3;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .branch-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(16, 123, 136, 0.08);
          border-color: #107B88;
        }

        .branch-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .branch-info {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .branch-icon {
          width: 44px;
          height: 44px;
          background: #F4F4F2;
          color: #107B88;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #1A3C34;
        }

        .branch-id {
          font-size: 11px;
          font-weight: 700;
          color: #9A9FA5;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .delete-btn {
          background: transparent;
          border: none;
          color: #DC2626;
          opacity: 0.4;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .delete-btn:hover {
          opacity: 1;
        }

        .branch-details {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #6F767E;
        }

        .branch-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          background: #F8F8F5;
          padding: 16px;
          border-radius: 16px;
        }

        .metric {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric .label {
          font-size: 10px;
          color: #9A9FA5;
          text-transform: uppercase;
          font-weight: 700;
        }

        .metric .value {
          font-size: 16px;
          font-weight: 800;
          color: #1A3C34;
        }

        .btn-full {
          width: 100%;
        }
      `}</style>
    </div>
  );
}

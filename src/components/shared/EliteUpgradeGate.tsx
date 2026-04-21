'use client';

import React from 'react';
import Link from 'next/link';
import { Crown, CheckCircle2, ArrowRight, Sparkles, Building2, BarChart3, Users } from 'lucide-react';

interface EliteUpgradeGateProps {
  featureName: string;
  featureDescription: string;
}

export default function EliteUpgradeGate({ featureName, featureDescription }: EliteUpgradeGateProps) {
  return (
    <div className="elite-gate-container">
      <div className="elite-gate-card">
        <div className="elite-gate-badge">
          <Crown size={16} />
          <span>Elite Exclusive</span>
        </div>
        
        <div className="elite-gate-icon">
          <Sparkles size={48} className="sparkle-anim" />
        </div>
        
        <h2>{featureName}</h2>
        <p className="description">{featureDescription}</p>
        
        <div className="benefits-list">
          <div className="benefit-item">
            <div className="benefit-icon"><Building2 size={18} /></div>
            <div>
              <h4>Unlimited Branches</h4>
              <p>Manage your entire jewelry chain from a single control plane.</p>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon"><BarChart3 size={18} /></div>
            <div>
              <h4>Inter-branch Analytics</h4>
              <p>Compare performance and stock levels across every location.</p>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon"><Users size={18} /></div>
            <div>
              <h4>Staff Assignments</h4>
              <p>Assign specific employees to specific branches with ease.</p>
            </div>
          </div>
        </div>

        <div className="elite-gate-footer">
          <Link href="/settings?tab=subscription" className="btn btn-gold btn-lg btn-full">
            Upgrade to Elite Plan <ArrowRight size={18} />
          </Link>
          <p className="footer-note">Unlock the full power of PledgeVault for your growing business.</p>
        </div>
      </div>

      <style jsx>{`
        .elite-gate-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          min-height: calc(100vh - 200px);
        }

        .elite-gate-card {
          background: #fff;
          width: 100%;
          max-width: 560px;
          border-radius: 40px;
          padding: 60px 48px;
          text-align: center;
          box-shadow: 0 40px 100px -20px rgba(16, 123, 136, 0.15);
          position: relative;
          border: 1px solid rgba(16, 123, 136, 0.1);
          overflow: hidden;
        }

        .elite-gate-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 8px;
          background: linear-gradient(90deg, #107B88, #D4AF37, #107B88);
          background-size: 200% auto;
          animation: shimmer 4s linear infinite;
        }

        @keyframes shimmer {
          to { background-position: 200% center; }
        }

        .elite-gate-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(212, 175, 55, 0.15);
          color: #B8860B;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 32px;
        }

        .elite-gate-icon {
          color: #D4AF37;
          margin-bottom: 24px;
        }

        .sparkle-anim {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        h2 {
          font-size: 36px;
          font-weight: 900;
          color: #1A3C34;
          margin-bottom: 16px;
          letter-spacing: -1px;
        }

        .description {
          font-size: 16px;
          color: #6F767E;
          line-height: 1.6;
          margin-bottom: 48px;
        }

        .benefits-list {
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 48px;
        }

        .benefit-item {
          display: flex;
          gap: 16px;
        }

        .benefit-icon {
          width: 40px;
          height: 40px;
          background: #F4F4F2;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #107B88;
          flex-shrink: 0;
        }

        .benefit-item h4 {
          font-size: 16px;
          font-weight: 700;
          color: #1A3C34;
          margin-bottom: 4px;
        }

        .benefit-item p {
          font-size: 14px;
          color: #6F767E;
          margin: 0;
          line-height: 1.4;
        }

        .elite-gate-footer {
          margin-top: 24px;
        }

        .btn-full {
          width: 100%;
        }

        .footer-note {
          font-size: 13px;
          color: #9A9FA5;
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
}

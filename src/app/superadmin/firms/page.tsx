'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Users, 
  Layers, 
  ChevronRight, 
  MoreVertical,
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Zap,
  Activity,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { supabaseService } from '@/lib/supabase/service';
import { formatCurrency, formatDate } from '@/lib/constants';

export default function FirmManagementPage() {
  const [firms, setFirms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');

  useEffect(() => {
    async function fetchFirms() {
      try {
        const data = await supabaseService.getFirmsDetailed();
        setFirms(data || []);
      } catch (err) {
        console.error('Error fetching firms:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFirms();
  }, []);

  const filteredFirms = firms.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterPlan === 'all' || f.plan === filterPlan;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="admin-page" style={{ padding: '32px' }}>
      <div className="admin-header" style={{ marginBottom: '32px' }}>
        <div className="header-info">
          <Link href="/superadmin" className="btn btn-ghost btn-sm" style={{ marginBottom: '12px' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px' }}>Firm Management</h1>
             <span className="badge" style={{ verticalAlign: 'middle' }}>{firms.length} Total Shops</span>
          </div>
          <p className="subtitle">Oversee all registered pawn shops, monitor growth, and manage accounts.</p>
        </div>
        <div className="header-actions">
           <Link href="/superadmin/onboarding" className="btn btn-gold">
             <Plus size={18} /> Onboard New Firm
           </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-container card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div className="search-box" style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input 
            type="text" 
            placeholder="Search firms by name..." 
            className="form-input"
            style={{ paddingLeft: '48px', width: '100%' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <Filter size={18} color="var(--text-tertiary)" />
           <select 
             className="form-input" 
             style={{ width: '160px' }}
             value={filterPlan}
             onChange={e => setFilterPlan(e.target.value)}
           >
             <option value="all">All Plans</option>
             <option value="free">Standard (Free)</option>
             <option value="pro">Premium (Growth)</option>
             <option value="enterprise">Enterprise</option>
           </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '100px', textAlign: 'center' }}>
          <div className="spin-box"><Activity className="spin" size={32} color="var(--accent)" /></div>
          <p style={{ marginTop: '16px', color: 'var(--text-tertiary)' }}>Syncing firm directory...</p>
        </div>
      ) : (
        <div className="firms-grid">
          {filteredFirms.length === 0 ? (
            <div className="card" style={{ padding: '80px', textAlign: 'center', gridColumn: '1 / -1' }}>
              <Building2 size={48} color="var(--border)" style={{ marginBottom: '16px' }} />
              <h3>No firms found</h3>
              <p style={{ color: 'var(--text-tertiary)' }}>Adjust your search or filter to find specific shops.</p>
            </div>
          ) : (
            filteredFirms.map((firm) => (
              <div key={firm.id} className="firm-mgmt-card card animate-in">
                <div className="card-top">
                   <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      <div className="firm-initials">
                        {firm.name.charAt(0)}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>{firm.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                          <MapPin size={14} /> Coimbatore, TN
                        </div>
                      </div>
                   </div>
                   <div className={`plan-badge ${firm.plan}`}>
                     {firm.plan.toUpperCase()}
                   </div>
                </div>

                <div className="card-metrics">
                   <div className="metric">
                      <Layers size={14} />
                      <span>{firm.branches?.[0]?.count || 0} Branches</span>
                   </div>
                   <div className="metric">
                      <Users size={14} />
                      <span>{firm.profiles?.[0]?.count || 0} Staff</span>
                   </div>
                   <div className="metric">
                      <ShieldCheck size={14} />
                      <span>Joined {formatDate(firm.created_at)}</span>
                   </div>
                </div>

                <div className="card-footer-actions">
                   <Link href={`/superadmin/subscriptions?firmId=${firm.id}`} className="mini-action">
                      <Zap size={14} /> Subscription
                   </Link>
                   <Link href="/superadmin/integrity" className="mini-action">
                      <Activity size={14} /> Health
                   </Link>
                   <button className="icon-btn mini">
                      <MoreVertical size={16} />
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <style jsx>{`
        .firms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 24px;
        }

        .firm-mgmt-card {
          padding: 24px;
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .firm-mgmt-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08);
          border-color: var(--accent-light);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .firm-initials {
          width: 48px;
          height: 48px;
          background: var(--bg-gold-light);
          color: var(--gold-dark);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 20px;
          border: 1px solid var(--gold-light);
        }

        .plan-badge {
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .plan-badge.enterprise { background: #E0F2FE; color: #0369A1; }
        .plan-badge.pro { background: #F0FDF4; color: #15803D; }
        .plan-badge.free { background: #F4F4F2; color: #666; }

        .card-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding: 16px;
          background: var(--bg-hover);
          border-radius: 12px;
        }

        .metric {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .card-footer-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }

        .mini-action {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-tertiary);
          text-decoration: none;
          padding: 6px 10px;
          border-radius: 8px;
          transition: all 0.2s;
          background: #fff;
          border: 1px solid var(--border);
        }

        .mini-action:hover {
          color: var(--accent);
          border-color: var(--accent);
          background: var(--bg-hover);
        }

        .icon-btn.mini {
          margin-left: auto;
          background: transparent;
          border: none;
          padding: 4px;
          color: var(--text-tertiary);
          cursor: pointer;
        }

        .spin { animation: rotate 1.5s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .animate-in {
          animation: slideUp 0.4s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Code2, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  ArrowLeft,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  XCircle,
  Zap,
  Terminal
} from 'lucide-react';
import Link from 'next/link';
import { getDeepIntegrityReport, DeepIntegrityReport, TableAudit } from './actions';

export default function IntegrityPage() {
  const [report, setReport] = useState<DeepIntegrityReport | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  const runDiagnostics = () => {
    setError(null);
    startTransition(async () => {
      try {
        const data = await getDeepIntegrityReport();
        setReport(data);
      } catch (err: any) {
        setError(err.message || 'Failed to run diagnostics');
      }
    });
  };

  useEffect(() => { runDiagnostics(); }, []);

  const getHealthColor = (health: number) => {
    if (health >= 100) return 'var(--success)';
    if (health >= 80) return 'var(--gold)';
    return 'var(--danger)';
  };

  return (
    <div className="integrity-dashboard">
      <div className="glass-container">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-content">
            <Link href="/superadmin" className="back-link">
              <ArrowLeft size={16} /> Hub
            </Link>
            <div className="title-section">
              <div className="glow-icon">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h1>System Integrity Audit</h1>
                <p>Deep scan of database schema against <code>schema.sql</code> blueprint</p>
              </div>
            </div>
          </div>
          
          <button 
            className={`audit-btn ${isPending ? 'loading' : ''}`} 
            onClick={runDiagnostics} 
            disabled={isPending}
          >
            <RefreshCw size={20} className={isPending ? 'spin' : ''} />
            <span>{isPending ? 'Auditing Schema...' : 'Run Deep Audit'}</span>
          </button>
        </header>

        {error && (
          <div className="error-banner">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        {report ? (
          <div className="dashboard-grid">
            {/* Health Summary Card */}
            <div className="summary-card full-width">
              <div className="health-gauge">
                <div className="gauge-background">
                  <div 
                    className="gauge-fill" 
                    style={{ 
                      width: `${report.overallHealth}%`, 
                      background: getHealthColor(report.overallHealth) 
                    }}
                  />
                </div>
                <div className="gauge-stats">
                  <span className="health-value">{report.overallHealth}%</span>
                  <span className="health-label">System Alignment</span>
                </div>
              </div>
              
              <div className="quick-stats">
                <div className="stat-item">
                  <span className="stat-num">{report.tables.length}</span>
                  <span className="stat-name">Tables Tracked</span>
                </div>
                <div className="stat-item">
                  <span className="stat-num">{report.tables.filter(t => t.isAligned).length}</span>
                  <span className="stat-name">Perfect Sync</span>
                </div>
                <div className="stat-item">
                  <span className="stat-num">{report.tables.reduce((acc, t) => acc + t.missingColumns.length, 0)}</span>
                  <span className="stat-name">Total Mismatches</span>
                </div>
              </div>
            </div>

            {/* Deep Schema Audit */}
            <div className="main-card">
              <div className="card-header">
                <div className="header-title">
                  <Database size={20} />
                  <h2>Schema Alignment Audit</h2>
                </div>
                <span className="badge">100% Comprehensive</span>
              </div>
              
              <div className="table-list">
                {report.tables.map((table) => (
                  <div 
                    key={table.name} 
                    className={`table-item ${table.isAligned ? 'aligned' : 'mismatch'}`}
                  >
                    <div 
                      className="table-row" 
                      onClick={() => setExpandedTable(expandedTable === table.name ? null : table.name)}
                    >
                      <div className="table-info">
                        {table.isAligned ? (
                          <CheckCircle2 size={18} className="success-icon" />
                        ) : (
                          <XCircle size={18} className="danger-icon" />
                        )}
                        <span className="table-name">{table.name}</span>
                      </div>
                      <div className="table-meta">
                        <span className="col-count text-tertiary">{table.actualColumns.length} columns</span>
                        {table.missingColumns.length > 0 && (
                          <span className="danger-pill">{table.missingColumns.length} Missing</span>
                        )}
                        {expandedTable === table.name ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {expandedTable === table.name && (
                      <div className="table-details">
                        <div className="detail-grid">
                          <div className="detail-section">
                            <span className="detail-label">Status</span>
                            <div className="status-indicator">
                              {table.isAligned ? (
                                <p className="text-success small">Perfectly aligned with blueprint.</p>
                              ) : (
                                <p className="text-danger small">Mismatch detected between SQL and Database.</p>
                              )}
                            </div>
                          </div>
                          
                          {!table.isAligned && (
                            <div className="remediation-section">
                              <span className="detail-label">Remediation SQL</span>
                              <div className="code-box">
                                <Terminal size={14} />
                                <code>
                                  ALTER TABLE {table.name} <br/>
                                  {table.missingColumns.map((c, i) => (
                                    <span key={`${table.name}-missing-${c}-${i}`}>
                                      ADD COLUMN {c} ...{i < table.missingColumns.length - 1 ? ',' : ';'}
                                      <br/>
                                    </span>
                                  ))}
                                </code>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Cards */}
            <div className="integrity-sidebar">
              <div className="side-card">
                <div className="card-header">
                  <Lock size={18} />
                  <h3>Security Governance</h3>
                </div>
                <div className="side-list">
                  {report.rlsStatus.map((s, idx) => (
                    <div key={`rls-${s.tableName}-${idx}`} className="side-item">
                      <span>{s.tableName}</span>
                      <span className={`pill ${s.enabled ? 'success' : 'danger'}`}>
                        {s.enabled ? 'RLS' : 'UNSAFE'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="side-card">
                <div className="card-header">
                  <Zap size={18} />
                  <h3>Functional Health</h3>
                </div>
                <div className="side-list">
                  {report.functions.map((f, idx) => (
                    <div key={`fn-${f.name}-${idx}`} className="side-item">
                      <code>{f.name}()</code>
                      {f.exists ? <CheckCircle2 size={14} color="var(--success)"/> : <AlertCircle size={14} color="var(--danger)"/>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="loading-state">
            <div className="loader">
              <Activity size={48} />
            </div>
            <p>Initializing Deep Schema Audit...</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .integrity-dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: white;
          padding: 40px 20px;
          font-family: 'Outfit', sans-serif;
        }
        .glass-container {
          max-width: 1200px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }
        .back-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.4);
          text-decoration: none;
          font-size: 14px;
          margin-bottom: 12px;
          transition: 0.2s;
        }
        .back-link:hover { color: white; }
        .title-section {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .glow-icon {
          background: var(--accent);
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          padding: 12px;
          border-radius: 16px;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
        }
        h1 { font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -1px; }
        p { color: rgba(255, 255, 255, 0.5); margin: 4px 0 0; }

        .audit-btn {
          background: white;
          color: black;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .audit-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(255, 255, 255, 0.1); }
        .audit-btn:active { transform: translateY(0); }
        .audit-btn.loading { opacity: 0.7; cursor: not-allowed; }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }
        .full-width { grid-column: 1 / -1; }

        .summary-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 32px;
          display: flex;
          align-items: center;
          gap: 60px;
        }
        .health-gauge {
          position: relative;
          width: 200px;
        }
        .gauge-background {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }
        .gauge-fill {
          height: 100%;
          transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .gauge-stats {
          display: flex;
          flex-direction: column;
          margin-top: 12px;
        }
        .health-value { font-size: 36px; font-weight: 900; }
        .health-label { font-size: 14px; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; letter-spacing: 1px; }

        .quick-stats {
          display: flex;
          gap: 48px;
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          padding-left: 60px;
        }
        .stat-item { display: flex; flex-direction: column; }
        .stat-num { font-size: 24px; font-weight: 700; }
        .stat-name { font-size: 12px; color: rgba(255, 255, 255, 0.4); }

        .main-card, .side-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 24px;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .header-title { display: flex; alignItems: center; gap: 12px; }
        h2 { font-size: 18px; font-weight: 700; margin: 0; }
        .badge { background: rgba(16, 185, 129, 0.1); color: #10B981; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; }

        .table-list { display: flex; flex-direction: column; gap: 8px; }
        .table-item {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          overflow: hidden;
          transition: 0.2s;
        }
        .table-item:hover { background: rgba(255, 255, 255, 0.05); }
        .table-row {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
        }
        .table-info { display: flex; align-items: center; gap: 12px; }
        .table-name { font-weight: 600; font-family: 'JetBrains Mono', monospace; }
        .table-meta { display: flex; align-items: center; gap: 16px; font-size: 13px; }
        .danger-pill { background: #E11D48; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }

        .table-details { padding: 0 20px 20px; border-top: 1px solid rgba(255, 255, 255, 0.05); margin-top: -4px; animation: slideDown 0.3s ease-out; }
        .detail-grid { display: grid; gap: 16px; padding-top: 16px; }
        .detail-label { font-size: 11px; color: rgba(255, 255, 255, 0.3); text-transform: uppercase; font-weight: 700; margin-bottom: 6px; display: block; }
        .code-box {
          background: black;
          padding: 12px;
          border-radius: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #10B981;
          display: flex;
          gap: 12px;
        }

        .sidebar-list { display: flex; flex-direction: column; gap: 24px; }
        .integrity-sidebar { display: flex; flex-direction: column; gap: 24px; }
        .side-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          font-size: 13px;
        }
        .pill { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800; }
        .pill.success { background: rgba(16, 185, 129, 0.1); color: #10B981; }
        .pill.danger { background: rgba(225, 29, 72, 0.1); color: #E11D48; }

        .loading-state {
          height: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
        }
        .loader { animation: pulse 2s infinite; color: var(--accent); }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

        .text-success { color: #10B981; }
        .text-danger { color: #E11D48; }
        .small { font-size: 12px; }
        .success-icon { color: #10B981; }
        .danger-icon { color: #E11D48; }
      `}</style>
    </div>
  );
}

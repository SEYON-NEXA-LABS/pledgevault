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
    <div style={{ minHeight: '100vh', background: 'var(--brand-deep)', color: 'white', padding: '40px 20px', fontFamily: 'var(--font-outfit)' }}>
      <div className="pv-glass" style={{ maxWidth: '1200px', margin: '0 auto', borderRadius: '24px', padding: '40px' }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <Link href="/superadmin" className="pv-btn pv-btn-outline pv-btn-sm" style={{ color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '12px' }}>
              <ArrowLeft size={16} /> Hub
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '8px' }}>
              <div style={{ background: 'var(--brand-vibrant)', color: 'var(--brand-deep)', padding: '12px', borderRadius: '16px', boxShadow: '0 0 20px rgba(45, 212, 191, 0.3)' }}>
                <ShieldCheck size={32} />
              </div>
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-px' }}>System Integrity Audit</h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>Deep scan of database schema against blueprint</p>
              </div>
            </div>
          </div>
          
          <button 
            className={`pv-btn ${isPending ? 'pv-btn-outline' : 'pv-btn-gold'}`} 
            style={{ padding: '12px 24px', borderRadius: '12px' }}
            onClick={runDiagnostics} 
            disabled={isPending}
          >
            <RefreshCw size={20} className={isPending ? 'spin' : ''} />
            <span>{isPending ? 'Auditing...' : 'Run Audit'}</span>
          </button>
        </header>

        {error && (
          <div className="pv-badge" style={{ background: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', width: '100%', padding: '16px', borderRadius: '12px', marginBottom: '24px', justifyContent: 'center' }}>
            <AlertCircle size={20} />
            <p style={{ fontWeight: 800 }}>{error}</p>
          </div>
        )}

        {report ? (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            {/* Health Summary Card */}
            <div className="pv-card" style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '60px', padding: '32px' }}>
              <div style={{ position: 'relative', width: '200px' }}>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      height: '100%',
                      width: `${report.overallHealth}%`, 
                      background: report.overallHealth >= 90 ? 'var(--status-active)' : 'var(--gold)' 
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: '12px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 900 }}>{report.overallHealth}%</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase' }}>System Alignment</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '48px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '60px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '24px', fontWeight: 800 }}>{report.tables.length}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase' }}>Tables</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '24px', fontWeight: 800 }}>{report.tables.filter(t => t.isAligned).length}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase' }}>Synced</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--status-overdue)' }}>{report.tables.reduce((acc, t) => acc + t.missingColumns.length, 0)}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase' }}>Mismatches</span>
                </div>
              </div>
            </div>

            <div className="pv-card" style={{ padding: 0, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Database size={20} style={{ color: 'var(--brand-primary)' }} />
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Schema Alignment Audit</h2>
                </div>
                <span className="pv-badge" style={{ background: 'rgba(45, 212, 191, 0.1)', color: 'var(--status-active)', fontWeight: 800 }}>100% Comprehensive</span>
              </div>
              
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {report.tables.map((table) => (
                  <div 
                    key={table.name} 
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.03)', 
                      border: '1px solid rgba(255, 255, 255, 0.05)', 
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}
                  >
                    <div 
                      style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => setExpandedTable(expandedTable === table.name ? null : table.name)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {table.isAligned ? (
                          <CheckCircle2 size={18} style={{ color: 'var(--status-active)' }} />
                        ) : (
                          <XCircle size={18} style={{ color: 'var(--status-overdue)' }} />
                        )}
                        <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{table.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
                        <span style={{ opacity: 0.5 }}>{table.actualColumns.length} columns</span>
                        {table.missingColumns.length > 0 && (
                          <span className="pv-badge" style={{ background: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', fontWeight: 800, fontSize: '10px' }}>{table.missingColumns.length} Missing</span>
                        )}
                        {expandedTable === table.name ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {expandedTable === table.name && (
                      <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', animation: 'anim-fade-in 0.3s' }}>
                        <div style={{ display: 'grid', gap: '16px', paddingTop: '16px' }}>
                          <div>
                            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.3)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px', display: 'block' }}>Alignment Status</span>
                            <div>
                              {table.isAligned ? (
                                <p style={{ color: 'var(--status-active)', fontSize: '12px', fontWeight: 700, margin: 0 }}>Perfectly aligned with blueprint.</p>
                              ) : (
                                <p style={{ color: 'var(--status-overdue)', fontSize: '12px', fontWeight: 700, margin: 0 }}>Mismatch detected between SQL and Database.</p>
                              )}
                            </div>
                          </div>
                          
                          {!table.isAligned && (
                            <div>
                              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.3)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px', display: 'block' }}>Remediation SQL</span>
                              <div style={{ background: 'black', padding: '12px', borderRadius: '8px', color: 'var(--brand-primary)', display: 'flex', gap: '12px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="pv-card" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Lock size={18} style={{ color: 'var(--brand-primary)' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Security Governance</h3>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {report.rlsStatus.map((s, idx) => (
                    <div key={`rls-${s.tableName}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', fontSize: '13px' }}>
                      <span style={{ fontWeight: 600 }}>{s.tableName}</span>
                      <span className="pv-badge" style={{ background: s.enabled ? 'rgba(45, 212, 191, 0.1)' : 'var(--status-overdue-bg)', color: s.enabled ? 'var(--status-active)' : 'var(--status-overdue)', fontWeight: 800, fontSize: '10px' }}>
                        {s.enabled ? 'RLS' : 'UNSAFE'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pv-card" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Zap size={18} style={{ color: 'var(--brand-primary)' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Functional Health</h3>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {report.functions.map((f, idx) => (
                    <div key={`fn-${f.name}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', fontSize: '13px' }}>
                      <code style={{ fontSize: '12px', color: 'var(--brand-primary)' }}>{f.name}()</code>
                      {f.exists ? <CheckCircle2 size={14} style={{ color: 'var(--status-active)' }}/> : <AlertCircle size={14} style={{ color: 'var(--status-overdue)' }}/>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
            <Activity className="spin" size={48} style={{ color: 'var(--brand-primary)' }} />
            <p style={{ fontWeight: 800, opacity: 0.5 }}>Initializing Deep Schema Audit...</p>
          </div>
        )}
      </div>


    </div>
  );
}

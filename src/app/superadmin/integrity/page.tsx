'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Code2, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  ArrowLeft,
  Search,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { supabaseService } from '@/lib/supabase/service';

interface IntegrityReport {
  tables: any[];
  columns: any[];
  security: any[];
  functions: any[];
  timestamp: string;
}

export default function IntegrityPage() {
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await supabaseService.checkSystemIntegrity();
      if (data.error && !data.tables) {
        setError(data.error);
      } else {
        setReport(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to run diagnostics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runDiagnostics(); }, []);

  const getStatusIcon = (found: boolean) => found 
    ? <CheckCircle2 size={16} color="var(--success)" /> 
    : <AlertCircle size={16} color="var(--danger)" />;

  return (
    <div className="container" style={{ padding: '32px' }}>
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div className="page-header-left">
          <Link href="/superadmin" className="btn btn-ghost btn-sm" style={{ marginBottom: '16px' }}>
            <ArrowLeft size={16} /> Back to Hub
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="icon-box" style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <ShieldCheck size={28} color="var(--accent)" />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800 }}>System Integrity Dashboard</h1>
              <p className="subtitle">Real-time verification of database schema and security policies</p>
            </div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={runDiagnostics} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
          {loading ? 'Running Audit...' : 'Re-Run Audit'}
        </button>
      </div>

      {error ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', border: '2px dashed var(--danger-light)' }}>
          <AlertCircle size={48} color="var(--danger)" style={{ marginBottom: '16px' }} />
          <h3>Diagnostic Failure</h3>
          <p style={{ color: 'var(--text-tertiary)', maxWidth: '400px', margin: '8px auto 24px' }}>
            The system could not perform a structural audit. This usually means the diagnostic RPC function hasn't been installed.
          </p>
          <div style={{ background: 'var(--bg-hover)', padding: '16px', borderRadius: '12px', textAlign: 'left', marginBottom: '24px' }}>
            <code style={{ fontSize: '13px', color: 'var(--danger)' }}>{error}</code>
          </div>
          <p style={{ fontSize: '14px' }}>
            <strong>Solution:</strong> Please run the latest SQL migration in your Supabase SQL Editor.
          </p>
        </div>
      ) : report ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          
          {/* Section: Core Tables */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Database size={20} color="var(--accent)" />
                <h3 style={{ margin: 0 }}>Core Tables</h3>
              </div>
              <span className="badge">{report.tables.length} Detected</span>
            </div>
            <div className="card-body">
              <div className="integrity-list">
                {report.tables.map((t: any) => (
                  <div key={t.table_name} className="integrity-item">
                    <code>{t.table_name}</code>
                    {getStatusIcon(t.exists)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Audit Columns */}
          <div className="card" style={{ borderLeft: '4px solid var(--gold)' }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Search size={20} color="var(--gold)" />
                <h3 style={{ margin: 0 }}>Required Columns</h3>
              </div>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
                Verified presence of recent multi-branch & audit updates.
              </p>
              <div className="integrity-list">
                {['default_branch_id (profiles)', 'branch_id (payments)', 'created_by (loans)', 'created_by (payments)'].map((col) => {
                  const [c, tab] = col.split(' (');
                  const tName = tab.replace(')', '');
                  const found = report.columns.some((rc: any) => rc.table_name === tName && rc.column_name === c);
                  return (
                    <div key={col} className="integrity-item">
                      <span style={{ fontSize: '13px' }}>
                        <code style={{ color: 'var(--text-secondary)' }}>{tName}</code>.<b>{c}</b>
                      </span>
                      {getStatusIcon(found)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section: Security Policies */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Lock size={20} color="var(--success)" />
                <h3 style={{ margin: 0 }}>Access Security</h3>
              </div>
            </div>
            <div className="card-body">
              <div className="integrity-list">
                {report.security.map((s: any) => (
                  <div key={s.table_name} className="integrity-item">
                    <span style={{ fontSize: '14px' }}>RLS: <code>{s.table_name}</code></span>
                    <span className={`status-pill ${s.rls_enabled ? 'active' : 'inactive'}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                      {s.rls_enabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Analytics Functions */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Code2 size={20} color="var(--accent)" />
                <h3 style={{ margin: 0 }}>System Functions</h3>
              </div>
            </div>
            <div className="card-body">
              <div className="integrity-list">
                {['get_firm_stats', 'get_superadmin_stats', 'check_db_integrity'].map((fn) => {
                  const found = report.functions.some((rf: any) => rf.function_name === fn);
                  return (
                    <div key={fn} className="integrity-item">
                      <code style={{ color: 'var(--accent)' }}>{fn}()</code>
                      {getStatusIcon(found)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <Activity size={48} color="var(--accent)" className="spin" />
          <p style={{ marginTop: '16px', color: 'var(--text-tertiary)' }}>Gathering system metadata...</p>
        </div>
      )}

      <style jsx>{`
        .integrity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .integrity-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: var(--bg-hover);
          border-radius: 8px;
          border: 1px solid var(--border);
        }
        code {
          background: #eee;
          padding: 2px 4px;
          border-radius: 4px;
          font-family: 'Courier New', Courier, monospace;
          font-size: 13px;
        }
        .spin {
          animation: rotate 1.5s linear infinite;
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

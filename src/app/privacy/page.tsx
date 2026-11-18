'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Database, Smartphone } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 py-12 px-6 sm:px-12">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-14 shadow-xl border border-slate-200 dark:border-slate-800">
        
        {/* Navigation */}
        <div className="mb-8 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Effective Date: November 2026
          </span>
        </div>

        {/* Title */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-black uppercase tracking-wider mb-4">
            <ShieldCheck size={14} /> Security & Privacy
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Privacy & Data Security Policy
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            How PledgeVault protects your firm&apos;s financial records, customer KYC data, and vault transaction records.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          
          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Lock size={18} className="text-primary" />
              1. Multi-Tenant Cryptographic Isolation
            </h2>
            <p>
              PledgeVault utilizes modern PostgreSQL Row-Level Security (RLS) architecture. Every record in your database—customers, loans, pledge items, receipts, and branch configurations—is tagged with your organization&apos;s unique firm ID. No cross-tenant access is permissible by any user, including staff belonging to other organizations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Database size={18} className="text-primary" />
              2. Customer KYC & Photo Asset Privacy
            </h2>
            <p>
              When your staff registers borrowers and uploads identification documents (Aadhaar, PAN cards, customer selfies, and ornament photos), images are automatically optimized, compressed, and stored in encrypted vault storage. We do not index, search, or make borrower KYC documents publicly discoverable.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone size={18} className="text-primary" />
              3. WhatsApp & Messaging Policy
            </h2>
            <p>
              When you send automated pledge receipts or overdue reminders via WhatsApp (Meta Cloud API, local OpenWA Docker, or direct WhatsApp Desktop app links), customer contact details are used solely to transmit that specific notification. PledgeVault does not collect customer contact lists for third-party marketing or spam.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" />
              4. Local Offline Storage & PWA Caching
            </h2>
            <p>
              To support uninterrupted offline operations in rural or low-connectivity pawn shops, PledgeVault stores temporary operational caches in your browser&apos;s local IndexedDB. This data is protected under browser sandboxing security. When staff signs out, sensitive session tokens are purged immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">5</span>
              Data Retention & Account Deletion
            </h2>
            <p>
              You maintain complete ownership of your data. If your organization decides to terminate its subscription, you can export your historical ledger records or request full data deletion from the system.
            </p>
          </section>

        </div>

        {/* Footer info */}
        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-400">
          <div>© {new Date().getFullYear()} PledgeVault. All rights reserved.</div>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/start-trial" className="hover:text-primary transition-colors">Start Free Trial</Link>
            <Link href="/login" className="hover:text-primary transition-colors">Sign In</Link>
          </div>
        </div>

      </div>
    </div>
  );
}

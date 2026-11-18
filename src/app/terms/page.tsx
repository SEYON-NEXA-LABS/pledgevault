'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, Scale, FileText, CheckCircle2 } from 'lucide-react';

export default function TermsPage() {
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
            <FileText size={14} /> Legal Documentation
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Terms of Service & Disclaimer
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Please read these terms carefully before accessing or utilizing the PledgeVault SaaS application.
          </p>
        </div>

        {/* Highlighted Disclaimer Box */}
        <div className="mb-10 p-6 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3 font-black text-base mb-2">
            <ShieldAlert size={22} className="text-amber-600 dark:text-amber-400 shrink-0" />
            CRITICAL DISCLAIMER: NO FINANCIAL, ASSET, OR FRAUD LIABILITY
          </div>
          <p className="text-xs sm:text-sm leading-relaxed font-semibold">
            PledgeVault is strictly a digital record-keeping software tool. Under no circumstances is PledgeVault, its developers, or affiliates liable for physical gold/silver adulteration, theft, counterfeit collateral, borrower defaults, bad debts, financial loss, or fraudulent activities carried out by customers, shop operators, or employees.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          
          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
              Software Nature & Role
            </h2>
            <p>
              PledgeVault provides a digital ledger, calculation engine, thermal receipt printing, and asset tracking application. PledgeVault is <strong>not</strong> a bank, Non-Banking Financial Company (NBFC), pawnbroker, or licensed lender. PledgeVault does not take custody of, inspect, appraise, or guarantee physical gold, silver, or funds exchanged during transactions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
              Limitation of Liability & Financial Losses
            </h2>
            <p>
              To the fullest extent permitted by applicable law, PledgeVault and its developers shall not be liable for any direct, indirect, incidental, consequential, or punitive damages resulting from:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 font-medium">
              <li>Any financial loss, lost profits, revenue deficits, or bad debts incurred from borrower default.</li>
              <li>Counterfeit, stolen, spuria, adulterated, or misrepresented gold, silver, or jewellery accepted as pledge collateral.</li>
              <li>Discrepancies in weight, karat appraisal, melt value calculations, or market rate variations.</li>
              <li>Network outages, server unavailability, local device malfunctions, or hardware scale connection errors.</li>
              <li>Unauthorized access or data tampering resulting from compromised passwords or internal staff negligence.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
              Operator Verification & Regulatory Compliance
            </h2>
            <p>
              The subscriber (shop owner, firm, or pawnbroker) bears sole responsibility for:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 font-medium">
              <li>Physically testing, weighing, and authenticating all ornaments before disbursing loan amounts.</li>
              <li>Ensuring full compliance with local Moneylenders Acts, state licensing, and Reserve Bank of India (RBI) regulations.</li>
              <li>Adhering to statutory Loan-to-Value (LTV) limits (capped at 85%) and legal maximum interest ceilings.</li>
              <li>Conducting Know Your Customer (KYC) identity verification for all borrowers.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">4</span>
              Staff Permissions & Internal Malpractice
            </h2>
            <p>
              PledgeVault offers multi-branch and role-based staff permissions. You are solely responsible for delegating authority to your staff members. PledgeVault shall not be held liable for internal embezzlement, unauthorized contract modifications, or fraudulent cash disbursements performed by your authorized personnel.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">5</span>
              Data Ownership
            </h2>
            <p>
              Your proprietary business records—including borrower details, loan ledgers, customer contact lists, and transaction histories—belong exclusively to your organization. PledgeVault does not claim ownership, sell, or monetize your confidential customer data.
            </p>
          </section>

        </div>

        {/* Footer info */}
        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-400">
          <div>© {new Date().getFullYear()} PledgeVault. All rights reserved.</div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/start-trial" className="hover:text-primary transition-colors">Start Free Trial</Link>
            <Link href="/login" className="hover:text-primary transition-colors">Sign In</Link>
          </div>
        </div>

      </div>
    </div>
  );
}

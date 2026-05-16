'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabaseService } from '@/lib/supabase/service';
import { formatCurrency, formatWeight } from '@/lib/constants';
import { calculateMonthlyInterestAmount } from '@/lib/interest';
import { 
  ShieldCheck, 
  Calendar, 
  CircleDollarSign, 
  Gem, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  ExternalLink,
  ArrowRight
} from 'lucide-react';

export default function PublicTrackerPage() {
  const { id } = useParams();
  const [loan, setLoan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    supabaseService.getPublicLoanDetails(id as string)
      .then(res => {
        if (res) setLoan(res);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black uppercase tracking-widest text-brand-deep opacity-50">Opening Secure Vault...</p>
        </div>
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="pv-card max-w-md w-full p-10 text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} className="text-destructive" />
          </div>
          <h2 className="text-2xl font-black text-brand-deep mb-4">Identity Not Found</h2>
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
            We couldn't locate a vault record matching this secure link. Please verify the link or contact your branch manager.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="pv-btn pv-btn-primary w-full"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const isOverdue = new Date(loan.dueDate) < new Date();
  const daysRemaining = Math.ceil((new Date(loan.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate live interest up to today
  const startDate = new Date(loan.startDate);
  const now = new Date();
  const monthsElapsed = Math.max(1, (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()));
  const estimatedInterest = (loan.loanAmount * (loan.interestRate / 100)) * monthsElapsed;
  const totalDue = loan.loanAmount + estimatedInterest - (loan.amountPaid || 0);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-brand-primary/30">
      {/* Premium Header Overlay */}
      <div className="absolute top-0 left-0 w-full h-96 bg-linear-to-b from-brand-primary/20 to-transparent pointer-events-none"></div>

      <div className="relative max-w-3xl mx-auto px-6 py-12">
        {/* Branding */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-14 h-14 bg-linear-to-br from-brand-primary to-brand-deep rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-primary/20 mb-6 border border-white/10">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-xs font-black uppercase tracking-[0.3em] text-brand-primary mb-2">PledgeVault Secure</h1>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Global Asset Verification Protocol</p>
        </div>

        {/* The Digital Certificate */}
        <div className="relative pv-card bg-white text-brand-deep p-0 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-0">
          {/* Gold Security Strip */}
          <div className="h-2 bg-linear-to-r from-[#D4AF37] via-[#F9F295] to-[#D4AF37]"></div>
          
          <div className="p-8 sm:p-12">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-12 border-b border-brand-deep/5 pb-12">
              <div>
                <div className="flex items-center gap-2 mb-4">
                   <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${loan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    Status: {loan.status}
                   </div>
                </div>
                <h2 className="text-4xl sm:text-5xl font-black mb-2 tracking-tight">#{loan.loanNumber}</h2>
                <p className="text-brand-deep/50 text-sm font-bold">Issued for: <span className="text-brand-deep">{loan.customerName}</span></p>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black text-brand-deep/30 uppercase tracking-widest mb-1">Asset Value Secured</div>
                <div className="text-3xl font-black text-brand-primary">
                  {formatCurrency(loan.loanAmount)}
                </div>
              </div>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
              <div className="bg-[#f8fafc] p-6 rounded-2xl border border-brand-deep/5">
                <div className="flex items-center gap-3 mb-4 text-brand-deep/40">
                  <Clock size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Time Remaining</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-black ${isOverdue ? 'text-destructive' : 'text-brand-deep'}`}>
                    {isOverdue ? 'Overdue' : daysRemaining}
                  </span>
                  {!isOverdue && <span className="text-xs font-bold text-brand-deep/40">Days</span>}
                </div>
                <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-brand-deep/60">
                   <Calendar size={14} />
                   Due: {new Date(loan.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              <div className="bg-[#f8fafc] p-6 rounded-2xl border border-brand-deep/5">
                <div className="flex items-center gap-3 mb-4 text-brand-deep/40">
                  <CircleDollarSign size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Estimated Redemption</span>
                </div>
                <div className="text-4xl font-black text-brand-deep">
                  {formatCurrency(totalDue)}
                </div>
                <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-brand-deep/60">
                   <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></div>
                   Includes live interest: {formatCurrency(estimatedInterest)}
                </div>
              </div>
            </div>

            {/* Asset Breakdown */}
            <div className="mb-12">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-deep/40 mb-6 flex items-center gap-2">
                <Gem size={14} /> Collateral Assets
              </h3>
              <div className="space-y-3">
                {loan.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-brand-deep/[0.02] rounded-xl border border-brand-deep/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white border border-brand-deep/5 flex items-center justify-center">
                        <Gem size={16} className={item.metalType === 'gold' ? 'text-amber-500' : 'text-slate-400'} />
                      </div>
                      <div>
                        <div className="text-sm font-black capitalize">{item.itemType}</div>
                        <div className="text-[10px] font-bold text-brand-deep/40 uppercase tracking-widest">{item.metalType} • Verified Weight</div>
                      </div>
                    </div>
                    <div className="text-right">
                       <div className="text-sm font-black">{formatWeight(loan.totalNetWeight / (loan.items?.length || 1))}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Footer */}
            <div className="pt-8 border-t border-brand-deep/5 text-center">
              <p className="text-[10px] text-brand-deep/30 font-bold uppercase tracking-[0.2em] mb-4">Certified by PledgeVault Cryptographic Protocol</p>
              <div className="flex justify-center gap-4">
                <div className="flex items-center gap-1 text-[9px] font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                  <ShieldCheck size={12} /> SSL SECURED
                </div>
                <div className="flex items-center gap-1 text-[9px] font-black text-brand-primary bg-brand-soft px-3 py-1.5 rounded-full">
                  <CheckCircle2 size={12} /> AUDIT READY
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 text-center space-y-6">
          <p className="text-white/20 text-[10px] leading-relaxed max-w-lg mx-auto">
            This is a real-time digital representation of your vault record. Physical verification and final redemption calculations will be performed at the branch location. Do not share this secure link with unauthorized parties.
          </p>
          <div className="flex justify-center gap-8">
             <button 
               onClick={() => {
                 if (navigator.share) {
                   navigator.share({
                     title: `Loan Tracking #${loan.loanNumber}`,
                     text: `Track my loan #${loan.loanNumber} live on PledgeVault.`,
                     url: window.location.href
                   });
                 } else {
                   navigator.clipboard.writeText(window.location.href);
                   alert('Tracking link copied!');
                 }
               }}
               className="flex items-center gap-2 text-[11px] font-black text-brand-primary hover:text-white transition-colors uppercase tracking-widest"
             >
               <ExternalLink size={14} /> Share Tracking Link
             </button>
             <button className="flex items-center gap-2 text-[11px] font-black text-brand-primary hover:text-white transition-colors uppercase tracking-widest">
               <ShieldCheck size={14} /> Security Policy
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

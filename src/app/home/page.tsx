'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Zap,
  Building2,
  HandCoins,
  Scale,
  Smartphone,
  Printer,
  TrendingUp,
  MessageCircle,
  Database,
  Globe2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Calculator,
  Lock,
  ChevronRight,
  Layers,
  Award,
  Clock,
  ChevronDown
} from 'lucide-react';

export default function AboutLandingPage() {
  // Demo Loan Calculator State
  const [calcWeight, setCalcWeight] = useState<number>(10); // grams
  const [calcKarat, setCalcKarat] = useState<number>(22);
  const [metalType, setMetalType] = useState<'gold' | 'silver'>('gold');

  const [liveRates, setLiveRates] = useState<{ gold22k: number; gold24k: number; silver: number } | null>(null);

  useEffect(() => {
    import('@/lib/supabase/metalRateService').then(({ metalRateService }) => {
      metalRateService.getLiveRates().then(rates => {
        if (rates) {
          setLiveRates({
            gold24k: rates.gold24k || 7450,
            gold22k: rates.gold22k || 6830,
            silver: rates.silver || 92
          });
        }
      }).catch(err => console.error('Landing page rate fetch failed:', err));
    });
  }, []);

  const gold24kRate = liveRates?.gold24k || 7450;
  const silverRate = liveRates?.silver || 92;

  const getPurityMultiplier = (k: number) => {
    if (metalType === 'silver') return 1;
    return k / 24;
  };

  const marketRatePerGram = metalType === 'gold' ? gold24kRate * getPurityMultiplier(calcKarat) : silverRate;
  const appraisedValue = Math.round(calcWeight * marketRatePerGram);
  const maxLoanAmount = Math.round(appraisedValue * 0.75); // 75% LTV standard

  return (
    <div className="bg-white text-slate-900 min-h-screen font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg shadow-emerald-900/10 group-hover:scale-105 transition-transform overflow-hidden p-1.5">
              <img src="/android-chrome-192x192.png" alt="PledgeVault Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900">PledgeVault</span>
              <span className="text-[9px] font-extrabold uppercase tracking-[0.25em] text-emerald-600">Gold & Silver Ledger</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 font-semibold text-sm text-slate-600">
            <a href="#overview" className="hover:text-emerald-600 transition-colors">Overview</a>
            <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
            <a href="#calculator" className="hover:text-emerald-600 transition-colors">Live Calculator</a>
            <a href="#pricing" className="hover:text-emerald-600 transition-colors">Pricing</a>
            <a href="#security" className="hover:text-emerald-600 transition-colors">Security</a>
            <a href="#localization" className="hover:text-emerald-600 transition-colors">Coimbatore / Tamil UI</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-700 hover:text-emerald-600 hover:bg-slate-50 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/start-trial"
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all flex items-center gap-2"
            >
              Start Free Trial <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section id="overview" className="relative pt-16 pb-24 overflow-hidden bg-linear-to-b from-emerald-50/50 via-white to-white">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-extrabold tracking-wide uppercase mb-8 border border-emerald-200 shadow-xs">
              <Sparkles size={14} className="text-amber-500" />
              <span>Modern Pawn Shop Financial Platform</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
              Replace Paper Registers with a <span className="bg-linear-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">Slick, Local-First Vault</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed mb-10 max-w-2xl">
              PledgeVault simplifies gold and silver pledge management for pawn shops. Automate appraisal valuations, interest yields, thermal receipt printing, and WhatsApp reminders with zero hassle.
            </p>

            <div className="flex flex-col items-center gap-3 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Link
                  href="/start-trial"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/25 hover:shadow-emerald-600/35 transition-all flex items-center justify-center gap-3"
                >
                  Start 30-Day Free Trial <ArrowRight size={18} />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-2 border border-slate-200"
                >
                  Sign In to Vault
                </Link>
              </div>
              <p className="text-xs font-bold text-slate-400 tracking-wide mt-1">
                ✓ No credit card required • Instant private firm setup in 30 seconds
              </p>
            </div>

            {/* Live Ticker Bar */}
            <div className="mt-14 w-full max-w-3xl bg-white rounded-2xl p-4 shadow-xl shadow-slate-900/5 border border-slate-200/80 flex flex-wrap items-center justify-around gap-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  24K
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-slate-400">Gold Live Rate</div>
                  <div className="text-base font-extrabold text-slate-900">₹{gold24kRate.toLocaleString('en-IN')} <span className="text-xs font-semibold text-emerald-600">/ g</span></div>
                </div>
              </div>
              <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
                  Ag
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-slate-400">Silver Live Rate</div>
                  <div className="text-base font-extrabold text-slate-900">₹{silverRate.toLocaleString('en-IN')} <span className="text-xs font-semibold text-emerald-600">/ g</span></div>
                </div>
              </div>
              <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-slate-400">Sync Provider</div>
                  <div className="text-base font-extrabold text-slate-900">Live MCX Feed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Paper Registers vs PledgeVault */}
      <section className="py-20 bg-slate-50 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-3">Why Upgrade?</h2>
            <p className="text-3xl font-black text-slate-900">Built Specifically for Pawn Shop Workflows</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* The Old Way */}
            <div className="bg-white p-8 rounded-3xl border border-red-100 shadow-sm relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center font-bold text-lg mb-6">
                ✕
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Traditional Paper Registers</h3>
              <p className="text-slate-500 text-sm mb-6">Prone to errors, physical damage, and missing customer records.</p>
              <ul className="space-y-3 text-sm text-slate-600 font-medium">
                <li className="flex items-center gap-3 text-red-700/80">
                  <span className="w-2 h-2 rounded-full bg-red-400" /> Manual interest calculations causing shop losses
                </li>
                <li className="flex items-center gap-3 text-red-700/80">
                  <span className="w-2 h-2 rounded-full bg-red-400" /> No instant search for past loans or customer histories
                </li>
                <li className="flex items-center gap-3 text-red-700/80">
                  <span className="w-2 h-2 rounded-full bg-red-400" /> Hard to track overdue pledges and send payment reminders
                </li>
                <li className="flex items-center gap-3 text-red-700/80">
                  <span className="w-2 h-2 rounded-full bg-red-400" /> Risk of data loss from water, fire, or worn pages
                </li>
              </ul>
            </div>

            {/* The PledgeVault Way */}
            <div className="bg-white p-8 rounded-3xl border-2 border-emerald-500/30 shadow-xl shadow-emerald-900/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-bl-2xl">
                The PledgeVault Solution
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg mb-6">
                ✓
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Local-First Digital Ledger</h3>
              <p className="text-slate-500 text-sm mb-6">Instant, offline-ready, and audit-proof financial management.</p>
              <ul className="space-y-3 text-sm text-slate-700 font-semibold">
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> Automated market-linked valuation & interest engines
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> One-click search by customer phone, loan ID, or Aadhaar
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> One-tap WhatsApp reminders for overdue pledges
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> Local PWA offline support with optional encrypted cloud backup
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-3">Feature Highlights</h2>
            <p className="text-4xl font-black text-slate-900 tracking-tight">Everything Your Shop Needs to Scale</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-500/50 hover:bg-white hover:shadow-xl hover:shadow-emerald-900/5 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Scale size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Weighing Scale Integration</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Connect your physical jewel weighing scale directly via USB/Web Serial for instant, tamper-proof weight capture paired with 916/22K purity presets.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-500/50 hover:bg-white hover:shadow-xl hover:shadow-emerald-900/5 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <HandCoins size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Central Interest Engine</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Update interest rates centrally from any location and instantly apply them firm-wide. Supports flat rate, reducing balance, compounding, and custom grace periods.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-500/50 hover:bg-white hover:shadow-xl hover:shadow-emerald-900/5 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Printer size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Thermal & A5 Receipt Printing</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Instant printing support for 80mm thermal receipt printers and standard A5 pledged receipts with legal terms and conditions.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-3xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-500/50 hover:bg-white hover:shadow-xl hover:shadow-emerald-900/5 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageCircle size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">WhatsApp Reminders</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Send manual or automated WhatsApp notice alerts to customers with overdue pledges directly from your shop dashboard.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-3xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-500/50 hover:bg-white hover:shadow-xl hover:shadow-emerald-900/5 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Building2 size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Multi-Location Control</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Seamlessly manage multiple shop locations from any device. Switch branches on the fly, isolate staff per location, and aggregate firm-wide analytics.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-3xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-500/50 hover:bg-white hover:shadow-xl hover:shadow-emerald-900/5 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Live MCX Rate Sync</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Automated daily synchronisation with live MCX market rates for 24K/22K gold and silver to ensure accurate appraisal valuations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Live Interactive Loan Valuation Calculator */}
      <section id="calculator" className="py-24 bg-linear-to-b from-slate-50 via-emerald-50/30 to-slate-50 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl shadow-emerald-950/10 border border-slate-200 overflow-hidden">
            <div className="p-8 sm:p-12 bg-linear-to-r from-emerald-900 to-teal-900 text-white relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
                  <Calculator size={22} />
                </div>
                <h3 className="text-2xl font-black">Live Appraisal Calculator Demo</h3>
              </div>
              <p className="text-emerald-100/80 text-sm max-w-xl">
                Test how PledgeVault calculates gold and silver appraisal values based on current market rates and hallmarks.
              </p>
            </div>

            <div className="p-8 sm:p-12 grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Controls */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">Metal Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setMetalType('gold')}
                      className={`py-3 rounded-xl font-bold text-sm border transition-all ${
                        metalType === 'gold'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Gold (🪙)
                    </button>
                    <button
                      onClick={() => setMetalType('silver')}
                      className={`py-3 rounded-xl font-bold text-sm border transition-all ${
                        metalType === 'silver'
                          ? 'bg-slate-800 text-white border-slate-800 shadow-md shadow-slate-800/20'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Silver (🥈)
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-black uppercase text-slate-500 mb-2">
                    <span>Weight (Grams)</span>
                    <span className="text-emerald-600 font-extrabold text-sm">{calcWeight} g</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>

                {metalType === 'gold' && (
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-2">Purity / Karat</label>
                    <select
                      value={calcKarat}
                      onChange={(e) => setCalcKarat(Number(e.target.value))}
                      className="w-full py-3 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm outline-none focus:border-emerald-500"
                    >
                      <option value={24}>24K (99.9% Purity - Fine Gold)</option>
                      <option value={22}>22K (91.6% Purity - Standard Jewellery)</option>
                      <option value={20}>20K (83.3% Purity)</option>
                      <option value={18}>18K (75.0% Purity)</option>
                    </select>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 font-medium">
                  Rate applied: <span className="font-bold text-slate-800">₹{marketRatePerGram.toLocaleString('en-IN')}/g</span> (Live market benchmark)
                </div>
              </div>

              {/* Output Card */}
              <div className="bg-slate-900 rounded-2xl p-8 text-white flex flex-col justify-between shadow-xl">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Estimated Valuation</div>
                  <div className="text-4xl font-black text-white mb-6">
                    ₹{appraisedValue.toLocaleString('en-IN')}
                  </div>

                  <div className="pt-6 border-t border-slate-800 space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400 font-medium">Max Recommended Loan (75% LTV):</span>
                      <span className="font-extrabold text-amber-400 text-base">₹{maxLoanAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400 font-medium">Est. Monthly Interest (2%):</span>
                      <span className="font-bold text-slate-200">₹{Math.round(maxLoanAmount * 0.02).toLocaleString('en-IN')} / mo</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/start-trial"
                  className="mt-8 py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm text-center transition-all flex items-center justify-center gap-2"
                >
                  Create Custom Appraisal Presets <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Enterprise Security & Reliability */}
      <section id="security" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black uppercase mb-4">
              <Database size={14} /> Enterprise Security
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-6">
              Local-First Resilience with Cloud Redundancy
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed mb-12">
              Pawn shops often deal with patchy local internet. PledgeVault uses an offline-first architecture so your shop keeps running smoothly.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                  <ShieldCheck size={20} />
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-2">Row-Level Security (RLS)</h4>
                <p className="text-slate-500 text-sm">Strict database isolation ensures your shop data remains strictly confidential and segregated.</p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                  <Zap size={20} />
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-2">Local-First Storage</h4>
                <p className="text-slate-500 text-sm">Issue receipts and open new pledge loans seamlessly even without an active internet connection.</p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                  <Lock size={20} />
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-2">Encrypted Cloud Sync</h4>
                <p className="text-slate-500 text-sm">Export local encrypted JSON backups or synchronize automatically to cloud database tables.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Transparent Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-3">Transparent Pricing</h2>
            <p className="text-4xl font-black text-slate-900 tracking-tight">Flexible Plans for Single & Multi-Branch Pawn Shops</p>
            <p className="text-slate-500 font-medium text-sm mt-3">Start with a 30-day free trial. Upgrade or cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Free */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Free Tier</h3>
                <p className="text-slate-500 text-xs mb-6">For single counter shops getting started.</p>
                <div className="text-3xl font-black text-slate-900 mb-6">₹0 <span className="text-xs font-semibold text-slate-400">/ mo</span></div>
                <ul className="space-y-3 text-xs text-slate-600 font-medium mb-8">
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600" /> Up to 50 Active Loans</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600" /> 1 Branch & 1 Staff</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600" /> Local-first PWA access</li>
                </ul>
              </div>
              <Link href="/start-trial" className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-center text-slate-800 transition-all">
                Get Started Free
              </Link>
            </div>

            {/* Starter */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Starter</h3>
                <p className="text-slate-500 text-xs mb-6">Growing pawn shops needing thermal printing.</p>
                <div className="text-3xl font-black text-slate-900 mb-6">₹499 <span className="text-xs font-semibold text-slate-400">/ mo</span></div>
                <ul className="space-y-3 text-xs text-slate-600 font-medium mb-8">
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600" /> Up to 500 Loans</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600" /> 2 Branches & 3 Staff</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600" /> Thermal 80mm receipts</li>
                </ul>
              </div>
              <Link href="/start-trial" className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-center text-slate-800 transition-all">
                Start Free Trial
              </Link>
            </div>

            {/* Pro */}
            <div className="p-8 rounded-3xl bg-slate-900 text-white border-2 border-emerald-500 shadow-xl shadow-emerald-950/10 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-black text-[9px] uppercase px-3 py-1 rounded-bl-xl">
                MOST POPULAR
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Pro</h3>
                <p className="text-slate-400 text-xs mb-6">High-volume shops wanting WhatsApp alerts.</p>
                <div className="text-3xl font-black text-white mb-6">₹999 <span className="text-xs font-semibold text-slate-400">/ mo</span></div>
                <ul className="space-y-3 text-xs text-slate-300 font-medium mb-8">
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> Unlimited Loans</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> 5 Branches & 10 Staff</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> WhatsApp alerts & Live MCX</li>
                </ul>
              </div>
              <Link href="/start-trial" className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-black text-xs text-center text-slate-950 transition-all shadow-md">
                Start 30-Day Free Trial
              </Link>
            </div>

            {/* Elite */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Elite</h3>
                <p className="text-slate-500 text-xs mb-6">Large multi-branch jewelry chains.</p>
                <div className="text-3xl font-black text-slate-900 mb-6">₹1,999 <span className="text-xs font-semibold text-slate-400">/ mo</span></div>
                <ul className="space-y-3 text-xs text-slate-600 font-medium mb-8">
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600" /> Unlimited Everything</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600" /> Custom domain & branding</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600" /> Dedicated priority support</li>
                </ul>
              </div>
              <Link href="/start-trial" className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-center text-slate-800 transition-all">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Tamil UI & Localized for Coimbatore */}
      <section id="localization" className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-extrabold tracking-widest uppercase mb-6 border border-emerald-500/20">
            <Globe2 size={14} /> Tamil Localization
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-6">
            Designed with Tamil UI & Bilingual Receipts
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-12 font-medium">
            Built with ❤️ for pawn shops in Coimbatore and across Tamil Nadu. Toggle language instantly between English and Tamil.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto text-left">
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-amber-400 font-black text-lg mb-2">தமிழ் இடைமுகம்</div>
              <div className="text-slate-300 text-sm font-medium">Full UI support in Tamil for shop staff and operators.</div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-emerald-400 font-black text-lg mb-2">இருமொழி ரசீதுகள்</div>
              <div className="text-slate-300 text-sm font-medium">Print bilingual A5 receipts in Tamil and English for transparency.</div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-teal-400 font-black text-lg mb-2">WhatsApp நினைவூட்டல்</div>
              <div className="text-slate-300 text-sm font-medium">Send Tamil WhatsApp reminder alerts for overdue gold pledges.</div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-sky-400 font-black text-lg mb-2">கோயம்புத்தூர் ஸ்பெஷல்</div>
              <div className="text-slate-300 text-sm font-medium">Tailored for local Coimbatore hallmark presets and interest conventions.</div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Call to Action Footer Banner */}
      <section className="py-20 bg-emerald-600 text-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-black mb-6 tracking-tight">
            Ready to Modernize Your Pawn Shop?
          </h2>
          <p className="text-emerald-100 text-lg mb-10 max-w-xl mx-auto font-medium">
            Start your 30-day trial today. No credit card required. Setup takes less than 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/start-trial"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-base bg-white text-emerald-900 hover:bg-emerald-50 transition-all shadow-xl shadow-emerald-950/20 flex items-center justify-center gap-2"
            >
              Start Free Trial <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-base bg-emerald-700/60 hover:bg-emerald-700 text-white transition-all border border-emerald-500/40 flex items-center justify-center gap-2"
            >
              Sign In to Your Vault
            </Link>
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <img src="/android-chrome-192x192.png" alt="PledgeVault Logo" className="w-6 h-6 object-contain" />
              <span className="font-extrabold text-white">PledgeVault</span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 tracking-wide">
              &copy; {new Date().getFullYear()} <span translate="no" className="font-extrabold text-white">PledgeVault</span>. Developed by <span translate="no">SEYON NEXA LABS</span> (A subsidiary of <Link href="https://nvisionsystems.in" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 underline decoration-dotted text-slate-300" translate="no">NVISION SYSTEMS</Link>).
            </p>
          </div>

          <div className="flex items-center gap-6 font-semibold text-xs">
            <Link href="/home" className="hover:text-white transition-colors">Home</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <Link href="/start-trial" className="hover:text-white transition-colors">Start Trial</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

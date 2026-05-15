import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Activity, RefreshCw, Zap } from 'lucide-react';

import { InputPage }     from './fhd/InputPage';

// Lazy-load all result sections — only downloaded after user clicks Analyze
const Section1Overview         = lazy(() => import('./fhd/Section1Overview').then(m => ({ default: m.Section1Overview })));
const Section2CashFlow         = lazy(() => import('./fhd/Section2CashFlow').then(m => ({ default: m.Section2CashFlow })));
const Section3LoanInsights     = lazy(() => import('./fhd/Section3LoanInsights').then(m => ({ default: m.Section3LoanInsights })));
const Section4Spending         = lazy(() => import('./fhd/Section4Spending').then(m => ({ default: m.Section4Spending })));
const Section5Projection       = lazy(() => import('./fhd/Section5Projection').then(m => ({ default: m.Section5Projection })));
const Section6Debt             = lazy(() => import('./fhd/Section6Debt').then(m => ({ default: m.Section6Debt })));
const Section7Amortization     = lazy(() => import('./fhd/Section7Amortization').then(m => ({ default: m.Section7Amortization })));
const Section8Credit           = lazy(() => import('./fhd/Section8Credit').then(m => ({ default: m.Section8Credit })));
const Section9TaxSavings       = lazy(() => import('./fhd/Section9TaxSavings').then(m => ({ default: m.Section9TaxSavings })));
const Section10AIChat          = lazy(() => import('./fhd/Section10AIChat').then(m => ({ default: m.Section10AIChat })));
const Section11Monitoring      = lazy(() => import('./fhd/Section11Monitoring').then(m => ({ default: m.Section11Monitoring })));
const Section12PeerComparison  = lazy(() => import('./fhd/Section12PeerComparison').then(m => ({ default: m.Section12PeerComparison })));
const Section13Refinance       = lazy(() => import('./fhd/Section12PeerComparison').then(m => ({ default: m.Section13Refinance })));
const Section14Simulator       = lazy(() => import('./fhd/Section14Simulator').then(m => ({ default: m.Section14Simulator })));
const Section15StressTest      = lazy(() => import('./fhd/Section14Simulator').then(m => ({ default: m.Section15StressTest })));
const Section16Arbitrage       = lazy(() => import('./fhd/Section16ProMax').then(m => ({ default: m.Section16Arbitrage })));
const Section17RepaymentMilestones = lazy(() => import('./fhd/Section16ProMax').then(m => ({ default: m.Section17RepaymentMilestones })));
const Section18SurplusSuggester= lazy(() => import('./fhd/Section16ProMax').then(m => ({ default: m.Section18SurplusSuggester })));
const Section19EWS             = lazy(() => import('./fhd/Section19UltraProMax').then(m => ({ default: m.Section19EWS })));
const Section20FreedomPoint    = lazy(() => import('./fhd/Section19UltraProMax').then(m => ({ default: m.Section20FreedomPoint })));

// Minimal section loader — doesn't block layout
function SectionLoader() {
  return <div className="h-32 rounded-2xl bg-slate-800/30 animate-pulse" />;
}

export const fmt  = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
export const pct  = (n) => `${n ?? 0}%`;
export const fadeUp = (delay = 0) => ({ initial:{opacity:0,y:22}, animate:{opacity:1,y:0}, transition:{delay, duration:0.42} });



export default function FinancialHealthDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [file,    setFile]    = useState(null);
  const [error,   setError]   = useState('');
  const [manual,  setManual]  = useState({
    monthly_income:80000, employment_type:'Salaried', dependents:0,
    loan_amount:300000, loan_tenure:36, interest_rate:11, loan_type:'Personal', emi_amount:15000,
    rent:15000, utilities:4000, food:7000, transport:3000, insurance:2000, other_expenses:5000,
    credit_card_payments:5000, existing_loans:0, number_of_active_loans:1,
    account_balance:150000, current_savings:300000, credit_utilization:30,
  });

  const [activeSection, setActiveSection] = useState('Overview');
  const sectionsRef = useRef({});

  useEffect(() => {
    if (!data) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.dataset.section);
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    Object.values(sectionsRef.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [data]);

  const handleAnalyze = async () => {
    setError('');
    if (!manual.monthly_income || !manual.emi_amount || !manual.loan_tenure) {
      setError('Monthly Income, EMI Amount and Loan Tenure are required.'); return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('manual_data', JSON.stringify(manual));
      if (file) { fd.append('file', file); fd.append('file_type', file.name.split('.').pop().toLowerCase()); }
      const res  = await fetch('http://127.0.0.1:5001/api/financial-health/analyze', { method:'POST', body:fd });
      const json = await res.json();
      if (json.features) setData(json);
      else setError(json.error || 'Backend error — check Flask terminal');
    } catch(e) { setError('Cannot connect to backend. Is Flask running?'); }
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#070b14] text-white gap-5">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping"/>
        <div className="absolute inset-2 rounded-full border-4 border-t-emerald-500 border-transparent animate-spin"/>
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1">Analyzing Financial Profile</h2>
        <p className="text-slate-400 text-sm">{file ? 'Parsing statement + running ML…' : 'Running 11-feature ML analysis…'}</p>
      </div>
    </div>
  );

  if (!data) return (
    <InputPage manual={manual} setManual={setManual} file={file} setFile={setFile}
      error={error} onAnalyze={handleAnalyze} />
  );

  const f  = data.features;
  const d  = data.extractedData;
  const cf = data.cashFlow || {};

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <div className="max-w-7xl mx-auto px-5 py-8 space-y-12">

        {/* Top Bar — plain div, no framer overhead needed */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 text-emerald-400 text-xs font-semibold mb-2">
              <Zap className="w-3 h-3"/> 6 ML Models · 11 Features · AI Advisor
            </div>
            <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
              Financial Health Report
            </h1>
            <p className="text-slate-500 text-sm mt-1">{new Date().toLocaleDateString('en-IN',{dateStyle:'long'})}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {(data.alerts||[]).slice(0,2).map((a,i) => (
              <div key={i} className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${
                a.type==='danger'  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                a.type==='warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                {a.msg}
              </div>
            ))}
            <button onClick={()=>setData(null)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all">
              <RefreshCw className="w-3.5 h-3.5"/> New Analysis
            </button>
          </div>
        </div>

        {/* Sections — each wrapped in Suspense for progressive rendering */}
        <Suspense fallback={<SectionLoader />}>
          <div ref={el => sectionsRef.current['overview'] = el} data-section="Financial Health Overview"><Section1Overview  data={data} /></div>
          <div ref={el => sectionsRef.current['cashflow'] = el} data-section="Cash Flow Analysis"><Section2CashFlow  data={data} /></div>
          <div ref={el => sectionsRef.current['loaninsights'] = el} data-section="Loan Insights"><Section3LoanInsights data={data} /></div>
          <div ref={el => sectionsRef.current['spending'] = el} data-section="Spending Behavior"><Section4Spending  data={data} /></div>
          <div ref={el => sectionsRef.current['projection'] = el} data-section="Future Projections"><Section5Projection data={data} /></div>
          <div ref={el => sectionsRef.current['debt'] = el} data-section="Debt to Income Ratio"><Section6Debt      data={data} /></div>
          <div ref={el => sectionsRef.current['amort'] = el} data-section="Amortization Schedule"><Section7Amortization data={data} /></div>
          <div ref={el => sectionsRef.current['credit'] = el} data-section="Credit Utilization"><Section8Credit    data={data} /></div>
          <div ref={el => sectionsRef.current['tax'] = el} data-section="Tax Savings"><Section9TaxSavings data={data} /></div>
          <div ref={el => sectionsRef.current['monitor'] = el} data-section="Live Monitoring Rules"><Section11Monitoring data={data} /></div>
          <div ref={el => sectionsRef.current['peer'] = el} data-section="Peer Comparison"><Section12PeerComparison data={data} /></div>
          <div ref={el => sectionsRef.current['refinance'] = el} data-section="Refinance Opportunities"><Section13Refinance data={data} /></div>
          <div ref={el => sectionsRef.current['simulator'] = el} data-section="Payment Simulator"><Section14Simulator data={data} /></div>
          <div ref={el => sectionsRef.current['stress'] = el} data-section="Stress Test Scenarios"><Section15StressTest data={data} /></div>
          <div ref={el => sectionsRef.current['arbitrage'] = el} data-section="Investment Arbitrage"><Section16Arbitrage data={data} /></div>
          <div ref={el => sectionsRef.current['milestones'] = el} data-section="Repayment Milestones"><Section17RepaymentMilestones data={data} /></div>
          <div ref={el => sectionsRef.current['surplus'] = el} data-section="Monthly Surplus Allocator"><Section18SurplusSuggester data={data} /></div>
          <div ref={el => sectionsRef.current['ews'] = el} data-section="Early Warning System"><Section19EWS data={data} /></div>
          <div ref={el => sectionsRef.current['freedom'] = el} data-section="Financial Freedom Path"><Section20FreedomPoint data={data} /></div>
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <Section10AIChat data={data} manual={manual} activeSection={activeSection} />
      </Suspense>
    </div>
  );
}


import React from 'react';
import { Card, SectionTitle, fmt } from '../drp/shared';
import { 
  Activity, ShieldMinus, Zap, Clock, Frown, Coffee, Globe, Compass, 
  Users, AlertTriangle, FileCheck, Anchor, ArrowRight,
  TrendingUp, Scale, Coins, Network
} from 'lucide-react';

export function Section8BounceRisk({ result }) {
  const data = result?.bounce_risk;
  if (!data) return null;
  return (
    <section>
      <SectionTitle n={8} title="EMI Bounce Risk Predictor" subtitle="Testing your resilience against sudden job loss"/>
      <Card className={data.risk_profile === 'High Risk' ? 'border-rose-500/20 bg-rose-500/5' : ''}>
         <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-full ${data.risk_profile === 'High Risk' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
               <Activity className="w-8 h-8" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Survival Buffer</p>
               <p className="text-3xl font-black text-white">{data.survival_months} <span className="text-sm text-slate-400">Months</span></p>
            </div>
         </div>
         <p className="text-sm font-bold text-slate-300 leading-relaxed border-t border-white/5 pt-4">
            {data.message}
         </p>
      </Card>
    </section>
  );
}

export function Section9TaxShield({ result }) {
  const data = result?.tax_shield;
  if (!data) return null;
  return (
    <section>
      <SectionTitle n={9} title="Tax Shield Benefits" subtitle="Government exemptions reducing the effective cost of your loan"/>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="flex flex-col justify-center">
            <ShieldMinus className={`w-10 h-10 mb-4 ${data.status === 'Eligible' ? 'text-cyan-400' : 'text-slate-500'}`} />
            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Eligibility Status</p>
            <p className={`text-2xl font-black ${data.status === 'Eligible' ? 'text-cyan-400' : 'text-white'}`}>{data.status}</p>
         </Card>
         <Card className="bg-cyan-500/5 border-cyan-500/20">
            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">{data.section}</p>
            <p className="text-2xl font-black text-white mb-2">{data.max_deduction}</p>
            <p className="text-xs text-slate-400 font-medium">{data.benefit}</p>
         </Card>
      </div>
    </section>
  );
}

export function Section10Prepayment({ result }) {
  const data = result?.prepayment_sim;
  if (!data) return null;
  return (
    <section>
      <SectionTitle n={10} title="Pre-Payment Foreclosure Simulator" subtitle="Mathematical impact of paying 1 extra EMI per year"/>
      <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
         <div className="absolute right-0 top-0 p-6 opacity-20 pointer-events-none"><Zap className="w-32 h-32 text-indigo-400" /></div>
         <p className="text-[10px] font-black uppercase text-indigo-400 mb-6 tracking-widest">{data.strategy}</p>
         
         <div className="flex flex-col md:flex-row gap-8 mb-6">
            <div>
               <p className="text-xs font-bold text-slate-500 uppercase mb-1">Interest Saved</p>
               <p className="text-4xl font-black text-white">₹{data.interest_saved.toLocaleString()}</p>
            </div>
            <div>
               <p className="text-xs font-bold text-slate-500 uppercase mb-1">Tenure Reduction</p>
               <p className="text-4xl font-black text-indigo-400">{data.tenure_reduction}</p>
            </div>
         </div>
         <p className="text-sm text-indigo-200/80 font-medium max-w-lg">{data.message}</p>
      </Card>
    </section>
  );
}

export function Section11Refinance({ result }) {
  const data = result?.refinancing_horizon;
  if (!data) return null;
  return (
    <section>
      <SectionTitle n={11} title="Optimal Refinancing Horizon" subtitle="When is the mathematical turning point for a Balance Transfer?"/>
      <Card className="flex items-center gap-6">
         <div className="p-4 bg-slate-800 rounded-full border border-white/10 shrink-0">
            <Clock className="w-8 h-8 text-amber-400" />
         </div>
         <div>
            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Target Action Date</p>
            <p className="text-2xl font-black text-white mb-1">Month {data.optimal_month}</p>
            <p className="text-xs font-bold text-slate-400 mb-2">Required Rate Drop: <span className="text-amber-400">{data.rate_drop_required}</span></p>
            <p className="text-xs text-slate-500">{data.message}</p>
         </div>
      </Card>
    </section>
  );
}

export function Section12HiddenFees({ result }) {
  const data = result?.hidden_fees;
  if (!data) return null;
  return (
    <section>
      <SectionTitle n={12} title="Hidden Fees & Processing Analysis" subtitle="The true disbursed amount after bank deductions"/>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="opacity-70">
            <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Processing Fee (Est)</p>
            <p className="text-2xl font-black text-white">₹{data.processing_fee_est.toLocaleString()}</p>
         </Card>
         <Card className="opacity-70">
            <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Forced Insurance (Est)</p>
            <p className="text-2xl font-black text-white">₹{data.forced_insurance_est.toLocaleString()}</p>
         </Card>
         <Card className="border-rose-500/20 bg-rose-500/5">
            <p className="text-[10px] font-black uppercase text-rose-400/80 mb-2">Actual Funds Received</p>
            <p className="text-3xl font-black text-rose-400">₹{data.actual_disbursed.toLocaleString()}</p>
         </Card>
      </div>
      <p className="text-xs font-bold text-slate-500 text-center mt-6 italic">{data.message}</p>
    </section>
  );
}

export function Section13Lifestyle({ result }) {
  const data = result?.lifestyle_inflation_cap;
  if (!data) return null;
  return (
    <section>
      <SectionTitle n={13} title="Lifestyle Inflation Cap" subtitle="How much your discretionary spending must shrink to afford this EMI safely"/>
      <Card className={`border-l-4 ${data.status === 'Severe Cutbacks Required' ? 'border-amber-500 bg-amber-500/5' : 'border-emerald-500 bg-emerald-500/5'}`}>
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
               <Coffee className={`w-6 h-6 ${data.status === 'Severe Cutbacks Required' ? 'text-amber-400' : 'text-emerald-400'}`} />
               <h3 className="text-sm font-black text-white uppercase italic">Monthly Squeeze Capacity</h3>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-black/40 ${data.status === 'Severe Cutbacks Required' ? 'text-amber-400' : 'text-emerald-400'}`}>{data.status}</span>
         </div>
         <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Max Discretionary Budget</p>
         <p className="text-4xl font-black text-white mb-4">₹{data.discretionary_budget.toLocaleString()}</p>
         <p className="text-sm font-medium text-slate-300 border-t border-white/5 pt-4">{data.message}</p>
      </Card>
    </section>
  );
}

export function Section14Macro({ result }) {
  const data = result?.macro_rate_cycle;
  if (!data) return null;
  return (
    <section>
      <SectionTitle n={14} title="Macro-Economic Rate Cycle" subtitle="Is it a good economic climate to take a fixed or floating loan?"/>
      <Card>
         <div className="flex items-center gap-4 mb-6">
            <Globe className="w-8 h-8 text-blue-400" />
            <div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Current Cycle</p>
               <p className="text-xl font-black text-white">{data.cycle}</p>
            </div>
         </div>
         <div className="p-4 bg-slate-900 rounded-xl border border-white/5 flex justify-between items-center mb-4">
            <p className="text-xs font-black uppercase text-slate-400">System Recommendation</p>
            <p className="text-sm font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1.5 rounded">{data.recommended_type}</p>
         </div>
         <p className="text-xs text-slate-400 leading-relaxed font-medium">{data.message}</p>
      </Card>
    </section>
  );
}

export function Section15DebtStrategy({ result }) {
  const data = result?.debt_strategy;
  if (!data) return null;
  return (
    <section>
      <SectionTitle n={15} title="Debt Repayment Strategy" subtitle="Snowball vs Avalanche Action Plan"/>
      <Card className="text-center py-10">
         <Compass className="w-16 h-16 mx-auto text-purple-400 mb-6 opacity-80" />
         <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] mb-2">Optimised Repayment Engine</p>
         <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6">
            {data.recommended_method}
         </p>
         <p className="text-sm text-slate-400 max-w-md mx-auto">{data.logic}</p>
      </Card>
    </section>
  );
}

export function Section16PeerBenchmarking({ result }) {
  const data = result?.peer_benchmarking;
  if (!data) return null;
  return (
    <section>
      <SectionTitle n={16} title="Peer Group Benchmarking" subtitle="How your intended EMI burden compares to similar income demographics"/>
      <Card>
         <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="p-4 bg-slate-800 rounded-full">
                  <Users className="w-6 h-6 text-cyan-400" />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Peer Group Delta</p>
                  <p className="text-2xl font-black text-white">{data.delta}% {data.comparison}</p>
               </div>
            </div>
         </div>
         <p className="text-sm font-medium text-slate-400 mt-6 border-t border-white/5 pt-4">{data.message}</p>
      </Card>
    </section>
  );
}

export function Section17EmergencyBuffer({ result }) {
  const data = result?.emergency_buffer;
  if (!data) return null;
  return (
    <section>
      <SectionTitle n={17} title="Emergency Fund Prerequisite" subtitle="Minimum safe liquid capital required before signing loan agreements"/>
      <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
         <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Safety Net</h3>
         </div>
         <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Required Liquid Assets</p>
         <p className="text-5xl font-black text-white mb-2">₹{data.required_liquid.toLocaleString()}</p>
         <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-6">{data.breakdown}</p>
         <p className="text-sm text-slate-300 font-medium">{data.message}</p>
      </Card>
    </section>
  );
}

export function Section18Negotiation({ result }) {
  const data = result?.negotiation_leverage;
  if (!data) return null;
  return (
    <section>
      <SectionTitle n={18} title="Negotiation Leverage Score" subtitle="Quantifying your bargaining power against bank relationship managers"/>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="text-center">
            <p className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-[0.2em]">AI Leverage Score</p>
            <div className="w-32 h-32 rounded-full border-[8px] border-slate-800 flex items-center justify-center mx-auto mb-4 relative">
               <div className="absolute inset-0 rounded-full border-[8px] border-indigo-500" style={{ clipPath: `inset(${100 - data.score}% 0 0 0)`}} />
               <p className="text-4xl font-black text-white">{data.score}</p>
            </div>
            <p className={`text-sm font-black uppercase tracking-widest ${data.score > 70 ? 'text-indigo-400' : 'text-slate-400'}`}>{data.status}</p>
         </Card>
         <Card className="flex flex-col justify-center">
            <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
               <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-3">Tactical Advice</p>
               <p className="text-sm font-bold text-slate-300 leading-relaxed">{data.message}</p>
            </div>
         </Card>
      </div>
    </section>
  );
}

export function Section19AltFinancing({ result }) {
  const data = result?.alternative_financing;
  if (!data) return null;
  return (
    <section>
      <SectionTitle n={19} title="Superior Alternative Financing" subtitle="Cheaper funding sources detected in the market"/>
      <Card className="flex items-center gap-6">
         <div className="px-6 py-8 bg-slate-800 rounded-3xl shrink-0 text-center border border-white/5">
            <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Est Rate</p>
            <p className="text-2xl font-black text-emerald-400">{data.estimated_rate}</p>
         </div>
         <div>
            <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1">Recommended Alternative</p>
            <p className="text-2xl font-black text-white mb-2">{data.primary_alternative}</p>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">{data.message}</p>
         </div>
      </Card>
    </section>
  );
}

export function Section20PostApproval({ result }) {
  const data = result?.post_approval_plan;
  if (!data) return null;
  return (
    <section>
      <SectionTitle n={20} title="Post-Approval Underwriter Checklist" subtitle="Critical defense steps prior to loan disbursement"/>
      <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent">
         <div className="flex items-center gap-3 mb-6">
            <FileCheck className="w-6 h-6 text-cyan-400" />
            <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Disbursement Protocol</h3>
         </div>
         <div className="space-y-4">
            {data.map((item, i) => (
               <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-black/40 border border-white/5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-xs shrink-0">
                     {item.step ?? i + 1}
                  </div>
                  <div className="flex-1">
                     <p className="text-sm font-black text-white mb-1">{item.title ?? item}</p>
                     {item.action && <p className="text-xs text-slate-400 leading-relaxed">{item.action}</p>}
                  </div>
                  {item.priority && (
                     <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full shrink-0 ${
                        item.priority === 'Critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                     }`}>{item.priority}</span>
                  )}
               </div>
            ))}
         </div>
      </Card>
    </section>
  );
}

// ULTRA-PRO-MAX SECTIONS
export function Section21Arbitrage({ result }) {
  const data = result?.arbitrage;
  if (!data) return null;
  return (
    <section>
      <SectionTitle n={21} title="Yield Curve Arbitrage" subtitle="Exploiting the cost of debt vs historical equity returns"/>
      <Card className="flex flex-col md:flex-row items-center gap-8 justify-between bg-gradient-to-r from-purple-500/5 to-transparent border-purple-500/20">
         <div>
            <div className="flex items-center gap-3 mb-4">
               <TrendingUp className="w-8 h-8 text-purple-400" />
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Spread Calculus</p>
                  <p className="text-3xl font-black text-white">{data.spread} <span className="text-sm text-purple-400">+Alpha</span></p>
               </div>
            </div>
            <p className="text-sm font-medium text-slate-300 leading-relaxed max-w-sm">{data.message}</p>
         </div>
         <div className="px-6 py-4 bg-black/50 border border-white/5 rounded-2xl shrink-0 text-center shadow-2xl">
            <p className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Trade Viability</p>
            <p className={`text-xl font-black uppercase tracking-tighter ${data.viable === 'Highly Viable' ? 'text-emerald-400' : 'text-rose-400'}`}>{data.viable}</p>
         </div>
      </Card>
    </section>
  );
}

export function Section22Inflation({ result }) {
  const data = result?.inflation_impact;
  if (!data) return null;
  return (
    <section>
      <SectionTitle n={22} title="Real-Time Inflation Devaluation" subtitle="How inflation mathematically destroys your future EMI burden"/>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="text-center group overflow-hidden relative">
            <p className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest relative z-10">Current EMI</p>
            <p className="text-5xl font-black text-rose-400 opacity-60 line-through relative z-10">₹{data.current_emi_value.toLocaleString()}</p>
         </Card>
         <Card className="text-center bg-cyan-500/10 border border-cyan-500/30 group overflow-hidden relative shadow-[0_0_30px_rgba(34,211,238,0.15)]">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
            <p className="text-[10px] font-black uppercase text-cyan-400 mb-4 tracking-widest relative z-10">Real Future Value</p>
            <p className="text-5xl font-black text-white relative z-10">₹{data.future_emi_real_value.toLocaleString()}</p>
         </Card>
      </div>
      <p className="text-xs font-bold text-slate-400 text-center mt-6 italic">{data.message}</p>
    </section>
  );
}

export function Section23Liquidation({ result }) {
  const data = result?.liquidation;
  if (!data) return null;
  return (
    <section>
      <SectionTitle n={23} title="Alternative Asset Liquidation" subtitle="Capital gains tax destruction vs taking new debt"/>
      <Card className="flex items-start gap-4">
         <div className="p-4 bg-slate-800 rounded-full shrink-0 border border-white/10">
            <Scale className="w-8 h-8 text-emerald-400" />
         </div>
         <div className="w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Forced Liquidation Tax</p>
                  <p className="text-xl font-black text-white">{data.tax_implication}</p>
               </div>
               <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 shrink-0">
                  <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">{data.recommendation}</p>
               </div>
            </div>
            <p className="text-sm font-medium text-slate-400 leading-relaxed border-t border-white/5 pt-4">{data.message}</p>
         </div>
      </Card>
    </section>
  );
}

export function Section24CareerRisk({ result }) {
  const data = result?.career_risk;
  if (!data) return null;
  return (
    <section>
      <SectionTitle n={24} title="Geopolitical & AI Career Risk" subtitle="Systemic macro-shocks that could eradicate your capacity to repay"/>
      <Card className={`border-t-4 ${data.tenure_risk === 'Dangerous Mismatch' ? 'border-rose-500 bg-gradient-to-b from-rose-500/5 to-transparent' : 'border-indigo-500 bg-gradient-to-b from-indigo-500/5 to-transparent'}`}>
         <div className="flex items-center gap-3 mb-4">
            <Network className={`w-5 h-5 ${data.tenure_risk === 'Dangerous Mismatch' ? 'text-rose-400' : 'text-indigo-400'}`} />
            <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Systemic Exposure</h3>
         </div>
         <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
               <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Sector Risk</p>
               <p className="text-lg font-black text-white">{data.industry_exposure}</p>
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Tenure Vulnerability</p>
               <p className={`text-lg font-black ${data.tenure_risk === 'Dangerous Mismatch' ? 'text-rose-400' : 'text-white'}`}>{data.tenure_risk}</p>
            </div>
         </div>
         <p className="text-sm font-medium text-slate-400">{data.message}</p>
      </Card>
    </section>
  );
}

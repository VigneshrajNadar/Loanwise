import React from 'react';
import { Card, SectionTitle } from '../drp/shared';
import { Target, FileWarning, Building2, Fingerprint, Lock } from 'lucide-react';

export function SectionQuota({ result }) {
  const data = result?.quota_volatility;
  if (!data) return null;
  return (
    <section>
      <SectionTitle n={16} title="Underwriter Quota Volatility" subtitle="Exploiting month-end bank lending targets for higher approval odds"/>
      <Card className="flex flex-col md:flex-row items-center gap-8 justify-between bg-gradient-to-r from-emerald-500/5 to-transparent border-emerald-500/20">
         <div>
            <div className="flex items-center gap-3 mb-4">
               <Target className="w-8 h-8 text-emerald-400" />
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Optimal Strike Window</p>
                  <p className="text-3xl font-black text-white">{data.optimal_application_window}</p>
               </div>
            </div>
            <p className="text-sm font-medium text-slate-300 leading-relaxed max-w-sm">{data.message}</p>
         </div>
         <div className="px-6 py-4 bg-black/50 border border-white/5 rounded-2xl shrink-0 text-center shadow-2xl">
            <p className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Historical Lift</p>
            <p className="text-xl font-black uppercase tracking-tighter text-emerald-400">{data.approval_delta}</p>
         </div>
      </Card>
    </section>
  );
}

export function SectionCovenant({ result }) {
  const data = result?.covenant_breach;
  if (!data) return null;
  return (
    <section>
      <SectionTitle n={17} title="Covenant Breach Probability" subtitle="Vulnerability to obscure cross-default subclauses"/>
      <Card className={`border-t-4 ${data.cross_default_risk === 'Elevated' ? 'border-amber-500 bg-gradient-to-b from-amber-500/5 to-transparent' : 'border-blue-500 bg-gradient-to-b from-blue-500/5 to-transparent'}`}>
         <div className="flex items-center gap-3 mb-4">
            <FileWarning className={`w-5 h-5 ${data.cross_default_risk === 'Elevated' ? 'text-amber-400' : 'text-blue-400'}`} />
            <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Legal Vulnerability</h3>
         </div>
         <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
               <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Cross-Default Risk</p>
               <p className={`text-lg font-black ${data.cross_default_risk === 'Elevated' ? 'text-amber-400' : 'text-white'}`}>{data.cross_default_risk}</p>
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Hidden Clause Exposure</p>
               <p className="text-lg font-black text-white">{data.hidden_clause_exposure}</p>
            </div>
         </div>
         <p className="text-sm font-medium text-slate-400">{data.message}</p>
      </Card>
    </section>
  );
}

export function SectionLiquidity({ result }) {
  const data = result?.bank_liquidity;
  if (!data) return null;
  return (
    <section>
      <SectionTitle n={18} title="Lender Capital Adequacy" subtitle="Macro-banking systemic liquidity signaling lending aggressiveness"/>
      <Card className="flex items-start gap-4">
         <div className="p-4 bg-slate-800 rounded-full shrink-0 border border-white/10">
            <Building2 className="w-8 h-8 text-cyan-400" />
         </div>
         <div className="w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 mb-1">CAR Status</p>
                  <p className="text-xl font-black text-white">{data.tier_1_capital_status}</p>
               </div>
               <div className="px-4 py-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 shrink-0">
                  <p className="text-[10px] font-black uppercase text-cyan-400 tracking-widest">{data.market_willingness}</p>
               </div>
            </div>
            <p className="text-sm font-medium text-slate-400 leading-relaxed border-t border-white/5 pt-4">{data.message}</p>
         </div>
      </Card>
    </section>
  );
}

export function SectionFraudAudit({ result }) {
  const data = result?.fraud_audit;
  if (!data) return null;
  return (
    <section>
      <SectionTitle n={19} title="Synthetic Identity Fraud Audit" subtitle="Simulated ML checks against anti-money laundering (AML) firewalls"/>
      <Card className="grid grid-cols-1 md:grid-cols-2 gap-6 relative overflow-hidden group border-rose-500/10">
         <div className="absolute right-0 top-0 opacity-5 group-hover:opacity-10 transition-opacity">
            <Fingerprint className="w-48 h-48 text-rose-500" />
         </div>
         <div className="relative z-10 text-center bg-black/40 rounded-2xl p-6 border border-white/5">
            <p className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em]">Synthetic Mismatch Flag</p>
            <p className={`text-3xl font-black ${data.bureau_mismatch_prob === 'Flagged' ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>{data.bureau_mismatch_prob}</p>
         </div>
         <div className="relative z-10">
            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">AI Trust Score</p>
            <p className="text-2xl font-black text-white mb-4">{data.synthetic_risk_score} <span className="text-xs text-rose-400/50">Risk Metric</span></p>
            <p className="text-sm font-medium text-slate-300 leading-relaxed border-t border-white/5 pt-4">{data.message}</p>
         </div>
      </Card>
    </section>
  );
}

export function SectionEscrow({ result }) {
  const data = result?.quantum_escrow;
  if (!data) return null;
  return (
    <section>
      <SectionTitle n={20} title="Quantum Escrow Readiness" subtitle="Smart contract and zero-trust automated disbursement compatibility"/>
      <Card className="bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent border-indigo-500/20 group">
         <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
               <Lock className="w-6 h-6 text-indigo-400" />
               <h3 className="text-sm font-black text-white uppercase tracking-tighter">Zero-Trust Network</h3>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Ledger Status</p>
               <p className="text-xl font-black text-indigo-400">{data.ledger_deployment}</p>
            </div>
         </div>
         <div className="mb-4">
            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Smart Contract Compatibility</p>
            <p className={`text-2xl font-black ${data.smart_contract_compatible === 'Verified' ? 'text-emerald-400' : 'text-amber-400'}`}>{data.smart_contract_compatible}</p>
         </div>
         <p className="text-sm font-medium text-slate-400 border-t border-white/5 pt-4">{data.message}</p>
      </Card>
    </section>
  );
}

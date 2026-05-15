import React from 'react';
import { Card, SectionTitle, fmt } from './shared';

export function Section9TaxSavings({ data }) {
  const tx = data.taxSavings || {};

  return (
    <section>
      <SectionTitle n={9} title="Tax Savings Strategy" subtitle="Maximize Indian IT deductions on your loan"/>
      <Card delay={0.05}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-white">Tax Benefits ({tx.loanType} Loan)</h3>
          <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
            Optimized for FY 2024-25
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {(tx.sections||[]).map((s,i)=>(
              <div key={i} className="flex items-start justify-between p-4 bg-slate-900/40 border border-slate-800/50 rounded-2xl hover:bg-slate-900/60 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${s.applicable > 0 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-600'}`}/>
                    <p className="text-sm font-black text-white">Section {s.section}</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{s.desc}</p>
                  {s.maxLimit && <p className="text-[10px] text-slate-500 mt-1 font-medium">Limit: {fmt(s.maxLimit)}</p>}
                </div>
                <div className="text-right ml-4">
                  <p className={`text-base font-black ${s.applicable > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {fmt(s.applicable)}
                  </p>
                  {s.applicable === 0 && (
                    <p className="text-[9px] text-slate-600 font-bold uppercase mt-0.5">Not Applicable</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-center flex flex-col items-center justify-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Total Deduction</p>
                <p className="text-3xl font-black text-emerald-400">{fmt(tx.totalDeduction)}</p>
              </div>
              <div className="p-5 bg-teal-500/5 border border-teal-500/10 rounded-2xl text-center flex flex-col items-center justify-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Estimated Tax Saved</p>
                <p className="text-3xl font-black text-teal-400">{fmt(tx.estimatedTaxSaved)}</p>
              </div>
            </div>
            
            <div className="flex-1 p-5 rounded-2xl bg-[#1e293b]/30 border border-slate-800 flex items-start gap-3">
              <span className="text-2xl mt-1">💡</span>
              <div>
                <p className="text-xs font-bold text-slate-200 mb-1">Expert Tax Tip</p>
                <p className="text-sm text-slate-400 leading-relaxed">{tx.tip}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}

import React from 'react';
import { Card, SectionTitle, fmt, pct } from './shared';

export function Section8Credit({ data }) {
  const ch = data.creditHealth || {};
  const nw = data.netWorth    || {};
  const score = ch.estimatedScore || 0;
  const pctScore = Math.round(((score - 300) / 600) * 100);

  return (
    <section>
      <SectionTitle n={8} title="Credit Health & Net Worth" subtitle="CIBIL-estimate, utilization, net worth snapshot"/>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Credit Health */}
        <Card delay={0.05}>
          <h3 className="font-semibold text-white mb-4">Estimated Credit Score</h3>
          <div className="flex items-center gap-6 mb-5">
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3"/>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={ch.scoreColor||'#10b981'}
                  strokeWidth="3" strokeDasharray={`${pctScore} ${100-pctScore}`} strokeLinecap="round"/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black" style={{color:ch.scoreColor}}>{score}</span>
                <span className="text-xs text-slate-400">{ch.scoreLabel}</span>
              </div>
            </div>
            <div className="space-y-3 flex-1">
              {[
                { label:'Credit Utilization', val:`${ch.utilization}%`, warn:ch.utilization>30 },
                { label:'Late Payments',      val:ch.delays||0,         warn:ch.delays>0 },
                { label:'Active Loans',       val:ch.activeLoans||0,    warn:ch.activeLoans>3 },
              ].map(({label,val,warn})=>(
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className={`text-xs font-bold ${warn?'text-amber-400':'text-emerald-400'}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Improvement Tips</p>
            {(ch.tips||[]).map((t,i)=>(
              <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="text-teal-400 font-bold mt-0.5">→</span>{t}
              </div>
            ))}
          </div>
        </Card>

        {/* Net Worth */}
        <Card delay={0.08}>
          <h3 className="font-semibold text-white mb-5">Net Worth Snapshot</h3>
          {[
            { label:'Total Assets',      val:fmt(nw.assets),      color:'text-emerald-400', bg:'bg-emerald-500/10 border-emerald-500/20' },
            { label:'Total Liabilities', val:fmt(nw.liabilities), color:'text-rose-400',    bg:'bg-rose-500/10 border-rose-500/20' },
          ].map(({label,val,color,bg})=>(
            <div key={label} className={`p-4 rounded-xl border mb-3 ${bg}`}>
              <p className="text-xs text-slate-400 mb-1">{label}</p>
              <p className={`text-2xl font-black ${color}`}>{val}</p>
            </div>
          ))}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <p className="text-xs text-slate-400 mb-1">Net Worth (Assets − Liabilities)</p>
            <p className={`text-3xl font-black ${nw.netWorth>=0?'text-emerald-400':'text-rose-400'}`}>{fmt(nw.netWorth)}</p>
            <p className="text-xs text-slate-500 mt-1">{nw.netWorth>=0?'Positive net worth — keep growing!':'Outstanding loan exceeds current assets'}</p>
          </div>
        </Card>
      </div>
    </section>
  );
}

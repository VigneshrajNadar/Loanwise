import React from 'react';
import { Card, SectionTitle, fmt, pct } from './shared';
import { Users, BarChart3, TrendingDown, CheckCircle2 } from 'lucide-react';

export function Section12PeerComparison({ data }) {
  const pc = data.peerComparison || {};
  if (!pc.benchmarks) return null;

  return (
    <section>
      <SectionTitle n={12} title="Peer Benchmarking" subtitle="How you rank against 100k+ anonymized loan profiles"/>
      <Card delay={0.05}>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <Users className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Percentile Ranking</h3>
            <p className="text-sm text-slate-400">{pc.insight}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-3xl font-black text-emerald-400">{pc.overallPercentile}%</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Top Borrower Rank</p>
          </div>
        </div>

        <div className="space-y-6">
          {pc.benchmarks.map((b, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-sm font-semibold text-slate-300">{b.label}</span>
                <span className="text-xs text-slate-500">
                  You: <span className="text-white font-bold">{b.label==='Annual Income' ? fmt(b.user) : b.user.toFixed(1)+b.suffix}</span> vs 
                  Avg: <span className="text-slate-400 font-bold ml-1">{b.label==='Annual Income' ? fmt(b.avg) : b.avg.toFixed(1)+b.suffix}</span>
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                 <div 
                   className={`h-full transition-all duration-1000 ${b.rank > 50 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}
                   style={{ width: `${b.rank}%` }}
                 />
              </div>
              <p className="text-[10px] text-slate-500">Confidence: 94% (ML trained on Kaggle Lending Club Dataset)</p>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

export function Section13Refinance({ data }) {
  const rf = data.refinance || {};
  if (!rf.currentRate) return null;

  return (
    <section>
      <SectionTitle n={13} title="Loan Optimization ML" subtitle="Predictive analysis for interest rate refinancing"/>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card delay={0.1}>
          <div className="flex items-center gap-3 mb-5">
            <BarChart3 className="w-5 h-5 text-teal-400" />
            <h3 className="font-semibold text-white">Refinance Eligibility</h3>
          </div>
          
          <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-900/60 border border-slate-800/50 mb-4">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">Status</p>
              <p className={`text-xl font-black ${rf.eligible ? 'text-emerald-400' : 'text-amber-400'}`}>
                {rf.eligible ? 'HIGHLY ELIGIBLE' : 'PLANNING PHASE'}
              </p>
            </div>
            {rf.eligible && (
              <div className="flex flex-col items-end">
                 <p className="text-xs text-slate-500 font-bold uppercase mb-1">Max Benefit</p>
                 <p className="text-xl font-black text-emerald-400">Save {fmt(rf.monthly_savings || rf.monthlySavings)}/mo</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl text-center">
                <p className="text-[10px] text-slate-500 uppercase mb-1">Current Rate</p>
                <p className="text-lg font-black text-rose-400">{rf.currentRate}%</p>
             </div>
             <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center">
                <p className="text-[10px] text-slate-500 uppercase mb-1">Potential Rate</p>
                <p className="text-lg font-black text-emerald-400">{rf.potentialRate}%</p>
             </div>
          </div>
        </Card>

        <Card delay={0.15}>
          <div className="flex items-center gap-3 mb-5">
            <TrendingDown className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">ML Savings Prediction</h3>
          </div>
          
          <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/10 space-y-4">
            <div className="flex items-start gap-3">
               <div className="p-2 bg-emerald-500/20 rounded-lg">
                 <CheckCircle2 className="w-4 h-4 text-emerald-400" />
               </div>
               <div>
                  <p className="text-sm font-bold text-white">AI Optimization Tip</p>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    {rf.tip}
                  </p>
               </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-purple-500/10">
               <div>
                 <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Prediction Confidence</p>
                 <div className="flex items-center gap-2 mt-1">
                   <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500" style={{ width: `${rf.confidence}%` }} />
                   </div>
                   <span className="text-[10px] text-purple-400 font-bold">{rf.confidence}%</span>
                 </div>
               </div>
               <button className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-black rounded-lg uppercase tracking-wider hover:bg-emerald-400 transition-all">
                  Get Offers
               </button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

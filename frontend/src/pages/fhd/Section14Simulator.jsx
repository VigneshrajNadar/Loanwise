import React from 'react';
import { Card, SectionTitle, fmt } from './shared';
import { Play, ShieldAlert, Zap, Clock, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';

export function Section14Simulator({ data }) {
  const sim = data.simulator || {};
  const s1 = sim.scenario1 || {};

  return (
    <section>
      <SectionTitle n={14} title="Loan Scenario Simulator" subtitle="Visualizing the ROI of early loan prepayments"/>
      <Card delay={0.05}>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white">Prepayment Strategy: {s1.label}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#0d1424] border border-slate-800 flex flex-col items-center">
                <Clock className="w-4 h-4 text-emerald-400 mb-2" />
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Months Saved</p>
                <p className="text-2xl font-black text-white">{s1.monthsSaved} <span className="text-xs text-slate-500">mo</span></p>
              </div>
              <div className="p-4 rounded-2xl bg-[#0d1424] border border-slate-800 flex flex-col items-center">
                <Zap className="w-4 h-4 text-teal-400 mb-2" />
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Interest Saved</p>
                <p className="text-2xl font-black text-teal-400">{fmt(s1.interestSaved)}</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-300">ROI of Prepayment</span>
                <span className="text-sm font-black text-emerald-400">{sim.roiPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, sim.roiPercent)}%` }}
                  className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2 italic">Calculated as (Interest Saved / Extra Payment Investment)</p>
            </div>
          </div>

          <div className="lg:w-72 bg-[#1e293b]/20 rounded-2xl border border-slate-800/50 p-6 flex flex-col justify-center">
            <Play className="w-10 h-10 text-emerald-500/40 mb-4 mx-auto" />
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              Paying just 10% more on your EMI every month reduces your tenure to 
              <span className="text-white font-bold mx-1">{s1.newTenure} months</span>. 
              This is equivalent to a high-yield investment with no market risk.
            </p>
            <button className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-black uppercase tracking-wider text-white transition-all">
              Update Custom Scenario
            </button>
          </div>
        </div>
      </Card>
    </section>
  );
}

export function Section15StressTest({ data }) {
  const st = data.stressTest || {};

  return (
    <section>
      <SectionTitle n={15} title="Financial Stress Test" subtitle="Monte Carlo simulation of financial resilience"/>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card delay={0.1}>
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
               <ShieldAlert className="w-5 h-5 text-rose-400" />
             </div>
             <h3 className="font-bold text-white">Stress Test Score</h3>
          </div>

          <div className="relative h-48 flex items-center justify-center">
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-36 h-36 rounded-full border-[10px] border-slate-800" />
                <svg className="absolute w-36 h-36 -rotate-90">
                  <circle
                    cx="72" cy="72" r="63"
                    fill="transparent"
                    stroke={st.stressScore > 75 ? '#10b981' : st.stressScore > 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="10"
                    strokeDasharray={396}
                    strokeDashoffset={396 - (396 * st.stressScore) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="text-center">
                   <p className="text-3xl font-black text-white">{st.stressScore}</p>
                   <p className="text-[10px] text-slate-500 uppercase font-black">Resilience</p>
                </div>
             </div>
          </div>

          <div className="mt-4 flex justify-between gap-2">
            {st.labels.map(l => (
              <div key={l} className="flex-1 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <p className="text-[9px] text-slate-500 font-bold uppercase">{l}</p>
                <p className="text-[10px] text-emerald-400 font-black">STABLE</p>
              </div>
            ))}
          </div>
        </Card>

        <Card delay={0.15}>
          <h3 className="font-semibold text-white mb-6 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            Survival Runway Prediction
          </h3>
          
          <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/20 mb-6">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mb-2 text-center">Zero Income Survival</p>
            <p className="text-5xl font-black text-center text-white mb-2">{st.runwayMonths} <span className="text-xl text-slate-500">Months</span></p>
            <p className="text-xs text-center text-teal-400 font-medium">Predicted via cash-flow burn rate analysis</p>
          </div>

          <div className={`p-4 rounded-xl border flex items-start gap-4 ${
            st.stressScore > 50 ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'
          }`}>
             <span className="text-2xl mt-1">🧠</span>
             <div>
                <p className="text-sm font-bold text-white mb-1">AI Risk Evaluation</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {st.tip}
                </p>
             </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

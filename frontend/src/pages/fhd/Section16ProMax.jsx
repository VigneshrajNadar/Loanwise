import React from 'react';
import { Card, SectionTitle, fmt } from './shared';
import { TrendingUp, Trophy, Sparkles, ArrowRightLeft, Target, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

export function Section16Arbitrage({ data }) {
  const arb = data.arbitrage || {};
  return (
    <section>
      <SectionTitle n={16} title="Wealth Builder Arbitrage" subtitle="Should you prepay your loan or invest in the stock market?"/>
      <Card delay={0.05}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
             <div className="flex items-center gap-3">
               <ArrowRightLeft className="w-5 h-5 text-purple-400" />
               <h3 className="font-bold text-white uppercase tracking-wider text-sm">Opportunity Cost Analysis</h3>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-between">
                   <div>
                     <p className="text-[10px] text-slate-500 font-bold uppercase">Loan Interest</p>
                     <p className="text-xl font-black text-rose-400">{arb.loanRate}%</p>
                   </div>
                   <TrendingUp className="w-8 h-8 text-rose-500/20 -rotate-90" />
                </div>
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                   <div>
                     <p className="text-[10px] text-slate-500 font-bold uppercase">Market Return</p>
                     <p className="text-xl font-black text-emerald-400">{arb.marketRate}%</p>
                   </div>
                   <TrendingUp className="w-8 h-8 text-emerald-500/20" />
                </div>
             </div>

             <div className="p-5 rounded-2xl bg-[#0d1424] border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Sparkles className="w-12 h-12 text-purple-400" />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                   <span className="text-purple-400 font-black uppercase text-[10px] block mb-1">AI Recommendation</span>
                   {arb.tip}
                </p>
                <div className="flex items-center gap-2">
                   <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter shadow-lg ${
                     arb.recommendation === 'Invest' ? 'bg-emerald-500 text-white' : 'bg-purple-500 text-white'
                   }`}>
                     Action: {arb.recommendation}
                   </div>
                   <span className="text-[10px] text-slate-500 font-bold">Estimated Delta: {fmt(arb.benefitDelta)} / 5yrs</span>
                </div>
             </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 via-transparent to-transparent border border-purple-500/20 rounded-3xl p-6 flex flex-col justify-between">
             <div>
               <p className="text-xs font-black text-white uppercase mb-2">Arbitrage Gap</p>
               <p className="text-4xl font-black text-purple-400">{arb.gap}%</p>
               <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Interest Differential</p>
             </div>
             <div className="mt-8 space-y-3">
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                   <motion.div initial={{width:0}} animate={{width:'85%'}} className="h-full bg-purple-500" />
                </div>
                <p className="text-[9px] text-slate-500 leading-tight">
                  This analysis suggests that for every ₹1 lakh, you could be missing out on significant wealth generation by choosing the wrong strategy.
                </p>
             </div>
          </div>
        </div>
      </Card>
    </section>
  );
}

export function Section17RepaymentMilestones({ data }) {
  const ms = data.milestones || {};
  return (
    <section>
      <SectionTitle n={17} title="Repayment Milestones" subtitle="Gamified tracking of your journey to a debt-free life"/>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card delay={0.1} className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-sm uppercase">Achievement Roadmap</h3>
          </div>
          
          <div className="relative">
             <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-800" />
             <div className="space-y-8">
               {(ms.milestones || []).map((m, i) => (
                 <div key={i} className="flex items-start gap-6 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                      m.status === 'In Progress' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-800 text-slate-600'
                    }`}>
                       <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-sm font-black ${m.status === 'In Progress' ? 'text-white' : 'text-slate-500'}`}>{m.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
                    </div>
                    <div className="ml-auto text-[10px] font-black uppercase px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-500">
                      {m.status}
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </Card>

        <Card delay={0.15}>
          <div className="h-full flex flex-col justify-between">
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">Current Rank</p>
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-4">
                 <div className="p-3 bg-amber-500/20 rounded-xl">
                   <Trophy className="w-6 h-6 text-amber-500" />
                 </div>
                 <div>
                   <p className="text-lg font-black text-white">{ms.achievement}</p>
                   <p className="text-xs text-amber-400 font-bold">Tier 2 Borrower</p>
                 </div>
              </div>
            </div>

            <div className="mt-8">
               <p className="text-4xl font-black text-white">{ms.daysRemaining}</p>
               <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Days to Freedom</p>
               <div className="mt-4 flex gap-1">
                 {[0,1,2,3,4,5].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i<3 ? 'bg-emerald-500' : 'bg-slate-800'}`} />)}
               </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

export function Section18SurplusSuggester({ data }) {
  const ss = data.surplusSuggester || {};
  return (
    <section>
      <SectionTitle n={18} title="AI Surplus Suggester" subtitle="Smart analysis of your daily cash-flow to find 'Hidden' savings"/>
      <Card delay={0.2}>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
             <div className="flex items-center gap-3">
               <Wallet className="w-5 h-5 text-teal-400" />
               <h3 className="font-bold text-white text-sm uppercase">Monthly Surplus Engine</h3>
             </div>
             <p className="text-sm text-slate-400 leading-relaxed">
               Our algorithm analyzed your Income vs. Expenditure and found a safer "surplus zone."
               Allocating just <span className="text-white font-bold">{fmt(ss.suggestedBuffer)}</span> to an extra 
               monthly payment can have a massive compound effect on your total debt.
             </p>
             <div className="flex gap-3">
               <div className="px-4 py-2 rounded-xl bg-[#0d1424] border border-slate-800">
                  <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Total Net Savings</p>
                  <p className="text-lg font-black text-white">{fmt(ss.netSavings)}</p>
               </div>
               <div className="px-4 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
                  <p className="text-[9px] text-teal-400 font-black uppercase mb-1">AI Guided Buffer</p>
                  <p className="text-lg font-black text-teal-400">{fmt(ss.suggestedBuffer)}</p>
               </div>
             </div>
          </div>

          <div className="w-full md:w-80 p-6 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-[0_20px_40px_-15px_rgba(16,185,129,0.4)]">
             <p className="text-[10px] text-white/60 font-black uppercase tracking-widest mb-1 text-center">Potential Benefit</p>
             <p className="text-4xl font-black text-white text-center mb-1">{fmt(ss.potentialInterestSaved)}</p>
             <p className="text-[10px] text-white/80 font-bold uppercase text-center mb-6">In Life-Time Interest Savings</p>
             
             <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                   <Target className="w-4 h-4 text-white" />
                   <p className="text-xs font-black text-white uppercase tracking-wider">Strategy: {ss.action}</p>
                </div>
                <p className="text-[10px] text-white/70 leading-relaxed">
                  Start an automated monthly transfer of {fmt(ss.suggestedBuffer)} towards this loan. 12 months from now, your principal will be significantly lower.
                </p>
             </div>
          </div>
        </div>
      </Card>
    </section>
  );
}

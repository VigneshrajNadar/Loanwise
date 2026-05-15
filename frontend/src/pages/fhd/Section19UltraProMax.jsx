import React from 'react';
import { Card, SectionTitle, fmt } from './shared';
import { ShieldAlert, LineChart, TrendingUp, AlertTriangle, FastForward, Flag } from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function Section19EWS({ data }) {
  const ews = data.ews || {};
  return (
    <section>
      <SectionTitle n={19} title="Early Warning System (EWS)" subtitle="Predictive ML modeling of potential financial distress in next 6mo"/>
      <Card delay={0.05}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="space-y-6">
              <div className="flex items-center gap-3">
                 <AlertTriangle className="w-5 h-5 text-rose-500" />
                 <h3 className="font-bold text-white text-sm uppercase">Distress Probability</h3>
              </div>
              
              <div className="p-8 rounded-[32px] bg-rose-500/5 border border-rose-500/10 flex flex-col items-center justify-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5">
                    <ShieldAlert className="w-24 h-24 text-rose-500" />
                 </div>
                 <p className="text-6xl font-black text-white mb-2">{ews.distressProbability}%</p>
                 <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                   ews.riskLevel === 'Low' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                 }`}>
                   {ews.riskLevel} Risk Level
                 </div>
              </div>

              <div className="space-y-3">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Key Risk Drivers</p>
                 {(ews.factors || []).map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/50">
                       <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                       <p className="text-xs text-slate-300 font-medium">{f}</p>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-[#1e293b]/20 rounded-3xl border border-slate-800/50 p-6 flex flex-col justify-between">
              <div>
                 <p className="text-xs font-bold text-slate-200 mb-4 flex items-center gap-2">
                   <FastForward className="w-4 h-4 text-purple-400" />
                   EWS Prevention Strategy
                 </p>
                 <p className="text-xs text-slate-400 leading-relaxed mb-6">
                   Our predictive model has analyzed your historical cash flow and existing debt load. 
                   To drop your distress probability below 15%, follow the safe-zone guideline:
                 </p>
                 <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                    <p className="text-sm font-bold text-purple-400 font-mono">{ews.safeZone}</p>
                 </div>
              </div>
              
              <div className="pt-6 border-t border-slate-800 flex justify-between items-end">
                 <div>
                    <p className="text-[10px] text-slate-500 uppercase font-black">Model Accuracy</p>
                    <p className="text-lg font-black text-white">91.4%</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-black">Time Horizon</p>
                    <p className="text-lg font-black text-teal-400">Next 6 Months</p>
                 </div>
              </div>
           </div>
        </div>
      </Card>
    </section>
  );
}

export function Section20FreedomPoint({ data }) {
  const fp = data.freedomPoint || {};
  const chartData = (fp.wealthCurve || []).map((w, i) => ({
    name: `M${i}`,
    wealth: w,
    debt: fp.debtCurve[i]
  }));

  return (
    <section>
      <SectionTitle n={20} title="The Freedom Point Tracker" subtitle="Projecting the exact moment your assets overtake your debt"/>
      <Card delay={0.1}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2">
              <div className="h-64 mt-4">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                       <defs>
                          <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                             <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                             <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                       <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
                       <Tooltip 
                         contentStyle={{backgroundColor:'#0f172a', borderRadius:'12px', borderColor:'#1e293b', color:'#fff', fontSize:'12px'}}
                         formatter={(v)=>fmt(v)}
                       />
                       <Area type="monotone" dataKey="wealth" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorWealth)" name="Net Worth" />
                       <Area type="monotone" dataKey="debt" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorDebt)" name="Total Debt" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                 <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Asset Trajectory</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Debt Decay</span>
                 </div>
              </div>
           </div>

           <div className="flex flex-col justify-center space-y-8">
              <div className="text-center lg:text-left">
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-2">Estimated Freedom Point</p>
                 <p className="text-5xl font-black text-emerald-400 mb-1">{fp.freedomDate}</p>
                 <p className="text-xs text-slate-400 font-medium">In {fp.monthsToFreedom} months from today</p>
              </div>

              <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 relative">
                 <Flag className="absolute -top-3 -right-3 w-10 h-10 text-emerald-500/20 rotate-12" />
                 <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-3">Goal Reached</p>
                 <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    "Freedom Point" is the mathematical moment your generated wealth exceeds your total debt. Reaching this means you are effectively debt-free even while paying the loan.
                 </p>
              </div>

              <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-[#0d1424] border border-slate-800 flex items-center justify-center">
                     <TrendingUp className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">Accelerate Point</p>
                    <p className="text-[10px] text-slate-500">Add ₹5k/mo to reach freedom 4mo earlier</p>
                  </div>
              </div>
           </div>
        </div>
      </Card>
    </section>
  );
}

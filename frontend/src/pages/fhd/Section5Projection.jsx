import React from 'react';
import { Card, SectionTitle, fmt, CustomTip } from './shared';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Section5Projection({ data }) {
  const pr = data.projection || [];
  const cf = data.cashFlow || {};

  return (
    <section>
      <SectionTitle n={5} title="12-Month Savings Forecast" subtitle="Projection based on current spending rate"/>
      <Card delay={0.05}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm text-slate-400">Projected savings in 12 months</p>
            <p className="text-3xl font-black text-emerald-400">{fmt(pr[pr.length-1]?.savings)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Monthly net savings</p>
            <p className="text-lg font-bold text-teal-400">{fmt(cf.netSavings)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Rate: {cf.savingsRate}%</p>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pr}>
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
              <XAxis dataKey="month" stroke="#475569" tick={{fontSize:10}}/>
              <YAxis stroke="#475569" tick={{fontSize:10}} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<CustomTip/>}/>
              <Area type="monotone" dataKey="savings" name="Savings" stroke="#10b981" fill="url(#pg)" strokeWidth={2.5} dot={{r:3,fill:'#10b981'}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </section>
  );
}

// ─── Section 6: Debt Payoff Strategy ─────────────────────────────────────────
export function Section6Debt({ data }) {
  const dp = data.debtPayoff || {};
  if (!dp.loanAmount) return null;

  const rows = [
    { label:'Loan Amount',         val: fmt(dp.loanAmount) },
    { label:'Normal Tenure',       val: `${dp.normalTenure} months` },
    { label:'Total Interest (Normal)', val: fmt(dp.normalInterest) },
    { label:'Total Cost (Normal)', val: fmt(dp.totalNormal) },
    { label:'Extra Payment/Month', val: fmt(dp.extraMonthly), highlight:true },
    { label:'Avalanche Tenure',    val: `${dp.avalancheTenure} months`, highlight:true },
    { label:'Months Saved',        val: `${dp.monthsSaved} months`, highlight:true },
    { label:'Interest Saved',      val: fmt(dp.interestSaved), highlight:true },
  ];

  return (
    <section>
      <SectionTitle n={6} title="Debt Payoff Strategy" subtitle="Avalanche method — minimize total interest"/>
      <Card delay={0.05}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {rows.map(({label,val,highlight})=>(
            <div key={label} className={`rounded-xl p-3 border ${highlight?'bg-emerald-500/8 border-emerald-500/25':'bg-slate-900/60 border-slate-800/50'}`}>
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className={`font-bold text-sm ${highlight?'text-emerald-400':'text-white'}`}>{val}</p>
            </div>
          ))}
        </div>
        <div className="p-4 rounded-xl bg-teal-500/8 border border-teal-500/25">
          <p className="text-sm text-teal-300 font-medium">💡 {dp.prepayTip}</p>
        </div>
        {/* Visual comparison */}
        <div className="mt-5 grid grid-cols-2 gap-4">
          {[{label:'Normal Schedule', months:dp.normalTenure, color:'#f59e0b'},
            {label:'Avalanche Strategy', months:dp.avalancheTenure, color:'#10b981'}].map(({label,months,color})=>(
            <div key={label}>
              <p className="text-xs text-slate-400 mb-2">{label} — {months} months</p>
              <div className="w-full bg-slate-800 rounded-full h-3">
                <div className="h-3 rounded-full" style={{width:`${Math.min(100,(months/Math.max(dp.normalTenure,1))*100)}%`,backgroundColor:color}}/>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

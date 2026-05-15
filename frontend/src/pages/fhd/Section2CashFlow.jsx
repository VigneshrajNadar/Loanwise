import React from 'react';
import { ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';
import { Card, SectionTitle, fmt, fadeUp, CustomTip } from './shared';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Section2CashFlow({ data }) {
  const cf = data.cashFlow || {};
  const d  = data.extractedData;
  const trend = cf.trend || [];

  return (
    <section>
      <SectionTitle n={2} title="Cash Flow Analysis" subtitle="Income, expenses & net savings trend"/>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Area Chart */}
        <Card className="lg:col-span-2" delay={0.05}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Income vs Expenses</h3>
            <div className="flex gap-3 text-xs">
              {[['Income','#10b981'],['Expenses','#ef4444'],['EMI','#f59e0b']].map(([l,c])=>(
                <span key={l} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{background:c}}/><span style={{color:c}}>{l}</span></span>
              ))}
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  {[['g1','#10b981'],['g2','#ef4444'],['g3','#f59e0b']].map(([id,c])=>(
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={c} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                <XAxis dataKey="month" stroke="#475569" tick={{fontSize:11}}/>
                <YAxis stroke="#475569" tick={{fontSize:10}} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                <Tooltip content={<CustomTip/>}/>
                <Area type="monotone" dataKey="income"   name="Income"   stroke="#10b981" fill="url(#g1)" strokeWidth={2}/>
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" fill="url(#g2)" strokeWidth={2}/>
                <Area type="monotone" dataKey="emi"      name="EMI"      stroke="#f59e0b" fill="url(#g3)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Summary */}
        <Card delay={0.08}>
          <h3 className="font-semibold text-white mb-4">Monthly Summary</h3>
          {[
            { label:'Monthly Income',   val:fmt(d.monthly_income),   color:'text-emerald-400', Icon:ArrowUpRight },
            { label:'Monthly Expenses', val:fmt(d.monthly_expenses), color:'text-rose-400',    Icon:ArrowDownRight },
            { label:'EMI Payment',      val:fmt(d.emi_amount),       color:'text-amber-400',   Icon:CreditCard },
          ].map(({label,val,color,Icon})=>(
            <div key={label} className="flex items-center justify-between py-3 border-b border-slate-800/60 last:border-0">
              <div className="flex items-center gap-2 text-sm text-slate-400"><Icon className={`w-4 h-4 ${color}`}/>{label}</div>
              <span className={`font-bold text-sm ${color}`}>{val}</span>
            </div>
          ))}
          <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-slate-400 mb-1">Net Monthly Savings</p>
            <p className="text-2xl font-black text-emerald-400">{fmt(cf.netSavings)}</p>
            <p className="text-xs text-emerald-400/70 mt-1">Savings rate: {cf.savingsRate}%</p>
          </div>
        </Card>
      </div>
    </section>
  );
}

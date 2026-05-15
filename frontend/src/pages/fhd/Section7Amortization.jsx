import React from 'react';
import { Card, SectionTitle, fmt } from './shared';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function Section7Amortization({ data }) {
  const amort = data.amortization || [];
  if (!amort.length) return null;

  const totalInterest  = amort.reduce((s,r)=>s+r.interest,0);
  const totalPrincipal = amort.reduce((s,r)=>s+r.principal,0);

  return (
    <section>
      <SectionTitle n={7} title="Loan Amortization" subtitle="First 12 months principal vs interest breakdown"/>
      <Card delay={0.05}>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="bg-blue-500/8 border border-blue-500/25 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">Total Principal Paid</p>
            <p className="text-xl font-black text-blue-400">{fmt(totalPrincipal)}</p>
          </div>
          <div className="bg-rose-500/8 border border-rose-500/25 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">Total Interest Paid</p>
            <p className="text-xl font-black text-rose-400">{fmt(totalInterest)}</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">Remaining Balance (M12)</p>
            <p className="text-xl font-black text-white">{fmt(amort[amort.length-1]?.balance)}</p>
          </div>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={amort} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false}/>
              <XAxis dataKey="month" stroke="#475569" tick={{fontSize:10}}/>
              <YAxis stroke="#475569" tick={{fontSize:10}} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={v=>fmt(v)} contentStyle={{backgroundColor:'#0f172a',border:'1px solid #1e293b',borderRadius:8}}/>
              <Bar dataKey="principal" name="Principal" fill="#3b82f6" radius={[3,3,0,0]} stackId="a"/>
              <Bar dataKey="interest"  name="Interest"  fill="#ef4444" radius={[3,3,0,0]} stackId="a"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-3 text-xs">
          <span className="flex items-center gap-1.5 text-blue-400"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400"/>Principal</span>
          <span className="flex items-center gap-1.5 text-rose-400"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400"/>Interest</span>
        </div>
      </Card>
    </section>
  );
}

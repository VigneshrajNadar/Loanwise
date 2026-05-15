import React from 'react';
import { FileText } from 'lucide-react';
import { Card, SectionTitle, fmt, CustomTip } from './shared';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Section4Spending({ data }) {
  const f  = data.features;
  const d  = data.extractedData;
  const sc = data.spendingCategories || [];

  return (
    <section>
      <SectionTitle n={4} title="Spending Behavior" subtitle="Category breakdown & anomaly detection"/>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Donut */}
        <Card delay={0.05}>
          <h3 className="font-semibold text-white mb-3">Expense Breakdown</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sc} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {sc.map((s,i)=><Cell key={i} fill={s.color}/>)}
                </Pie>
                <Tooltip formatter={v=>fmt(v)} contentStyle={{backgroundColor:'#0f172a',border:'1px solid #1e293b',borderRadius:8}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-1">
            {sc.map((s,i)=>(
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{backgroundColor:s.color}}/>
                  <span className="text-slate-400">{s.name}</span>
                </div>
                <span className="font-semibold text-white">{fmt(s.value)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Bar chart */}
        <Card className="lg:col-span-2" delay={0.08}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Category Spending</h3>
            <div className={`text-xs px-3 py-1 rounded-full font-semibold border ${f.spendingBehavior.isAnomaly?'bg-rose-500/10 text-rose-400 border-rose-500/30':'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
              {f.spendingBehavior.status}
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sc} barSize={26}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false}/>
                <XAxis dataKey="name" stroke="#475569" tick={{fontSize:10}}/>
                <YAxis stroke="#475569" tick={{fontSize:10}} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                <Tooltip content={<CustomTip/>}/>
                <Bar dataKey="value" name="Amount" radius={[4,4,0,0]}>
                  {sc.map((s,i)=><Cell key={i} fill={s.color} fillOpacity={0.85}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Statement file data */}
        {d.spending_analysis_from_file && (
          <Card className="lg:col-span-3 border-teal-500/20" delay={0.11}>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-teal-400"/>
              <h3 className="font-semibold text-white">Statement Analysis</h3>
              <span className="text-xs px-2.5 py-0.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full font-semibold">Extracted from File</span>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {Object.entries(d.spending_analysis_from_file).map(([cat,val])=>(
                <div key={cat} className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/50 text-center">
                  <p className="text-xs text-slate-500 capitalize mb-1">{cat}</p>
                  <p className="font-bold text-white text-sm">{fmt(val)}</p>
                  <div className="mt-2 w-full bg-slate-800 rounded-full h-1">
                    <div className="h-1 rounded-full bg-teal-400" style={{width:`${Math.min(100,(val/(d.monthly_income||1))*100)}%`}}/>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </section>
  );
}

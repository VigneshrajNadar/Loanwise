import { useState } from 'react';
import { Clock, ChevronRight, CheckCircle2, AlertTriangle, ShieldCheck, Activity, Brain } from 'lucide-react';
import { SectionCard, SectionHeader, VerdictBadge } from './DashboardWidgets';

const MODULE_META = {
  eligibility:    {label:'Loan Eligibility',   color:'emerald', Icon:ShieldCheck, route:'/eligibility'},
  default:        {label:'Default Risk',        color:'rose',    Icon:AlertTriangle, route:'/default-risk'},
  loan_decision:  {label:'Loan Decision AI',   color:'indigo',  Icon:Brain, route:'/intelligence'},
  health:         {label:'Financial Health',   color:'teal',    Icon:Activity, route:'/health'},
  decision:       {label:'Loan Decision AI',   color:'indigo',  Icon:Brain, route:'/intelligence'},
};

export function TabHistory({analyses}) {
  const [filter,setFilter] = useState('all');
  const FILTERS = [
    {id:'all',         label:'All Records'},
    {id:'eligibility', label:'Eligibility'},
    {id:'default',     label:'Default Risk'},
    {id:'loan_decision',label:'Decision AI'},
  ];

  const filtered = filter==='all'
    ? analyses
    : analyses.filter(a => a.module===filter || (filter==='loan_decision' && a.module==='decision'));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex gap-2 p-1 bg-[#111827] border border-[#1f2937] rounded-xl w-fit">
        {FILTERS.map(f=>(
          <button key={f.id} onClick={()=>setFilter(f.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter===f.id?'bg-[#1f2937] text-white shadow-sm border border-[#374151]':'text-slate-400 hover:text-white'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filtered.length===0?(
          <div className="text-center py-20 px-4 bg-[#111827] border border-[#1f2937] rounded-3xl">
            <Clock className="w-12 h-12 text-slate-700 mx-auto mb-3"/>
            <p className="text-white font-medium text-lg">No analysis records yet</p>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">Run any predictive module while logged in to see your history populated here.</p>
          </div>
        ):(
            [...filtered].reverse().map((a,i)=>{
              const m = MODULE_META[a.module] || MODULE_META.eligibility;
              const dt = new Date(a.created_at);
              const dateStr = dt.toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'});
              const timeStr = dt.toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'});
              return (
                <div key={a.id||i} className="flex flex-col sm:flex-row gap-4 p-5 bg-[#111827] border border-[#1f2937] rounded-2xl hover:border-[#374151] transition-colors group">
                  <div className={`w-12 h-12 rounded-2xl bg-${m.color}-500/10 flex items-center justify-center shrink-0`}>
                    <m.Icon className={`w-6 h-6 text-${m.color}-400`}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="text-base font-semibold text-white">{m.label}</h4>
                        <VerdictBadge verdict={a.verdict}/>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {dateStr} at {timeStr}</span>
                    </div>
                    {a.input_summary && (
                        <div className="mt-4 p-3 bg-[#0a0f1a] rounded-xl text-xs text-slate-300 font-mono">
                            <span className="text-slate-500">Inputs: </span> {a.input_summary}
                        </div>
                    )}
                  </div>
                  <div className="sm:self-center">
                      <a href={m.route || '/'}
                        className="inline-flex text-xs px-4 py-2 bg-[#1f2937] text-white hover:bg-indigo-600 rounded-xl items-center gap-1.5 transition-colors font-medium">
                        Re-run module<ChevronRight className="w-3.5 h-3.5"/>
                      </a>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}

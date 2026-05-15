import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export const fmt = n => `₹${Number(n||0).toLocaleString('en-IN')}`;
export const fmtK = n => n>=100000?`₹${(n/100000).toFixed(1)}L`:n>=1000?`₹${(n/1000).toFixed(0)}K`:fmt(n);

export function SectionCard({children, className=''}) {
  return <div className={`bg-[#111827] border border-[#1f2937] rounded-2xl overflow-hidden ${className}`}>{children}</div>;
}

export function SectionHeader({icon:Icon, iconColor='text-slate-400', title, right}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f2937] bg-[#1a2234]/50">
      <div className="flex items-center gap-2.5">
        <Icon className={`w-4 h-4 ${iconColor}`}/>
        <span className="text-sm font-semibold text-white">{title}</span>
      </div>
      {right}
    </div>
  );
}

export function Pill({children, color='slate'}) {
  const cls = {
    green:'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    red:'bg-rose-500/15 text-rose-400 border-rose-500/20',
    amber:'bg-amber-500/15 text-amber-400 border-amber-500/20',
    blue:'bg-blue-500/15 text-blue-400 border-blue-500/20',
    slate:'bg-slate-500/15 text-slate-400 border-slate-500/20',
    indigo:'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
    teal:'bg-teal-500/15 text-teal-400 border-teal-500/20',
  };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${cls[color]||cls.slate}`}>{children}</span>;
}

export function VerdictBadge({verdict}) {
  if (!verdict) return null;
  const vStr = verdict.replace('✅','').replace('❌','').trim();
  const isGood = /eligible|recommend|low/i.test(verdict);
  const isWarn = /moderate/i.test(verdict);
  const colorMeta = isGood
      ? { cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', Icon: CheckCircle2 }
      : isWarn
      ? { cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20', Icon: AlertTriangle }
      : { cls: 'bg-rose-500/15 text-rose-400 border-rose-500/20', Icon: XCircle };
      
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${colorMeta.cls}`}>
      <colorMeta.Icon className="w-3 h-3"/>
      {vStr}
    </span>
  );
}

export function KpiCard({icon:Icon, label, value, sub, accent='emerald'}) {
  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-5 transition-all duration-300 hover:border-[#374151] hover:shadow-lg hover:shadow-black/20 group cursor-default">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`p-1.5 rounded-lg bg-${accent}-500/10 group-hover:bg-${accent}-500/20 transition-colors`}>
          <Icon className={`w-4 h-4 text-${accent}-400`}/>
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export function GaugeChart({score, max=100, label="Health Score"}) {
  const r=52, circ=2*Math.PI*r;
  const percentage = Math.min(Math.max(score / max, 0), 1);
  const arc=percentage*circ*0.75;
  
  let gradeColor = '#f43f5e';
  let grade = 'Poor';
  if (percentage >= 0.8) { gradeColor = '#10b981'; grade = 'Excellent'; }
  else if (percentage >= 0.6) { gradeColor = '#06b6d4'; grade = 'Good'; }
  else if (percentage >= 0.4) { gradeColor = '#f59e0b'; grade = 'Fair'; }

  if (max === 900) {
      if (score >= 750) { gradeColor = '#10b981'; grade = 'Excellent'; }
      else if (score >= 700) { gradeColor = '#06b6d4'; grade = 'Good'; }
      else if (score >= 650) { gradeColor = '#f59e0b'; grade = 'Fair'; }
      else { gradeColor = '#f43f5e'; grade = 'Poor'; }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-24">
        <svg viewBox="0 0 110 85" className="w-full h-full -rotate-[135deg]">
          <circle cx="55" cy="58" r={r} fill="none" stroke="#1f2937" strokeWidth="9" strokeDasharray={`${circ*0.75} ${circ}`} strokeLinecap="round"/>
          <motion.circle cx="55" cy="58" r={r} fill="none" stroke={gradeColor} strokeWidth="9"
            strokeDasharray={`${arc} ${circ}`} strokeLinecap="round"
            initial={{strokeDasharray:`0 ${circ}`}} animate={{strokeDasharray:`${arc} ${circ}`}} transition={{duration:1.2,ease:'easeOut'}}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center mt-3">
          <span className="text-2xl font-bold text-white">{score}</span>
          <span className="text-[10px] font-semibold" style={{color:gradeColor}}>{grade}</span>
        </div>
      </div>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

export function DonutChart({ data }) {
    if (!data || Object.keys(data).length === 0) {
        return <div className="text-xs text-slate-500 flex items-center justify-center h-32 tracking-wider uppercase">No Spending Data</div>;
    }

    const CAT_COLORS = {
        'Salary':'#10b981','EMI':'#f43f5e','Food & Dining':'#f59e0b','Rent':'#6366f1',
        'Investment':'#06b6d4','Shopping':'#ec4899','Medical':'#8b5cf6','Travel':'#14b8a6',
        'Utilities':'#64748b','Entertainment':'#fb923c','Insurance':'#84cc16','Transfer':'#94a3b8','Other':'#475569'
    };

    const entries = Object.entries(data).sort((a,b) => b[1] - a[1]);
    const total = entries.reduce((s, [_, v]) => s + v, 0);
    
    let currentAngle = -90;
    const r = 40;
    const cx = 50;
    const cy = 50;

    return (
        <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {entries.map(([cat, val], i) => {
                        const pct = val / total;
                        const dasharray = `${pct * 2 * Math.PI * r} ${2 * Math.PI * r}`;
                        const offset = (currentAngle + 90) / 360 * (2 * Math.PI * r);
                        currentAngle += pct * 360;
                        return (
                            <motion.circle 
                                key={cat} cx={cx} cy={cy} r={r} fill="none"
                                stroke={CAT_COLORS[cat] || CAT_COLORS['Other']} strokeWidth="12"
                                strokeDasharray={dasharray} strokeDashoffset={-offset}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                            />
                        );
                    })}
                </svg>
            </div>
            <div className="flex-1 space-y-2">
                {entries.slice(0, 4).map(([cat, val]) => (
                    <div key={cat} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: CAT_COLORS[cat] || CAT_COLORS['Other']}} />
                            <span className="text-xs text-slate-300">{cat}</span>
                        </div>
                        <span className="text-xs font-semibold text-white">{fmtK(val)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function Sparkline({ data }) {
    if (!data || data.length === 0) return <div className="h-10"></div>;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const w = 100;
    const h = 40;
    const dx = w / (data.length - 1 || 1);
    
    const points = data.map((d, i) => {
        const x = i * dx;
        const y = h - ((d - min) / range) * h;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox={`0 -5 ${w} ${h + 10}`} className="w-full h-10 overflow-visible">
            <motion.polyline 
                fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                points={points} 
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} 
            />
            {data.map((d, i) => (
                <circle key={i} cx={i*dx} cy={h - ((d - min) / range) * h} r="2" fill="#8b5cf6" />
            ))}
        </svg>
    );
}

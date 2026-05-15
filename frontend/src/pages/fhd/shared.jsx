// Shared helpers & reusable UI atoms for the FHD sub-components
import React from 'react';
import { motion } from 'framer-motion';

export const fmt     = (n) => `₹${Number(n||0).toLocaleString('en-IN')}`;
export const pct     = (n) => `${n??0}%`;
export const fadeUp  = (d=0) => ({ initial:{opacity:0,y:22}, animate:{opacity:1,y:0}, transition:{delay:d, duration:0.42} });

export function KPI({ title, value, sub, icon:Icon, color, bg, border, delay=0 }) {
  return (
    <motion.div {...fadeUp(delay)} whileHover={{y:-4}}
      className={`p-5 rounded-2xl bg-[#0f172a]/80 backdrop-blur border shadow-xl relative overflow-hidden ${border}`}>
      <div className={`absolute -right-5 -top-5 w-20 h-20 rounded-full ${bg} blur-2xl opacity-60`}/>
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs text-slate-400 font-medium mb-1">{title}</p>
          <h3 className={`text-2xl font-black ${color}`}>{value}</h3>
          {sub && <p className="text-xs text-slate-500 mt-1.5">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${bg} border ${border}`}>
          <Icon className={`w-5 h-5 ${color}`}/>
        </div>
      </div>
    </motion.div>
  );
}

export function Card({ children, className='', delay=0 }) {
  return (
    <motion.div {...fadeUp(delay)} className={`bg-[#0d1424]/80 backdrop-blur border border-slate-800/70 rounded-2xl p-6 ${className}`}>
      {children}
    </motion.div>
  );
}

export function SectionTitle({ n, title, subtitle }) {
  return (
    <div className="flex items-baseline gap-3 mb-5">
      <span className="text-xs font-black text-slate-600 bg-slate-800/60 px-2 py-0.5 rounded">S{n}</span>
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
    </div>
  );
}

export const CustomTip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div className="bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-xs shadow-2xl">
      <p className="text-slate-400 mb-2 font-semibold">{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{color:p.color}} className="font-medium">{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
};

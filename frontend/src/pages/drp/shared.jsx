import React from 'react';
import { motion } from 'framer-motion';

export const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
export const pct = (n) => `${Number(n || 0).toFixed(1)}%`;

export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: "easeOut" }
});

export const Card = ({ children, className = "", delay = 0 }) => (
  <motion.div 
    {...fadeUp(delay)}
    className={`bg-[#0d1424]/60 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 shadow-2xl ${className}`}
  >
    {children}
  </motion.div>
);

export const SectionTitle = ({ n, title, subtitle }) => (
  <motion.div {...fadeUp(0)} className="mb-6 flex items-center gap-4">
    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-black text-lg shadow-lg shadow-rose-500/5">
      {n}
    </div>
    <div>
      <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
      <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
    </div>
  </motion.div>
);

export const RiskBadge = ({ grade }) => {
  const colors = {
    A: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    B: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    C: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    D: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    E: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };
  return (
    <div className={`px-4 py-1.5 rounded-xl border text-sm font-black uppercase tracking-widest ${colors[grade] || colors.C}`}>
      Grade {grade}
    </div>
  );
};

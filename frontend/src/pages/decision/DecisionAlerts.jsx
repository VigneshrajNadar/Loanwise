import { motion } from 'framer-motion';
import { 
    TrendingUp, AlertOctagon, Zap, Lock, Unlock, 
    Activity, Brain, ArrowRight, CheckCircle2, ShieldCheck
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────
   MACRO RATE OPTIMIZER BANNER
────────────────────────────────────────────────────────────────────────── */
function MacroRateBanner({ macro, interestRate }) {
    if (!macro) return null;

    const rate = parseFloat(interestRate) || 11.5;
    const isHawkish = rate > 11;
    const isDovish  = rate < 9;
    // Fill from 0 → 100 mapped across 7–24% range (realistic loan rates)
    const fillPct = Math.min(100, Math.max(0, Math.round(((rate - 7) / (24 - 7)) * 100)));
    const isFixed = macro.recommended_type === 'Fixed Rate';

    const bgClass    = isHawkish ? 'border-rose-500/30 bg-rose-500/5'
                     : isDovish  ? 'border-emerald-500/30 bg-emerald-500/5'
                     :             'border-amber-500/30 bg-amber-500/5';
    const textColor  = isHawkish ? 'text-rose-400' : isDovish ? 'text-emerald-400' : 'text-amber-400';
    const iconBg     = isHawkish ? 'bg-rose-500/20' : isDovish ? 'bg-emerald-500/20' : 'bg-amber-500/20';

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full rounded-[28px] border p-6 mb-6 ${bgClass}`}
        >
            <div className="flex flex-col xl:flex-row xl:items-center gap-6">
                {/* Icon + Title */}
                <div className="flex items-center gap-4 shrink-0">
                    <div className={`p-3 rounded-2xl ${iconBg}`}>
                        <Activity className={`w-6 h-6 ${textColor}`} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Macro Rate Cycle Optimizer</p>
                        <p className={`text-xl font-black uppercase italic tracking-tighter ${textColor}`}>{macro.cycle}</p>
                    </div>
                </div>

                {/* Rate Meter */}
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                    <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        <span>Dovish (Low Rates)</span>
                        <span>Hawkish (Peak Rates)</span>
                    </div>
                    <div className="relative w-full h-4 bg-slate-800/80 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                            initial={{ width: '0%' }}
                            animate={{ width: `${fillPct}%` }}
                            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
                            style={{ 
                                background: 'linear-gradient(to right, #10b981, #f59e0b 50%, #ef4444)',
                                height: '100%',
                                borderRadius: '9999px'
                            }}
                        />
                        {/* Needle marker */}
                        <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_6px_white]"
                            style={{ left: `${fillPct}%`, transition: 'left 1.4s ease-out 0.2s' }}
                        />
                    </div>
                    <div className="text-center">
                        <span className="text-[10px] font-bold text-slate-400">Current Rate: </span>
                        <span className={`text-sm font-black ${textColor}`}>{rate}%</span>
                    </div>
                </div>

                {/* Fixed vs Floating Badge */}
                <div className={`shrink-0 px-5 py-3 rounded-2xl border flex items-center gap-3 ${isFixed ? 'bg-rose-500/10 border-rose-500/25' : 'bg-cyan-500/10 border-cyan-500/25'}`}>
                    {isFixed ? <Lock className="w-5 h-5 text-rose-400" /> : <Unlock className="w-5 h-5 text-cyan-400" />}
                    <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">AI Recommends</p>
                        <p className={`text-sm font-black uppercase ${isFixed ? 'text-rose-300' : 'text-cyan-300'}`}>{macro.recommended_type}</p>
                    </div>
                </div>
            </div>

            <p className="text-[11px] font-bold text-slate-400 mt-4 leading-relaxed border-t border-white/5 pt-4">
                {macro.message}
            </p>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
   DEBT AVALANCHE SECTION — Always visible, dual state
   • Triggered:     Red emergency banner with consolidation math
   • Not triggered: Green safe card with proactive advice
────────────────────────────────────────────────────────────────────────── */
function DebtAvalancheSection({ debtStrategy, existingEmiTotal }) {
    if (!debtStrategy) return null;

    const isTriggered = debtStrategy.avalanche_triggered;
    const targetEmi   = debtStrategy.consolidation_target_emi;
    const savings     = targetEmi ? Math.round(targetEmi * 0.25) : null;
    const currentLoad = existingEmiTotal || 0;

    if (isTriggered) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full rounded-[28px] border border-rose-500/40 bg-gradient-to-br from-rose-500/10 to-black/60 p-6 mb-6 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[60px] rounded-full pointer-events-none" />

                <div className="flex flex-col xl:flex-row xl:items-start gap-6 relative z-10">
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="p-3 rounded-2xl bg-rose-500/20 animate-pulse">
                            <Zap className="w-6 h-6 text-rose-400" />
                        </div>
                        <div>
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-300 rounded border border-rose-500/30 mb-1 inline-block">
                                ⚡ Auto-Triggered
                            </span>
                            <p className="text-xl font-black text-rose-300 uppercase italic tracking-tighter">Debt Avalanche Consolidation</p>
                        </div>
                    </div>

                    {/* Before → After Math */}
                    <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                        <div className="bg-black/40 rounded-2xl border border-rose-500/20 p-4 text-center">
                            <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">Current Multi-Debt Load</p>
                            <p className="text-2xl font-black text-rose-300">₹{currentLoad > 0 ? currentLoad.toLocaleString() : '30,000+'}</p>
                            <p className="text-[9px] text-slate-500 mt-1">/month</p>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <ArrowRight className="w-6 h-6 text-slate-500" />
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">Consolidate Into 1 Loan</p>
                        </div>
                        {targetEmi ? (
                            <div className="bg-emerald-500/10 rounded-2xl border border-emerald-500/25 p-4 text-center">
                                <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Target Single EMI</p>
                                <p className="text-2xl font-black text-emerald-300">₹{targetEmi.toLocaleString()}</p>
                                {savings && <p className="text-[9px] text-emerald-400/70 mt-1">Save ~₹{savings.toLocaleString()}/mo</p>}
                            </div>
                        ) : (
                            <div className="bg-emerald-500/10 rounded-2xl border border-emerald-500/25 p-4 text-center">
                                <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Strategy</p>
                                <p className="text-lg font-black text-emerald-300">Single Top-Up</p>
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-[11px] font-bold text-slate-400 mt-4 leading-relaxed border-t border-rose-500/20 pt-4 relative z-10">
                    {debtStrategy.logic}
                </p>
            </motion.div>
        );
    }

    // Not triggered — show proactive "Debt is Manageable" safe card
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-[28px] border border-emerald-500/20 bg-emerald-500/5 p-6 mb-6"
        >
            <div className="flex flex-col xl:flex-row xl:items-center gap-6">
                <div className="flex items-center gap-4 shrink-0">
                    <div className="p-3 rounded-2xl bg-emerald-500/20">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Debt Avalanche Analysis</p>
                        <p className="text-xl font-black text-emerald-300 uppercase italic tracking-tighter">{debtStrategy.recommended_method}</p>
                    </div>
                </div>
                <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded mb-3">
                        <ShieldCheck className="w-3 h-3" /> Debt Load: Manageable
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                        {debtStrategy.logic}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
   BEHAVIORAL SPLURGE PREDICTOR
────────────────────────────────────────────────────────────────────────── */
function SplurgePredictorAlert({ splurgePredictor }) {
    if (!splurgePredictor?.triggered) return null;

    const isCritical = splurgePredictor.severity === 'Critical';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full rounded-[28px] border p-6 mb-6 relative overflow-hidden ${
                isCritical 
                    ? 'border-rose-600/50 bg-gradient-to-br from-rose-900/20 to-black/60'
                    : 'border-amber-500/40 bg-gradient-to-br from-amber-900/10 to-black/40'
            }`}
        >
            {/* Hazard stripe background */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
                backgroundImage: 'repeating-linear-gradient(-45deg, rgba(239,68,68,1) 0, rgba(239,68,68,1) 1px, transparent 0, transparent 50%)',
                backgroundSize: '10px 10px'
            }} />

            <div className="relative z-10 flex flex-col xl:flex-row xl:items-start gap-6">
                <div className="flex items-start gap-4 shrink-0">
                    <div className={`p-3 rounded-2xl ${isCritical ? 'bg-rose-500/30' : 'bg-amber-500/20'}`}>
                        <AlertOctagon className={`w-6 h-6 ${isCritical ? 'text-rose-300' : 'text-amber-400'} animate-pulse`} />
                    </div>
                    <div>
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded border mb-1 inline-block ${
                            isCritical ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>🧠 Behavioral Analysis</span>
                        <p className={`text-xl font-black uppercase italic tracking-tighter ${isCritical ? 'text-rose-300' : 'text-amber-300'}`}>
                            {splurgePredictor.title}
                        </p>
                    </div>
                </div>
                <div className="flex-1">
                    <p className="text-sm font-bold text-slate-300 leading-relaxed mb-4">{splurgePredictor.message}</p>
                    <div className={`inline-flex items-start gap-2 px-4 py-3 rounded-xl border text-[11px] font-bold leading-relaxed ${
                        isCritical ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                    }`}>
                        <Brain className="w-4 h-4 shrink-0 mt-0.5" />
                        {splurgePredictor.advice}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN EXPORT
────────────────────────────────────────────────────────────────────────── */
export function DecisionAlerts({ analysis, interestRate }) {
    if (!analysis) return null;

    return (
        <div className="w-full mt-6 space-y-0">
            {/* 1 — Splurge Predictor (only when triggered) */}
            {analysis.splurge_predictor?.triggered && (
                <SplurgePredictorAlert splurgePredictor={analysis.splurge_predictor} />
            )}

            {/* 2 — Debt Avalanche (ALWAYS visible) */}
            {analysis.debt_strategy && (
                <DebtAvalancheSection 
                    debtStrategy={analysis.debt_strategy} 
                    existingEmiTotal={null}
                />
            )}

            {/* 3 — Macro Rate Optimizer (ALWAYS visible) */}
            {analysis.macro_rate_cycle && (
                <MacroRateBanner 
                    macro={analysis.macro_rate_cycle} 
                    interestRate={interestRate || 11.5}
                />
            )}
        </div>
    );
}

import { motion } from 'framer-motion';
import { 
    ShieldAlert, ShieldCheck, TrendingUp, TrendingDown, AlertTriangle, 
    CheckCircle2, Lightbulb, IndianRupee, Activity, Info, BarChart3, Fingerprint, PieChart
} from 'lucide-react';

const RISK_PROFILE_COLORS = {
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/20' },
    teal:    { text: 'text-teal-400',    bg: 'bg-teal-500/10',    border: 'border-teal-500/20',    glow: 'shadow-teal-500/20' },
    amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   glow: 'shadow-amber-500/20' },
    orange:  { text: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  glow: 'shadow-orange-500/20' },
    rose:    { text: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    glow: 'shadow-rose-500/20' },
};

function MetricBox({ label, value, sub, icon: Icon, color = 'slate' }) {
    return (
        <div className="glass-panel rounded-xl p-4 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] uppercase font-bold tracking-tighter text-slate-500 group-hover:text-slate-400 transition-colors uppercase">{label}</p>
                {Icon && <Icon className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />}
            </div>
            <p className={`text-xl font-bold ${color === 'slate' ? 'text-white' : RISK_PROFILE_COLORS[color].text}`}>{value}</p>
            {sub && <p className="text-[10px] text-slate-600 font-medium group-hover:text-slate-500 mt-1">{sub}</p>}
        </div>
    );
}

export default function RiskResultCard({ result }) {
    if (!result) return null;

    const {
        risk_score, pd, lgd, ead, expected_loss,
        risk_level, risk_color, risk_grade, borrower_profile,
        stability_score, dti, loan_to_income, emi_to_income,
        credit_util, positive_factors, negative_factors,
        recommendation, confidence, message
    } = result;

    const theme = RISK_PROFILE_COLORS[risk_color] || RISK_PROFILE_COLORS.amber;

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            
            {/* ── Main Score Panel ── */}
            <div className={`glass-panel rounded-3xl p-6 relative overflow-hidden border ${theme.border} ${theme.glow} shadow-2xl`}>
                <div className={`absolute -top-24 -right-24 w-64 h-64 ${theme.bg} blur-[100px] rounded-full pointer-events-none`} />
                
                <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className={`p-1.5 rounded-lg ${theme.bg}`}>
                                <Fingerprint className={`w-4 h-4 ${theme.text}`} />
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${theme.text}`}>Predictive Risk Assessment</span>
                        </div>
                        <h2 className="text-4xl font-black text-white mb-2 leading-none uppercase italic">
                            {borrower_profile.split(' ')[0]} <br/> <span className={theme.text}>{borrower_profile.split(' ')[1]}</span>
                        </h2>
                        <div className="flex items-center gap-3 mt-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 uppercase font-black">Risk Grade</span>
                                <span className={`text-3xl font-black ${theme.text}`}>{risk_grade}</span>
                            </div>
                            <div className="w-px h-10 bg-slate-800" />
                            <div className="flex flex-col text-sm text-slate-400 font-medium">
                                <span>{risk_level} Probability Zone</span>
                                <span className="text-slate-500 text-xs italic">Model Confidence: {confidence}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center bg-black/40 p-6 rounded-2xl border border-white/5 backdrop-blur-xl">
                        <span className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Aggregate Risk Score</span>
                        <div className="relative mb-2">
                            <svg className="w-24 h-24 transform -rotate-90">
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                                <motion.circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                    initial={{ strokeDashoffset: 251 }} animate={{ strokeDashoffset: 251 - (251 * risk_score / 100) }}
                                    strokeDasharray="251" className={`${theme.text}`} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-3xl font-black text-white">{Math.round(risk_score)}</span>
                            </div>
                        </div>
                        <p className={`text-[10px] font-bold ${theme.text} uppercase`}>{risk_level} EXPOSURE</p>
                    </div>
                </div>
            </div>

            {/* ── Industry Metrics Grid (PD, LGD, EAD, EL) ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricBox label="PD (Prob. of Default)" value={`${pd}%`} sub="Based on historical trends" icon={PieChart} color={risk_color} />
                <MetricBox label="LGD (Loss Given Default)" value={`${lgd}%`} sub="Fixed recovery estimate" icon={TrendingDown} />
                <MetricBox label="EAD (Exposure at Default)" value={`₹${ead.toLocaleString()}`} sub="Total current limit" icon={IndianRupee} />
                <MetricBox label="EL (Expected Loss)" value={`₹${expected_loss.toLocaleString()}`} sub="Risk-adjusted loss" icon={AlertTriangle} color="rose" />
            </div>

            {/* ── Financial Health Dashboard ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-panel rounded-2xl p-5 border border-white/5">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5" /> Core Stability Indices
                    </h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Financial Stability Score', val: stability_score, col: stability_score > 70 ? 'emerald' : stability_score > 40 ? 'amber' : 'rose' },
                            { label: 'Debt-to-Income (DTI)', val: dti, unit: '%', max: 60 },
                            { label: 'EMI-to-Income Ratio', val: emi_to_income, unit: '%', max: 50 },
                            { label: 'Credit Utilization', val: credit_util, unit: '%', max: 100 },
                        ].map(metric => (
                            <div key={metric.label}>
                                <div className="flex justify-between text-[11px] font-bold mb-1.5 uppercase">
                                    <span className="text-slate-400">{metric.label}</span>
                                    <span className={metric.col ? RISK_PROFILE_COLORS[metric.col].text : 'text-slate-200'}>{metric.val}{metric.unit}</span>
                                </div>
                                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${(metric.val / (metric.max || 100)) * 100}%` }} 
                                        className={`h-full ${metric.col ? RISK_PROFILE_COLORS[metric.col].bg.replace('10', '40') : 'bg-rose-500/40'}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="glass-panel rounded-2xl p-5 border border-white/5 h-full">
                        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Info className="w-3.5 h-3.5" /> Explainable Risk Analysis
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-bold text-emerald-400 mb-2 uppercase">✔ Positive Factors</p>
                                <div className="flex flex-wrap gap-2">
                                    {positive_factors.map((f, i) => (
                                        <span key={i} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">{f}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-rose-400 mb-2 uppercase">✘ Risk Contributors</p>
                                <div className="flex flex-wrap gap-2">
                                    {negative_factors.map((f, i) => (
                                        <span key={i} className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-1 rounded border border-rose-500/20">{f}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── AI Recommendation ── */}
            {recommendation && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                    className="glass-panel rounded-2xl p-5 border border-teal-500/20 bg-teal-500/5 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-4">
                        <Lightbulb className="w-5 h-5 text-teal-400" />
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Strategic Recommendation</h4>
                    </div>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                        To mitigate high default probability, consider adjusting your loan structure. A lower principal or extended tenure can significantly improve your risk score.
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                            <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Safer Amount</p>
                            <p className="text-lg font-bold text-teal-400">₹{recommendation.amount.toLocaleString()}</p>
                        </div>
                        <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                            <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Extended Term</p>
                            <p className="text-lg font-bold text-teal-400">{recommendation.tenure} MO</p>
                        </div>
                        <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                            <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Target Risk</p>
                            <p className="text-lg font-bold text-emerald-400">LOW</p>
                        </div>
                    </div>
                </motion.div>
            )}

        </motion.div>
    );
}

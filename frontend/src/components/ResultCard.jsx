import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck, AlertTriangle, TrendingUp, CheckCircle2, XCircle, IndianRupee, AlertCircle } from 'lucide-react';

export default function ResultCard({ result }) {
    if (!result) return null;

    const { eligible, probability, suggestedLimit, reasons = [] } = result;

    const isApproved = eligible;
    const neonColor = isApproved ? "emerald" : "rose";
    const StatusIcon = isApproved ? CheckCircle2 : XCircle;

    const riskData = [
        { amount: suggestedLimit * 0.2, risk: Math.max(5, 100 - probability * 1.5) },
        { amount: suggestedLimit * 0.5, risk: Math.max(10, 100 - probability * 1.2) },
        { amount: suggestedLimit * 0.75, risk: Math.max(20, 100 - probability) },
        { amount: suggestedLimit * 1.0, risk: isApproved ? (100 - probability + 15) : (100 - probability + 35) },
        { amount: suggestedLimit * 1.3, risk: isApproved ? 80 : 95 },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            {/* ── Status Banner ── */}
            <div className={`glass-panel rounded-2xl p-6 relative overflow-hidden border ${isApproved ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
                <div className={`absolute -top-20 -right-20 w-56 h-56 ${isApproved ? 'bg-emerald-500/10' : 'bg-rose-500/10'} blur-[80px] rounded-full pointer-events-none`} />

                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-xl ${isApproved ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                        <StatusIcon className={`w-5 h-5 ${isApproved ? 'text-emerald-400' : 'text-rose-400'}`} />
                    </div>
                    <span className={`text-xs font-semibold uppercase tracking-widest ${isApproved ? 'text-emerald-400' : 'text-rose-400'}`}>
                        Eligibility Status
                    </span>
                </div>

                <div className={`text-3xl font-extrabold mb-2 ${isApproved ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isApproved ? '✔ Eligible' : '✘ Not Eligible'}
                </div>
                <p className="text-slate-400 text-sm">
                    {isApproved
                        ? 'Your financial profile meets the loan approval criteria.'
                        : 'Your current profile does not meet the eligibility criteria.'}
                </p>
            </div>

            {/* ── Metrics Row ── */}
            <div className="grid grid-cols-2 gap-4">
                {/* Approval Chance */}
                <div className="glass-panel rounded-2xl p-5 relative overflow-hidden">
                    <p className="text-xs uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" /> Approval Chance
                    </p>
                    <div className="flex items-end gap-1 mt-2">
                        <span className={`text-5xl font-bold ${isApproved ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {probability}
                        </span>
                        <span className="text-2xl text-slate-400 pb-1">%</span>
                    </div>
                    <div className="mt-3 w-full h-1.5 rounded-full bg-slate-700">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${probability}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`h-full rounded-full ${isApproved ? 'bg-emerald-400' : 'bg-rose-400'}`}
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        {isApproved ? 'Above 60% approval threshold' : 'Below 60% approval threshold'}
                    </p>
                </div>

                {/* Suggested Loan Limit – always shown */}
                <div className="glass-panel rounded-2xl p-5 relative overflow-hidden">
                    <p className="text-xs uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                        <IndianRupee className="w-3.5 h-3.5" /> Suggested Limit
                    </p>
                    <div className="flex items-end gap-1 mt-2">
                        <span className={`text-2xl font-bold leading-tight ${isApproved ? 'text-emerald-400' : 'text-amber-400'}`}>
                            ₹{suggestedLimit.toLocaleString('en-IN')}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">
                        {isApproved
                            ? 'Recommended safe borrowing amount'
                            : 'Max limit if profile improved'}
                    </p>
                </div>
            </div>

            {/* ── Rejection Reasons (shown only when not eligible) ── */}
            {!isApproved && reasons.length > 0 && (
                <div className="glass-panel rounded-2xl p-6 border border-rose-500/20">
                    <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        Key Reasons for Rejection
                    </h4>
                    <ul className="space-y-3">
                        {reasons.map((reason, i) => (
                            <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10"
                            >
                                <div className="mt-0.5 shrink-0 w-2 h-2 rounded-full bg-rose-400 mt-2" />
                                <div>
                                    <p className="text-sm font-medium text-rose-300">{reason.factor}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{reason.detail}</p>
                                </div>
                            </motion.li>
                        ))}
                    </ul>
                    <p className="text-xs text-slate-500 mt-4 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Improve these factors to increase your approval chances.
                    </p>
                </div>
            )}

            {/* ── Risk Chart ── */}
            <div className="glass-panel rounded-2xl p-6">
                <h4 className="text-sm font-semibold text-slate-300 mb-4">Risk vs Loan Amount</h4>
                <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={riskData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isApproved ? "#10b981" : "#f43f5e"} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={isApproved ? "#10b981" : "#f43f5e"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="amount"
                                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                                stroke="#475569"
                                fontSize={11}
                            />
                            <YAxis stroke="#475569" fontSize={11} tickFormatter={(val) => `${val}%`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0F1629', borderColor: '#334155', borderRadius: '8px' }}
                                itemStyle={{ color: '#e2e8f0' }}
                                formatter={(value) => [`${Math.round(value)}% Risk`, '']}
                                labelFormatter={(label) => `Amount: ₹${Number(label).toLocaleString('en-IN')}`}
                            />
                            <Area
                                type="monotone"
                                dataKey="risk"
                                stroke={isApproved ? "#10b981" : "#f43f5e"}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorRisk)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </motion.div>
    );
}

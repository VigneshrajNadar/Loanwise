import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { motion } from 'framer-motion';

const COLORS = {
    very_low:  '#10b981',
    low:       '#14b8a6',
    medium:    '#f59e0b',
    high:      '#f97316',
    very_high: '#f43f5e',
};

const RISK_LABELS = {
    emerald: 'Conservative',
    teal:    'Balanced',
    amber:   'Aggressive',
    orange:  'High-Risk',
    rose:    'Critical'
};

export default function RiskChart({ result }) {
    if (!result) return null;

    const {
        risk_score, pd, lgd, ead, stability_score, risk_color, risk_grade,
        dti, loan_to_income, emi_to_income, credit_util
    } = result;

    // Radar data for borrower characteristics
    const radarData = [
        { subject: 'Income Stability', A: stability_score, fullMark: 100 },
        { subject: 'Debt Capacity',    A: Math.max(0, 100 - dti * 1.5), fullMark: 100 },
        { subject: 'Asset Backing',    A: 50, fullMark: 100 }, // Placeholder for home ownership
        { subject: 'Credit Health',    A: Math.max(0, 100 - credit_util), fullMark: 100 },
        { subject: 'LTI Safety',       A: Math.max(0, 100 - loan_to_income * 20), fullMark: 100 },
    ];

    // Risk vs Probability Distribution (Mock comparison)
    const areaData = [
        { amount: '10k', risk: 5 },
        { amount: '100k', risk: 15 },
        { amount: '250k', risk: 35 },
        { amount: '500k', risk: 60 },
        { amount: '1M', risk: 85 },
        { amount: '2.5M', risk: 100 },
    ];

    return (
        <div className="space-y-6">
            
            {/* ── Eligibility Probability "Slider" Grapher ── */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Eligibility Probability Indicator</h4>
                <div className="relative pt-6 pb-2">
                    {/* Linear Gauge Background */}
                    <div className="h-4 w-full bg-slate-900 rounded-full flex overflow-hidden border border-white/5 shadow-inner">
                        <div className="h-full w-1/5 bg-emerald-500/30 border-r border-white/5" />
                        <div className="h-full w-1/5 bg-teal-500/30 border-r border-white/5" />
                        <div className="h-full w-1/5 bg-amber-500/30 border-r border-white/5" />
                        <div className="h-full w-1/5 bg-orange-500/30 border-r border-white/5" />
                        <div className="h-full w-1/5 bg-rose-500/30" />
                    </div>
                    {/* The "Slider" Pointer */}
                    <motion.div initial={{ left: 0 }} animate={{ left: `${pd}%` }} transition={{ type: 'spring', stiffness: 50 }}
                        className="absolute top-1 -translate-x-1/2 flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg shadow-black/50 bg-${risk_color}-500`} />
                        <div className={`w-0.5 h-6 bg-${risk_color}-500 mb-1`} />
                        <span className={`text-[10px] font-black text-white bg-slate-800 px-2 py-0.5 rounded border border-white/10 uppercase`}>
                           {risk_score}% Risk
                        </span>
                    </motion.div>
                </div>
                <div className="flex justify-between mt-8 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                    <span>Low Risk</span>
                    <span>Moderate</span>
                    <span>High Risk</span>
                    <span>Critical</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ── Borrower DNA (Radar Chart) ── */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Borrower Risk Profile DNA</h4>
                    <div className="h-[200px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Borrower" dataKey="A" stroke={COLORS[risk_color] || '#10b981'} fill={COLORS[risk_color] || '#10b981'} fillOpacity={0.4} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ── Risk Exposure Curve (Area Chart) ── */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Loan Amount vs Risk Exposure</h4>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={areaData}>
                                <defs>
                                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="amount" stroke="#475569" fontSize={9} />
                                <YAxis hide domain={[0, 100]} />
                                <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1e293b', fontSize: '10px' }} />
                                <Area type="monotone" dataKey="risk" stroke="#f43f5e" fillOpacity={1} fill="url(#riskGrad)" />
                                {/* Current position dot */}
                                <Area type="monotone" dataKey="current" stroke="none" fill="none" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-2 text-center">Projected risk increases exponentially relative to principal amount.</p>
                </div>
            </div>

        </div>
    );
}

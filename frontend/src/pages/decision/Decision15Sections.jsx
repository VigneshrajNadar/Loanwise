import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Activity, Brain, ShieldAlert, TrendingUp, Wallet, PieChart as PieChartIcon, ShieldCheck, 
    Gauge, Target, Users, Search, Landmark, ArrowRightLeft, FastForward, GitCommit,
    SlidersHorizontal, Zap, AlertOctagon, TrendingDown
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, 
    BarChart, Bar, CartesianGrid, Legend,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';

export function Decision15Sections({ analysis }) {
    if (!analysis) return null;

    // Helper for basic static cards
    const Card = ({ title, icon: Icon, children, isDangerous, delay, className = "" }) => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: delay * 0.05 }}
            className={`glass-panel p-6 rounded-[32px] border transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl flex flex-col ${className} ${
                isDangerous ? 'border-rose-500/30 hover:border-rose-500/60 bg-rose-500/5' : 'border-white/5 hover:border-cyan-500/40 bg-black/40'
            }`}
        >
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4 shrink-0">
                <div className={`p-2 rounded-xl ${isDangerous ? 'bg-rose-500/20' : 'bg-cyan-500/10'} group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-4 h-4 ${isDangerous ? 'text-rose-400' : 'text-cyan-400'}`} />
                </div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{title}</h3>
            </div>
            <div className="flex-1 flex flex-col justify-center">
                {children}
            </div>
        </motion.div>
    );

    // --- CHART DATA PREPARATION ---
    
    // 1. Lifestyle Donut Data
    const m_inc = analysis.affordability.monthly_income;
    const new_emi = analysis.decision.emi;
    const disc_budget = analysis.lifestyle_inflation_cap.discretionary_budget;
    const committed_spend = m_inc - disc_budget - new_emi;

    const donutData = [
        { name: 'Existing Living Expenses (Rent, Bills, Old Debt)', value: committed_spend, color: '#64748b' },
        { name: 'New Loan EMI Addition', value: new_emi, color: '#f59e0b' },
        { name: 'Remaining Free Cash', value: Math.max(0, disc_budget), color: disc_budget < 5000 ? '#ef4444' : '#10b981' }
    ];

    // 2. Wealth vs Bank Cost Bar Data
    const principal = analysis.savings_vs_loan.savings_future_value - analysis.savings_vs_loan.opportunity_cost; 
    const totalBankPaid = analysis.savings_vs_loan.loan_cost + principal;
    const sipFutureValue = analysis.savings_vs_loan.savings_future_value;
    
    const barData = [
        { name: 'Take Loan & Pay Bank', "Total Paid": totalBankPaid, "Wealth Built": 0 },
        { name: 'Invest EMI into Index Fund', "Total Paid": 0, "Wealth Built": sipFutureValue }
    ];

    // 3. Radar Chart Profile Vector
    const radarData = [
        { subject: 'Default Risk', A: Math.min(100, analysis.decision.risk_probability * 2), fullMark: 100 },
        { subject: 'Debt Burden (DTI)', A: Math.min(100, analysis.affordability.ratio * 2), fullMark: 100 },
        { subject: 'Peer Exposure', A: 50 + (analysis.peer_benchmarking.comparison === 'Heavier Burden' ? analysis.peer_benchmarking.delta : -analysis.peer_benchmarking.delta), fullMark: 100 },
        { subject: 'Purpose Cohort Rate', A: parseFloat(analysis.purpose_analysis.historical_default_rate) * 3, fullMark: 100 },
        { subject: 'Credit Drop Exposure', A: Math.min(100, Math.abs(analysis.credit_impact.impact) * 2), fullMark: 100 }
    ];

    // 4. Prepayment Interactive Simulator Component
    const PrepaymentSimulator = () => {
        const [extraPct, setExtraPct] = useState(15); // e.g. pay 15% extra monthly
        
        // Very rough internal amortization approximation for visuals
        const term = formTermMonths || 36; 
        const emi = analysis.decision.emi;
        const bal = principal;
        
        const generateAmortLine = (extraMultiplier) => {
            let pts = [];
            let currentBal = bal;
            let m = 0;
            const step = Math.max(1, Math.floor(term / 20));
            while (currentBal > 0 && m <= term) {
                pts.push({ month: `Mo ${m}`, balance: currentBal });
                currentBal -= ((emi * extraMultiplier) * 0.7); // Roughly estimating principal component
                m += step;
            }
            if (currentBal <= 0) pts.push({ month: `Mo ${m}`, balance: 0 });
            return pts;
        };

        const standardLine = generateAmortLine(1);
        const acceleratedLine = generateAmortLine(1 + (extraPct / 100));

        // Merge for Recharts
        const mergedData = standardLine.map((pt, i) => {
            return {
                month: pt.month,
                "Standard Payment": pt.balance,
                "Accelerated (Simulated)": acceleratedLine[i] ? acceleratedLine[i].balance : 0
            };
        });

        return (
            <div className="flex flex-col h-full w-full">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ">Extra Payment Simulator</p>
                        <p className="text-xl font-black text-cyan-400">+{extraPct}% EMI / month</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl">
                        <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                        <input type="range" min="0" max="50" step="5" value={extraPct} onChange={(e) => setExtraPct(Number(e.target.value))} className="w-24 accent-cyan-500" />
                    </div>
                </div>
                <div className="flex-1 min-h-[160px] w-full mt-2 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mergedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorStd" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v)=>`${v/1000}k`} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} />
                            <Area type="monotone" dataKey="Standard Payment" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorStd)" />
                            <Area type="monotone" dataKey="Accelerated (Simulated)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAcc)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-[10px] font-medium text-slate-400 mt-4 italic text-center">
                    Simulating <span className="text-cyan-400 font-bold">+₹{Math.round(emi * (extraPct/100)).toLocaleString()}</span> extra per month clears the debt <span className="text-emerald-400 font-bold">{Math.round((extraPct/2))} months earlier</span>.
                </p>
            </div>
        );
    };

    // Pull loan term from analysis for chart accuracy
    const formTermMonths = analysis.decision?.loan_term || 36; 

    return (
        <div className="w-full mt-16 mb-24">
            
            {/* BIG GRAPHS ROW (INTERACTIVE SIMULATORS) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-2 xl:grid-cols-3 xl:grid-rows-1 gap-6 mb-6">
                
                {/* Visual Donut Chart */}
                <Card title="Cash Flow Exhaustion" icon={PieChartIcon} isDangerous={disc_budget < 5000} delay={1} className="min-h-[380px] lg:col-span-1">
                    <div className="flex-1 w-full flex flex-col relative h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={donutData} innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                                    {donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', fontSize: '11px', fontWeight: 'bold' }} itemStyle={{ color: '#fff' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{disc_budget < 0 ? 'Deficit' : 'Discretionary'}</p>
                            <p className={`text-2xl font-black ${disc_budget < 5000 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {disc_budget < 0 ? '-' : ''}₹{Math.abs(disc_budget).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Visual Bar Chart */}
                <Card title="Wealth Trajectory: SIP vs Loan" icon={TrendingUp} isDangerous={false} delay={2} className="min-h-[380px] lg:col-span-1">
                     <p className="text-[10px] text-slate-400 font-bold uppercase mb-4 text-center leading-relaxed">
                        Comparing the total sunk cost of your bank loan against the potential net-worth generated if you invested the exact EMI into an S&P 500 Index Fund (7% real return) for the same duration.
                     </p>
                     <div className="flex-1 w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tick={{ fill: '#cbd5e1', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} width={130} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                                <Bar dataKey="Total Paid" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={24} />
                                <Bar dataKey="Wealth Built" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                     </div>
                </Card>

                {/* Prepayment Simulator */}
                <Card title="Debt Extinguisher Simulator" icon={FastForward} isDangerous={false} delay={3} className="min-h-[380px] lg:col-span-2 xl:col-span-1">
                    <PrepaymentSimulator />
                </Card>
            </div>

            {/* SMALLER GRID SECTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                {/* Risk Radar */}
                <Card title="Threat Vector Radar" icon={Target} isDangerous={analysis.decision.risk_probability > 40} delay={4} className="md:row-span-2 min-h-[300px]">
                    <div className="w-full flex-1 -mt-4 mb-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="#1e293b" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9 }} />
                                <Radar dataKey="A" stroke={analysis.decision.risk_probability > 30 ? '#ef4444' : '#10b981'} fill={analysis.decision.risk_probability > 30 ? '#ef4444' : '#10b981'} fillOpacity={0.3} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* 3. EMI Bounce Risk Predictor */}
                <Card title="EMI Bounce Survival" icon={ShieldAlert} isDangerous={analysis.bounce_risk.survival_months < 3} delay={5}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Liquid Runway</p>
                            <p className="text-3xl font-black text-white">{analysis.bounce_risk.survival_months} <span className="text-xl text-slate-500">MO</span></p>
                        </div>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400 leading-relaxed italic border-l-2 border-white/10 pl-3">
                        {analysis.bounce_risk.message}
                    </p>
                </Card>

                {/* 6. Cohort Purpose Risk */}
                <Card title="Cohort Purpose Risk" icon={PieChartIcon} isDangerous={analysis.purpose_analysis.risk_level === 'High'} delay={6}>
                     <div className="flex justify-between items-center mb-4">
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Market Default Rate</p>
                            <p className="text-2xl font-black text-white">{analysis.purpose_analysis.historical_default_rate}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-xs font-black text-cyan-400 uppercase">{analysis.purpose_analysis.purpose.replace(/_/g, ' ')}</p>
                        </div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        People who take loans for this exact purpose have a {analysis.purpose_analysis.risk_level} risk of defaulting.
                    </p>
                </Card>

                {/* 7. Emergency Buffer Engine */}
                <Card title="Emergency Buffer Engine" icon={ShieldCheck} isDangerous={analysis.decision.decision === 'Avoid Loan'} delay={7}>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Mandatory Liquid Cash Req.</p>
                     <p className="text-3xl font-black text-white mb-2">₹{analysis.emergency_buffer.required_liquid.toLocaleString()}</p>
                     <p className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg uppercase tracking-widest inline-block mb-2">
                         {analysis.emergency_buffer.breakdown}
                     </p>
                </Card>

                {/* 8. Credit Score Forecasting */}
                <Card title="Instant Credit Impact" icon={Gauge} isDangerous={analysis.credit_impact.predicted_score < 650} delay={8}>
                    <div className="flex items-center justify-between mt-2">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-slate-500">{analysis.credit_impact.current_score}</p>
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Current</p>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <ArrowRightLeft className="w-5 h-5 text-slate-600" />
                            <span className="text-[10px] font-black text-rose-500 px-2 py-0.5 bg-rose-500/10 rounded-md border border-rose-500/20">{analysis.credit_impact.impact} PT</span>
                        </div>
                        <div className="text-center">
                            <p className={`text-3xl font-black ${analysis.credit_impact.predicted_score < 650 ? 'text-rose-400' : 'text-emerald-400'}`}>{analysis.credit_impact.predicted_score}</p>
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Predicted</p>
                        </div>
                    </div>
                </Card>

                {/* 9. Negotiation Leverage Scorer */}
                <Card title="Negotiation Leverage" icon={Target} isDangerous={analysis.negotiation_leverage.status === 'Weak Power'} delay={9}>
                     <div className="flex justify-between items-center mb-4 mt-2">
                        <p className="text-3xl font-black text-white">{analysis.negotiation_leverage.score.toFixed(0)}<span className="text-xl text-slate-500">/100</span></p>
                        <span className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border ${
                            analysis.negotiation_leverage.status === 'High Power' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                            {analysis.negotiation_leverage.status}
                        </span>
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 border-t border-white/10 pt-4 italic mt-auto">
                        {analysis.negotiation_leverage.message}
                    </p>
                </Card>

                {/* 10. Peer Benchmarking */}
                <Card title="Market Peer Benchmark" icon={Users} isDangerous={analysis.peer_benchmarking.comparison === 'Heavier Burden'} delay={10}>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Delta against Bracket</p>
                    <p className={`text-3xl font-black mb-3 ${analysis.peer_benchmarking.comparison === 'Heavier Burden' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {analysis.peer_benchmarking.comparison === 'Heavier Burden' ? '+' : '-'}{analysis.peer_benchmarking.delta}%
                    </p>
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5 mt-auto">
                        <p className="text-[10px] font-black text-slate-300 uppercase leading-relaxed">
                            {analysis.peer_benchmarking.message}
                        </p>
                    </div>
                </Card>

                {/* 11. Hidden Fees Auto-Discovery */}
                <Card title="Hidden Deductions" icon={Search} isDangerous={analysis.hidden_fees.total_deductions > 10000} delay={11}>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Processing</p>
                            <p className="text-lg font-bold text-rose-400/80">₹{analysis.hidden_fees.processing_fee_est.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Insurance</p>
                            <p className="text-lg font-bold text-rose-400/80">₹{analysis.hidden_fees.forced_insurance_est.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 mt-auto">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actual Mapped</p>
                        <p className="text-xl font-black text-cyan-400">₹{analysis.hidden_fees.actual_disbursed.toLocaleString()}</p>
                    </div>
                </Card>

                {/* 12. Tax Shield Viability */}
                <Card title="Tax Shield Integrity" icon={Landmark} isDangerous={analysis.tax_shield.status === 'Not Eligible'} delay={12}>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tax Act Section</p>
                        <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${
                            analysis.tax_shield.status === 'Eligible' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                            {analysis.tax_shield.section}
                        </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400 leading-relaxed border-l-2 border-slate-700 pl-3 italic mt-auto">
                        {analysis.tax_shield.benefit}
                    </p>
                </Card>

                {/* 13. Alternative Financing Matrix */}
                <Card title="Alternative Solutions" icon={ArrowRightLeft} isDangerous={false} delay={13}>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Algorithm Recommends</p>
                     <p className="text-lg font-black text-white mb-4 leading-tight">{analysis.alternative_financing.primary_alternative}</p>
                     
                     <div className="flex justify-between items-center bg-cyan-500/5 p-3 rounded-xl border border-cyan-500/10 mt-auto">
                         <p className="text-[10px] font-bold text-cyan-400/80 uppercase">Est. Target Rate</p>
                         <p className="text-sm font-black text-cyan-400">{analysis.alternative_financing.estimated_rate}</p>
                     </div>
                </Card>

                {/* 15. Debt Integration Protocol - Upgraded Avalanche */}
                <Card 
                    title={analysis.debt_strategy?.avalanche_triggered ? "⚡ Debt Avalanche Auto-Triggered" : "Debt Integration Strategy"} 
                    icon={GitCommit} 
                    isDangerous={analysis.debt_strategy?.avalanche_triggered} 
                    delay={14}
                >
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Mathematical Order</p>
                     <p className={`text-xl font-black mb-3 uppercase italic tracking-tighter ${analysis.debt_strategy?.avalanche_triggered ? 'text-rose-400' : 'text-purple-400'}`}>{analysis.debt_strategy.recommended_method}</p>
                     
                     {analysis.debt_strategy?.avalanche_triggered && analysis.debt_strategy?.consolidation_target_emi && (
                        <div className="mb-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                            <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Consolidation Target EMI</p>
                            <p className="text-2xl font-black text-white">₹{analysis.debt_strategy.consolidation_target_emi.toLocaleString()}<span className="text-sm text-slate-500">/mo</span></p>
                        </div>
                     )}

                     <p className="text-[10px] font-medium text-slate-400 italic leading-relaxed mt-auto">
                         {analysis.debt_strategy.logic}
                     </p>
                </Card>

                {/* Behavioral Splurge Predictor */}
                {analysis.splurge_predictor && (
                    <Card 
                        title="Behavioral Spending Pattern" 
                        icon={analysis.splurge_predictor.triggered ? AlertOctagon : ShieldCheck} 
                        isDangerous={analysis.splurge_predictor.triggered} 
                        delay={15}
                    >
                        <div className={`mb-4 px-3 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest inline-block ${
                            analysis.splurge_predictor.triggered 
                                ? (analysis.splurge_predictor.severity === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/20')
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                            {analysis.splurge_predictor.title}
                        </div>
                        <p className="text-[11px] font-medium text-slate-400 leading-relaxed italic mb-4">
                            {analysis.splurge_predictor.message}
                        </p>
                        <p className="text-[10px] font-black text-cyan-400 border-t border-white/5 pt-3 mt-auto leading-relaxed">
                            {analysis.splurge_predictor.advice}
                        </p>
                    </Card>
                )}
            </div>
        </div>
    );
}

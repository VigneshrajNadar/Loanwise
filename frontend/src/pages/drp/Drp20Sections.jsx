import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    AlertTriangle, ShieldAlert, TrendingDown, Target, Building2, 
    Activity, Clock, Users, Zap, ShieldCheck, Database, FileText, Anchor,
    Flame, PieChart as PieChartIcon, TrendingUp, Landmark, Home, History, SlidersHorizontal
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, 
    BarChart, Bar, CartesianGrid, Legend,
    RadarChart, PolarGrid, PolarAngleAxis, Radar,
    RadialBarChart, RadialBar,
    LineChart, Line, ReferenceLine
} from 'recharts';

export function Drp20Sections({ result, profile }) {
    if (!result) return null;

    // Helper Card
    const Card = ({ title, icon: Icon, children, isDangerous, delay, className = "", accentColor }) => {
        const accent = accentColor || (isDangerous ? 'rose' : 'indigo');
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: delay * 0.05 }}
                className={`glass-panel p-6 rounded-[32px] border transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl flex flex-col ${className} ${
                    isDangerous ? 'border-rose-500/30 hover:border-rose-500/60 bg-rose-500/5' : 
                    accentColor === 'emerald' ? 'border-emerald-500/20 bg-emerald-900/5 hover:border-emerald-500/40' :
                    accentColor === 'amber' ? 'border-amber-500/20 bg-amber-900/5 hover:border-amber-500/40' :
                    'border-white/5 hover:border-indigo-500/40 bg-black/40'
                }`}
            >
                <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4 shrink-0">
                    <div className={`p-2 rounded-xl bg-${accent}-500/10 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-4 h-4 text-${accent}-400`} />
                    </div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{title}</h3>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                    {children}
                </div>
            </motion.div>
        );
    };

    // --- BASE CALCULATION DATA ---

    // 1. Expected Loss Waterfall (Bar Chart)
    const ead = result.loss_metrics.ead;
    const recovery = result.recovery.estimated_recovery;
    const el = result.loss_metrics.expected_loss;
    const lossData = [
        { name: 'Exposure at Default', amount: ead, fill: '#64748b' },
        { name: 'Est. Bank Recovery', amount: recovery, fill: '#10b981' },
        { name: 'Expected Loss Write-off', amount: el, fill: '#ef4444' }
    ];

    // 2. Tenure Sensitivity (Area Chart)
    const tData = result.tenure_analysis.map(t => ({
        month: `${t.months}m`,
        EMI: t.emi,
        Interest: t.totalInterest
    }));

    // 3. Radar Chart
    const radarData = [
        { subject: 'Financial Stability', A: result.stability_score, fullMark: 100 },
        { subject: 'Psychometric Profile', A: result.psychometric.score, fullMark: 100 },
        { subject: 'Debt Trap Risk', A: result.debt_trap.spiral_probability, fullMark: 100 },
        { subject: 'Recovery Prob', A: result.recovery.probability, fullMark: 100 },
        { subject: 'PD Base', A: 100 - result.pd, fullMark: 100 }
    ];

    // --- DASHBOARD-CONNECTED DATA SECTIONS ---

    // 4. Emergency Liquidity Burndown (Profile-connected)
    const dashSavings     = Number(profile?.savings || 0);
    const dashInvestments = Number(profile?.investments || 0);
    const dashRent        = Number(profile?.rent || 0);
    const dashExpenses    = Number(profile?.monthly_expenses || 0);
    const dashInsurance   = Number(profile?.insurance_premium || 0);
    const totalLiquid     = dashSavings + dashInvestments * 0.4; // 40% of investments assumed liquid
    const monthlyBurn     = dashExpenses + dashRent + dashInsurance + result.monthly_installment;
    const monthsToEmpty   = monthlyBurn > 0 ? Math.floor(totalLiquid / monthlyBurn) : 99;
    const burndownData    = Array.from({ length: Math.min(monthsToEmpty + 2, 36) }, (_, i) => ({
        month: `Mo ${i}`,
        'Liquid Assets': Math.max(0, totalLiquid - monthlyBurn * i),
        'Danger Line': monthlyBurn * 3 // 3 months emergency fund = minimum safe zone
    }));

    // 5. EMI Portfolio Breakdown (Profile-connected)
    const dashEmis = (profile?.emis || []);
    const emiColors = ['#6366f1', '#f59e0b', '#10b981', '#f43f5e', '#06b6d4', '#a78bfa'];
    const emiChartData = [
        ...dashEmis.map((e, i) => ({ name: e.label || e.type || `EMI ${i+1}`, value: Number(e.amount), color: emiColors[i % emiColors.length] })),
        { name: 'New Loan EMI', value: result.monthly_installment, color: '#ef4444' }
    ];
    const totalEmiLoad = emiChartData.reduce((s, e) => s + e.value, 0);
    const dashMonthlyIncome = Number(profile?.monthly_income || result.loss_metrics.ead / 60);
    const emiIncomeRatio = dashMonthlyIncome > 0 ? ((totalEmiLoad / dashMonthlyIncome) * 100).toFixed(1) : result.dti;

    // 6. Net Worth Erosion Over Loan Tenure (Profile-connected)
    const dashNetWorth = dashSavings + dashInvestments + Number(profile?.ppf_nps || 0) + Number(profile?.gold_value || 0) + Number(profile?.net_worth_assets || 0);
    const loanTotalCost = result.monthly_installment * (result.tenure_analysis[result.tenure_analysis.length - 1]?.months || 36);
    const netWorthData = [
        { label: 'Current Net Worth', value: dashNetWorth, fill: '#10b981' },
        { label: 'Total Loan Cost', value: -loanTotalCost, fill: '#ef4444' },
        { label: 'Post-Loan Net Worth', value: dashNetWorth - loanTotalCost, fill: dashNetWorth > loanTotalCost ? '#6366f1' : '#f43f5e' }
    ];

    // 7. Goal Feasibility Check (Profile-connected)
    const genericGoalType = profile?.goal_type || 'Home';
    const goalHomeAmt  = Number(profile?.goal_amount || profile?.goal_home_amount || 0);
    const goalHomeYrs  = Number(profile?.goal_home_years || 5);
    const goalRetYrs   = Number(profile?.goal_retirement_years || 0);
    const monthlyFreeCash = Math.max(0, dashMonthlyIncome - monthlyBurn);
    const sipRate = 0.12 / 12;

    const getSipFV = (monthly, years) => {
        const r = sipRate;
        const n = years * 12;
        return (monthly > 0 && n > 0 && r > 0) ? monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r) : 0;
    };
    
    const homeSipProjection = getSipFV(monthlyFreeCash, goalHomeYrs);
    const goalHomeAchievable = goalHomeAmt > 0 ? homeSipProjection >= goalHomeAmt : null;

    const retGoalMonths = goalRetYrs * 12;
    const retCorpus = retGoalMonths > 0 && sipRate > 0
        ? monthlyFreeCash * ((Math.pow(1 + sipRate, retGoalMonths) - 1) / sipRate)
        : 0;

    // 8. CIBIL Trajectory Simulator
    const baseCibil = Number(profile?.cibil_score || 700);
    const cibilAfter = Math.max(300, Math.min(900, baseCibil - Math.round(result.pd * 0.8)));
    const cibilTimeline = [
        { label: 'Now', score: baseCibil },
        { label: '1 Month', score: Math.max(300, baseCibil - Math.round(result.pd * 0.15)) },
        { label: '6 Months', score: Math.max(300, baseCibil - Math.round(result.pd * 0.40)) },
        { label: '12 Months', score: Math.max(300, baseCibil - Math.round(result.pd * 0.55)) },
        { label: '24 Months', score: Math.max(300, cibilAfter) },
        { label: 'Loan End', score: baseCibil > 750 && result.pd < 20 ? Math.min(900, baseCibil + 25) : Math.max(300, cibilAfter - 15) },
    ];

    return (
        <div className="w-full mt-16 mb-24 space-y-6">
            
            {/* SECTION DIVIDER */}
            <div className="flex items-center gap-4 pt-4">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-indigo-500/20" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">AI Risk Intelligence</span>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-indigo-500/20" />
            </div>

            {/* ROW 1: Massive Visualizers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. PD Speedometer */}
                <Card title="Base Probability of Default" icon={Activity} isDangerous={result.pd > 30} delay={1} className="lg:col-span-1 min-h-[350px]">
                    <div className="relative flex-1 flex flex-col items-center justify-center">
                        <ResponsiveContainer width="100%" height={200}>
                            <RadialBarChart 
                                cx="50%" cy="100%" 
                                innerRadius="70%" outerRadius="100%" 
                                barSize={20} 
                                data={[{ value: result.pd, fill: result.pd > 30 ? '#ef4444' : '#10b981' }]} 
                                startAngle={180} endAngle={0}
                            >
                                <RadialBar minAngle={15} background={{ fill: '#1e293b' }} clockWise dataKey="value" cornerRadius={10} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 pointer-events-none">
                            <span className={`text-5xl font-black ${result.pd > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>{result.pd}%</span>
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">AI Confidence: {result.confidence}%</span>
                        </div>
                    </div>
                </Card>

                {/* 2. Expected Loss Engine */}
                <Card title="Expected Loss (EL) Engine" icon={TrendingDown} isDangerous={el > (ead * 0.1)} delay={2} className="lg:col-span-1 min-h-[350px]">
                    <div className="flex-1 w-full h-[200px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={lossData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={110} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                                    {lossData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center mt-2 italic">Bank write-off: <strong className="text-rose-400">₹{el.toLocaleString()}</strong></p>
                </Card>

                {/* 3. Holistic Risk Radar */}
                <Card title="Structural Defense Vector" icon={ShieldAlert} delay={3} className="lg:col-span-1 min-h-[350px]">
                    <div className="flex-1 w-full h-[250px] -mt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }} />
                                <Radar name="Profile Strength" dataKey="A" stroke="#818cf8" fill="#818cf8" fillOpacity={0.4} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* SECTION DIVIDER */}
            <div className="flex items-center gap-4 pt-8">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-rose-500/20" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-rose-700">Dashboard Intelligence — Personalized to Your Profile</span>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-rose-500/20" />
            </div>

            {/* ROW 2: Emergency Liquidity Burndown (Full Width) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className={`w-full rounded-[32px] border p-8 ${monthsToEmpty < 6 ? 'border-rose-500/40 bg-gradient-to-br from-rose-900/10 to-black/60' : monthsToEmpty < 12 ? 'border-amber-500/30 bg-black/40' : 'border-emerald-500/20 bg-black/40'}`}>
                <div className="flex flex-col xl:flex-row xl:items-center gap-6 mb-8">
                    <div className="flex items-center gap-4 shrink-0">
                        <div className={`p-3 rounded-2xl ${monthsToEmpty < 6 ? 'bg-rose-500/20 animate-pulse' : 'bg-amber-500/10'}`}>
                            <Flame className={`w-6 h-6 ${monthsToEmpty < 6 ? 'text-rose-400' : 'text-amber-400'}`} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Emergency Liquidity Stress Test</p>
                            <p className={`text-2xl font-black uppercase italic tracking-tighter ${monthsToEmpty < 6 ? 'text-rose-300' : monthsToEmpty < 12 ? 'text-amber-300' : 'text-emerald-300'}`}>
                                {monthsToEmpty < 6 ? 'Critical Liquidity Risk' : monthsToEmpty < 12 ? 'Moderate Buffer' : 'Resilient Liquidity'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4 flex-1">
                        <div className="bg-black/40 border border-white/5 rounded-2xl px-5 py-3 min-w-[150px]">
                            <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Total Liquid Assets</p>
                            <p className="text-xl font-black text-white">₹{totalLiquid.toLocaleString()}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">(savings + 40% of investments)</p>
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-2xl px-5 py-3 min-w-[150px]">
                            <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Monthly Burn Rate</p>
                            <p className="text-xl font-black text-rose-400">₹{monthlyBurn.toLocaleString()}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">(rent + expenses + new EMI)</p>
                        </div>
                        <div className={`border rounded-2xl px-5 py-3 min-w-[150px] ${monthsToEmpty < 6 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-black/40 border-white/5'}`}>
                            <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Survival Without Job</p>
                            <p className={`text-3xl font-black ${monthsToEmpty < 6 ? 'text-rose-400' : monthsToEmpty < 12 ? 'text-amber-400' : 'text-emerald-400'}`}>{monthsToEmpty} Mo</p>
                        </div>
                    </div>
                </div>
                <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={burndownData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="burnGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={monthsToEmpty < 6 ? '#ef4444' : '#f59e0b'} stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor={monthsToEmpty < 6 ? '#ef4444' : '#f59e0b'} stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="dangerGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/100000).toFixed(1)}L`} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }}
                                formatter={(val) => [`₹${Number(val).toLocaleString()}`, undefined]} />
                            <Area type="monotone" dataKey="Liquid Assets" stroke={monthsToEmpty < 6 ? '#ef4444' : '#f59e0b'} strokeWidth={2.5} fillOpacity={1} fill="url(#burnGrad)" />
                            <Area type="monotone" dataKey="Danger Line" stroke="#6366f1" strokeWidth={1.5} strokeDasharray="6 3" fillOpacity={1} fill="url(#dangerGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-slate-500 mt-3 text-center italic">
                    If you lose income today, your savings + investments cover the new EMI + living costs for approximately <strong className={`${monthsToEmpty < 6 ? 'text-rose-400' : 'text-amber-400'}`}>{monthsToEmpty} months</strong>. Minimum recommendation: 6 months.
                </p>
            </motion.div>

            {/* ROW 3: EMI Portfolio + Net Worth Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 4. EMI Portfolio Analyzer */}
                <Card title="Active EMI Portfolio (Dashboard Sync)" icon={PieChartIcon} accentColor="amber" delay={4} className="min-h-[360px]">
                    {dashEmis.length === 0 && !result.monthly_installment ? (
                        <div className="text-center py-8">
                            <p className="text-slate-500 text-sm">No EMIs found in your Dashboard Profile.</p>
                            <a href="/dashboard" className="text-xs text-indigo-400 hover:underline mt-2 block">→ Add EMIs in Dashboard Profile tab</a>
                        </div>
                    ) : (
                        <div className="flex flex-col xl:flex-row items-center gap-6 h-full">
                            <div className="w-full xl:w-[160px] h-[160px] shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={emiChartData} cx="50%" cy="50%" outerRadius="80%" innerRadius="55%" dataKey="value" stroke="none">
                                            {emiChartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', fontSize: '10px' }}
                                            formatter={(val) => [`₹${Number(val).toLocaleString()}/mo`]} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex-1 space-y-2">
                                {emiChartData.map((e, i) => (
                                    <div key={i} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                                            <span className="text-[10px] text-slate-400 truncate">{e.name}</span>
                                        </div>
                                        <span className="text-[10px] font-black text-white shrink-0">₹{Number(e.value).toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="pt-3 border-t border-white/5 mt-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase text-slate-500">Total EMI/Income Ratio</span>
                                        <span className={`text-base font-black ${parseFloat(emiIncomeRatio) > 50 ? 'text-rose-400' : parseFloat(emiIncomeRatio) > 35 ? 'text-amber-400' : 'text-emerald-400'}`}>{emiIncomeRatio}%</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-[10px] font-black uppercase text-slate-500">Total Monthly Drain</span>
                                        <span className="text-base font-black text-rose-400">₹{totalEmiLoad.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>

                {/* 5. Net Worth Erosion */}
                <Card title="Net Worth Impact Projection" icon={TrendingDown} isDangerous={dashNetWorth < loanTotalCost} accentColor={dashNetWorth > loanTotalCost ? 'emerald' : 'rose'} delay={5} className="min-h-[360px]">
                    {dashNetWorth === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-slate-500 text-sm">Add your assets in Dashboard to see impact.</p>
                            <a href="/dashboard" className="text-xs text-indigo-400 hover:underline mt-2 block">→ Update Net Worth in Dashboard</a>
                        </div>
                    ) : (
                        <>
                            <div className="h-[180px] w-full mb-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={netWorthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/100000).toFixed(0)}L`} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }}
                                            formatter={(val) => [`₹${Math.abs(val).toLocaleString()}`]} />
                                        <ReferenceLine y={0} stroke="#334155" strokeWidth={1} />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                            {netWorthData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                <div>
                                    <p className="text-[9px] uppercase tracking-widest text-slate-500">Total Loan Cost</p>
                                    <p className="text-sm font-black text-rose-400">₹{loanTotalCost.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] uppercase tracking-widest text-slate-500">Net Worth Impact</p>
                                    <p className={`text-sm font-black ${dashNetWorth > loanTotalCost ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {dashNetWorth > loanTotalCost ? '▲ Positive' : '▼ At Risk'}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </Card>
            </div>

            {/* ROW 4: CIBIL Trajectory + Goal Feasibility */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 6. CIBIL Score Trajectory */}
                <Card title="CIBIL Score Trajectory Simulator" icon={TrendingUp} delay={6} accentColor="indigo" className="min-h-[340px]">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-[9px] uppercase tracking-widest text-slate-500">Current CIBIL</p>
                            <p className={`text-3xl font-black ${baseCibil >= 750 ? 'text-emerald-400' : baseCibil >= 650 ? 'text-amber-400' : 'text-rose-400'}`}>{baseCibil}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] uppercase tracking-widest text-slate-500">Post-Loan Projection</p>
                            <p className={`text-3xl font-black ${cibilAfter >= 750 ? 'text-emerald-400' : cibilAfter >= 650 ? 'text-amber-400' : 'text-rose-400'}`}>{cibilAfter}</p>
                        </div>
                    </div>
                    <div className="h-[180px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={cibilTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                                <YAxis domain={[300, 900]} tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} />
                                <ReferenceLine y={750} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1} label={{ value: 'Prime (750)', fill: '#10b981', fontSize: 9 }} />
                                <ReferenceLine y={650} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1} label={{ value: 'Fair (650)', fill: '#f59e0b', fontSize: 9 }} />
                                <Line type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={2.5} dot={{ fill: '#818cf8', r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-slate-500 text-center mt-2 italic">Based on {result.pd}% PD — higher default risk accelerates CIBIL score decay trajectory.</p>
                </Card>

                {/* 7. Life Goal Feasibility Check */}
                <Card title="Life Goal Feasibility Check" icon={Home} accentColor={goalHomeAchievable === false ? 'rose' : 'emerald'} delay={7} className="min-h-[340px]">
                    {goalHomeAmt === 0 && goalRetYrs === 0 ? (
                        <div className="text-center py-8">
                            <Home className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                            <p className="text-slate-500 text-sm">No goals configured in your Dashboard profile.</p>
                            <a href="/dashboard" className="text-xs text-indigo-400 hover:underline mt-2 block">→ Set Goals in Dashboard Profile</a>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className={`p-4 rounded-2xl border ${goalHomeAchievable === null ? 'border-white/5 bg-black/30' : goalHomeAchievable ? 'border-emerald-500/20 bg-emerald-900/5' : 'border-rose-500/20 bg-rose-900/5'}`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-[9px] uppercase tracking-widest font-black text-slate-500">{genericGoalType} Purchase Goal</p>
                                        <p className="text-lg font-black text-white">₹{goalHomeAmt.toLocaleString()}</p>
                                        <p className="text-[9px] text-slate-500">Target: {goalHomeYrs} years</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] uppercase tracking-widest font-black text-slate-500">Projected SIP Corpus</p>
                                        <p className={`text-lg font-black ${goalHomeAchievable ? 'text-emerald-400' : 'text-rose-400'}`}>₹{homeSipProjection.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                                    </div>
                                </div>
                                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-700 ${goalHomeAchievable ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                        style={{ width: `${Math.min(100, goalHomeAmt > 0 ? (homeSipProjection / goalHomeAmt) * 100 : 0).toFixed(0)}%` }} />
                                </div>
                                <p className={`text-[10px] font-bold mt-2 ${goalHomeAchievable ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {goalHomeAchievable === null ? `— Set a ${genericGoalType.toLowerCase()} goal` : goalHomeAchievable ? '✓ Goal is achievable with remaining free cash' : `✗ Shortfall of ₹${Math.round(goalHomeAmt - homeSipProjection).toLocaleString()} — this new EMI compromises the goal`}
                                </p>
                            </div>

                            {goalRetYrs > 0 && (
                                <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-900/5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-[9px] uppercase tracking-widest font-black text-slate-500">Retirement Corpus Projection</p>
                                            <p className="text-[9px] text-slate-500">@ 12% XIRR for {goalRetYrs} yrs on ₹{monthlyFreeCash.toLocaleString()}/mo free cash</p>
                                        </div>
                                        <p className="text-lg font-black text-indigo-400">₹{retCorpus.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                <p className="text-[9px] uppercase tracking-widest text-slate-500">Monthly Free Cash After All EMIs</p>
                                <p className={`text-base font-black ${monthlyFreeCash < 5000 ? 'text-rose-400' : 'text-emerald-400'}`}>₹{monthlyFreeCash.toLocaleString()}</p>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* ROW 5: Tenure + Small Intel Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Tenure Sensitivity Simulation" icon={Target} delay={8} className="min-h-[300px]">
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={tData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorInt" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorEmi" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} />
                                <Area type="monotone" dataKey="Interest" stroke="#f59e0b" fill="url(#colorInt)" />
                                <Area type="monotone" dataKey="EMI" stroke="#6366f1" fill="url(#colorEmi)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <div className="grid grid-cols-2 gap-6">
                    <Card title="Macro Vulnerability" icon={Building2} isDangerous={result.macro.inflation_shock_risk === 'High'} delay={9}>
                        <div className="space-y-4">
                            <div><p className="text-[8px] uppercase tracking-widest text-slate-500 mb-1">Inflation Risk</p><p className={`text-sm font-black ${result.macro.inflation_shock_risk === 'High' ? 'text-rose-400' : 'text-emerald-400'}`}>{result.macro.inflation_shock_risk}</p></div>
                            <div><p className="text-[8px] uppercase tracking-widest text-slate-500 mb-1">Rate Hike Risk</p><p className={`text-sm font-black ${result.macro.rate_hike_vulnerability === 'Critical' ? 'text-rose-400' : 'text-emerald-400'}`}>{result.macro.rate_hike_vulnerability}</p></div>
                            <div><p className="text-[8px] uppercase tracking-widest text-slate-500 mb-1">Job Dependency</p><p className="text-sm font-black text-indigo-400">{result.macro.job_market_dependency}</p></div>
                        </div>
                    </Card>
                    <Card title="Budget Shock Absorber" icon={Anchor} isDangerous={result.shock_absorber.status === 'Vulnerable'} delay={10}>
                        <div className="flex flex-col items-center justify-center text-center h-full space-y-3">
                            <p className="text-[10px] text-slate-400 font-bold leading-tight">Min Cash Buffer</p>
                            <p className="text-3xl font-black text-white">₹{result.shock_absorber.recommended_buffer.toLocaleString()}</p>
                            <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg border ${result.shock_absorber.status === 'Vulnerable' ? 'bg-rose-500/20 border-rose-500/30 text-rose-300' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'}`}>{result.shock_absorber.status}</span>
                        </div>
                    </Card>
                </div>
            </div>

            {/* ROW 6: Small Intel Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card title="Debt Trap Spiral" icon={AlertTriangle} isDangerous={result.debt_trap.risk_status === 'High'} delay={11}>
                    <p className="text-4xl font-black mb-2 text-white">{result.debt_trap.spiral_probability}%</p>
                    <p className="text-[10px] text-slate-400 leading-tight">Probability of entering an unrecoverable debt loop.</p>
                </Card>
                <Card title="Network Contagion" icon={Users} isDangerous={result.network_contagion.secondary_exposure === 'Elevated Risk'} delay={12}>
                    <p className={`text-lg font-black uppercase mb-1 ${result.network_contagion.secondary_exposure === 'Low' ? 'text-emerald-400' : 'text-rose-400'}`}>{result.network_contagion.secondary_exposure}</p>
                    <p className="text-[10px] text-slate-400 leading-tight">Cross-default risk from family or guarantors.</p>
                </Card>
                <Card title="Shadow Debt Check" icon={Database} isDangerous={result.shadow_debt.bnpl_probability === 'High Probability'} delay={13}>
                    <p className={`text-lg font-black uppercase mb-1 ${result.shadow_debt.bnpl_probability === 'Low Probability' ? 'text-emerald-400' : 'text-rose-400'}`}>{result.shadow_debt.bnpl_probability}</p>
                    <p className="text-[10px] text-slate-400 leading-tight">Est Hidden: {result.shadow_debt.estimated_hidden_exposure}</p>
                </Card>
                <Card title="Missed Payment Penalty" icon={TrendingDown} isDangerous={true} delay={14}>
                    <div className="flex justify-between items-center mb-2"><span className="text-[10px] text-slate-500 font-bold uppercase">1 Miss</span><span className="text-sm font-black text-rose-400">PD {result.behavioral_penalty.missed_1_payment}%</span></div>
                    <div className="flex justify-between items-center"><span className="text-[10px] text-slate-500 font-bold uppercase">2 Misses</span><span className="text-sm font-black text-rose-500">PD {result.behavioral_penalty.missed_2_payments}%</span></div>
                    <p className="text-[9px] text-slate-500 mt-3 pt-3 border-t border-white/5">CIBIL Drop: {result.behavioral_penalty.credit_drop_est}</p>
                </Card>
            </div>

            {/* ROW 6.5: BRAND NEW ADVANCED DEFAULT SIMULATORS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6 border-b border-indigo-500/20 mb-6 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0a0f1a] px-4 text-[10px] font-black text-indigo-500 tracking-widest uppercase shadow-[0_0_20px_rgba(99,102,241,0.2)]">Advanced Default Simulators</div>
                
                {/* 21. True Cost & Inflation Erosion */}
                {result.inflation_erosion && (
                    <Card title="True Cost & Inflation Erosion" icon={Flame} delay={14.1}>
                        <div className="h-48 mb-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    {name: 'Nominal Cost', value: result.inflation_erosion.nominal_cost},
                                    {name: 'Real Value (at 6% Inf)', value: result.inflation_erosion.real_cost_at_6pct}
                                ]} margin={{top:10, right:10, bottom:10, left:20}}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false}/>
                                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false}/>
                                    <YAxis stroke="#6b7280" fontSize={10} tickFormatter={(v)=>`₹${(v/1000).toFixed(0)}K`} tickLine={false} axisLine={false}/>
                                    <Tooltip contentStyle={{backgroundColor:'#111827', borderColor:'#374151', borderRadius:'12px', fontSize:'11px'}} cursor={{fill:'#1f2937'}} formatter={(val)=>['₹'+val.toLocaleString(), 'Amount']}/>
                                    <Bar dataKey="value" radius={[4,4,0,0]}>
                                        <Cell fill="#6366f1"/>
                                        <Cell fill="#10b981"/>
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 text-center">Inflation effectively erodes <span className="text-emerald-400 font-bold">{result.inflation_erosion.wealth_transfer_pct}%</span> of the debt's real burden.</p>
                    </Card>
                )}

                {/* 22. Macro Rate Shock Predictor */}
                {result.macro_rate_shock && (
                    <Card title="Macro Rate Shock Predictor" icon={Activity} delay={14.2}>
                        <div className="h-48 mb-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={result.macro_rate_shock} margin={{top:10, right:10, bottom:10, left:0}}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false}/>
                                    <XAxis dataKey="shock" stroke="#6b7280" fontSize={9} tickLine={false} axisLine={false}/>
                                    <YAxis stroke="#6b7280" fontSize={10} tickFormatter={(v)=>`₹${(v/1000).toFixed(0)}K`} tickLine={false} axisLine={false}/>
                                    <Tooltip contentStyle={{backgroundColor:'#111827', borderColor:'#374151', borderRadius:'12px', fontSize:'11px'}}/>
                                    <Line type="monotone" dataKey="emi" stroke="#f43f5e" strokeWidth={3} dot={{r:4, fill:'#f43f5e', strokeWidth:0}} activeDot={{r:6}} name="Shock EMI" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 text-center text-rose-300">A 3% RBI rate hike pushes your Default Probability to <span className="font-bold">{result.macro_rate_shock[3].pd}%</span>.</p>
                    </Card>
                )}

                {/* 23. Refinancing Horizon */}
                {result.refinancing_horizon && (
                    <Card title="Refinancing Sweet Spot" icon={Target} delay={14.3}>
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
                            <div className="w-20 h-20 rounded-full border-4 border-indigo-500/30 flex flex-col items-center justify-center relative bg-indigo-500/10 shrink-0 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                                <span className="text-2xl font-black text-indigo-400 leading-none">M{result.refinancing_horizon.crossover_month}</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white">Optimal Refinance Window</h4>
                                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto">Target a rate drop of <span className="text-emerald-400 font-bold">{result.refinancing_horizon.safe_rate_drop}%</span> by Month {result.refinancing_horizon.crossover_month} to maximize savings.</p>
                            </div>
                            <div className="bg-[#111827] border border-[#1f2937] px-4 py-2 rounded-xl mt-2 inline-flex flex-col items-center">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Est. Monthly Savings</span>
                                <span className="text-sm font-black text-emerald-400">₹{result.refinancing_horizon.monthly_savings.toLocaleString()} / mo</span>
                            </div>
                        </div>
                    </Card>
                )}

                {/* 24. Behavioral Contagion Matrix */}
                {result.behavioral_contagion && (
                    <Card title="Budget Contagion Matrix" icon={PieChartIcon} delay={14.4}>
                        <div className="h-48 mb-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={result.behavioral_contagion}>
                                    <PolarGrid stroke="#1f2937" />
                                    <PolarAngleAxis dataKey="category" tick={{ fill: '#6b7280', fontSize: 9 }} />
                                    <Radar name="Budget Cutback %" dataKey="cutback" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} />
                                    <Tooltip contentStyle={{backgroundColor:'#111827', borderColor:'#374151', borderRadius:'12px', fontSize:'11px'}} formatter={(v)=>v+'%'}/>
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 text-center px-4">If stressed, your <span className="font-bold text-rose-400">Travel & Vacations</span> budget will be the first targeted for an immediate 100% cutback.</p>
                    </Card>
                )}
            </div>

            {/* ROW 7: Playbook + Roadmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Default Avoidance Playbook" icon={ShieldCheck} delay={15} className="h-full">
                    <div className="space-y-4">
                        {result.playbook.map((p, i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-2xl bg-black/40 border border-white/5 items-center">
                                <div className="text-indigo-500/30 font-black text-2xl italic shrink-0">{p.step}</div>
                                <div className="flex-1"><p className="text-xs font-bold text-white leading-tight">{p.action}</p></div>
                                <span className={`shrink-0 px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded border ${p.impact === 'Critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>{p.impact}</span>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card title="Pre-Approval Action Plan" icon={FileText} delay={16} className="h-full">
                    <div className="space-y-4">
                        {result.roadmap.map((r, i) => (
                            <div key={i} className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
                                <p className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-1">{r.task}</p>
                                <p className="text-[10px] text-slate-400 mb-2">{r.desc}</p>
                                <p className="text-[9px] text-emerald-400 font-bold">↳ {r.benefit}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* ROW 8: ULTRA ADVANCED LIFE SIMULATORS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 border-t border-indigo-500/20 mt-6 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0a0f1a] px-4 text-[10px] font-black text-emerald-500 tracking-widest uppercase shadow-[0_0_20px_rgba(16,185,129,0.2)]">Wealth Destruction Simulators</div>
                
                {/* 25. Yield vs Debt Arbitrage */}
                <Card title="Yield vs Debt Arbitrage" icon={TrendingDown} outlineColor="amber" delay={16.1} className="lg:col-span-1 h-full flex flex-col">
                    <div className="flex-1 flex flex-col justify-center text-center">
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2">Cost of Debt vs Equity Return</p>
                        <div className="flex items-center justify-center gap-6 mb-4">
                            <div>
                                <p className="text-3xl font-black text-rose-400">{result.monthly_installment ? (result.monthly_installment * 36 - 100000 > 0 ? '16%' : '14%') : '15%'}</p>
                                <p className="text-[9px] text-slate-500">Debt Cost</p>
                            </div>
                            <div className="text-slate-600 font-bold opacity-30">VS</div>
                            <div>
                                <p className="text-3xl font-black text-emerald-400">12%</p>
                                <p className="text-[9px] text-slate-500">Est. Index Return</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-300">Arbitrage is <span className="font-bold text-rose-400">NEGATIVE</span>.</p>
                        <p className="text-[10px] text-slate-500 mt-1">Mathematically, every extra rupee you have should aggressively prepay this loan rather than being invested in SIPs.</p>
                    </div>
                </Card>

                {/* 26. Opportunity Cost Wealth Destruction */}
                <Card title="Opportunity Cost of Capital" icon={Activity} outlineColor="rose" delay={16.2} className="lg:col-span-1 h-full">
                     <div className="h-40 mb-2 mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                                { year: 1, wealth: getSipFV(result.monthly_installment, 1) },
                                { year: 5, wealth: getSipFV(result.monthly_installment, 5) },
                                { year: 10, wealth: getSipFV(result.monthly_installment, 10) },
                                { year: 15, wealth: getSipFV(result.monthly_installment, 15) },
                                { year: 20, wealth: getSipFV(result.monthly_installment, 20) },
                            ]} margin={{top:10, right:10, bottom:0, left:-20}}>
                                <defs>
                                    <linearGradient id="wealthGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false}/>
                                <XAxis dataKey="year" stroke="#6b7280" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v)=>`Y${v}`}/>
                                <YAxis stroke="#6b7280" fontSize={9} tickFormatter={(v)=>`₹${(v/100000).toFixed(0)}L`} tickLine={false} axisLine={false}/>
                                <Tooltip contentStyle={{backgroundColor:'#111827', borderColor:'#374151', borderRadius:'12px', fontSize:'11px'}} formatter={(val)=>['₹'+Number(val).toLocaleString('en-IN',{maximumFractionDigits:0}), 'Destroyed Future Value']}/>
                                <Area type="monotone" dataKey="wealth" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#wealthGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 text-center">If you invested this ₹{result.monthly_installment?.toLocaleString()} EMI in a 12% Index Fund instead of paying debt, it would be worth <span className="font-bold text-rose-400">₹{getSipFV(result.monthly_installment, 10).toLocaleString('en-IN', {maximumFractionDigits:0})}</span> in 10 years.</p>
                </Card>

                {/* 27. Cashflow Severance Simulator */}
                <Card title="Cashflow Severance Drop" icon={TrendingDown} outlineColor="rose" delay={16.3} className="lg:col-span-1 h-full">
                    <div className="flex flex-col h-full justify-center space-y-4">
                         <div className="flex items-center justify-between p-3 rounded-xl border border-rose-500/20 bg-rose-500/5">
                             <div>
                                 <p className="text-[9px] uppercase tracking-widest font-black text-rose-400">Zero Income Shock</p>
                                 <p className="text-lg font-black text-white">M-{monthsToEmpty}</p>
                             </div>
                             <div className="text-right">
                                 <p className="text-[9px] text-slate-500 uppercase font-black">Monthly Burn</p>
                                 <p className="text-sm font-bold text-rose-300">₹{monthlyBurn.toLocaleString()}</p>
                             </div>
                         </div>
                         <p className="text-[10px] text-slate-400">In a 0-income scenario (job loss/severance), your entire liquid assets limit your runway exactly to <strong>{monthsToEmpty} months</strong>. Any loan period beyond this represents absolute default risk exposure.</p>
                    </div>
                </Card>
            </div>

        </div>
    );
}

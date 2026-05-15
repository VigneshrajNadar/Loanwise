import { useState, useEffect, useCallback } from 'react';
import { useChat } from '../../context/ChatContext';
import axios from 'axios';
import {
    Brain, Target, ShieldAlert, TrendingUp, BarChart2, ListChecks,
    Zap, RotateCcw, Calendar, CheckCircle2, RefreshCw, ArrowRight,
    Activity, Cpu, AlertTriangle, Clock, DollarSign, Download, History,
    Calculator, PieChart, TrendingDown, Sparkles, ChevronRight, ChevronDown,
    Star, Flame, Shield
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    Tooltip as RechartsTooltip, CartesianGrid, LineChart, Line,
    PieChart as RPieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { SectionCard, SectionHeader, Pill } from './DashboardWidgets';

const API = 'http://localhost:5001/api';
const INR = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

// ─── EMI Calculator (pure JS) ─────────────────────────────────────────────────
function calcEMI(principal, ratePercent, months) {
    const r = ratePercent / 1200;
    if (r === 0) return principal / months;
    return principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
}

// ─── Compound interest ────────────────────────────────────────────────────────
function calcCorpus(monthly, ratePercent, years) {
    const r = ratePercent / 1200;
    const n = years * 12;
    return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

// ─── Simulators Panel ─────────────────────────────────────────────────────────
function SimulatorsPanel() {
    const [tab, setTab] = useState('emi');
    // EMI
    const [emiPrincipal, setEmiPrincipal] = useState(1000000);
    const [emiRate, setEmiRate] = useState(8.5);
    const [emiMonths, setEmiMonths] = useState(240);
    // Corpus
    const [sipAmt, setSipAmt] = useState(10000);
    const [sipRate, setSipRate] = useState(12);
    const [sipYears, setSipYears] = useState(10);
    // Savings
    const [income, setIncome] = useState(80000);
    const [savRate, setSavRate] = useState(20);

    const emi = calcEMI(emiPrincipal, emiRate, emiMonths);
    const totalPay = emi * emiMonths;
    const totalInt = totalPay - emiPrincipal;
    const corpus = calcCorpus(sipAmt, sipRate, sipYears);
    const wealthMultiple = (corpus / (sipAmt * sipYears * 12)).toFixed(1);
    const monthlySav = (income * savRate) / 100;
    const annualSav = monthlySav * 12;

    // EMI amortization chart data (yearly)
    const emiChartData = Array.from({ length: Math.ceil(emiMonths / 12) }, (_, yr) => {
        const startMonth = yr * 12;
        let balance = emiPrincipal;
        let totInt = 0, totPrin = 0;
        for (let m = 0; m < startMonth; m++) {
            const intPay = balance * (emiRate / 1200);
            const prinPay = emi - intPay;
            balance -= prinPay;
        }
        balance = Math.max(0, balance);
        return { name: `Yr ${yr + 1}`, Balance: Math.round(balance), Interest: Math.round((emiPrincipal - balance)) };
    });

    // SIP growth chart
    const sipData = Array.from({ length: sipYears }, (_, yr) => ({
        name: `Yr ${yr + 1}`,
        Corpus: Math.round(calcCorpus(sipAmt, sipRate, yr + 1)),
        Invested: sipAmt * (yr + 1) * 12
    }));

    const TABS = [
        { id: 'emi', label: 'EMI Calculator', icon: Calculator },
        { id: 'sip', label: 'Goal Planner', icon: TrendingUp },
        { id: 'savings', label: 'Savings Rate', icon: PieChart },
    ];



    return (
        <SectionCard>
            <SectionHeader icon={Calculator} iconColor="text-cyan-400" title="Financial Simulators"
                right={<span className="text-[9px] font-black uppercase text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-lg">Live Compute</span>} />
            <div className="p-5">
                {/* Tab Switcher */}
                <div className="flex gap-2 mb-5 bg-black/30 p-1 rounded-xl w-fit">
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === t.id ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                            <t.icon className="w-3.5 h-3.5" />{t.label}
                        </button>
                    ))}
                </div>

                {tab === 'emi' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            {[
                                { label: 'Loan Amount', value: emiPrincipal, setter: setEmiPrincipal, min: 100000, max: 10000000, step: 50000, fmt: INR },
                                { label: 'Annual Rate (%)', value: emiRate, setter: setEmiRate, min: 5, max: 20, step: 0.1, fmt: v => `${v}%` },
                                { label: 'Duration (months)', value: emiMonths, setter: setEmiMonths, min: 12, max: 360, step: 12, fmt: v => `${v} mo` },
                            ].map(f => (
                                <div key={f.label}>
                                    <div className="flex justify-between mb-1.5">
                                        <span className="text-xs text-slate-400 font-bold">{f.label}</span>
                                        <span className="text-xs text-cyan-400 font-black">{f.fmt(f.value)}</span>
                                    </div>
                                    <input type="range" min={f.min} max={f.max} step={f.step} value={f.value}
                                        onChange={e => f.setter(Number(e.target.value))}
                                        className="w-full h-1.5 bg-slate-700 rounded accent-cyan-500 cursor-pointer" />
                                </div>
                            ))}
                            <div className="grid grid-cols-3 gap-3 mt-4">
                                {[{ l: 'Monthly EMI', v: INR(Math.round(emi)), c: 'cyan' }, { l: 'Total Interest', v: INR(Math.round(totalInt)), c: 'rose' }, { l: 'Total Payment', v: INR(Math.round(totalPay)), c: 'amber' }].map(s => (
                                    <div key={s.l} className={`p-3 bg-${s.c}-500/10 border border-${s.c}-500/20 rounded-2xl text-center`}>
                                        <p className={`text-lg font-black text-${s.c}-400`}>{s.v}</p>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">{s.l}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={emiChartData.slice(0, 20)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 100000).toFixed(0)}L`} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', fontSize: '11px' }} formatter={v => INR(v)} />
                                    <Area dataKey="Balance" stroke="#22d3ee" fill="#22d3ee20" strokeWidth={2} name="Remaining Balance" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {tab === 'sip' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            {[
                                { label: 'Monthly SIP', value: sipAmt, setter: setSipAmt, min: 1000, max: 100000, step: 500, fmt: INR },
                                { label: 'Expected Return (%)', value: sipRate, setter: setSipRate, min: 6, max: 20, step: 0.5, fmt: v => `${v}%` },
                                { label: 'Time Horizon (years)', value: sipYears, setter: setSipYears, min: 1, max: 30, step: 1, fmt: v => `${v} yrs` },
                            ].map(f => (
                                <div key={f.label}>
                                    <div className="flex justify-between mb-1.5">
                                        <span className="text-xs text-slate-400 font-bold">{f.label}</span>
                                        <span className="text-xs text-emerald-400 font-black">{f.fmt(f.value)}</span>
                                    </div>
                                    <input type="range" min={f.min} max={f.max} step={f.step} value={f.value}
                                        onChange={e => f.setter(Number(e.target.value))}
                                        className="w-full h-1.5 bg-slate-700 rounded accent-emerald-500 cursor-pointer" />
                                </div>
                            ))}
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                {[
                                    { l: 'Final Corpus', v: INR(Math.round(corpus)), c: 'emerald' },
                                    { l: 'Wealth Multiple', v: `${wealthMultiple}x`, c: 'purple' },
                                    { l: 'Amount Invested', v: INR(sipAmt * sipYears * 12), c: 'slate' },
                                    { l: 'Profit Earned', v: INR(Math.round(corpus - sipAmt * sipYears * 12)), c: 'amber' },
                                ].map(s => (
                                    <div key={s.l} className={`p-3 bg-${s.c}-500/10 border border-${s.c}-500/20 rounded-2xl text-center`}>
                                        <p className={`text-lg font-black text-${s.c}-400`}>{s.v}</p>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">{s.l}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={sipData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 100000).toFixed(0)}L`} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', fontSize: '11px' }} formatter={v => INR(v)} />
                                    <Area dataKey="Invested" stroke="#64748b" fill="#64748b20" strokeWidth={1.5} name="Amount Invested" />
                                    <Area dataKey="Corpus" stroke="#10b981" fill="#10b98120" strokeWidth={2} name="Projected Corpus" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {tab === 'savings' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            {[
                                { label: 'Monthly Income', value: income, setter: setIncome, min: 20000, max: 500000, step: 5000, fmt: INR },
                                { label: 'Savings Rate (%)', value: savRate, setter: setSavRate, min: 5, max: 60, step: 1, fmt: v => `${v}%` },
                            ].map(f => (
                                <div key={f.label}>
                                    <div className="flex justify-between mb-1.5">
                                        <span className="text-xs text-slate-400 font-bold">{f.label}</span>
                                        <span className="text-xs text-indigo-400 font-black">{f.fmt(f.value)}</span>
                                    </div>
                                    <input type="range" min={f.min} max={f.max} step={f.step} value={f.value}
                                        onChange={e => f.setter(Number(e.target.value))}
                                        className="w-full h-1.5 bg-slate-700 rounded accent-indigo-500 cursor-pointer" />
                                </div>
                            ))}
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                {[
                                    { l: 'Monthly Savings', v: INR(Math.round(monthlySav)), c: 'indigo' },
                                    { l: 'Annual Savings', v: INR(Math.round(annualSav)), c: 'emerald' },
                                    { l: 'Monthly Spending', v: INR(income - monthlySav), c: 'rose' },
                                    { l: '5-Yr Corpus (12%)', v: INR(Math.round(calcCorpus(monthlySav, 12, 5))), c: 'amber' },
                                ].map(s => (
                                    <div key={s.l} className={`p-3 bg-${s.c}-500/10 border border-${s.c}-500/20 rounded-2xl text-center`}>
                                        <p className={`text-base font-black text-${s.c}-400`}>{s.v}</p>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">{s.l}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <RPieChart>
                                    <Pie data={[
                                        { name: 'Savings', value: savRate },
                                        { name: 'Spending', value: 100 - savRate }
                                    ]} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                                        <Cell fill="#6366f1" />
                                        <Cell fill="#334155" />
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', fontSize: '11px' }} formatter={v => `${v}%`} />
                                    <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700 }}>{v}</span>} />
                                </RPieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}


            </div>
        </SectionCard>
    );
}

// ─── History Sidebar ──────────────────────────────────────────────────────────
function HistoryEntry({ item, isActive, onClick }) {
    const trendColors = { Improving: 'text-emerald-400', Stable: 'text-amber-400', Declining: 'text-rose-400', 'No Data': 'text-slate-400' };
    const date = new Date(item.created_at);
    return (
        <button onClick={onClick}
            className={`w-full text-left p-3 rounded-xl border transition-all hover:bg-white/5 ${isActive ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-white/5'}`}>
            <p className="text-xs font-bold text-white truncate leading-tight mb-1">{item.objective || 'No Objective'}</p>
            <div className="flex items-center justify-between">
                <span className={`text-[9px] font-black ${trendColors[item.trend] || 'text-slate-400'}`}>{item.trend}</span>
                <span className="text-[9px] text-slate-600 font-bold">{date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
            </div>
            {item.health_score > 0 && (
                <div className="mt-1.5 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${item.health_score}%` }} />
                </div>
            )}
        </button>
    );
}

// ─── CIBIL Score Forecaster ───────────────────────────────────────────────────
function CIBILForecaster({ agent }) {
    const base = agent?.cibil_current || 650;
    const forecasts = [
        { period: 'Now', score: base, label: 'Current' },
        { period: '+30 Days', score: Math.min(900, base + 15), label: 'If EMIs auto-paid' },
        { period: '+60 Days', score: Math.min(900, base + 30), label: 'Utilization < 30%' },
        { period: '+90 Days', score: Math.min(900, base + 50), label: 'No new inquiries' },
    ];
    const getColor = (score) => score >= 750 ? '#10b981' : score >= 650 ? '#f59e0b' : '#ef4444';

    return (
        <SectionCard>
            <SectionHeader icon={Shield} iconColor="text-violet-400" title="CIBIL Score Forecaster"
                right={<span className="text-[9px] font-black uppercase text-violet-400 bg-violet-500/10 px-2 py-1 rounded-lg">AI Projected</span>} />
            <div className="p-5">
                <div className="h-48 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={forecasts} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                            <XAxis dataKey="period" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[Math.max(0, base - 50), Math.min(900, base + 100)]} />
                            <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', fontSize: '11px' }}
                                formatter={(val, name) => [`${val} pts`, 'CIBIL Score']} />
                            <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 5, strokeWidth: 0 }} activeDot={{ r: 7 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {forecasts.map((f, i) => (
                        <div key={i} className="text-center p-2 bg-black/30 rounded-xl border border-white/5">
                            <p className="text-sm font-black" style={{ color: getColor(f.score) }}>{f.score}</p>
                            <p className="text-[9px] text-slate-500 font-bold mt-0.5">{f.period}</p>
                            <p className="text-[8px] text-slate-600 leading-tight mt-0.5">{f.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </SectionCard>
    );
}

// ─── Smart Budget Allocator ───────────────────────────────────────────────────
function BudgetAllocator({ agent }) {
    const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#6366f1', '#22d3ee'];
    const allocation = agent?.budget_allocation || [
        { name: 'EMI / Debt', value: 30 },
        { name: 'Essentials', value: 35 },
        { name: 'Savings', value: 20 },
        { name: 'Investments', value: 10 },
        { name: 'Lifestyle', value: 5 },
    ];

    return (
        <SectionCard>
            <SectionHeader icon={PieChart} iconColor="text-pink-400" title="Smart Budget Allocation"
                right={<span className="text-[9px] font-black uppercase text-pink-400 bg-pink-500/10 px-2 py-1 rounded-lg">Agent Optimised</span>} />
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                        <RPieChart>
                            <Pie data={allocation} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                                {allocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', fontSize: '11px' }} formatter={v => `${v}%`} />
                        </RPieChart>
                    </ResponsiveContainer>
                </div>
                <div className="space-y-2.5">
                    {allocation.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="text-xs text-slate-300 font-bold">{item.name}</span>
                                    <span className="text-xs font-black" style={{ color: COLORS[i % COLORS.length] }}>{item.value}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.value}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </SectionCard>
    );
}

// ─── Wealth Projection ────────────────────────────────────────────────────────
function WealthProjection({ agent }) {
    const hs = agent?.health_score || 50;
    const monthlyGrowth = 0.006 + (hs / 100) * 0.008;
    const base = 200000;
    const data = Array.from({ length: 13 }, (_, i) => ({
        name: i === 0 ? 'Now' : `M${i * 1}`,
        Optimistic: Math.round(base * Math.pow(1 + monthlyGrowth * 1.3, i)),
        Base: Math.round(base * Math.pow(1 + monthlyGrowth, i)),
        Conservative: Math.round(base * Math.pow(1 + monthlyGrowth * 0.7, i)),
    }));

    return (
        <SectionCard>
            <SectionHeader icon={TrendingUp} iconColor="text-emerald-400" title="Wealth Projection (12-Month)"
                right={<span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">3 Scenarios</span>} />
            <div className="p-5">
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradOpt" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradBase" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 100000).toFixed(1)}L`} />
                            <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', fontSize: '11px' }} formatter={v => INR(v)} />
                            <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700 }}>{v}</span>} />
                            <Area type="monotone" dataKey="Optimistic" stroke="#10b981" fill="url(#gradOpt)" strokeWidth={2} strokeDasharray="4 2" />
                            <Area type="monotone" dataKey="Base" stroke="#6366f1" fill="url(#gradBase)" strokeWidth={2.5} />
                            <Area type="monotone" dataKey="Conservative" stroke="#64748b" fill="none" strokeWidth={1.5} strokeDasharray="3 3" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </SectionCard>
    );
}

// ─── Main TabAdvisor Component ────────────────────────────────────────────────
export function TabAdvisor({ token }) {
    const { openChat } = useChat();
    const [agentContext, setAgentContext] = useState(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [objective, setObjective] = useState('');
    const [lastObjective, setLastObjective] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [activeHistoryId, setActiveHistoryId] = useState(null);
    const [showHistory, setShowHistory] = useState(true);

    const headers = { Authorization: `Bearer ${token}` };

    const fetchHistory = useCallback(async () => {
        try {
            const r = await axios.get(`${API}/user/agent-history`, { headers });
            setHistory(r.data || []);
        } catch (e) { /* silent */ }
    }, [token]);

    const fetchCurrentPlan = useCallback(async () => {
        try {
            const r = await axios.get(`${API}/user/agent-plan`, { headers });
            if (r.data.has_plan) {
                setAgentContext(r.data.plan);
                setLastObjective(r.data.objective);
                setObjective(r.data.objective);
            }
        } catch (e) {
            console.error('Failed to fetch plan', e);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const loadAgent = useCallback(async (customObjective = '') => {
        if (!customObjective) return;
        setRunning(true);
        setActiveHistoryId(null);
        try {
            const r = await axios.post(`${API}/user/agent-advice`, { objective: customObjective }, { headers });
            setAgentContext(r.data);
            setLastObjective(customObjective);
            fetchHistory(); // Refresh history after new run
        } catch (e) {
            console.error('Agent error', e);
        } finally {
            setRunning(false);
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchCurrentPlan();
        fetchHistory();
    }, [fetchCurrentPlan, fetchHistory]);

    const handleSetAutomation = async (automation, index) => {
        setActionLoading(index);
        try {
            const r = await axios.post(`${API}/user/agent-action`, {
                action_type: 'create_reminder',
                title: automation.action,
                message: automation.trigger + ' - ' + automation.benefit
            }, { headers });
            if (r.data.ok && r.data.plan) setAgentContext(r.data.plan);
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const downloadPDF = () => {
        setPdfLoading(true);
        const element = document.getElementById('agent-report-container');
        html2pdf().set({
            margin: [10, 8],
            filename: `LoanWise-Agent-Plan-${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#0B0F19' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(element).save().then(() => setPdfLoading(false));
    };

    const handleRunAgent = (e) => {
        e.preventDefault();
        if (!objective.trim()) return;
        loadAgent(objective.trim());
    };

    const loadHistoryItem = (item) => {
        setAgentContext(item.plan);
        setLastObjective(item.objective);
        setObjective(item.objective);
        setActiveHistoryId(item.id);
    };

    const QUICK_OBJECTIVES = [
        'Help me get a Home Loan approved',
        'Reduce my EMI burden',
        'Improve my CIBIL score fast',
        'Build a 6-month emergency fund',
    ];

    const agent = agentContext;
    const trendColor = { Improving: 'text-emerald-400', Stable: 'text-amber-400', Declining: 'text-rose-400', 'No Data': 'text-slate-400' };
    const trendIcon = { Improving: TrendingUp, Stable: Activity, Declining: AlertTriangle, 'No Data': BarChart2 };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Agent is analyzing your full financial history…</p>
        </div>
    );

    return (
        <div className="flex gap-6 max-w-7xl mx-auto">

            {/* ── History Sidebar ── */}
            <div className={`shrink-0 transition-all duration-300 ${showHistory ? 'w-56' : 'w-10'}`}>
                <div className="sticky top-4">
                    <button onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 mb-3 px-2 py-1.5 text-slate-400 hover:text-white transition-colors w-full">
                        <History className="w-4 h-4 shrink-0" />
                        {showHistory && <span className="text-xs font-black uppercase tracking-wider">History</span>}
                        {showHistory && <ChevronDown className="w-3 h-3 ml-auto" />}
                    </button>

                    {showHistory && (
                        <div className="space-y-2">
                            {history.length === 0 ? (
                                <p className="text-[10px] text-slate-600 px-2">No history yet. Run the Agent to get started.</p>
                            ) : (
                                history.map(item => (
                                    <HistoryEntry key={item.id} item={item}
                                        isActive={activeHistoryId === item.id}
                                        onClick={() => loadHistoryItem(item)} />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="flex-1 min-w-0 space-y-6">

                {/* ── Agent Command Center ── */}
                <div className="p-5 bg-gradient-to-br from-indigo-950/60 to-black border border-indigo-500/25 rounded-3xl relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-indigo-500/20 rounded-2xl shrink-0"><Cpu className="w-5 h-5 text-indigo-400" /></div>
                        <div>
                            <p className="text-sm font-black text-white">Financial Intelligence Agent</p>
                            <p className="text-[10px] text-slate-400">Reads your full analysis history, transactions, and profile in real-time</p>
                        </div>
                        <div className="ml-auto flex items-center gap-4">
                            {agent?.progress && (() => {
                                const TIcon = trendIcon[agent.progress.trend] || Activity;
                                return (
                                    <div className="text-right shrink-0">
                                        <div className={`flex justify-end items-center gap-1 ${trendColor[agent.progress.trend] || 'text-slate-400'}`}>
                                            <TIcon className="w-3.5 h-3.5" />
                                            <span className="text-xs font-black">{agent.progress.trend}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-0.5">{agent.progress.description}</p>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Objective input */}
                    <form onSubmit={handleRunAgent} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={objective}
                            onChange={e => setObjective(e.target.value)}
                            placeholder="e.g. Build a 6-month savings plan, Help me get a Home Loan…"
                            className="flex-1 px-4 py-2.5 bg-black/50 border border-white/10 text-white text-sm rounded-xl focus:outline-none focus:border-indigo-500/60 placeholder:text-slate-600 transition-colors"
                        />
                        <button
                            type="button"
                            onClick={() => openChat('General Overview')}
                            className="px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-sm font-bold rounded-xl flex items-center gap-2 transition-all shrink-0"
                        >
                            <Sparkles className="w-4 h-4" /> Ask AI
                        </button>
                        <button
                            type="submit"
                            disabled={running || !objective.trim()}
                            className="px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                        >
                            {running ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Target className="w-4 h-4" />}
                            {running ? 'Running…' : 'Run Agent'}
                        </button>
                    </form>

                    {/* Quick Objective Pills */}
                    <div className="flex flex-wrap gap-2">
                        <span className="text-[9px] font-black text-slate-500 uppercase self-center mr-1">Quick:</span>
                        {QUICK_OBJECTIVES.map((q, i) => (
                            <button key={i} onClick={() => { setObjective(q); loadAgent(q); }} disabled={running}
                                className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/40 transition-all disabled:opacity-40">
                                {q}
                            </button>
                        ))}
                    </div>

                    {lastObjective && (
                        <p className="text-[10px] text-indigo-400/70 mt-3">
                            <span className="text-slate-500">Active Objective →</span> {lastObjective}
                            {activeHistoryId && <span className="ml-2 text-amber-400/60">(viewing history)</span>}
                        </p>
                    )}
                </div>

                {/* Fallback Banner */}
                {agent?.is_fallback && (
                    <div className="flex items-start gap-3 p-4 bg-amber-500/8 border border-amber-500/25 rounded-2xl">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-amber-400">AI rate limit — showing data-driven plan</p>
                            <p className="text-xs text-amber-400/70 mt-0.5">{agent.error_msg}</p>
                        </div>
                        <button onClick={() => loadAgent(lastObjective || '')}
                            className="ml-auto shrink-0 px-3 py-1.5 text-[10px] font-black text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/10 transition-all flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> Retry Gemini
                        </button>
                    </div>
                )}

                {/* ── Simulators (always visible) ── */}
                <SimulatorsPanel />

                {/* ── Agent Response Dashboard ── */}
                {agent && (
                    <div id="agent-report-container" className="space-y-6">

                        {/* PDF Cover Header (hidden on screen) */}
                        <div className="hidden" style={{ display: 'none' }}>
                            <h1 style={{ fontSize: 24, fontWeight: 900 }}>LoanWise Financial Action Plan</h1>
                            <p style={{ fontSize: 12 }}>Objective: {lastObjective} — Generated {new Date().toLocaleDateString()}</p>
                        </div>

                        {/* Primary Directive + Download */}
                        {agent.next_action && (
                            <div className="relative p-6 bg-indigo-500/8 border border-indigo-500/20 rounded-3xl overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-600" />
                                <div>
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5 pl-2">
                                        <Zap className="w-3 h-3" /> Agent Primary Directive
                                    </p>
                                    <p className="text-base text-white leading-relaxed font-semibold pl-2">{agent.next_action}</p>
                                </div>
                                <button onClick={downloadPDF} disabled={pdfLoading}
                                    className="shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all">
                                    {pdfLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                                    {pdfLoading ? 'Generating PDF…' : 'Download PDF Report'}
                                </button>
                            </div>
                        )}

                        {/* Dynamic Agent Chart */}
                        {agent.dynamic_chart?.data?.length > 0 && (
                            <div className="p-6 bg-[#0B0F19] border border-white/5 rounded-3xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-6">
                                    <BarChart2 className="w-4 h-4 text-emerald-400" /> {agent.dynamic_chart.title || 'AI Data Projection'}
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={agent.dynamic_chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                            <RechartsTooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} formatter={v => `₹${v.toLocaleString()}`} />
                                            <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Automation Log */}
                        {agent.executed_actions?.length > 0 && (
                            <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl">
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <h3 className="text-sm font-bold text-emerald-400">Agent Automation Log</h3>
                                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-900 bg-emerald-400 px-2 py-0.5 rounded-md ml-auto">Autonomous</span>
                                </div>
                                <div className="space-y-2">
                                    {agent.executed_actions.map((act, i) => (
                                        <div key={i} className="flex items-start gap-3 bg-black/40 p-3 rounded-xl border border-emerald-500/10">
                                            <Zap className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-bold text-emerald-50">{act.title}</p>
                                                    <span className="text-[8px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">Success</span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-0.5">{act.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Health Score */}
                        {agent.health_score > 0 && (
                            <div className="p-5 bg-[#0d1424]/70 border border-white/5 rounded-3xl">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Activity className="w-3.5 h-3.5 text-teal-400" /> Financial Health Score
                                    </p>
                                    <span className={`text-2xl font-black ${agent.health_score >= 70 ? 'text-emerald-400' : agent.health_score >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                                        {agent.health_score}<span className="text-sm text-slate-500">/100</span>
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-700 ${agent.health_score >= 70 ? 'bg-emerald-500' : agent.health_score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                        style={{ width: `${agent.health_score}%` }} />
                                </div>
                                <div className="flex justify-between text-[9px] text-slate-600 mt-1.5 font-bold">
                                    <span>Critical</span><span>Weak</span><span>Stable</span><span>Strong</span><span>Prime</span>
                                </div>
                            </div>
                        )}

                        {/* Wealth Projection */}
                        <WealthProjection agent={agent} />

                        {/* CIBIL Forecaster */}
                        <CIBILForecaster agent={agent} />

                        {/* Budget Allocator */}
                        <BudgetAllocator agent={agent} />

                        {/* Execution Plan + Risks grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {agent.personalized_plan?.length > 0 && (
                                <SectionCard>
                                    <SectionHeader icon={ListChecks} iconColor="text-emerald-400" title="Execution Plan" />
                                    <div className="divide-y divide-white/5">
                                        {agent.personalized_plan.map((p, i) => (
                                            <div key={i} className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] group">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${p.impact === 'Critical' ? 'bg-rose-500/20 text-rose-400' : p.impact === 'High' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                    {p.step}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <p className="text-sm font-bold text-white">{p.title}</p>
                                                        {p.timeline && <span className="text-[9px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded font-bold">{p.timeline}</span>}
                                                        {p.impact && <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${p.impact === 'Critical' ? 'text-rose-400 bg-rose-500/10' : p.impact === 'High' ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>{p.impact}</span>}
                                                    </div>
                                                    <p className="text-xs text-slate-400 leading-relaxed">{p.action}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </SectionCard>
                            )}

                            <div className="space-y-6">
                                {agent.risk_patterns?.length > 0 && (
                                    <SectionCard>
                                        <SectionHeader icon={ShieldAlert} iconColor="text-rose-400" title="Detected Risk Patterns" />
                                        <div className="divide-y divide-white/5">
                                            {agent.risk_patterns.map((p, i) => (
                                                <div key={i} className="px-5 py-4">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <p className="text-sm font-bold text-white">{p.pattern}</p>
                                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${p.severity === 'Critical' ? 'text-rose-400 bg-rose-500/10' : p.severity === 'Warning' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 bg-slate-800'}`}>{p.severity}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400">{p.explanation}</p>
                                                    {p.detected_from && <p className="text-[9px] text-slate-600 mt-1 font-bold uppercase">Source: {p.detected_from}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    </SectionCard>
                                )}

                                {agent.behavioral_insights?.length > 0 && (
                                    <SectionCard>
                                        <SectionHeader icon={Brain} iconColor="text-purple-400" title="Behavioral Insights" />
                                        <div className="p-4 space-y-3">
                                            {agent.behavioral_insights.map((b, i) => (
                                                <div key={i} className="p-4 bg-black/30 border border-white/5 rounded-2xl">
                                                    <p className="text-sm font-bold text-white mb-2">{b.insight}</p>
                                                    <p className="text-xs"><span className="text-purple-400 font-bold">Data: </span><span className="text-slate-400">{b.data_point}</span></p>
                                                    <p className="text-xs mt-1"><span className="text-emerald-400 font-bold">Action: </span><span className="text-slate-400">{b.recommendation}</span></p>
                                                </div>
                                            ))}
                                        </div>
                                    </SectionCard>
                                )}
                            </div>
                        </div>

                        {/* Automations */}
                        {agent.automations?.length > 0 && (
                            <SectionCard>
                                <SectionHeader icon={RotateCcw} iconColor="text-teal-400" title="Recommended Automations"
                                    right={<span className="text-[9px] font-black uppercase text-teal-400 bg-teal-500/10 px-2 py-1 rounded-lg">Set & Forget</span>} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                                    {agent.automations.map((a, i) => (
                                        <div key={i} className="p-4 bg-black/30 border border-white/5 rounded-2xl hover:border-teal-500/20 transition-all group relative overflow-hidden flex flex-col">
                                            <div className="absolute top-0 left-0 w-0.5 h-full bg-teal-500/40 group-hover:bg-teal-500 transition-all" />
                                            <p className="text-[10px] text-teal-400 font-black uppercase tracking-wider mb-1 pl-3">⚡ {a.trigger}</p>
                                            <p className="text-sm font-bold text-white mb-1.5 pl-3">{a.action}</p>
                                            <p className="text-xs text-emerald-400 font-medium mb-3 pl-3">✓ {a.benefit}</p>
                                            {a.setup && (
                                                <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 ml-3 mb-3">
                                                    <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Setup</p>
                                                    <p className="text-[11px] text-slate-300 leading-relaxed">{a.setup}</p>
                                                </div>
                                            )}
                                            <div className="mt-auto pl-3 pt-2">
                                                <button
                                                    onClick={() => handleSetAutomation(a, i)}
                                                    disabled={actionLoading === i || agent.executed_actions?.some(ea => ea.title === a.action)}
                                                    className="w-full py-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-400 text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                                    {actionLoading === i ? <div className="w-3.5 h-3.5 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                                                    {agent.executed_actions?.some(ea => ea.title === a.action) ? 'Automation Enabled ✓' : 'Enable Automation'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )}

                        {/* Roadmap */}
                        {agent.roadmap?.length > 0 && (
                            <SectionCard>
                                <SectionHeader icon={Calendar} iconColor="text-amber-400" title="Strategic Roadmap" />
                                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
                                    {agent.roadmap.map((r, i) => (
                                        <div key={i} className="p-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                                <p className="text-xs font-black text-amber-400 uppercase tracking-wider">{r.period}</p>
                                            </div>
                                            <p className="text-sm font-black text-white mb-4 leading-snug">{r.milestone}</p>
                                            <ul className="space-y-2.5">
                                                {(r.tasks || []).map((t, j) => (
                                                    <li key={j} className="flex items-start gap-2 text-xs text-slate-300">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-600 mt-0.5 shrink-0" />{t}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )}
                    </div>
                )}

                {!agent && !running && (
                    <div className="text-center py-20 space-y-4">
                        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
                            <Sparkles className="w-7 h-7 text-indigo-400" />
                        </div>
                        <p className="text-lg font-black text-white">Ready to Analyze</p>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto">Type an objective above or pick a Quick Objective to generate your personalized action plan.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

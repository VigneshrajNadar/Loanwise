import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    Calendar, Sparkles, Brain, RefreshCw, Zap, CheckCircle2,
    ShieldAlert, Activity, Info, X, History, ChevronRight,
    Target, BarChart3, Flame, Star, Wallet, Clock, AlertTriangle,
    TrendingUp, Plus, Pencil, Check, DollarSign, Shield, PieChart,
    CreditCard, Layers, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip as RechartsTooltip, Line,
    ComposedChart, Bar, LineChart, BarChart, Cell, PieChart as RePieChart, Pie
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const API = 'http://localhost:5001/api';
const INR = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const CATEGORIES = ['Home', 'Car', 'Wedding', 'Education', 'Travel', 'Business', 'Medical', 'General'];
const P_COLORS = {
    Critical: 'text-red-400 bg-red-500/10 border-red-500/30',
    High:     'text-rose-400 bg-rose-500/10 border-rose-500/30',
    Medium:   'text-amber-400 bg-amber-500/10 border-amber-500/30',
    Low:      'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
};

// Editable field component — inline click-to-edit
function EditableField({ value, onChange, prefix, suffix, type = 'text', small = false }) {
    const [editing, setEditing] = useState(false);
    const [local, setLocal] = useState(value);
    const commit = () => { onChange(type === 'number' ? Number(local) : local); setEditing(false); };
    if (editing) return (
        <span className="inline-flex items-center gap-1">
            {prefix && <span className="text-slate-500 text-xs">{prefix}</span>}
            <input autoFocus type={type} value={local} onChange={e => setLocal(e.target.value)}
                onBlur={commit} onKeyDown={e => e.key === 'Enter' && commit()}
                className={`bg-[#060A12] border border-indigo-500/40 rounded-lg px-2 py-0.5 text-white outline-none ${small ? 'text-xs w-28' : 'text-sm w-36'} font-bold`} />
            {suffix && <span className="text-slate-500 text-xs">{suffix}</span>}
            <button onClick={commit} className="text-indigo-400 hover:text-indigo-300"><Check className="w-3 h-3" /></button>
        </span>
    );
    return (
        <button onClick={() => { setLocal(value); setEditing(true); }}
            className={`group inline-flex items-center gap-1 hover:text-white transition-all ${small ? 'text-xs' : 'text-sm'} font-bold text-slate-300`}>
            {prefix && <span className="text-slate-500">{prefix}</span>}
            <span>{type === 'number' ? Number(value).toLocaleString('en-IN') : value}</span>
            {suffix && <span className="text-slate-500">{suffix}</span>}
            <Pencil className="w-2.5 h-2.5 text-slate-700 group-hover:text-indigo-400 transition-all ml-0.5" />
        </button>
    );
}

export default function LifePlannerPage() {
    const { token } = useAuth();
    const [lifeEvents, setLifeEvents] = useState([
        { name: 'Marriage', year: 2026, cost: 800000, category: 'Wedding', priority: 'High', downpayment_pct: 100 },
        { name: 'Baby Arrival', year: 2027, cost: 200000, category: 'Medical', priority: 'Critical', downpayment_pct: 100 },
        { name: 'Home Purchase', year: 2028, cost: 4500000, category: 'Home', priority: 'High', downpayment_pct: 20 }
    ]);
    const [horizon, setHorizon] = useState(8);
    const [eventPlan, setEventPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState([]);
    const [histLoading, setHistLoading] = useState(false);
    const [profile, setProfile] = useState({ income: 80000, savings: 300000 });
    const [dashData, setDashData] = useState(null); // full profile-summary

    // Draft state
    const [draft, setDraft] = useState({ name: '', year: 2027, cost: '', category: 'Home', priority: 'Medium', downpayment: 20 });
    const [inflationOn, setInflationOn] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const r = await axios.get(`${API}/user/profile-summary`, { headers: { Authorization: `Bearer ${token}` } });
                if (r.data) {
                    setDashData(r.data);
                    setProfile({ income: r.data.monthly_income || 80000, savings: r.data.savings || 300000 });
                }
            } catch(e) {}
        };
        if (token) load();
    }, [token]);

    // Live affordability maths
    const yearsOut = Math.max(0, draft.year - 2025);
    const baseCost = Number(draft.cost) || 0;
    const finalCost = inflationOn ? Math.round(baseCost * Math.pow(1.06, yearsOut)) : baseCost;
    const reqDown = Math.round(finalCost * draft.downpayment / 100);
    const savCov = reqDown > 0 ? Math.min(100, Math.round((profile.savings / reqDown) * 100)) : 0;
    const estEmi = Math.round((finalCost - reqDown) / 60);
    const emiImpact = profile.income > 0 ? Math.round((estEmi / profile.income) * 100) : 0;

    const addEvent = () => {
        if (!draft.name.trim() || !draft.cost) return;
        setLifeEvents(prev => [...prev, {
            name: draft.name, year: draft.year, cost: finalCost,
            category: draft.category, priority: draft.priority, downpayment_pct: draft.downpayment
        }]);
        setDraft(d => ({ ...d, name: '', cost: '' }));
    };
    const removeEvent = (i) => setLifeEvents(prev => prev.filter((_, idx) => idx !== i));
    const updateEvent = (i, field, val) => setLifeEvents(prev => { const n = [...prev]; n[i] = { ...n[i], [field]: val }; return n; });

    const runAnalysis = async () => {
        setLoading(true);
        try {
            const r = await axios.post(`${API}/user/life-event-planner`,
                { events: lifeEvents, horizon },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setEventPlan(r.data);
        } catch (e) { console.error('Life planner error:', e); }
        finally { setLoading(false); }
    };

    const fetchHistory = async () => {
        setHistLoading(true);
        try {
            const r = await axios.get(`${API}/user/life-event-history`, { headers: { Authorization: `Bearer ${token}` } });
            setHistory(r.data || []);
        } catch(e) {} finally { setHistLoading(false); }
    };
    const toggleHistory = () => { if (!showHistory) fetchHistory(); setShowHistory(!showHistory); };
    const loadEntry = (h) => {
        if (h.events?.length) setLifeEvents(h.events);
        if (h.horizon) setHorizon(h.horizon);
        if (h.result) setEventPlan(h.result);
        setShowHistory(false);
    };

    const totalCost = lifeEvents.reduce((s, e) => s + (e.cost || 0), 0);
    const totalUpfront = lifeEvents.reduce((s, e) => s + ((e.cost || 0) * ((e.downpayment_pct || 0) / 100)), 0);

    // Charts
    const buildWealth = () => {
        if (!eventPlan?.projections) return [];
        let sav = profile.savings, debt = totalCost * 0.7;
        return eventPlan.projections.map(p => {
            sav = Math.round(sav * 1.08 + profile.income * 12 * 0.15);
            debt = Math.max(0, Math.round(debt * 0.88));
            return { year: p.year, savings: Math.round(sav / 100000) / 10, debt: Math.round(debt / 100000) / 10 };
        });
    };
    const buildStress = () => {
        if (!eventPlan?.projections) return [];
        return eventPlan.projections.map(p => ({
            year: p.year, normal: p.dti, stressed: Math.min(98, Math.round(p.dti * 1.4))
        }));
    };

    // ── Dashboard-powered computations ──────────────────────────────────────────
    const emiRatio = dashData ? dashData.emi_ratio : 0;
    const cibil    = dashData ? (dashData.cibil_score || 0) : 0;
    const totalEmi = dashData ? (dashData.total_emi || 0) : 0;
    const netMonthly = dashData ? (dashData.net_monthly || 0) : Math.max(0, profile.income * 0.2);
    const healthScore = dashData ? (dashData.health_score || 0) : 0;
    const netWorth = dashData ? (dashData.net_worth || 0) : 0;
    const spendCats = dashData?.spending_by_cat ? Object.entries(dashData.spending_by_cat).map(([k,v]) => ({ name: k, value: Math.round(v) })).sort((a,b)=>b.value-a.value).slice(0,5) : [];

    // Loan eligibility (RBI 50% FOIR proxy)
    const maxEligibleLoan = useMemo(() => {
        if (!profile.income) return { home: 0, car: 0 };
        const foir = 0.50;
        const maxEmi = foir * profile.income - totalEmi;
        const homeRate = 8.5 / 1200, homeTenure = 240;
        const carRate = 10.5 / 1200, carTenure = 60;
        const elig = (emi, r, n) => r > 0 ? Math.round(emi * ((1+r)**n - 1) / (r * (1+r)**n)) : 0;
        return {
            home: maxEmi > 0 ? elig(maxEmi, homeRate, homeTenure) : 0,
            car:  maxEmi > 0 ? elig(maxEmi, carRate, carTenure) : 0
        };
    }, [profile.income, totalEmi]);

    // Months-to-downpayment per milestone
    const runwayData = useMemo(() => {
        if (netMonthly <= 0) return [];
        return lifeEvents.map(e => {
            const dp = Math.round((e.cost || 0) * ((e.downpayment_pct || 0) / 100));
            const gap = Math.max(0, dp - profile.savings);
            const months = gap > 0 ? Math.ceil(gap / netMonthly) : 0;
            const yearsAway = Math.max(0, (e.year || 2025) - 2025);
            return { name: e.name, months, yearsAway: yearsAway * 12, downpayment: dp, feasible: months <= yearsAway * 12 };
        });
    }, [lifeEvents, profile, netMonthly]);

    // EMI load timeline — existing vs new per year
    const emiTimeline = useMemo(() => {
        return Array.from({ length: Math.min(horizon, 10) }, (_, i) => {
            const yr = 2025 + i;
            const evsCost = lifeEvents.filter(e => e.year <= yr).reduce((s, e) => {
                const loan = (e.cost || 0) * (1 - ((e.downpayment_pct || 0) / 100));
                return s + loan / 60;
            }, 0);
            return {
                year: yr,
                existing: Math.round(totalEmi),
                milestone: Math.round(evsCost),
                total: Math.round(totalEmi + evsCost),
                dtiPct: profile.income ? Math.round(((totalEmi + evsCost) / profile.income) * 100) : 0
            };
        });
    }, [lifeEvents, totalEmi, horizon, profile.income]);

    const statusColor = (s) => s === 'Safe' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        : s === 'Risk' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
        : 'text-rose-400 bg-rose-500/10 border-rose-500/20';

    return (
        <div className="min-h-screen bg-[#060A12] text-slate-200 pb-24">
            {/* BG */}
            <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute -top-32 -right-32 w-[700px] h-[700px] bg-indigo-600/8 blur-[160px] rounded-full" />
                <div className="absolute bottom-0 -left-32 w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full" />
            </div>

            <div className="max-w-[1500px] mx-auto px-6 lg:px-12 pt-10">

                {/* ── Header ── */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-indigo-500/15 rounded-2xl border border-indigo-500/25">
                            <Calendar className="w-7 h-7 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Life Event <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Sequencer</span></h1>
                            <p className="text-slate-500 text-xs font-medium mt-0.5">AI-powered multi-year financial planning and cannibalization prevention</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        {/* KPIs */}
                        <div className="hidden md:flex items-center gap-5">
                            <div><p className="text-base font-black text-white">{lifeEvents.length}</p><p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Goals</p></div>
                            <div className="w-px h-7 bg-white/8" />
                            <div><p className="text-base font-black text-indigo-400">{INR(totalCost)}</p><p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Total Value</p></div>
                            <div className="w-px h-7 bg-white/8" />
                            <div><p className="text-base font-black text-amber-400">{INR(totalUpfront)}</p><p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Upfront Cash Needed</p></div>
                        </div>
                        <button onClick={toggleHistory} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-indigo-500/10 border border-white/10 hover:border-indigo-500/30 rounded-xl text-xs font-bold text-slate-400 hover:text-indigo-400 transition-all">
                            <History className="w-4 h-4" /> Scenario History
                        </button>
                    </div>
                </motion.div>

                {/* ── History Drawer ── */}
                <AnimatePresence>
                {showHistory && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8 overflow-hidden">
                        <div className="bg-[#0D1525]/90 border border-indigo-500/15 rounded-[24px] p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-sm font-black text-white flex items-center gap-2"><History className="w-4 h-4 text-indigo-400" /> Saved Scenarios</h3>
                                <button onClick={() => setShowHistory(false)} className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/8 transition-all"><X className="w-4 h-4" /></button>
                            </div>
                            {histLoading ? (
                                <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" /></div>
                            ) : history.length === 0 ? (
                                <p className="text-center py-8 text-slate-500 text-sm">No saved analyses yet. Run your first strategy to begin building your archive.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto">
                                    {history.map((h) => (
                                        <button key={h.id} onClick={() => loadEntry(h)}
                                            className="text-left p-4 bg-white/[0.02] hover:bg-indigo-500/8 border border-white/5 hover:border-indigo-500/25 rounded-2xl transition-all group">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded uppercase tracking-widest">{h.horizon || 5}yr</span>
                                                <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-indigo-400 transition-all" />
                                            </div>
                                            <p className="text-xs font-black text-white mb-1.5 line-clamp-2">{h.verdict}</p>
                                            <p className="text-[9px] text-slate-500 font-medium">{new Date(h.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                <div className="flex flex-col xl:flex-row gap-7 items-start">
                    {/* ── LEFT PANEL ── */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="w-full xl:w-[400px] shrink-0">
                        <div className="sticky top-6 space-y-5">

                            {/* Add Milestone Form */}
                            <div className="bg-[#0D1525]/90 border border-white/8 rounded-[24px] overflow-hidden shadow-2xl">
                                <div className="px-6 pt-6 pb-4 border-b border-white/5">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-sm font-black text-white flex items-center gap-2"><Plus className="w-4 h-4 text-indigo-400" /> New Milestone</h2>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">6% Inflation</span>
                                            <button onClick={() => setInflationOn(!inflationOn)}
                                                className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${inflationOn ? 'bg-indigo-500 justify-end' : 'bg-slate-700 justify-start'}`}>
                                                <div className="w-4 h-4 bg-white rounded-full shadow" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    {/* Goal Name */}
                                    <div>
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Goal Name</label>
                                        <input type="text" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                                            className="w-full bg-[#060A12] border border-white/8 focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none placeholder:text-slate-700 transition-all"
                                            placeholder="e.g. Dream Home, Tesla, Europe Trip" />
                                    </div>

                                    {/* Category + Year row */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Category</label>
                                            <select value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
                                                className="w-full bg-[#060A12] border border-white/8 focus:border-indigo-500/50 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none appearance-none transition-all cursor-pointer">
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Target Year</label>
                                            <select value={draft.year} onChange={e => setDraft(d => ({ ...d, year: Number(e.target.value) }))}
                                                className="w-full bg-[#060A12] border border-white/8 focus:border-indigo-500/50 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none appearance-none transition-all cursor-pointer">
                                                {Array.from({ length: 16 }, (_, i) => 2025 + i).map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Cost */}
                                    <div>
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Estimated Cost (Today's Value)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-black">₹</span>
                                            <input type="number" value={draft.cost} onChange={e => setDraft(d => ({ ...d, cost: e.target.value }))}
                                                className="w-full bg-[#060A12] border border-white/8 focus:border-indigo-500/50 rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-white outline-none placeholder:text-slate-700 transition-all"
                                                placeholder="0" />
                                        </div>
                                    </div>

                                    {/* Downpayment + Priority */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5 flex justify-between">
                                                Downpayment <span className="text-indigo-400">{draft.downpayment}%</span>
                                            </label>
                                            <input type="range" min="0" max="100" step="5" value={draft.downpayment}
                                                onChange={e => setDraft(d => ({ ...d, downpayment: Number(e.target.value) }))}
                                                className="w-full h-1.5 mt-2 bg-slate-800 rounded-full accent-indigo-500 cursor-pointer" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Priority</label>
                                            <div className="flex bg-[#060A12] border border-white/8 rounded-xl p-0.5">
                                                {['High', 'Med', 'Low'].map(p => {
                                                    const fullP = p === 'Med' ? 'Medium' : p;
                                                    const active = draft.priority === fullP;
                                                    return <button key={p} onClick={() => setDraft(d => ({ ...d, priority: fullP }))}
                                                        className={`flex-1 text-[9px] font-black py-1.5 rounded-lg transition-all ${active ? (fullP === 'High' ? 'bg-rose-500/25 text-rose-400' : fullP === 'Medium' ? 'bg-amber-500/25 text-amber-400' : 'bg-emerald-500/25 text-emerald-400') : 'text-slate-500 hover:text-slate-300'}`}>
                                                        {p}
                                                    </button>;
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Live Affordability Card */}
                                    {draft.cost && (
                                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                            className="bg-indigo-950/60 border border-indigo-500/15 rounded-xl p-4 grid grid-cols-2 gap-x-4 gap-y-3">
                                            <div>
                                                <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Inflated Cost ({draft.year})</p>
                                                <p className="text-sm font-black text-white">{INR(finalCost)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Downpayment Needed</p>
                                                <p className="text-sm font-black text-indigo-300">{INR(reqDown)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Savings Coverage</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all ${savCov >= 100 ? 'bg-emerald-500' : savCov >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, savCov)}%` }} />
                                                    </div>
                                                    <span className={`text-[10px] font-black ${savCov >= 100 ? 'text-emerald-400' : savCov >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{savCov}%</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Est. EMI Load</p>
                                                <p className={`text-sm font-black ${emiImpact > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>+{emiImpact}% income</p>
                                            </div>
                                        </motion.div>
                                    )}

                                    <button onClick={addEvent} disabled={!draft.name.trim() || !draft.cost}
                                        className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                        <Plus className="w-4 h-4" /> Add to Timeline
                                    </button>
                                </div>
                            </div>

                            {/* Timeline Panel */}
                            <div className="bg-[#0D1525]/90 border border-white/8 rounded-[24px] overflow-hidden shadow-2xl">
                                <div className="px-6 pt-5 pb-4 border-b border-white/5 flex items-center justify-between">
                                    <h2 className="text-sm font-black text-white flex items-center gap-2"><Target className="w-4 h-4 text-indigo-400" /> Timeline</h2>
                                    <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">{horizon}yr horizon</span>
                                </div>
                                <div className="px-6 py-4 border-b border-white/5">
                                    <div className="flex justify-between text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2"><span>Analysis Horizon</span><span>{horizon} Years</span></div>
                                    <input type="range" min="3" max="15" step="1" value={horizon} onChange={e => setHorizon(Number(e.target.value))}
                                        className="w-full h-1 bg-slate-800 rounded-full accent-indigo-500 cursor-pointer" />
                                </div>
                                <div className="p-4 space-y-2.5 max-h-[400px] overflow-y-auto">
                                    <AnimatePresence>
                                    {lifeEvents.map((ev, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="bg-[#060A12] border border-white/5 rounded-2xl p-4 group hover:border-indigo-500/20 transition-all">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0 space-y-2">
                                                    {/* Editable Name */}
                                                    <EditableField value={ev.name} onChange={v => updateEvent(i, 'name', v)} />
                                                    
                                                    {/* Year | Cost | Category */}
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[8px] text-slate-600 uppercase font-bold">Year</span>
                                                            <select value={ev.year} onChange={e => updateEvent(i, 'year', Number(e.target.value))}
                                                                className="bg-transparent text-xs font-black text-indigo-400 outline-none cursor-pointer">
                                                                {Array.from({ length: 16 }, (_, idx) => 2025 + idx).map(y => <option key={y} value={y}>{y}</option>)}
                                                            </select>
                                                        </div>
                                                        <span className="text-slate-700 text-xs">·</span>
                                                        <EditableField value={ev.cost} onChange={v => updateEvent(i, 'cost', v)} prefix="₹" type="number" small />
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <select value={ev.category || 'General'} onChange={e => updateEvent(i, 'category', e.target.value)}
                                                            className="bg-[#0D1525] border border-white/8 rounded-lg text-[9px] font-black text-slate-400 px-2 py-1 outline-none cursor-pointer">
                                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                        <select value={ev.priority || 'Medium'} onChange={e => updateEvent(i, 'priority', e.target.value)}
                                                            className={`rounded-lg text-[9px] font-black px-2 py-1 outline-none cursor-pointer border ${P_COLORS[ev.priority || 'Medium']} bg-transparent`}>
                                                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                <button onClick={() => removeEvent(i)} className="p-1.5 text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 shrink-0">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                    </AnimatePresence>
                                </div>
                                <div className="px-4 pb-5">
                                    <button onClick={runAnalysis} disabled={loading || lifeEvents.length === 0}
                                        className="w-full h-13 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-[0.18em] rounded-2xl shadow-xl shadow-indigo-500/15 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]">
                                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                                        {loading ? 'Calculating...' : `Run ${horizon}-Year AI Analysis`}
                                    </button>
                                </div>
                            </div>

                            {/* ── Financial Baseline Card (always visible) ── */}
                            {dashData && (
                                <div className="bg-[#0D1525]/90 border border-white/8 rounded-[24px] overflow-hidden shadow-2xl">
                                    <div className="px-5 pt-4 pb-3 border-b border-white/5">
                                        <h2 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-widest">
                                            <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Your Financial Baseline
                                        </h2>
                                    </div>
                                    <div className="p-4 grid grid-cols-2 gap-3">
                                        {[
                                            { label: 'Monthly Income',  val: INR(dashData.monthly_income || 0), color: 'text-emerald-400' },
                                            { label: 'Health Score',    val: `${healthScore}/100`, color: healthScore >= 70 ? 'text-emerald-400' : healthScore >= 50 ? 'text-amber-400' : 'text-rose-400' },
                                            { label: 'Existing EMI',    val: INR(totalEmi), color: 'text-rose-400' },
                                            { label: 'EMI Ratio',       val: `${emiRatio}%`, color: emiRatio < 30 ? 'text-emerald-400' : emiRatio < 50 ? 'text-amber-400' : 'text-rose-400' },
                                            { label: 'Liquid Savings',  val: INR(dashData.savings || 0), color: 'text-indigo-400' },
                                            { label: 'CIBIL Score',     val: cibil || 'N/A', color: cibil >= 750 ? 'text-emerald-400' : cibil >= 650 ? 'text-amber-400' : 'text-rose-400' },
                                            { label: 'Net Worth',       val: INR(netWorth), color: netWorth >= 0 ? 'text-white' : 'text-rose-400' },
                                            { label: 'Monthly Surplus', val: INR(netMonthly), color: netMonthly >= 0 ? 'text-emerald-400' : 'text-rose-400' },
                                        ].map(item => (
                                            <div key={item.label} className="bg-[#060A12] border border-white/5 rounded-xl px-3 py-2.5">
                                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-0.5">{item.label}</p>
                                                <p className={`text-xs font-black ${item.color}`}>{item.val}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Health Score Bar */}
                                    <div className="px-4 pb-4">
                                        <div className="flex justify-between text-[8px] text-slate-600 font-bold uppercase tracking-widest mb-1.5">
                                            <span>Overall Financial Health</span><span>{healthScore}/100</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${healthScore}%` }} transition={{ duration: 1.2 }}
                                                className={`h-full rounded-full ${healthScore >= 70 ? 'bg-emerald-500' : healthScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </motion.div>

                    {/* ── RIGHT PANEL ── */}
                    <div className="flex-1 min-w-0 space-y-6">

                        {/* ═══ ALWAYS-VISIBLE DASHBOARD SECTIONS ═══ */}

                        {/* 1. EMI Load Timeline — no analysis needed */}
                        {dashData && (
                            <div className="bg-[#0D1525]/90 border border-white/5 rounded-[24px] p-5 shadow-xl">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <Layers className="w-3.5 h-3.5 text-blue-400" /> EMI Load Timeline
                                </h3>
                                <p className="text-[10px] text-slate-600 mb-5">Your existing EMIs (fixed) stacked against new milestone loan obligations year-by-year.</p>
                                <div className="h-[220px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={emiTimeline} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff04" vertical={false} />
                                            <XAxis dataKey="year" stroke="#334155" fontSize={9} fontWeight={700} axisLine={false} tickLine={false} dy={6} />
                                            <YAxis stroke="#334155" fontSize={9} axisLine={false} tickLine={false} tickFormatter={v => INR(v).replace('₹','')} />
                                            <RechartsTooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '10px', fontSize: '11px' }} formatter={(v) => [INR(v)]} />
                                            <Bar dataKey="existing" stackId="a" fill="#6366f180" radius={[0,0,3,3]} name="Existing EMIs" />
                                            <Bar dataKey="milestone" stackId="a" fill="#ef444480" radius={[3,3,0,0]} name="Milestone EMIs" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex items-center gap-5 mt-2">
                                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-indigo-500/50" /><span className="text-[9px] text-slate-500">Existing EMIs</span></div>
                                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-rose-500/50" /><span className="text-[9px] text-slate-500">New Milestones</span></div>
                                    <div className="ml-auto text-[9px] text-slate-600">RBI Safe Limit: 50% of income = {INR(profile.income * 0.5)}/mo</div>
                                </div>
                            </div>
                        )}

                        {/* 2. Loan Eligibility Gauge */}
                        {dashData && (
                            <div className="bg-[#0D1525]/90 border border-white/5 rounded-[24px] p-5 shadow-xl">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <CreditCard className="w-3.5 h-3.5 text-indigo-400" /> Current Loan Eligibility
                                </h3>
                                <p className="text-[10px] text-slate-600 mb-5">Maximum loan amount you qualify for RIGHT NOW based on income, CIBIL and existing EMIs (FOIR 50%).</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { label: 'Home Loan', sublabel: '8.5% p.a. / 20yr', val: maxEligibleLoan.home, color: 'indigo', icon: '🏠' },
                                        { label: 'Car Loan',  sublabel: '10.5% p.a. / 5yr',  val: maxEligibleLoan.car,  color: 'blue',   icon: '🚗' },
                                    ].map(item => {
                                        const matchingGoal = lifeEvents.find(e => e.category === item.label.split(' ')[0]);
                                        const goalCost = matchingGoal ? matchingGoal.cost * (1 - (matchingGoal.downpayment_pct||0)/100) : 0;
                                        const coversPct = (item.val > 0 && goalCost > 0) ? Math.min(100, Math.round((item.val / goalCost) * 100)) : 100;
                                        return (
                                            <div key={item.label} className={`p-4 bg-[#060A12] border border-${item.color}-500/15 rounded-2xl`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div>
                                                        <p className="text-xs font-black text-white">{item.label}</p>
                                                        <p className="text-[9px] text-slate-500">{item.sublabel}</p>
                                                    </div>
                                                    <p className={`text-lg font-black text-${item.color}-400`}>{item.val > 0 ? INR(item.val) : 'N/A'}</p>
                                                </div>
                                                {matchingGoal && (
                                                    <>
                                                        <div className="flex justify-between text-[8px] text-slate-600 mb-1">
                                                            <span>Covers {matchingGoal.name} loan portion</span><span>{coversPct}%</span>
                                                        </div>
                                                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${coversPct >= 100 ? 'bg-emerald-500' : coversPct >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${coversPct}%` }} />
                                                        </div>
                                                    </>
                                                )}
                                                {!matchingGoal && <p className="text-[9px] text-slate-600">No matching goal planned yet.</p>}
                                            </div>
                                        );
                                    })}
                                </div>
                                {cibil < 750 && (
                                    <div className="mt-4 flex items-start gap-2.5 p-3 bg-amber-500/8 border border-amber-500/15 rounded-xl">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-amber-300 leading-relaxed">CIBIL {cibil} is below 750 — lenders may offer higher interest rates or limit eligibility. Improving to 750+ could increase your eligible loan amount significantly.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 3. Net Surplus Runway — Goal Feasibility */}
                        {dashData && (
                            <div className="bg-[#0D1525]/90 border border-white/5 rounded-[24px] p-5 shadow-xl">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <Target className="w-3.5 h-3.5 text-cyan-400" /> Downpayment Runway
                                </h3>
                                <p className="text-[10px] text-slate-600 mb-5">Using your {INR(netMonthly)}/month surplus, how many months before you can afford each downpayment.</p>
                                <div className="space-y-4">
                                    {runwayData.map((r, i) => (
                                        <div key={i} className="p-4 bg-[#060A12] border border-white/5 rounded-2xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <p className="text-xs font-black text-white">{r.name}</p>
                                                    <p className="text-[9px] text-slate-500">Downpayment: {INR(r.downpayment)}</p>
                                                </div>
                                                <div className="text-right">
                                                    {r.months === 0 ? (
                                                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Ready Now</span>
                                                    ) : r.feasible ? (
                                                        <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">{r.months} months needed</span>
                                                    ) : (
                                                        <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">Timeline tight</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${r.feasible || r.months === 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                    style={{ width: r.yearsAway > 0 ? `${Math.min(100, Math.round((1 - r.months / r.yearsAway) * 100))}%` : '100%' }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {runwayData.length === 0 && <p className="text-sm text-slate-600 text-center py-4">Add milestones to see runway analysis.</p>}
                                </div>
                            </div>
                        )}

                        {/* 4. Spending vs Savings Breakdown */}
                        {dashData && spendCats.length > 0 && (
                            <div className="bg-[#0D1525]/90 border border-white/5 rounded-[24px] p-5 shadow-xl">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <PieChart className="w-3.5 h-3.5 text-purple-400" /> Where Your Money Goes
                                </h3>
                                <p className="text-[10px] text-slate-600 mb-4">Monthly spending from your transaction history — areas to optimize to accelerate goal savings.</p>
                                <div className="space-y-3">
                                    {spendCats.map((cat, i) => {
                                        const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6'];
                                        const pct = dashData.monthly_income > 0 ? Math.round((cat.value / dashData.monthly_income) * 100) : 0;
                                        return (
                                            <div key={cat.name}>
                                                <div className="flex justify-between text-xs mb-1.5">
                                                    <span className="font-bold text-slate-300">{cat.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-white">{INR(cat.value)}</span>
                                                        <span className="text-[9px] text-slate-600">{pct}% of income</span>
                                                    </div>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                                                        className="h-full rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="pt-2 border-t border-white/5">
                                        <p className="text-[10px] text-slate-500">Redirect even 10% of discretionary spend → <span className="font-black text-emerald-400">{INR(Math.round(profile.income * 0.10))}/month</span> extra toward your goals.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ═══ AI ANALYSIS RESULTS (visible after run) ═══ */}
                        {!eventPlan ? (
                            <div className="flex flex-col items-center justify-center min-h-[300px] text-center bg-[#0D1525]/40 border border-white/5 rounded-[24px] p-10">
                                <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center mb-4">
                                    <Brain className="w-8 h-8 text-indigo-400/50" />
                                </div>
                                <h3 className="text-base font-black text-white mb-2">Run AI Analysis</h3>
                                <p className="text-slate-500 text-xs max-w-xs">Add your milestones and click the button to get your personalized {horizon}-year AI-sequenced financial roadmap.</p>
                            </div>
                        ) : (
                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                                {/* AI Summary */}
                                <div className="bg-gradient-to-br from-indigo-900/30 to-blue-900/10 border border-indigo-500/20 rounded-[24px] p-6 relative overflow-hidden">
                                    <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
                                    <div className="flex items-start gap-4">
                                        <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/25 shrink-0"><Brain className="w-5 h-5 text-indigo-400" /></div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">AI Executive Summary</p>
                                                {eventPlan.is_fallback && <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-black">Mathematical Fallback</span>}
                                            </div>
                                            <p className="text-sm text-slate-200 leading-relaxed">{eventPlan.summary}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Charts row */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                    {/* DTI + CIBIL */}
                                    <div className="bg-[#0D1525]/90 border border-white/5 rounded-[24px] p-5 shadow-xl">
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 text-rose-400" /> DTI & CIBIL Trajectory</h3>
                                        <div className="h-[220px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={eventPlan.projections} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="gDti" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff04" vertical={false} />
                                                    <XAxis dataKey="year" stroke="#334155" fontSize={9} fontWeight={700} axisLine={false} tickLine={false} dy={6} />
                                                    <YAxis yAxisId="l" stroke="#334155" fontSize={9} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                                                    <YAxis yAxisId="r" orientation="right" stroke="#334155" fontSize={9} axisLine={false} tickLine={false} domain={[600, 900]} />
                                                    <RechartsTooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '10px', fontSize: '11px' }} />
                                                    <Area yAxisId="l" type="monotone" dataKey="dti" stroke="#ef4444" fill="url(#gDti)" strokeWidth={2} name="DTI %" />
                                                    <Line yAxisId="r" type="monotone" dataKey="cibil" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 3, fill: '#818cf8', strokeWidth: 0 }} name="CIBIL" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Wealth vs Debt */}
                                    <div className="bg-[#0D1525]/90 border border-white/5 rounded-[24px] p-5 shadow-xl">
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-1 flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> Wealth vs Debt (₹L)</h3>
                                        <p className="text-[9px] text-slate-600 mb-4">Projected savings growth vs remaining loan burden</p>
                                        <div className="h-[220px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ComposedChart data={buildWealth()} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="gSave" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff04" vertical={false} />
                                                    <XAxis dataKey="year" stroke="#334155" fontSize={9} fontWeight={700} axisLine={false} tickLine={false} dy={6} />
                                                    <YAxis stroke="#334155" fontSize={9} axisLine={false} tickLine={false} tickFormatter={v => `${v}L`} />
                                                    <RechartsTooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '10px', fontSize: '11px' }} formatter={(v, n) => [`${v}L`, n]} />
                                                    <Area type="monotone" dataKey="savings" stroke="#10b981" fill="url(#gSave)" strokeWidth={2} name="Net Savings" />
                                                    <Bar dataKey="debt" fill="#ef444430" radius={[3, 3, 0, 0]} name="Loan Burden" />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* Stress Test */}
                                <div className="bg-[#0D1525]/90 border border-amber-500/10 rounded-[24px] p-5 shadow-xl">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2"><Flame className="w-3.5 h-3.5" /> Income Stress Test</h3>
                                        <span className="text-[9px] font-black bg-amber-500/10 border border-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">−35% Income Shock</span>
                                    </div>
                                    <p className="text-[10px] text-slate-600 mb-4">Simulates your DTI if annual income drops 35% due to job loss or market downturn.</p>
                                    <div className="h-[200px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={buildStress()} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff04" vertical={false} />
                                                <XAxis dataKey="year" stroke="#334155" fontSize={9} fontWeight={700} axisLine={false} tickLine={false} dy={6} />
                                                <YAxis stroke="#334155" fontSize={9} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                                                <RechartsTooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '10px', fontSize: '11px' }} />
                                                <Line type="monotone" dataKey="normal" stroke="#10b981" strokeWidth={2} dot={false} name="Normal DTI %" />
                                                <Line type="monotone" dataKey="stressed" stroke="#ef4444" strokeWidth={2} dot={false} name="Stressed DTI %" strokeDasharray="5 3" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex gap-5 mt-2">
                                        <div className="flex items-center gap-1.5"><div className="w-5 h-0.5 bg-emerald-500 rounded" /><span className="text-[9px] text-slate-500">Normal</span></div>
                                        <div className="flex items-center gap-1.5"><div className="w-5 h-0.5 bg-rose-500 rounded" style={{backgroundImage:'repeating-linear-gradient(90deg,#ef4444 0,#ef4444 5px,transparent 5px,transparent 8px)'}} /><span className="text-[9px] text-slate-500">Income Shock</span></div>
                                    </div>
                                </div>

                                {/* Strategy + Liquidity grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="bg-[#0D1525]/90 border border-white/5 rounded-[24px] p-5 shadow-xl">
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-emerald-400" /> AI Sequencing Strategy</h3>
                                        <div className="space-y-3">
                                            {(eventPlan.sequencing_strategy || []).map((s, i) => (
                                                <div key={i} className="flex gap-2.5 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                                    <p className="text-[11px] text-slate-300 leading-relaxed">{s}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-[#0D1525]/90 border border-indigo-500/15 rounded-[24px] p-5 shadow-xl">
                                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Wallet className="w-3.5 h-3.5" /> Liquidity & Tax Shield</h3>
                                        {eventPlan.liquidity_check && (
                                            <div className="p-3 bg-indigo-500/8 border border-indigo-500/10 rounded-xl mb-4">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Upfront Viability</span>
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded ${eventPlan.liquidity_check.status === 'Healthy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{eventPlan.liquidity_check.status}</span>
                                                </div>
                                                <p className="text-[11px] text-white leading-relaxed">{eventPlan.liquidity_check.insight}</p>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Tax Optimization</p>
                                            {(eventPlan.tax_implications || []).map((tip, i) => (
                                                <div key={i} className="flex gap-2 items-start">
                                                    <Star className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                                                    <p className="text-[10px] text-slate-400 leading-relaxed">{tip}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Readiness Radar */}
                                {eventPlan.readiness_scores && Object.keys(eventPlan.readiness_scores).length > 0 && (
                                    <div className="bg-[#0D1525]/90 border border-white/5 rounded-[24px] p-5 shadow-xl">
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-5 flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-cyan-400" /> Milestone Readiness Radar</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {Object.entries(eventPlan.readiness_scores).map(([name, data]) => {
                                                const score = data?.score ?? 0;
                                                const col = score > 80 ? '#10b981' : score > 50 ? '#f59e0b' : '#ef4444';
                                                return (
                                                    <div key={name} className="p-4 bg-[#060A12] border border-white/5 rounded-[18px] hover:border-cyan-500/20 transition-all">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <p className="text-xs font-black text-white truncate flex-1 mr-2">{name}</p>
                                                            <span className="text-sm font-black" style={{ color: col }}>{score}%</span>
                                                        </div>
                                                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-3">
                                                            <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                                                                className="h-full rounded-full" style={{ backgroundColor: col }} />
                                                        </div>
                                                        <p className="text-[9px] text-slate-500 leading-relaxed">{data?.justification}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Cannibalization Warning */}
                                {eventPlan.cannibalization_risk && (
                                    <div className="bg-rose-950/30 border border-rose-500/15 rounded-[24px] p-5">
                                        <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" /> Cannibalization Threat</h3>
                                        <p className="text-sm text-slate-300 leading-relaxed">{eventPlan.cannibalization_risk}</p>
                                    </div>
                                )}

                                {/* Year-by-Year Table */}
                                <div className="bg-[#0D1525]/90 border border-white/5 rounded-[24px] overflow-hidden shadow-xl">
                                    <div className="px-5 py-4 border-b border-white/5">
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-blue-400" /> Year-by-Year Projection</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-white/5">
                                                    {['Year', 'DTI', 'CIBIL', 'Status', 'AI Guidance'].map(h => (
                                                        <th key={h} className="text-left text-[9px] font-black text-slate-600 uppercase tracking-widest px-5 py-3">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/[0.03]">
                                                {eventPlan.projections.map((p, i) => {
                                                    const hasEv = lifeEvents.some(e => e.year === p.year);
                                                    return (
                                                        <tr key={i} className={`hover:bg-white/[0.015] transition-all ${hasEv ? 'bg-indigo-500/5' : ''}`}>
                                                            <td className="px-5 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-black text-white">{p.year}</span>
                                                                    {hasEv && <span className="text-[8px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-black">EVENT</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                                                                        <div className={`h-full rounded-full ${p.dti > 50 ? 'bg-rose-500' : p.dti > 35 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, p.dti)}%` }} />
                                                                    </div>
                                                                    <span className={`font-black ${p.dti > 50 ? 'text-rose-400' : p.dti > 35 ? 'text-amber-400' : 'text-emerald-400'}`}>{p.dti}%</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3 font-bold text-indigo-300">{p.cibil}</td>
                                                            <td className="px-5 py-3">
                                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${statusColor(p.status)}`}>{p.status}</span>
                                                            </td>
                                                            <td className="px-5 py-3 max-w-[280px]"><p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{p.advice}</p></td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

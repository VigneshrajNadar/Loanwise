import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    ShieldCheck, ShieldAlert, Cpu, TrendingUp, TrendingDown, AlertCircle,
    Zap, Building2, UserPlus, ShieldPlus, ListChecks, ArrowRight, Target,
    Briefcase, BarChart2, Activity, FileText, Clock, CheckCircle, XCircle
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, CartesianGrid, Cell,
    RadialBarChart, RadialBar,
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    LineChart, Line, ReferenceLine, Legend
} from 'recharts';

const API_BASE = 'http://127.0.0.1:5001/api';

const LOAN_TYPES = ['Home', 'Car', 'Personal', 'Education', 'Business', 'Bike', 'Gold', 'Medical', 'Agriculture', 'Appliances'];
const EMP_TYPES = ['Salaried', 'Self-Employed', 'Business Owner', 'Freelancer'];

const LOAN_THRESHOLDS = { Home: 55, Car: 55, Personal: 65, Education: 55, Business: 60, Bike: 50, Gold: 40, Medical: 50, Agriculture: 45, Appliances: 45 };
const LOAN_LIMITS =     { Home: 60, Car: 18, Personal: 8, Education: 20, Business: 30, Bike: 10, Gold: 8, Medical: 10, Agriculture: 15, Appliances: 5 };

// ─── Shared Card Component ───────────────────────────────────────
function Card({ children, className = '', isDangerous = false }) {
    return (
        <div className={`bg-[#0d1424]/70 backdrop-blur-xl border border-white/5 rounded-[24px] p-6 ${isDangerous ? 'border-rose-500/20 bg-rose-900/5' : ''} ${className}`}>
            {children}
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function EligibilityPage() {
    const [profile, setProfile] = useState(null);
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Sliders state
    const [form, setForm] = useState({
        loanAmount: 500000,
        loanTerm: 60,
        loanType: 'Personal',
        employmentType: 'Salaried',
        income: 50000,
        creditScore: 700,
        existingEMIs: 0,
        hasCoApplicant: false,
        coApplicantIncome: 0,
    });

    // Load dashboard profile on mount — tries localStorage first, falls back to API
    useEffect(() => {
        const loadProfile = async () => {
            try {
                // 1. Try localStorage (fastest, set when user saves Dashboard Profile)
                const raw = localStorage.getItem('user_profile');
                if (raw) {
                    const p = JSON.parse(raw);
                    applyProfile(p);
                    return;
                }
                // 2. Fallback: fetch from API using lw_token
                const token = localStorage.getItem('lw_token');
                if (token) {
                    const { data } = await axios.get('http://127.0.0.1:5001/api/user/financial-profile', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (data && Object.keys(data).length > 0) {
                        // Cache it for next time
                        localStorage.setItem('user_profile', JSON.stringify(data));
                        applyProfile(data);
                    }
                }
            } catch {}
        };
        const applyProfile = (p) => {
            setProfile(p);
            const totalEmis = (p.emis || []).reduce((s, e) => s + Number(e.amount || 0), 0);
            setForm(f => ({
                ...f,
                income:         Number(p.monthly_income)  || f.income,
                creditScore:    Number(p.cibil_score)     || f.creditScore,
                existingEMIs:   totalEmis                 || f.existingEMIs,
                employmentType: p.employment_type         || f.employmentType,
            }));
        };
        loadProfile();

    }, []);

    const handleInput = (e) => {
        const { name, value, type, checked } = e.target;
        const numericFields = ['loanAmount','loanTerm','income','creditScore','existingEMIs','coApplicantIncome'];
        setForm(f => ({ 
            ...f, 
            [name]: type === 'checkbox' ? checked : numericFields.includes(name) ? Number(value) : value 
        }));
    };

    // ─── Auto-fire analysis on every slider change ───────────
    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            setIsLoading(true);
            setError('');
            try {
                const payload = {
                    loanAmount:     form.loanAmount,
                    income:         form.income + (form.hasCoApplicant ? form.coApplicantIncome : 0),
                    creditScore:    form.creditScore,
                    existingEMIs:   form.existingEMIs,
                    loanType:       form.loanType,
                    employmentType: form.employmentType,
                    loanTerm:       form.loanTerm,
                };
                const token = localStorage.getItem('lw_token');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const { data } = await axios.post(`${API_BASE}/predict-eligibility`, payload, { headers });
                if (!cancelled) setResult(data);
            } catch (err) {
                if (!cancelled) setError(err.response?.data?.error || 'Eligibility Engine offline.');
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        const t = setTimeout(run, 900);
        return () => { cancelled = true; clearTimeout(t); };
    }, [
        form.loanAmount, form.loanTerm, form.loanType, form.employmentType,
        form.income, form.creditScore, form.existingEMIs, form.hasCoApplicant, form.coApplicantIncome
    ]);


    const dti = form.income > 0 ? ((form.existingEMIs / form.income) * 100).toFixed(1) : 0;
    const loanToIncome = form.income > 0 ? (form.loanAmount / (form.income * 12)).toFixed(2) : 0;

    return (
        <div className="pt-28 pb-32 min-h-screen relative bg-[#0B0F19] selection:bg-emerald-500/30">
            <div className="fixed top-0 right-0 w-[700px] h-[700px] bg-emerald-500/5 blur-[160px] rounded-full -z-10 pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/4 blur-[140px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/10 border border-white/5 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                        <Cpu className="w-3 h-3 fill-emerald-400" /> Live Eligibility Intelligence Engine
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tighter leading-[0.9]">
                        Loan Eligibility <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Predictor</span>
                    </h1>
                    <p className="text-slate-400 text-base font-medium max-w-xl mx-auto leading-relaxed">
                        Real-time ML predictions. Tweak the sliders to instantly model your approval odds across every loan type.
                    </p>
                </motion.div>

                <div className="flex flex-col xl:flex-row gap-10 items-start">

                    {/* ═══ LEFT SIDEBAR: Sliders ═══ */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="xl:w-[360px] shrink-0">
                        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto space-y-6 pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">

                            {/* Profile Badge */}
                            {profile ? (
                                <div className="px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Dashboard Profile Synced</p>
                                </div>
                            ) : (
                                <div className="px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                                    <AlertCircle className="w-4 h-4 text-amber-400" />
                                    <div>
                                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">No Profile Found</p>
                                        <a href="/dashboard" className="text-[9px] text-slate-400 hover:text-white">→ Set up Dashboard Profile</a>
                                    </div>
                                </div>
                            )}

                            <Card className="space-y-6">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white/5 pb-3">Loan Configuration</p>

                                {/* Loan Type */}
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Loan Type</p>
                                    <select name="loanType" value={form.loanType} onChange={handleInput}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-bold focus:outline-none focus:border-emerald-500/50 cursor-pointer">
                                        {LOAN_TYPES.map(t => <option key={t} value={t}>{t} Loan</option>)}
                                    </select>
                                </div>

                                {/* Loan Amount */}
                                <div>
                                    <div className="flex justify-between items-end text-[11px] font-bold mb-2">
                                        <span className="text-slate-500 uppercase">Loan Amount</span>
                                        <span className="text-emerald-400 font-mono">₹{form.loanAmount.toLocaleString()}</span>
                                    </div>
                                    <input type="range" name="loanAmount" min="50000" max="10000000" step="50000"
                                        className="w-full h-1.5 bg-slate-800 appearance-none rounded accent-emerald-500"
                                        value={form.loanAmount} onChange={handleInput} />
                                </div>

                                {/* Loan Term */}
                                <div>
                                    <div className="flex justify-between items-end text-[11px] font-bold mb-2">
                                        <span className="text-slate-500 uppercase">Loan Term</span>
                                        <span className="text-indigo-400 font-mono">{form.loanTerm} months</span>
                                    </div>
                                    <input type="range" name="loanTerm" min="12" max="360" step="12"
                                        className="w-full h-1.5 bg-slate-800 appearance-none rounded accent-indigo-500"
                                        value={form.loanTerm} onChange={handleInput} />
                                </div>

                                {/* Employment Type */}
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Employment Type</p>
                                    <select name="employmentType" value={form.employmentType} onChange={handleInput}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-bold focus:outline-none focus:border-emerald-500/50 cursor-pointer">
                                        {EMP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </Card>

                            <Card className="space-y-5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white/5 pb-3">Profile Override</p>

                                {/* Income */}
                                <div>
                                    <div className="flex justify-between text-[11px] font-bold mb-2">
                                        <span className="text-slate-500 uppercase">Monthly Income</span>
                                        <span className="text-emerald-400 font-mono">₹{form.income.toLocaleString()}</span>
                                    </div>
                                    <input type="range" name="income" min="5000" max="500000" step="1000"
                                        className="w-full h-1.5 bg-slate-800 appearance-none rounded accent-emerald-500"
                                        value={form.income} onChange={handleInput} />
                                </div>

                                {/* Credit Score */}
                                <div>
                                    <div className="flex justify-between text-[11px] font-bold mb-2">
                                        <span className="text-slate-500 uppercase">CIBIL Score</span>
                                        <span className={`font-mono ${form.creditScore >= 750 ? 'text-emerald-400' : form.creditScore >= 650 ? 'text-amber-400' : 'text-rose-400'}`}>{form.creditScore}</span>
                                    </div>
                                    <input type="range" name="creditScore" min="300" max="900" step="5"
                                        className="w-full h-1.5 bg-slate-800 appearance-none rounded accent-teal-500"
                                        value={form.creditScore} onChange={handleInput} />
                                </div>

                                {/* Existing EMIs */}
                                <div>
                                    <div className="flex justify-between text-[11px] font-bold mb-2">
                                        <span className="text-slate-500 uppercase">Existing EMIs/mo</span>
                                        <span className="text-rose-400 font-mono">₹{form.existingEMIs.toLocaleString()}</span>
                                    </div>
                                    <input type="range" name="existingEMIs" min="0" max="100000" step="1000"
                                        className="w-full h-1.5 bg-slate-800 appearance-none rounded accent-rose-500"
                                        value={form.existingEMIs} onChange={handleInput} />
                                </div>

                                {/* Co-Applicant Toggle */}
                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase">Add Co-Applicant</span>
                                    <button onClick={() => setForm(f => ({ ...f, hasCoApplicant: !f.hasCoApplicant }))}
                                        className={`relative w-10 h-5 rounded-full transition-all ${form.hasCoApplicant ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow ${form.hasCoApplicant ? 'left-5' : 'left-0.5'}`} />
                                    </button>
                                </div>
                                {form.hasCoApplicant && (
                                    <div>
                                        <div className="flex justify-between text-[11px] font-bold mb-2">
                                            <span className="text-slate-500 uppercase">Co-App Monthly Income</span>
                                            <span className="text-emerald-300 font-mono">₹{form.coApplicantIncome.toLocaleString()}</span>
                                        </div>
                                        <input type="range" name="coApplicantIncome" min="0" max="300000" step="5000"
                                            className="w-full h-1.5 bg-slate-800 appearance-none rounded accent-emerald-400"
                                            value={form.coApplicantIncome} onChange={handleInput} />
                                    </div>
                                )}
                            </Card>

                            {/* Live Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 text-center">
                                    <p className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-1">FOIR / DTI</p>
                                    <p className={`text-xl font-black ${dti > 45 ? 'text-rose-400' : dti > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>{dti}%</p>
                                </div>
                                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 text-center">
                                    <p className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-1">Loan/Income</p>
                                    <p className="text-xl font-black text-indigo-400">{loanToIncome}x</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ═══ RIGHT: Results Dashboard ═══ */}
                    <div className="flex-1 min-w-0">
                        {error ? (
                            <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-[24px] flex items-center gap-4 text-rose-400">
                                <ShieldAlert className="w-8 h-8 shrink-0" />
                                <div><p className="font-bold">Engine Error</p><p className="text-xs">{error}</p></div>
                            </div>
                        ) : !result ? (
                            <div className="h-64 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-14 h-14 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-emerald-400 font-black tracking-widest uppercase italic text-sm">Calibrating Engine...</p>
                                </div>
                            </div>
                        ) : (
                            <EligibilityResults result={result} form={form} isLoading={isLoading} profile={profile} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Results Dashboard ────────────────────────────────────────────
function EligibilityResults({ result, form, isLoading, profile }) {
    const cs = result.core_status;
    const eligible = cs.eligible;
    const prob = cs.probability;
    const threshold = cs.threshold;

    // Chart Data
    const probGaugeData = [{ value: prob, fill: eligible ? '#10b981' : '#ef4444' }];

    const dtiChartData = [
        { name: 'Your DTI', value: result.boundary_mapping.current_dti, fill: result.boundary_mapping.current_dti > 45 ? '#ef4444' : '#6366f1' },
        { name: 'Safe Zone', value: 40, fill: '#10b981' },
        { name: 'Bank Limit', value: 45, fill: '#f59e0b' },
    ];

    const sizingData = [
        { name: 'You Asked', amount: result.optimal_sizing.requested },
        { name: 'Safe Limit', amount: result.optimal_sizing.guaranteed_approval_limit },
        { name: 'Max Stretch', amount: result.optimal_sizing.max_stretch_limit },
    ];

    const coapData = [
        { label: 'Solo', prob: result.coapplicant_boost.base_prob },
        { label: '+ Co-App', prob: result.coapplicant_boost.simulated_prob_with_spouse },
    ];

    const creditTimeline = [
        { month: 'Now', score: form.creditScore },
        { month: '30d', score: Math.min(900, form.creditScore + (result.driver_analysis.positive.includes('Excellent Credit File') ? 10 : -5)) },
        { month: '90d', score: Math.min(900, form.creditScore + (eligible ? 25 : -10)) },
        { month: '180d', score: Math.min(900, form.creditScore + (eligible ? 40 : 5)) },
        { month: '360d', score: Math.min(900, form.creditScore + (eligible ? 55 : 20)) },
    ];

    const radarData = [
        { subject: 'Credit Score', A: Math.min(100, ((form.creditScore - 300) / 600) * 100) },
        { subject: 'Income Ratio', A: Math.min(100, (form.income / 100000) * 100) },
        { subject: 'Approval Prob', A: prob },
        { subject: 'DTI Health', A: Math.max(0, 100 - result.boundary_mapping.current_dti * 2) },
        { subject: 'Fast Track', A: result.fast_track.reduce((s, f) => s + f.point_bump, 0) },
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {isLoading && (
                <div className="fixed top-4 right-4 z-50 bg-black/80 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <div className="w-3 h-3 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                    Recalculating...
                </div>
            )}

            {/* ══ ROW 1: Hero Verdict ══ */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                className={`relative overflow-hidden w-full rounded-[40px] border p-8 xl:p-12 ${eligible
                    ? 'bg-gradient-to-br from-emerald-950/40 via-black to-emerald-900/20 border-emerald-500/30'
                    : 'bg-gradient-to-br from-rose-950/40 via-black to-rose-900/20 border-rose-500/30'}`}>
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    {eligible ? <ShieldCheck className="w-64 h-64" /> : <ShieldAlert className="w-64 h-64" />}
                </div>

                <div className="flex flex-col xl:flex-row items-start xl:items-center gap-10">
                    {/* Radial Gauge */}
                    <div className="shrink-0">
                        <ResponsiveContainer width={200} height={140}>
                            <RadialBarChart cx="50%" cy="80%" innerRadius="70%" outerRadius="100%"
                                startAngle={180} endAngle={0} data={probGaugeData} barSize={22}>
                                <RadialBar minAngle={10} background={{ fill: '#1e293b' }} clockWise dataKey="value" cornerRadius={10} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <p className="text-center -mt-4">
                            <span className={`text-4xl font-black ${eligible ? 'text-emerald-400' : 'text-rose-400'}`}>{prob}%</span>
                            <span className="text-slate-500 text-xs font-bold block">Approval Probability</span>
                        </p>
                    </div>

                    {/* Main verdict text */}
                    <div className="flex-1 relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border bg-black/40 border-white/10 w-fit mb-4">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${eligible ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {cs.loanType} Loan — {eligible ? 'Pre-Approved' : 'High Risk'}
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-black uppercase italic tracking-tighter mb-3 text-white leading-none">
                            {eligible
                                ? <><span className="text-emerald-400">ELIGIBLE</span> — Strong Profile</>
                                : <><span className="text-rose-400">CAUTION</span> — Needs Improvement</>
                            }
                        </h2>
                        <p className="text-sm text-slate-300 mb-6 leading-relaxed max-w-lg">
                            {eligible
                                ? `Your profile comfortably clears the ${threshold}% threshold for a ${cs.loanType} loan. Suggested safe limit: ₹${cs.suggestedLimit.toLocaleString()}.`
                                : `Your profile is ${Math.abs(prob - threshold).toFixed(1)}% below the ${threshold}% threshold. Use the optimizers below to turn this around.`
                            }
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <div className="bg-black/40 border border-white/5 rounded-2xl px-5 py-3">
                                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Safe Loan Limit</p>
                                <p className="text-xl font-black text-white">₹{cs.suggestedLimit.toLocaleString()}</p>
                            </div>
                            <div className="bg-black/40 border border-white/5 rounded-2xl px-5 py-3">
                                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Bureau Archetype</p>
                                <p className="text-xl font-black text-indigo-400">{result.bureau_archetype}</p>
                            </div>
                            <div className="bg-black/40 border border-white/5 rounded-2xl px-5 py-3">
                                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Risk Tier</p>
                                <p className={`text-xl font-black ${result.underwriter.risk_tier === 'Low' ? 'text-emerald-400' : result.underwriter.risk_tier === 'Medium' ? 'text-amber-400' : 'text-rose-400'}`}>{result.underwriter.risk_tier}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ══ ROW 2: Driver Analysis + DTI Chart ══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Approval Drivers */}
                <Card>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" /> Approval Driver Matrix
                    </h3>
                    <div className="space-y-3">
                        {result.driver_analysis.positive.map((f, i) => (
                            <div key={`p${i}`} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                <p className="text-xs text-slate-300 font-bold">{f}</p>
                            </div>
                        ))}
                        {result.driver_analysis.negative.map((f, i) => (
                            <div key={`n${i}`} className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                <p className="text-xs text-slate-300 font-bold">{f}</p>
                            </div>
                        ))}
                        {result.driver_analysis.positive.length === 0 && result.driver_analysis.negative.length === 0 && (
                            <p className="text-xs text-slate-500 italic">All factors are within baseline range.</p>
                        )}
                    </div>
                </Card>

                {/* DTI Rejection Zone Chart */}
                <Card>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-rose-400" /> FOIR / DTI Rejection Zone
                    </h3>
                    <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dtiChartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 60]} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px' }}
                                    formatter={(val) => [`${val}%`]} />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                    {dtiChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                </Bar>
                                <ReferenceLine y={45} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5}
                                    label={{ value: 'Max 45%', fill: '#ef4444', fontSize: 9, position: 'right' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 text-center">
                        You have a <strong className={result.boundary_mapping.buffer > 0 ? 'text-emerald-400' : 'text-rose-400'}>{result.boundary_mapping.buffer > 0 ? `${result.boundary_mapping.buffer.toFixed(1)}% safety buffer` : 'DTI breach'}</strong> before hitting bank rejection zone.
                    </p>
                </Card>
            </div>

            {/* ══ ROW 3: Profile Radar + CIBIL Trajectory ══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Financial Health Radar */}
                <Card>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-400" /> Financial Profile Radar
                    </h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="#1f2937" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9 }} />
                                <Radar name="Profile" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} formatter={(v) => [`${v.toFixed(1)}%`]} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* CIBIL Trajectory */}
                <Card>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-teal-400" /> CIBIL Score Trajectory
                    </h3>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-[9px] text-slate-500 uppercase font-black">Current Score</p>
                            <p className={`text-2xl font-black ${form.creditScore >= 750 ? 'text-emerald-400' : form.creditScore >= 650 ? 'text-amber-400' : 'text-rose-400'}`}>{form.creditScore}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] text-slate-500 uppercase font-black">12mo Projection</p>
                            <p className={`text-2xl font-black ${creditTimeline[creditTimeline.length - 1].score >= 750 ? 'text-emerald-400' : 'text-amber-400'}`}>{creditTimeline[creditTimeline.length - 1].score}</p>
                        </div>
                    </div>
                    <div className="h-[120px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={creditTimeline} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} domain={[300, 900]} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} />
                                <ReferenceLine y={750} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1} label={{ value: 'Prime', fill: '#10b981', fontSize: 8 }} />
                                <Line type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={2.5} dot={{ fill: '#818cf8', r: 3 }} activeDot={{ r: 5 }} name="CIBIL" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* ══ ROW 4: Optimal Sizing + Co-Applicant Impact ══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Optimal Loan Sizing */}
                <Card>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <Target className="w-4 h-4 text-amber-400" /> Optimal Loan Sizing
                    </h3>
                    <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sizingData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 9 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} width={75} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px' }}
                                    formatter={(val) => [`₹${val.toLocaleString()}`]} />
                                <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                                    <Cell fill="#6366f1" />
                                    <Cell fill="#10b981" />
                                    <Cell fill="#f59e0b" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Co-Applicant Probability Lift */}
                <Card>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-emerald-400" /> Co-Applicant Probability Lift
                    </h3>
                    <div className="h-[140px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={coapData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                                <defs>
                                    <linearGradient id="coAppGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px' }} formatter={(v) => [`${v}%`, 'Approval Probability']} />
                                <Area type="monotone" dataKey="prob" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#coAppGrad)" dot={{ fill: '#10b981', r: 5 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 text-center">
                        Adding a co-applicant lifts your probability by <strong className="text-emerald-400">+{(result.coapplicant_boost.simulated_prob_with_spouse - result.coapplicant_boost.base_prob).toFixed(1)}%</strong>.
                    </p>
                </Card>
            </div>

            {/* ══ ROW 5: Loan Type Eligibility Matrix ══ */}
            <Card>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-400" /> Loan Type Eligibility Matrix — Your Profile vs All Loan Types
                </h3>
                <p className="text-[10px] text-slate-500 mb-4">Based on your current income (₹{form.income.toLocaleString()}/mo) and CIBIL ({form.creditScore}), here is your probability across every loan category.</p>
                <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical"
                            data={[
                                { loan: 'Gold Loan',    prob: Math.min(99, prob + (form.creditScore > 600 ? 25 : 10)),  fill: '#f59e0b' },
                                { loan: 'Agriculture',  prob: Math.min(99, prob + 18),  fill: '#22c55e' },
                                { loan: 'Bike Loan',    prob: Math.min(99, prob + 15),  fill: '#06b6d4' },
                                { loan: 'Appliances',   prob: Math.min(99, prob + 12),  fill: '#a78bfa' },
                                { loan: 'Home Loan',    prob: Math.min(99, prob + (form.creditScore >= 650 ? 5 : -10)), fill: '#6366f1' },
                                { loan: 'Car Loan',     prob: Math.min(99, prob + 8),   fill: '#38bdf8' },
                                { loan: 'Education',    prob: Math.min(99, prob + 2),   fill: '#fb923c' },
                                { loan: 'Medical',      prob: Math.min(99, prob + 5),   fill: '#e879f9' },
                                { loan: form.loanType,  prob: prob,                     fill: prob >= (LOAN_THRESHOLDS[form.loanType] || 60) ? '#10b981' : '#ef4444' },
                                { loan: 'Business',     prob: Math.max(5, prob - 10),   fill: '#f43f5e' },
                            ].sort((a, b) => b.prob - a.prob)}
                            margin={{ top: 5, right: 40, bottom: 5, left: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="loan" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} width={80} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px' }}
                                formatter={(val) => [`${val}% approval probability`]} />
                            <Bar dataKey="prob" radius={[0, 6, 6, 0]}>
                                {[...Array(10)].map((_, i) => <Cell key={i} fill={['#f59e0b','#22c55e','#06b6d4','#a78bfa','#6366f1','#38bdf8','#fb923c','#e879f9','#10b981','#f43f5e'][i % 10]} />)}
                            </Bar>
                            <ReferenceLine x={60} stroke="#ef4444" strokeDasharray="5 3" strokeWidth={1.5}
                                label={{ value: 'Approval Threshold', fill: '#ef4444', fontSize: 8, position: 'top' }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* ══ ROW 6: EMI Affordability + Interest Rate Sensitivity ══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* EMI Affordability Zone */}
                <Card>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-amber-400" /> EMI Affordability Zone Simulator
                    </h3>
                    {(() => {
                        const safeEmiMax = form.income * 0.4;
                        const r = 0.10 / 12;
                        const n = form.loanTerm;
                        const emiData = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(pct => {
                            const loanAmt = pct * 100000;
                            const emi = r > 0 ? (loanAmt * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1) : loanAmt / n;
                            return { lakh: `₹${pct}L`, emi: Math.round(emi), safe: Math.round(safeEmiMax) };
                        });
                        return (
                            <>
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <p className="text-[9px] text-slate-500 uppercase font-black">Safe EMI Ceiling</p>
                                        <p className="text-xl font-black text-emerald-400">₹{Math.round(form.income * 0.4).toLocaleString()}/mo</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-slate-500 uppercase font-black">@ 40% FOIR Rule</p>
                                        <p className="text-xs font-black text-slate-300">Industry Standard</p>
                                    </div>
                                </div>
                                <div className="h-[160px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={emiData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                                            <defs>
                                                <linearGradient id="emiGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false}/>
                                            <XAxis dataKey="lakh" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false}/>
                                            <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}/>
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px' }}
                                                formatter={(v, name) => [`₹${Number(v).toLocaleString()}`, name === 'emi' ? 'Required EMI' : 'Your Safe Ceiling']}/>
                                            <ReferenceLine y={safeEmiMax} stroke="#10b981" strokeDasharray="5 3" strokeWidth={1.5}
                                                label={{ value: 'Safe Limit', fill: '#10b981', fontSize: 8 }}/>
                                            <Area type="monotone" dataKey="emi" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#emiGrad)" name="emi"/>
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2 text-center">Green line = your safe EMI. Any bar above it strains your budget.</p>
                            </>
                        );
                    })()}
                </Card>

                {/* Interest Rate Sensitivity */}
                <Card>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-rose-400" /> Interest Rate Sensitivity
                    </h3>
                    {(() => {
                        const n = form.loanTerm;
                        const L = form.loanAmount;
                        const rateData = [8, 10, 12, 14, 16, 18, 20, 22, 24].map(rate => {
                            const r = rate / 100 / 12;
                            const emi = r > 0 ? (L * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1) : L/n;
                            const totalCost = emi * n;
                            const interest = totalCost - L;
                            return { rate: `${rate}%`, emi: Math.round(emi), interest: Math.round(interest), total: Math.round(totalCost) };
                        });
                        return (
                            <>
                                <div className="h-[180px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={rateData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false}/>
                                            <XAxis dataKey="rate" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false}/>
                                            <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}/>
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px' }}
                                                formatter={(v, name) => [`₹${Number(v).toLocaleString()}`, name === 'emi' ? 'Monthly EMI' : 'Total Interest']}/>
                                            <Legend wrapperStyle={{ fontSize: '9px', color: '#64748b' }}/>
                                            <Line type="monotone" dataKey="emi"      stroke="#f59e0b" strokeWidth={2.5} dot={false} name="emi"/>
                                            <Line type="monotone" dataKey="interest" stroke="#ef4444" strokeWidth={2}   dot={false} name="interest" strokeDasharray="5 3"/>
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2 text-center">
                                    Every +2% rate hike adds <strong className="text-rose-400">₹{(rateData[2].emi - rateData[0].emi).toLocaleString()}/mo</strong> to your payment on this loan.
                                </p>
                            </>
                        );
                    })()}
                </Card>
            </div>

            {/* ══ ROW 7: Income Breakeven + Total Loan Cost Breakdown ══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Income Breakeven Simulator */}
                <Card>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" /> Income Breakeven Simulator
                    </h3>
                    {(() => {
                        const threshold = LOAN_THRESHOLDS[form.loanType] || 60;
                        const incomeSteps = [0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.5, 1.8].map(mult => {
                            const inc = Math.round(form.income * mult);
                            const dti_sim = inc > 0 ? ((form.existingEMIs / inc) * 100) : 100;
                            const raw_prob = Math.min(99, Math.max(5,
                                prob + (mult - 1.0) * 40
                                - (form.creditScore < 650 ? 15 : 0)
                                + (dti_sim < 30 ? 10 : dti_sim > 50 ? -15 : 0)
                            ));
                            return { income: `₹${(inc/1000).toFixed(0)}k`, prob: Math.round(raw_prob), threshold };
                        });
                        const breakeven = incomeSteps.find(d => d.prob >= threshold);
                        return (
                            <>
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <p className="text-[9px] text-slate-500 uppercase font-black">Breakeven Income</p>
                                        <p className="text-lg font-black text-emerald-400">{breakeven ? breakeven.income + '/mo' : 'Already Eligible'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-slate-500 uppercase font-black">Required for Approval</p>
                                        <p className="text-xs font-black text-slate-300">{threshold}% threshold</p>
                                    </div>
                                </div>
                                <div className="h-[155px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={incomeSteps} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                                            <defs>
                                                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false}/>
                                            <XAxis dataKey="income" tick={{ fill: '#64748b', fontSize: 8 }} axisLine={false} tickLine={false}/>
                                            <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`}/>
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px' }}
                                                formatter={(v) => [`${v}%`, 'Approval Probability']}/>
                                            <ReferenceLine y={threshold} stroke="#ef4444" strokeDasharray="5 3" strokeWidth={1.5}
                                                label={{ value: `${threshold}% threshold`, fill: '#ef4444', fontSize: 8 }}/>
                                            <Area type="monotone" dataKey="prob" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#incGrad)" dot={{ r: 3, fill: '#10b981' }}/>
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </>
                        );
                    })()}
                </Card>

                {/* Total Loan Cost Breakdown */}
                <Card>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-teal-400" /> Total Cost of Loan Breakdown
                    </h3>
                    {(() => {
                        const rate = 12; // Avg rate estimate
                        const r = rate / 100 / 12;
                        const n = form.loanTerm;
                        const L = form.loanAmount;
                        const emi = r > 0 ? (L * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1) : L/n;
                        const totalPaid = emi * n;
                        const interest = totalPaid - L;
                        const interestPct = totalPaid > 0 ? ((interest / totalPaid) * 100).toFixed(1) : 0;
                        const costData = [
                            { name: 'Principal', value: Math.round(L), fill: '#6366f1' },
                            { name: 'Total Interest', value: Math.round(interest), fill: '#ef4444' },
                        ];
                        const monthlyData = [1, 6, 12, 24, 36, n > 36 ? n : null].filter(Boolean).map(mo => {
                            const paid = emi * mo;
                            const interestPaid = paid - (L - L * Math.pow(1 + r, mo) / Math.pow(1 + r, n));
                            return { month: `M${mo}`, cumulative: Math.round(paid), interest: Math.round(Math.max(0, interestPaid)) };
                        });
                        return (
                            <>
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="text-center p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                        <p className="text-[8px] uppercase font-black text-slate-500 mb-1">Principal</p>
                                        <p className="text-sm font-black text-indigo-400">₹{(L/100000).toFixed(1)}L</p>
                                    </div>
                                    <div className="text-center p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                                        <p className="text-[8px] uppercase font-black text-slate-500 mb-1">Interest</p>
                                        <p className="text-sm font-black text-rose-400">₹{(interest/100000).toFixed(1)}L</p>
                                    </div>
                                    <div className="text-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                        <p className="text-[8px] uppercase font-black text-slate-500 mb-1">EMI</p>
                                        <p className="text-sm font-black text-amber-400">₹{Math.round(emi).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                                    <div className="h-full bg-indigo-500 rounded-l-full transition-all" style={{ width: `${100 - interestPct}%` }}/>
                                    <div className="h-full bg-rose-500 rounded-r-full transition-all" style={{ width: `${interestPct}%` }}/>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2 text-center">
                                    <strong className="text-rose-400">{interestPct}%</strong> of every rupee you pay goes to the bank as pure interest. You hand over <strong className="text-rose-400">₹{Math.round(interest).toLocaleString()}</strong> in interest over {n} months.
                                </p>
                            </>
                        );
                    })()}
                </Card>
            </div>




            {/* ══ ROW 8: Prepayment ROI + Credit Score Sensitivity ══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Prepayment ROI Simulator */}
                <Card>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-400" /> Prepayment ROI Simulator
                    </h3>
                    {(() => {
                        const r = 0.12 / 12;
                        const n = form.loanTerm;
                        const L = form.loanAmount;
                        const baseEmi = r > 0 ? (L * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1) : L/n;
                        const baseTotalInterest = baseEmi * n - L;
                        const prepayScenarios = [0, 5, 10, 15, 20].map(pct => {
                            const extra = L * pct / 100;
                            const newPrincipal = Math.max(0, L - extra);
                            const newEmi = r > 0 ? (newPrincipal * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1) : newPrincipal/n;
                            const newTotalInterest = newEmi * n - newPrincipal;
                            const interestSaved = baseTotalInterest - newTotalInterest;
                            return {
                                prepay: `${pct}%`,
                                emi: Math.round(newEmi),
                                interestSaved: Math.max(0, Math.round(interestSaved)),
                                totalInterest: Math.max(0, Math.round(newTotalInterest))
                            };
                        });
                        return (
                            <>
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <p className="text-[9px] text-slate-500 uppercase font-black">Max Interest Saved</p>
                                        <p className="text-xl font-black text-emerald-400">₹{prepayScenarios[prepayScenarios.length-1].interestSaved.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-slate-500 uppercase font-black">With 20% Upfront Prepay</p>
                                        <p className="text-[10px] text-slate-300 font-bold">on ₹{(L/100000).toFixed(1)}L @ 12% p.a.</p>
                                    </div>
                                </div>
                                <div className="h-[155px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={prepayScenarios} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false}/>
                                            <XAxis dataKey="prepay" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}/>
                                            <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}/>
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px' }}
                                                formatter={(v, name) => [`₹${Number(v).toLocaleString()}`, name === 'interestSaved' ? '💰 Interest Saved' : '📉 Remaining Interest']}/>
                                            <Legend wrapperStyle={{ fontSize: '9px', color: '#64748b' }}/>
                                            <Bar dataKey="interestSaved" name="interestSaved" fill="#10b981" radius={[4,4,0,0]}/>
                                            <Bar dataKey="totalInterest" name="totalInterest" fill="#ef4444" radius={[4,4,0,0]}/>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2 text-center">Even a <strong className="text-emerald-400">5% lump-sum prepayment</strong> on Day 1 saves ₹{prepayScenarios[1].interestSaved.toLocaleString()} in interest over the tenure.</p>
                            </>
                        );
                    })()}
                </Card>

                {/* Credit Score Sensitivity */}
                <Card>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-400" /> Credit Score Sensitivity Simulator
                    </h3>
                    {(() => {
                        const scoreSteps = [-100, -75, -50, -25, 0, 25, 50, 75, 100].map(delta => {
                            const newScore = Math.min(900, Math.max(300, form.creditScore + delta));
                            const baseProbAdjusted = Math.min(99, Math.max(5,
                                prob + (delta > 0 ? delta * 0.5 : delta * 0.6)
                            ));
                            const color = baseProbAdjusted >= (LOAN_THRESHOLDS[form.loanType] || 60) ? '#10b981' : '#ef4444';
                            return { delta: delta >= 0 ? `+${delta}` : `${delta}`, score: newScore, prob: Math.round(baseProbAdjusted), color };
                        });
                        const crossesThreshold = scoreSteps.find(s => s.prob >= (LOAN_THRESHOLDS[form.loanType] || 60) && s.delta.startsWith('+'));
                        return (
                            <>
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <p className="text-[9px] text-slate-500 uppercase font-black">Needed Score Boost</p>
                                        <p className="text-xl font-black text-indigo-400">{crossesThreshold ? crossesThreshold.delta + ' pts' : '✅ Already'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-slate-500 uppercase font-black">To Hit Approval Threshold</p>
                                        <p className="text-[10px] text-slate-300 font-bold">Current: {form.creditScore}</p>
                                    </div>
                                </div>
                                <div className="h-[155px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={scoreSteps} margin={{ top: 5, right: 10, bottom: 0, left: -15 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false}/>
                                            <XAxis dataKey="delta" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false}/>
                                            <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`}/>
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px' }}
                                                formatter={(v, _, p) => [`${v}% (CIBIL: ${p.payload.score})`, 'Approval Probability']}/>
                                            <ReferenceLine y={LOAN_THRESHOLDS[form.loanType] || 60} stroke="#f59e0b" strokeDasharray="5 3" strokeWidth={1.5}
                                                label={{ value: 'Threshold', fill: '#f59e0b', fontSize: 8 }}/>
                                            <Bar dataKey="prob" radius={[4,4,0,0]}>
                                                {scoreSteps.map((s, i) => <Cell key={i} fill={s.color}/>)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </>
                        );
                    })()}
                </Card>
            </div>

            {/* ══ ROW 9: Tenure vs EMI Trade-off + Debt Stacking Risk ══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Tenure vs EMI Trade-off */}
                <Card>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-400" /> Tenure vs EMI vs Total Cost Trade-off
                    </h3>
                    {(() => {
                        const r = 0.12 / 12;
                        const L = form.loanAmount;
                        const tenureData = [12, 24, 36, 48, 60, 84, 120, 180, 240].map(mo => {
                            const emi = r > 0 ? (L * r * Math.pow(1+r, mo)) / (Math.pow(1+r, mo) - 1) : L/mo;
                            const totalCost = emi * mo;
                            const totalInterest = totalCost - L;
                            return {
                                tenure: `${mo}mo`,
                                emi: Math.round(emi),
                                interest: Math.round(totalInterest),
                                highlight: mo === form.loanTerm
                            };
                        });
                        const selected = tenureData.find(t => t.tenure === `${form.loanTerm}mo`) || tenureData[4];
                        return (
                            <>
                                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                                    <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                        <p className="text-[8px] uppercase font-black text-slate-500">Your Term</p>
                                        <p className="text-sm font-black text-purple-400">{form.loanTerm}mo</p>
                                    </div>
                                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                        <p className="text-[8px] uppercase font-black text-slate-500">EMI</p>
                                        <p className="text-sm font-black text-amber-400">₹{(selected?.emi || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                                        <p className="text-[8px] uppercase font-black text-slate-500">Total Interest</p>
                                        <p className="text-sm font-black text-rose-400">₹{((selected?.interest || 0)/100000).toFixed(1)}L</p>
                                    </div>
                                </div>
                                <div className="h-[150px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={tenureData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false}/>
                                            <XAxis dataKey="tenure" tick={{ fill: '#64748b', fontSize: 8 }} axisLine={false} tickLine={false}/>
                                            <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}/>
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px' }}
                                                formatter={(v, name) => [`₹${Number(v).toLocaleString()}`, name === 'emi' ? 'Monthly EMI' : 'Total Interest Paid']}/>
                                            <Legend wrapperStyle={{ fontSize: '9px', color: '#64748b' }}/>
                                            <Line type="monotone" dataKey="emi"      stroke="#f59e0b" strokeWidth={2.5} dot={false} name="emi"/>
                                            <Line type="monotone" dataKey="interest" stroke="#ef4444" strokeWidth={2}   dot={false} name="interest" strokeDasharray="5 3"/>
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2 text-center">Shorter tenure = lower total interest but higher EMI. Use the slider to find your sweet spot.</p>
                            </>
                        );
                    })()}
                </Card>

                {/* Debt Stacking Risk Meter */}
                <Card isDangerous={form.existingEMIs / Math.max(1, form.income) > 0.4}>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-400" /> Debt Stacking Risk Meter
                    </h3>
                    {(() => {
                        const r = 0.12 / 12;
                        const n = form.loanTerm;
                        const newEmi = r > 0 ? (form.loanAmount * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1) : form.loanAmount/n;
                        const totalEmiAfter = form.existingEMIs + newEmi;
                        const foirAfter = form.income > 0 ? (totalEmiAfter / form.income) * 100 : 100;
                        const freeCashAfter = Math.max(0, form.income - totalEmiAfter);
                        const riskLevel = foirAfter > 60 ? 'CRITICAL' : foirAfter > 45 ? 'HIGH' : foirAfter > 30 ? 'MODERATE' : 'SAFE';
                        const riskColor = foirAfter > 60 ? '#ef4444' : foirAfter > 45 ? '#f59e0b' : foirAfter > 30 ? '#fb923c' : '#10b981';
                        const stackData = [
                            { name: 'Existing EMIs', value: form.existingEMIs, fill: '#f59e0b' },
                            { name: 'New Loan EMI',   value: Math.round(newEmi),  fill: '#ef4444' },
                            { name: 'Free Cash',      value: Math.round(freeCashAfter), fill: '#10b981' },
                        ];
                        return (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-[9px] text-slate-500 uppercase font-black">FOIR After New Loan</p>
                                        <p className="text-3xl font-black" style={{ color: riskColor }}>{foirAfter.toFixed(1)}%</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="px-3 py-1.5 rounded-xl text-xs font-black uppercase" style={{ color: riskColor, backgroundColor: `${riskColor}20`, border: `1px solid ${riskColor}40` }}>{riskLevel}</span>
                                        <p className="text-[9px] text-slate-500 mt-1">Free Cash: ₹{freeCashAfter.toLocaleString()}/mo</p>
                                    </div>
                                </div>
                                <div className="h-[100px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart layout="vertical" data={stackData} margin={{ top: 0, right: 30, bottom: 0, left: 10 }}>
                                            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 9 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false}/>
                                            <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} width={90}/>
                                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px' }}
                                                formatter={(v) => [`₹${Number(v).toLocaleString()}/mo`]}/>
                                            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                                {stackData.map((s, i) => <Cell key={i} fill={s.fill}/>)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-3 w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, foirAfter)}%`, backgroundColor: riskColor }}/>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2 text-center">
                                    Industry safe zone: <strong className="text-emerald-400">&lt;40%</strong>. You are at <strong style={{ color: riskColor }}>{foirAfter.toFixed(1)}%</strong> after adding this loan.
                                </p>
                            </>
                        );
                    })()}
                </Card>
            </div>

            {/* ══ Rejection Reasons (if any) ══ */}

            {result.reasons?.length > 0 && (
                <Card isDangerous>
                    <h3 className="text-sm font-black uppercase italic tracking-tighter text-rose-400 mb-5 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5" /> Rejection Risk Audit
                    </h3>
                    <div className="space-y-4">
                        {result.reasons.map((r, i) => (
                            <div key={i} className="p-4 rounded-2xl border border-rose-500/15 bg-black/30">
                                <p className="text-xs font-black uppercase text-rose-400 mb-1">{r.factor}</p>
                                <p className="text-sm text-slate-300 font-bold leading-relaxed">{r.detail}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </motion.div>
    );
}

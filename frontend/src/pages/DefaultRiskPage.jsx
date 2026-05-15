import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Fingerprint, IndianRupee, Clock, Percent, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { Drp20Sections } from './drp/Drp20Sections';
import { Section10AIChat } from './fhd/Section10AIChat';

const API_BASE = 'http://127.0.0.1:5001/api';
const PURPOSES = [
    { id: 'debt_consolidation', label: 'Debt Consolidation' },
    { id: 'credit_card', label: 'Credit Card' },
    { id: 'home_improvement', label: 'Home Improvement' },
    { id: 'small_business', label: 'Small Business' },
    { id: 'major_purchase', label: 'Major Purchase' },
    { id: 'medical', label: 'Medical' },
    { id: 'house', label: 'House' },
    { id: 'car', label: 'Car' },
    { id: 'other', label: 'Other' },
];

export default function DefaultRiskPage() {
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Auto-load profile data
    const [profile, setProfile] = useState(null);

    // Form inputs state
    const [form, setForm] = useState({
        loan_amount: 500000,
        loan_term: 36,
        interest_rate: 11.5,
        loan_purpose: 'debt_consolidation',
        annual_income: 600000,
        credit_score: 720,
        temp_dti: 20,
        emp_length: 5,
        revol_util: 30,
        delinq_2yrs: 0,
        inquiries: 0,
        open_accounts: 5,
        // Profile Override Simulation States
        override_savings: 0,
        override_expenses: 0,
        override_goal_type: 'Home',
        override_home_goal: 0
    });

    useEffect(() => {
        // Try API token-based profile first, then fall back to localStorage
        const storedProfile = localStorage.getItem('user_profile');
        if (storedProfile) {
            try {
                const parsed = JSON.parse(storedProfile);
                setProfile(parsed);
                // Pre-fill form from real dashboard values
                const annualIncome = parsed.annual_income ||
                    (parsed.monthly_income ? Number(parsed.monthly_income) * 12 : 0) || 600000;
                setForm(prev => ({
                    ...prev,
                    annual_income: annualIncome,
                    credit_score: parsed.cibil_score || parsed.credit_score || prev.credit_score,
                    revol_util: parsed.credit_utilization || prev.revol_util,
                    emp_length: parsed.work_experience_years || prev.emp_length,
                    override_savings: Number(parsed.savings) || prev.override_savings,
                    override_expenses: Number(parsed.monthly_expenses) || prev.override_expenses,
                    override_home_goal: Number(parsed.goal_home_amount) || prev.override_home_goal,
                }));
            } catch (e) {
                console.error("Failed to parse profile", e);
            }
        }
    }, []);

    const handleInput = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: name === 'loan_purpose' ? value : Number(value)
        }));
    };

    const runAnalysis = useCallback(async () => {
        setIsLoading(true);
        setError('');

        // Calculate dynamic profile values identically to DecisionEngine
        let exact_existing_emi = 0;
        if (profile) {
            exact_existing_emi = (profile.emis || []).reduce((s, emi) => s + (Number(emi.amount) || 0), 0);
        }
            
        // Always re-calculate projected DTI with new proposed EMI + old EMIs
        const m_inc = form.annual_income / 12;
        const r = (form.interest_rate / 100) / 12;
        const new_emi = r > 0 ? (form.loan_amount * r * Math.pow(1+r, form.loan_term)) / (Math.pow(1+r, form.loan_term) - 1) : form.loan_amount / form.loan_term;
        
        let dti = m_inc > 0 ? ((exact_existing_emi + new_emi) / m_inc) * 100 : form.temp_dti;

        try {
            const payload = {
                loan_amount: form.loan_amount,
                interest_rate: form.interest_rate,
                term: form.loan_term, // backend uses 'term'
                annual_income: form.annual_income,
                debt_to_income: dti,
                emp_length: form.emp_length,
                home_ownership: 'RENT', // Simplified assumption for slider
                purpose: form.loan_purpose,
                open_accounts: form.open_accounts,
                revol_util: form.revol_util,
                delinquencies: form.delinq_2yrs,
                total_accounts: form.open_accounts + 5, // rough estimate
                credit_inquiries: form.inquiries,
            };

            const config = {};
            const token = localStorage.getItem('lw_token'); // lw_token is the definitive Loanwise token
            if (token) {
                config.headers = { Authorization: `Bearer ${token}` };
            }

            const { data } = await axios.post(`${API_BASE}/predict-default-risk`, payload, config);
            setResult(data);
        } catch (err) {
            setError(err.response?.data?.error || 'Default Risk Engine offline. Ensure Flask API is fully bound.');
        } finally {
            setIsLoading(false);
        }
    }, [form, profile]);

    // Fast Debounce Trigger
    useEffect(() => {
        const timeout = setTimeout(runAnalysis, 1500);
        return () => clearTimeout(timeout);
    }, [form, runAnalysis]);


    return (
        <div className="pt-28 pb-32 min-h-screen relative selection:bg-indigo-500/30 bg-[#0B0F19]">
            {/* Ambient Backgrounds */}
            <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/10 blur-[150px] rounded-full -z-10 pointer-events-none" />
            <div className="fixed bottom-0 left-[-10%] w-[600px] h-[600px] bg-rose-600/5 blur-[150px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 pb-12 border-b border-indigo-500/20 mb-12 items-start">
                    
                    {/* LEFT COLUMN: INTERACTIVE SLIDERS */}
                    <div className="w-full lg:w-[420px] shrink-0">
                        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto bg-[#0d1424]/80 backdrop-blur-2xl border border-white/5 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                            
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[50px] -z-10 rounded-full" />
                            
                            <div className="mb-8">
                                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-400">
                                    Default Risk
                                </h1>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Live Dashboard Sync</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-[11px] font-bold uppercase mb-3 text-slate-500">
                                        <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3"/> Target Principal</span>
                                        <span className="text-indigo-400 font-mono text-base">₹{form.loan_amount.toLocaleString()}</span>
                                    </div>
                                    <input type="range" name="loan_amount" min="10000" max="2500000" step="10000"
                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                        value={form.loan_amount} onChange={handleInput} />
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mb-4 border-b border-white/5 pb-2">
                                            <span className="text-slate-500 flex items-center gap-1"><Percent className="w-3 h-3"/> Offered Rate</span>
                                            <span className="text-indigo-400 text-sm bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{form.interest_rate}%</span>
                                        </div>
                                        <input type="range" name="interest_rate" min="7" max="24" step="0.25"
                                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400 transition-all mb-4"
                                            value={form.interest_rate} onChange={handleInput} />
                                    </div>
                                    
                                    <div>
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mb-4 border-b border-white/5 pb-2">
                                            <span className="text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3"/> Tenure</span>
                                            <span className="text-indigo-400 text-sm bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{form.loan_term} Mo</span>
                                        </div>
                                        <input type="range" name="loan_term" min="12" max="180" step="12"
                                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400 transition-all mb-4"
                                            value={form.loan_term} onChange={handleInput} />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Target Asset / Purpose</label>
                                    <select name="loan_purpose" className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white uppercase font-bold outline-none focus:border-indigo-500/50"
                                        value={form.loan_purpose} onChange={handleInput}>
                                        {PURPOSES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                                    </select>
                                </div>

                                <div className="pt-4 border-t border-white/5 space-y-5">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dashboard Profile Override</h4>
                                    
                                    <div>
                                        <div className="flex justify-between text-[11px] font-bold uppercase mb-2">
                                            <span className="text-slate-500">Gross Ann. Income</span>
                                            <span className="text-emerald-400 font-mono">₹{form.annual_income.toLocaleString()}</span>
                                        </div>
                                        <input type="range" name="annual_income" min="300000" max="6000000" step="10000"
                                            className="w-full h-1.5 bg-slate-800 appearance-none rounded accent-emerald-500"
                                            value={form.annual_income} onChange={handleInput} />
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-[11px] font-bold uppercase mb-2">
                                            <span className="text-slate-500">Liquid Savings Base</span>
                                            <span className="text-emerald-400 font-mono">₹{form.override_savings.toLocaleString()}</span>
                                        </div>
                                        <input type="range" name="override_savings" min="0" max="5000000" step="10000"
                                            className="w-full h-1.5 bg-slate-800 appearance-none rounded accent-emerald-500"
                                            value={form.override_savings} onChange={handleInput} />
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-[11px] font-bold uppercase mb-2">
                                            <span className="text-slate-500">Base Living Expenses/mo</span>
                                            <span className="text-rose-400 font-mono">₹{form.override_expenses.toLocaleString()}</span>
                                        </div>
                                        <input type="range" name="override_expenses" min="10000" max="250000" step="2000"
                                            className="w-full h-1.5 bg-slate-800 appearance-none rounded accent-rose-500"
                                            value={form.override_expenses} onChange={handleInput} />
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center text-[11px] font-bold uppercase mb-2">
                                            <select name="override_goal_type" className="bg-transparent text-slate-500 hover:text-indigo-400 focus:outline-none cursor-pointer text-[10px] tracking-widest font-black uppercase appearance-none" value={form.override_goal_type} onChange={handleInput}>
                                                <option value="Home">Home Purchase Goal</option>
                                                <option value="Education">Education Goal</option>
                                                <option value="Wedding">Wedding Goal</option>
                                                <option value="Car">Car Purchase Goal</option>
                                            </select>
                                            <span className="text-indigo-400 font-mono">₹{form.override_home_goal.toLocaleString()}</span>
                                        </div>
                                        <input type="range" name="override_home_goal" min="0" max="25000000" step="500000"
                                            className="w-full h-1.5 bg-slate-800 appearance-none rounded accent-indigo-500"
                                            value={form.override_home_goal} onChange={handleInput} />
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-[11px] font-bold uppercase mb-2 items-center">
                                            <span className="text-slate-500 flex items-center gap-2">Credit Limit Util.</span>
                                            <span className="text-rose-400 font-mono text-sm">{form.revol_util}%</span>
                                        </div>
                                        <input type="range" name="revol_util" min="0" max="100" step="1"
                                            className="w-full h-1.5 bg-slate-800 appearance-none cursor-pointer accent-rose-500"
                                            value={form.revol_util} onChange={handleInput} />
                                    </div>
                                    
                                    <div className="flex justify-between items-center gap-4">
                                        <div className="flex flex-col flex-1">
                                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Emp Length</span>
                                            <div className="bg-black/40 border border-white/5 rounded-lg p-2 text-center text-indigo-300 font-bold">{form.emp_length} Yrs</div>
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Delinq (2y)</span>
                                            <div className="bg-black/40 border border-white/5 rounded-lg p-2 text-center text-rose-300 font-bold">{form.delinq_2yrs}</div>
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Inquiries</span>
                                            <div className="bg-black/40 border border-white/5 rounded-lg p-2 text-center text-amber-300 font-bold">{form.inquiries}</div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: CORE SUMMARY + ENGINE RENDER */}
                    <div className="flex-1 min-w-0">
                        {error ? (
                            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-[32px] flex items-center gap-4 text-rose-400">
                                <ShieldAlert className="w-8 h-8 shrink-0" /><div><p className="font-bold">Engine Error</p><p className="text-xs">{error}</p></div>
                            </motion.div>
                        ) : !result ? (
                            <div className="h-full flex items-center justify-center p-12">
                                <div className="text-center">
                                    <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6" />
                                    <p className="text-emerald-400 font-black tracking-widest uppercase italic text-sm">Synchronizing Engine...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                
                                {/* 1. Master Risk Output Header - Decision Card Style */}
                                <motion.div initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} className={`relative overflow-hidden w-full rounded-[40px] border p-8 xl:p-12 mb-8 ${result.risk_level === 'Very High' || result.risk_level === 'High' ? 'bg-gradient-to-br from-rose-950/40 via-black to-rose-900/20 border-rose-500/30' : 'bg-gradient-to-br from-emerald-950/40 via-black to-emerald-900/20 border-emerald-500/30'}`}>
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <Fingerprint className="w-48 h-48" />
                                    </div>

                                    {isLoading && (
                                        <div className="absolute top-6 right-6 px-3 py-1 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-black uppercase tracking-widest animate-pulse border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                                            Recalculating...
                                        </div>
                                    )}

                                    <div className="flex flex-col relative z-10">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border bg-black/40 border-white/10 w-fit mb-6 shadow-2xl">
                                            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] animate-pulse ${result.risk_level === 'Very High' || result.risk_level === 'High' ? 'bg-rose-500 text-rose-500' : 'bg-emerald-500 text-emerald-500'}`} />
                                            {result.borrower_profile} Tier
                                        </div>
                                        
                                        <h2 className="text-3xl lg:text-4xl font-black uppercase italic tracking-tighter mb-4 text-white leading-none">
                                            Risk Rating: <span className={`${result.risk_level === 'Very High' || result.risk_level === 'High' ? 'text-rose-400' : 'text-emerald-400'}`}>Grade {result.risk_grade}</span>
                                        </h2>
                                        
                                        <p className="text-sm lg:text-base font-medium text-slate-300 max-w-2xl leading-relaxed mb-8">
                                            {result.message}
                                        </p>

                                        <div className="flex flex-wrap gap-4 mt-auto w-full">
                                            <div className="bg-black/40 border border-white/5 rounded-2xl flex-1 min-w-[140px] p-5 shadow-2xl">
                                                <p className="text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest flex items-center gap-2">
                                                    Stability Score
                                                </p>
                                                <p className="text-3xl font-black text-indigo-400">{result.stability_score}/100</p>
                                            </div>
                                            <div className="bg-black/40 border border-white/5 rounded-2xl flex-1 min-w-[140px] p-5 shadow-2xl">
                                                <p className="text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">Calculated DTI</p>
                                                <p className="text-3xl font-black text-white">{result.dti}%</p>
                                            </div>
                                            <div className="bg-black/40 border border-white/5 rounded-2xl flex-2 min-w-[200px] p-5 shadow-2xl">
                                                <p className="text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">Computed Monthly Installment</p>
                                                <p className="text-3xl font-black text-white">₹{result.monthly_installment.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Alert Banner for High Risk Recommendations */}
                                {result.recommendation && (
                                    <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="w-full rounded-[28px] border border-amber-500/40 bg-gradient-to-br from-amber-900/10 to-black/40 p-6 mb-8 flex flex-col xl:flex-row xl:items-center gap-6">
                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className="p-3 rounded-2xl bg-amber-500/20 animate-pulse">
                                                <AlertCircle className="w-6 h-6 text-amber-400" />
                                            </div>
                                            <div>
                                                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded mb-1 inline-block">Safe Harbor Proposal</span>
                                                <p className="text-xl font-black text-amber-300 uppercase italic tracking-tighter">Reduce Exposure</p>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-300 font-bold mb-3">Your default risk is critically elevated. The AI mathematically guarantees lower risk if you restrict your borrowing parameters to:</p>
                                            <div className="flex flex-wrap gap-4">
                                                <div className="bg-black/40 border border-amber-500/20 rounded-xl px-4 py-2"><span className="text-[9px] uppercase tracking-widest text-slate-400 block mb-1">Max Loan</span><span className="text-sm font-black text-amber-300">₹{result.recommendation.amount.toLocaleString()}</span></div>
                                                <div className="bg-black/40 border border-amber-500/20 rounded-xl px-4 py-2"><span className="text-[9px] uppercase tracking-widest text-slate-400 block mb-1">Extended Term</span><span className="text-sm font-black text-amber-300">{result.recommendation.tenure} Months</span></div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* RENDER RECHARTS VISUALIZATIONS — profile-connected */}
                                <Drp20Sections result={result} profile={{ 
                                    ...profile, 
                                    savings: form.override_savings, 
                                    monthly_expenses: form.override_expenses,
                                    goal_type: form.override_goal_type,
                                    goal_amount: form.override_home_goal,
                                    // Make sure monthly_income reflects the slider directly so the DTI Pie Chart updates instantly
                                    monthly_income: form.annual_income / 12,
                                }} />

                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Section10AIChat 
                activeSection="Default Risk Engine" 
                manual={{
                    monthly_income: (form.annual_income / 12) || 0,
                    emi_amount: result ? result.monthly_installment : 0,
                    loan_amount: form.loan_amount || 0,
                    interest_rate: form.interest_rate || 0,
                    loan_tenure: form.loan_term || 0
                }}
            />
        </div>
    );
}

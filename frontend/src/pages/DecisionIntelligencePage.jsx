import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Brain, Zap, Activity, Sparkles, CheckCircle2, UserCheck, ShieldAlert,
    AlertCircle, ChevronRight, ArrowRightLeft, Download, Percent, Clock, Users, Fingerprint
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Line, LabelList 
} from 'recharts';
import axios from 'axios';
import { Section10AIChat } from './fhd/Section10AIChat';
import { Decision15Sections } from './decision/Decision15Sections';
import { MarketOffers } from './decision/MarketOffers';
import { DecisionAlerts } from './decision/DecisionAlerts';

const API_BASE = 'http://127.0.0.1:5001/api';

const PURPOSES = [
    { id: 'debt_consolidation', label: 'Debt Consolidation' },
    { id: 'credit_card', label: 'Credit Card' },
    { id: 'home_improvement', label: 'Home Improvement' },
    { id: 'small_business', label: 'Small Business' },
    { id: 'major_purchase', label: 'Major Purchase' },
    { id: 'medical', label: 'Medical' },
    { id: 'house', label: 'House Loan' },
    { id: 'car', label: 'Car Loan' },
    { id: 'bike', label: 'Bike / Two-Wheeler' },
    { id: 'education', label: 'Education' },
    { id: 'wedding', label: 'Wedding' },
    { id: 'vacation', label: 'Vacation' },
    { id: 'other', label: 'Other' },
];

export default function DecisionIntelligencePage() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Stage 1 Enterprise Upgrades
    const [hasCoApplicant, setHasCoApplicant] = useState(false);
    const [coIncome, setCoIncome] = useState(1200000); // default mocked 12LPA
    const [coEmi, setCoEmi] = useState(15000); 
    const [isFetchingCibil, setIsFetchingCibil] = useState(false);

    const [form, setForm] = useState({
        loan_amount: 500000,
        loan_term: 36,
        interest_rate: 11.5,
        loan_purpose: 'debt_consolidation',
        annual_income: 600000,
        credit_score: 720,
        existing_emi: 0 // New slider for manual override to test Debt Avalanche
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('lw_token');
                if (!token) return;
                const { data } = await axios.get(`${API_BASE}/user/financial-profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (data && data.monthly_income) {
                    setProfile(data);
                    
                    const mInc = data.monthly_income || 50000;
                    const computedAnnIncome = mInc * 12 + (data.annual_bonus || 0);
                    const computedScore = data.cibil_score || 720;
                    
                    setForm(prev => ({
                        ...prev,
                        annual_income: computedAnnIncome,
                        credit_score: computedScore
                    }));
                }
            } catch (err) {
                console.log("Failed to load user financial profile.");
            }
        };
        fetchProfile();
    }, []);

    const handleInput = (e) => {
        const val = e.target.type === 'range' || e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
        setForm(prev => ({ ...prev, [e.target.name]: val }));
    };

    const fetchCibilScore = async () => {
        setIsFetchingCibil(true);
        // Simulate Experian API latency
        await new Promise(r => setTimeout(r, 2000));
        setForm(prev => ({ ...prev, credit_score: profile?.cibil_score || 742 }));
        setIsFetchingCibil(false);
    };

    const runAnalysis = async () => {
        setIsLoading(true);
        setError('');
        
        let dti = 20;
        let e_length = 5;
        let util = 30;
        let acc_count = 5;
        let exact_expenses = (form.annual_income / 12) * 0.5; // Default 50%
        let exact_existing_emi = 0;

        if (profile) {
            e_length = profile.work_experience_years || 5;
            util = profile.credit_utilization || 30;
            acc_count = profile.credit_cards_count || 3;

            const mExp = (profile.monthly_expenses || 0) + (profile.rent || 0) + (profile.insurance_premium || 0);
            const totalEmis = (profile.emis || []).reduce((s, emi) => s + (Number(emi.amount) || 0), 0);
            
            exact_expenses = mExp;
            exact_existing_emi = totalEmis;

            const mInc = profile.monthly_income || (form.annual_income / 12);
            if (mInc > 0) {
                // Incorporate co-applicant combined household DTI if toggled
                const finalHouseholdInc = mInc + (hasCoApplicant ? coIncome/12 : 0);
                const finalHouseholdEmi = mExp + totalEmis + (hasCoApplicant ? coEmi : 0);
                dti = (finalHouseholdEmi / finalHouseholdInc) * 100;
            }
        } else if (hasCoApplicant) {
            dti = ((exact_expenses + coEmi) / ((form.annual_income/12) + (coIncome/12))) * 100;
        }

        const payload = {
            loan_amount: form.loan_amount,
            interest_rate: form.interest_rate,
            loan_term: form.loan_term,
            loan_purpose: form.loan_purpose,
            annual_income: form.annual_income + (hasCoApplicant ? coIncome : 0),
            credit_score: form.credit_score,
            debt_to_income: dti,
            emp_length: e_length,
            revol_util: util,
            open_accounts: acc_count,
            home_ownership: 'RENT',
            existing_emi: form.existing_emi > 0 ? form.existing_emi : (exact_existing_emi + (hasCoApplicant ? coEmi : 0)), // Priority to manual slider if used
            living_expenses: exact_expenses
        };

        try {
            const token = localStorage.getItem('lw_token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const { data } = await axios.post(`${API_BASE}/loan-decision-analysis`, payload, { headers });
            setAnalysis(data);
        } catch (err) {
            setError(err.response?.data?.error || 'Analysis engine failed to initialize.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(runAnalysis, 1500);
        return () => clearTimeout(timeout);
    }, [form.loan_amount, form.loan_term, form.interest_rate, form.annual_income, form.credit_score, form.existing_emi, profile]);

    const generateCurveData = () => {
        if (!analysis || !analysis.affordability) return [];
        const monthlyInc = analysis.affordability.monthly_income || (form.annual_income / 12);
        const currentEMI = analysis.affordability.emi;
        
        const data = [];
        for (let i = 0; i <= 10; i++) {
            const emi = (currentEMI * 2 * i) / 10;
            const ratio = (emi / monthlyInc) * 100;
            data.push({
                emi: Math.round(emi),
                ratio: Math.round(ratio)
            });
        }
        return data;
    };

    return (
        <div className="pt-28 pb-20 min-h-screen relative overflow-hidden selection:bg-cyan-500/30 font-sans">
            <div className="fixed top-0 left-0 w-[800px] h-[800px] bg-cyan-500/5 blur-[150px] rounded-full -z-10 opacity-60" />
            <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 blur-[150px] rounded-full -z-10 opacity-60" />

            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
                
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-16 gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-4">
                             <Activity className="w-3 h-3" /> Core Decision Protocol
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight leading-none uppercase italic">
                            Should You Take <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">This Loan?</span>
                        </h1>
                        <p className="text-slate-400 max-w-2xl text-sm font-bold uppercase tracking-widest leading-relaxed">
                            Focused artificial intelligence that analyzes your profile to deliver an unambiguous Yes or No decision.
                        </p>
                    </div>
                    {analysis && (
                        <button onClick={() => window.print()} className="shrink-0 flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-white tracking-widest uppercase transition-all shadow-xl hover:-translate-y-1 print:hidden">
                            <Download className="w-4 h-4 text-cyan-400" /> Export PDF Report
                        </button>
                    )}
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    
                    {/* 🔧 Modeler Sidebar */}
                    <div className="w-full lg:w-[400px] shrink-0">
                        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
                        <div className="glass-panel p-8 rounded-[32px] border border-white/5 relative overflow-hidden shadow-2xl">
                            
                            {profile ? (
                                <div className="mb-6 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <UserCheck className="w-4 h-4 text-emerald-400" />
                                        <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Financial Profile Synced</span>
                                    </div>
                                    <p className="text-[10px] text-emerald-400/80 font-bold leading-relaxed">
                                        We pre-filled your income and credit, but you can manually adjust them below for "what-if" simulations.
                                    </p>
                                </div>
                            ) : (
                                <div className="mb-6 px-4 py-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex flex-col gap-3">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <ShieldAlert className="w-4 h-4 text-cyan-400" />
                                            <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">Manual Simulation Mode</span>
                                        </div>
                                        <p className="text-[10px] text-cyan-400/80 font-bold leading-relaxed">
                                            You are running manual simulations. To get structurally precise decisions, connect your Financial Profile in the Dashboard.
                                        </p>
                                    </div>
                                    <button onClick={() => navigate('/dashboard')} className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                                        <UserCheck className="w-3 h-3" /> Connect Profile
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-sm font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-cyan-400" /> Prospective Loan
                                </h3>
                                <div className="flex gap-1">
                                    <div className="w-1 h-1 bg-cyan-500 rounded-full animate-ping" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Live Sync</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-[11px] font-bold uppercase mb-3">
                                        <span className="text-slate-500">Desired Capital Amount</span>
                                        <span className="text-cyan-400 font-mono text-base">₹{form.loan_amount.toLocaleString()}</span>
                                    </div>
                                    <input type="range" name="loan_amount" min="10000" max="2500000" step="10000"
                                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                        value={form.loan_amount} onChange={handleInput} />
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mb-4 border-b border-white/5 pb-2">
                                            <span className="text-slate-500 flex items-center gap-1"><Percent className="w-3 h-3"/> Offered Rate</span>
                                            <span className="text-cyan-400 text-sm bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">{form.interest_rate}%</span>
                                        </div>
                                        <input type="range" name="interest_rate" min="7" max="24" step="0.25"
                                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-all mb-4"
                                            value={form.interest_rate} onChange={handleInput} />
                                    </div>
                                    
                                    <div>
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mb-4 border-b border-white/5 pb-2">
                                            <span className="text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3"/> Tenure</span>
                                            <span className="text-cyan-400 text-sm bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">{form.loan_term} Months</span>
                                        </div>
                                        <input type="range" name="loan_term" min="12" max="180" step="12"
                                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-all mb-4"
                                            value={form.loan_term} onChange={handleInput} />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Loan Category / Purpose</label>
                                    <select name="loan_purpose" className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white uppercase font-bold outline-none focus:border-cyan-500/50 transition-all"
                                        value={form.loan_purpose} onChange={handleInput}>
                                        {PURPOSES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                                    </select>
                                </div>

                                <div className="pt-4 border-t border-white/5">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Profile Overrides</h4>
                                    
                                    <div className="mb-6">
                                        <div className="flex justify-between text-[11px] font-bold uppercase mb-3">
                                            <span className="text-slate-500">Annual Income</span>
                                            <span className="text-emerald-400 font-mono text-sm">₹{form.annual_income.toLocaleString()}</span>
                                        </div>
                                        <input type="range" name="annual_income" min="100000" max="5000000" step="50000"
                                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                            value={form.annual_income} onChange={handleInput} />
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex justify-between text-[11px] font-bold uppercase mb-3 items-center">
                                            <span className="text-slate-500 flex items-center gap-2">Credit Score <button onClick={fetchCibilScore} className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded flex items-center gap-1 transition-all"><Fingerprint className="w-3 h-3" /> Fetch Live</button></span>
                                            <span className="text-purple-400 font-mono text-sm">{isFetchingCibil ? '...' : form.credit_score}</span>
                                        </div>
                                        <input type="range" name="credit_score" min="300" max="850" step="1"
                                            className={`w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 ${isFetchingCibil ? 'opacity-50 pointer-events-none' : ''}`}
                                            value={form.credit_score} onChange={handleInput} disabled={isFetchingCibil} />
                                    </div>
                                    
                                    <div className="mb-6">
                                        <div className="flex justify-between text-[11px] font-bold uppercase mb-3 items-center">
                                            <span className="text-slate-500">Active Monthly EMIs</span>
                                            <span className="text-rose-400 font-mono text-sm">₹{form.existing_emi.toLocaleString()}</span>
                                        </div>
                                        <input type="range" name="existing_emi" min="0" max="150000" step="5000"
                                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                                            value={form.existing_emi} onChange={handleInput} />
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t border-white/5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Users className="w-3 h-3" /> Add Co-Applicant</h4>
                                        <div onClick={() => setHasCoApplicant(!hasCoApplicant)} className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-colors ${hasCoApplicant ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                                            <motion.div layout className="w-3 h-3 bg-white rounded-full shadow" style={{ float: hasCoApplicant ? 'right' : 'left' }} />
                                        </div>
                                    </div>
                                    
                                    <AnimatePresence>
                                        {hasCoApplicant && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} overflow="hidden" className="space-y-4">
                                                <div>
                                                    <label className="text-[9px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Co-Applicant Annual Income</label>
                                                    <input type="number" value={coIncome} onChange={(e) => setCoIncome(Number(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-sm text-emerald-400 font-bold outline-none focus:border-cyan-500/50" />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Co-Applicant Active EMIs</label>
                                                    <input type="number" value={coEmi} onChange={(e) => setCoEmi(Number(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-sm text-rose-400 font-bold outline-none focus:border-cyan-500/50" />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                
                                <button onClick={runAnalysis} disabled={isLoading}
                                    className="w-full h-14 rounded-2xl bg-cyan-600/10 border-cyan-500/20 text-cyan-400 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-cyan-600/20 transition-all border group relative overflow-hidden mt-4">
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    {isLoading ? <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" /> : <><Sparkles className="w-4 h-4" /> Recalculate Verdict</>}
                                </button>
                            </div>
                        </div>
                        </div>
                    </div>

                    {/* 📊 Main Verdict & Graph Section */}
                    <div className="flex-1 w-full flex flex-col items-center justify-start max-w-full overflow-hidden">
                        {analysis ? (
                            <AnimatePresence mode='wait'>
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                     className="w-full relative space-y-8">
                                    
                                    {/* Verdict Card */}
                                    <div className={`glass-panel p-10 md:p-14 rounded-[40px] border shadow-2xl relative overflow-hidden transition-all duration-700 w-full flex flex-col justify-center ${
                                        analysis.decision.decision === 'Recommend Loan' ? 'border-emerald-500/50 bg-emerald-500/5' : 
                                        analysis.decision.decision === 'Moderate Risk' ? 'border-amber-500/50 bg-amber-500/5' : 
                                        'border-rose-500/50 bg-rose-500/5'
                                    }`}>
                                        <div className={`absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] blur-[150px] rounded-full pointer-events-none opacity-30 ${
                                            analysis.decision.decision === 'Recommend Loan' ? 'bg-emerald-500' : 
                                            analysis.decision.decision === 'Moderate Risk' ? 'bg-amber-500' : 'bg-rose-500'
                                        }`} />
                                        
                                        <div className="flex flex-col xl:flex-row justify-between items-center gap-12 relative z-10 w-full">
                                            <div className="flex-1 text-center xl:text-left w-full">
                                                <div className="flex items-center justify-center xl:justify-start gap-4 mb-8">
                                                    <div className={`p-4 rounded-2xl ${
                                                        analysis.decision.decision === 'Recommend Loan' ? 'bg-emerald-500/20' : 
                                                        analysis.decision.decision === 'Moderate Risk' ? 'bg-amber-500/20' : 'bg-rose-500/20'
                                                    }`}>
                                                        <Brain className={`w-8 h-8 ${
                                                            analysis.decision.decision === 'Recommend Loan' ? 'text-emerald-400' : 
                                                            analysis.decision.decision === 'Moderate Risk' ? 'text-amber-400' : 'text-rose-400'
                                                        }`} />
                                                    </div>
                                                    <span className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Final Recommendation</span>
                                                </div>
                                                
                                                <h2 className={`text-6xl md:text-7xl font-black mb-8 uppercase italic leading-none tracking-tighter ${
                                                    analysis.decision.decision === 'Recommend Loan' ? 'text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 
                                                    analysis.decision.decision === 'Moderate Risk' ? 'text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]' :
                                                    'text-rose-400 drop-shadow-[0_0_20px_rgba(225,29,72,0.3)]'
                                                }`}>
                                                    {analysis.decision.decision === 'Avoid Loan' ? 'Do Not Take' : analysis.decision.decision}
                                                </h2>
                                                
                                                <div className="max-w-xl mx-auto xl:mx-0 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8">
                                                    <p className="text-white font-medium text-xl leading-relaxed">
                                                        {analysis.decision.reason}
                                                    </p>
                                                    <div className="w-full h-px bg-white/10 my-6" />
                                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                                        <div>
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">New EMI Addition</p>
                                                            <p className="text-3xl font-black text-white">₹{analysis.decision.emi.toLocaleString()}</p>
                                                        </div>
                                                        <div className="px-5 py-3 rounded-xl bg-white/5 border border-white/10">
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Affordability Status</p>
                                                            <p className={`text-xl font-black ${
                                                                analysis.affordability.status === 'Safe' ? 'text-emerald-400' : 
                                                                analysis.affordability.status === 'Moderate' ? 'text-amber-400' : 'text-rose-400'
                                                            }`}>{analysis.affordability.status}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center justify-center p-10 bg-black/60 rounded-[40px] border border-white/10 backdrop-blur-3xl shadow-2xl group transition-transform hover:scale-105 shrink-0 w-full sm:w-auto">
                                                <div className="relative w-44 h-44 mb-8 flex items-center justify-center">
                                                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                                                        <circle cx="88" cy="88" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
                                                        <motion.circle cx="88" cy="88" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="502"
                                                            initial={{ strokeDashoffset: 502 }} animate={{ strokeDashoffset: 502 - (502 * ((100 - analysis.decision.risk_probability) / 100)) }} 
                                                            className={analysis.decision.decision === 'Recommend Loan' ? 'text-emerald-400' : analysis.decision.decision === 'Moderate Risk' ? 'text-amber-400' : 'text-rose-400'} strokeLinecap="round" />
                                                    </svg>
                                                    <div className="text-center">
                                                        <p className="text-5xl font-black text-white">{(100 - analysis.decision.risk_probability).toFixed(0)}<span className="text-2xl text-slate-500">%</span></p>
                                                        <p className="text-[10px] font-black justify-center text-slate-500 uppercase tracking-widest mt-2">Safety Score</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 items-center bg-white/5 px-4 py-2 rounded-full border border-white/5">
                                                    <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">XGBoost Validated</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Responsive Affordability Curve */}
                                    <div className="glass-panel p-8 md:p-10 rounded-[40px] border border-white/5 relative overflow-hidden group shadow-xl w-full">
                                        <div className="flex justify-between items-center mb-10 w-full">
                                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3 italic">
                                                <Activity className="w-5 h-5 text-emerald-400" /> Burden Mapping (EMI vs Income)
                                            </h3>
                                        </div>
                                        
                                        <div className="h-[280px] w-full relative">
                                            <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-end pointer-events-none opacity-10">
                                                <div className="h-[35%] w-full bg-rose-500 border-t border-rose-500/50" />
                                                <div className="h-[20%] w-full bg-amber-500 border-t border-amber-500/50" />
                                                <div className="h-[45%] w-full bg-emerald-500" />
                                            </div>

                                            <div className="w-full h-full overflow-hidden">
                                                 <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={generateCurveData()} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                                        <defs>
                                                            <linearGradient id="curveColor" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                                                                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                                                            </linearGradient>
                                                        </defs>
                                                        <XAxis dataKey="emi" hide />
                                                        <YAxis hide domain={[0, 100]} />
                                                        <Tooltip 
                                                            cursor={{ stroke: '#22d3ee', strokeWidth: 1 }}
                                                            content={({ active, payload }) => {
                                                                if (active && payload?.[0]) {
                                                                    const val = payload[0].value;
                                                                    const status = val > 35 ? 'Dangerous' : val > 20 ? 'Moderate' : 'Safe';
                                                                    const color = val > 35 ? '#ef4444' : val > 20 ? '#f59e0b' : '#10b981';
                                                                    return (
                                                                        <div className="bg-slate-900/90 border border-white/10 p-4 rounded-2xl backdrop-blur-xl shadow-2xl">
                                                                            <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Simulated Burden</p>
                                                                            <div className="flex items-center gap-4">
                                                                                <div>
                                                                                    <p className="text-xl font-black text-white">₹{payload[0].payload.emi.toLocaleString()}</p>
                                                                                    <p className="text-[9px] font-bold text-slate-400">Monthly EMI</p>
                                                                                </div>
                                                                                <div className="w-px h-8 bg-white/10" />
                                                                                <div>
                                                                                    <p className="text-xl font-black" style={{ color }}>{Math.round(val)}%</p>
                                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{status}</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            }}
                                                        />
                                                        <Area type="monotone" dataKey="ratio" stroke="#22d3ee" strokeWidth={3} fill="url(#curveColor)" animationDuration={1500} />
                                                        <ReferenceLine x={analysis.affordability.emi} stroke="#fff" strokeWidth={2} strokeDasharray="5 5" />
                                                        <Line dataKey="ratio" stroke="none">
                                                            <LabelList dataKey="ratio" content={(props) => {
                                                                const { x, y, index, data } = props;
                                                                if (data && data[index] && analysis?.affordability) {
                                                                    if (data[index].emi === analysis.affordability.emi) {
                                                                        return <circle cx={x} cy={y} r={6} fill="#fff" className="animate-pulse shadow-lg" />
                                                                    }
                                                                }
                                                                return null;
                                                            }} />
                                                        </Line>
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                            
                                            <div className="absolute right-0 top-0 text-[10px] font-black text-slate-600 uppercase flex flex-col items-end gap-1">
                                                <span className="text-rose-500/80 tracking-widest flex items-center gap-1">Dangerous <AlertCircle className="w-3 h-3" /></span>
                                                <span className="text-amber-500/80 tracking-widest">Moderate</span>
                                                <span className="text-emerald-500/80 tracking-widest">Safe</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        ) : (
                            <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center text-center glass-panel rounded-[40px] border border-white/5 relative overflow-hidden group p-12">
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
                                <div className="relative z-10 max-w-md mx-auto">
                                    <div className="w-28 h-28 bg-slate-900 rounded-[40px] mx-auto mb-10 flex items-center justify-center border border-white/10 shadow-[0_0_50px_rgba(34,211,238,0.15)] group-hover:rotate-12 transition-transform duration-700">
                                        <Brain className="w-12 h-12 text-cyan-500" />
                                    </div>
                                    <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-6 leading-none">Decision <br/> <span className="text-cyan-500">Engine</span></h3>
                                    <p className="text-slate-500 text-base font-medium leading-relaxed mb-10">
                                        Configure your prospective loan parameters. We cross-reference this directly with your stored financial profile to issue an uncompromised Go/No-Go verdict.
                                    </p>
                                    <div className="flex justify-center gap-3">
                                        {[0, 0.2, 0.4].map((delay, i) => (
                                            <motion.div key={i} animate={{ y: [0, -10, 0] }} transition={{ duration: 1, repeat: Infinity, delay }} 
                                                className="w-2.5 h-2.5 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-full" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Decision Alert Banners: Macro Rate, Debt Avalanche, Splurge Predictor */}
                {analysis && <DecisionAlerts analysis={analysis} interestRate={form.interest_rate} />}
                
                {/* Embedded 15 Predictive Model Sections */}
                {analysis && <Decision15Sections analysis={analysis} />}
                
                {/* Embedded Market Offers Scraper — always show if offers exist */}
                {analysis && analysis.recommended_loans && analysis.recommended_loans.length > 0 && (
                    <MarketOffers 
                        initialOffers={analysis.recommended_loans} 
                        decisionType={analysis.decision?.decision || 'Moderate Risk'} 
                        creditScore={form.credit_score} 
                    />
                )}
            </div>

            <Section10AIChat 
                activeSection="Decision Intelligence" 
                manual={{
                    monthly_income: profile ? (profile.monthly_income || (form.annual_income/12)) : (form.annual_income/12),
                    emi_amount: analysis?.decision?.emi || 0,
                    loan_amount: form.loan_amount || 0,
                    interest_rate: form.interest_rate || 0,
                    loan_tenure: form.loan_term || 0
                }}
            />
        </div>
    );
}

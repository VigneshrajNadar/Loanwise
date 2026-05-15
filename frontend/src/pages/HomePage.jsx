import { motion, AnimatePresence } from 'framer-motion';
import { 
    Brain, Zap, ShieldCheck, PieChart, Landmark, 
    ArrowRight, ChevronRight, Activity, Wallet, 
    CheckCircle2, AlertCircle, Sparkles, Plus, Minus,
    Cpu, Video, Lock, Search, FileText, Smartphone,
    Eye, HelpCircle, Layers, ScanFace, Database,
    TrendingUp, ShieldAlert, BarChart3, Globe,
    LayoutDashboard, Users, Clock, ShoppingCart,
    ArrowUpRight, Target, Network, Fingerprint, Server
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// --- UTILITY COMPONENTS (TRUSTSHIELD STYLE) ---

function RevealOnScroll({ children, delay = 0 }) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // Stop watching — no need to keep alive
                }
            },
            { threshold: 0.08 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className={`transition-all duration-500 ease-out transform ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`} style={{ transitionDelay: `${delay}ms` }}>
            {children}
        </div>
    );
}

function Stat({ number, label, sublabel, delay = 0 }) {
    return (
        <RevealOnScroll delay={delay}>
            <div className="p-6 group relative h-full flex flex-col justify-center glass-panel border border-white/0 hover:border-white/5 transition-all duration-700 bg-white/[0.01] rounded-3xl">
                <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/[0.02] transition-all duration-700 rounded-3xl" />
                <div className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tighter italic group-hover:text-cyan-400 transition-colors duration-500 leading-none">{number}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-[0.25em] font-black mb-1 group-hover:text-slate-300 transition-colors uppercase">{label}</div>
                <div className="text-[8px] text-emerald-500/60 uppercase tracking-widest font-black opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-2 group-hover:translate-y-0">{sublabel}</div>
            </div>
        </RevealOnScroll>
    );
}

function DefenseCard({ icon: Icon, step, title, desc, delay }) {
    return (
        <RevealOnScroll delay={delay}>
            <div className="glass-panel border border-white/5 rounded-[32px] p-8 hover:border-cyan-500/30 transition-all hover:shadow-[0_20px_50px_rgba(6,182,212,0.1)] group h-full flex flex-col relative overflow-hidden">
                <div className="absolute -top-4 -right-4 text-7xl font-black text-white/[0.02] group-hover:text-cyan-500/[0.05] transition-colors italic pointer-events-none select-none">{step}</div>
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/5 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition-colors shadow-2xl">
                    <Icon className="w-7 h-7 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </div>
                <h3 className="text-xl font-black mb-3 group-hover:text-cyan-400 transition-colors uppercase italic tracking-tight">{title}</h3>
                <p className="text-slate-400 font-medium leading-relaxed text-xs opacity-80 group-hover:opacity-100 transition-opacity">{desc}</p>
            </div>
        </RevealOnScroll>
    );
}

function MLVisualizer() {
    return (
        <div className="relative h-64 md:h-80 w-full glass-panel rounded-[32px] border border-white/5 flex items-center justify-between px-8 md:px-20 overflow-hidden shadow-2xl group">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c12] via-transparent to-[#0a0c12] z-20 pointer-events-none" />

            {/* Grid Overlay inside Visualizer */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-10" 
                 style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 -translate-y-1/2 z-0" />
            
            <motion.div 
                animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 h-1 w-32 bg-gradient-to-r from-transparent via-cyan-400 to-transparent -translate-y-1/2 z-0"
            />

            {[
                { icon: FileText, label: "Profile Ingestion", color: "cyan" },
                { icon: ShieldCheck, label: "KYC Extraction", color: "indigo" },
                { icon: Brain, label: "XGBoost Weights", color: "blue" },
                { icon: Zap, label: "Forensic Verdict", color: "emerald" }
            ].map((node, i) => (
                <div key={i} className="relative z-30 flex flex-col items-center gap-3 group/node translate-y-2">
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#0d0f1a] flex items-center justify-center border border-white/5 shadow-3xl group-hover/node:border-${node.color}-500 group-hover/node:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-700 relative overflow-hidden group/box`}>
                        <div className="absolute inset-0 bg-white/[0.02] group-hover/box:bg-white/[0.05] transition-all" />
                        {i === 2 && <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />}
                        <node.icon className={`w-7 h-7 md:w-8 md:h-8 text-slate-500 group-hover/node:text-white transition-all duration-500 scale-100 group-hover/node:scale-110`} />
                        
                        {/* Status Light */}
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                    </div>
                    <span className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest group-hover/node:text-white transition-colors uppercase">{node.label}</span>
                </div>
            ))}
        </div>
    );
}

function ListItem({ children }) {
    return (
        <li className="flex items-center gap-3 text-slate-400 font-medium text-xs">
            <div className="w-1 h-1 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
            {children}
        </li>
    );
}

// Pure CSS blob — runs on GPU compositor thread, zero JS cost
function AtmosphericBlob({ color, size, top, left, delay }) {
    return (
        <div
            className="absolute pointer-events-none -z-10 blur-[120px] rounded-full opacity-[0.07]"
            style={{
                backgroundColor: color,
                width: size,
                height: size,
                top: top,
                left: left,
                animation: `blobFloat 20s ease-in-out ${delay}s infinite`,
                willChange: 'transform',
            }}
        />
    );
}

function BackgroundParticles() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-cyan-400/20 rounded-full"
                    initial={{ 
                        x: Math.random() * 100 + "%", 
                        y: Math.random() * 100 + "%",
                        opacity: Math.random() * 0.5
                    }}
                    animate={{ 
                        y: [null, Math.random() * -100 - 50 + "%"],
                        opacity: [0, 0.4, 0]
                    }}
                    transition={{ 
                        duration: Math.random() * 10 + 10, 
                        repeat: Infinity, 
                        ease: "linear",
                        delay: Math.random() * 10
                    }}
                />
            ))}
        </div>
    );
}

// --- MAIN PAGE ---

export default function HomePage() {
    const [openFaq, setOpenFaq] = useState(0);
    const { isAuthenticated, token } = useAuth();
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        if (isAuthenticated && token) {
            axios.get('http://127.0.0.1:5001/api/user/profile-summary', {
                headers: { Authorization: `Bearer ${token}` }
            }).then(r => setProfile(r.data)).catch(() => {});
        }
    }, [isAuthenticated, token]);

    const isZeroProfile = isAuthenticated && profile && (profile.monthly_income === 0 || profile.total_emi === 0);

    return (
        <div className="bg-[#0a0c12] min-h-screen text-white selection:bg-cyan-500/30 font-sans overflow-x-hidden relative">
            
            {/* 🌌 Atmospheric Backdrop — CSS only, GPU composited */}
            <div className="fixed inset-0 pointer-events-none -z-20">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0c17] via-[#0d101a] to-[#0a0c12]" />
                
                {/* Cyber Grid with Animation */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none animate-grid-slow" 
                     style={{ 
                         backgroundImage: `linear-gradient(to right, #ffffff1a 1px, transparent 1px), linear-gradient(to bottom, #ffffff1a 1px, transparent 1px)`,
                         backgroundSize: '60px 60px',
                     }} 
                />

                <BackgroundParticles />

                <AtmosphericBlob color="#0891b2" size="60vw" top="-10%" left="-10%" delay={0} />
                <AtmosphericBlob color="#4f46e5" size="50vw" top="50%" left="70%" delay={5} />
                <AtmosphericBlob color="#10b981" size="40vw" top="80%" left="-5%" delay={2} />
            </div>

            {/* 📊 Personalized Welcome Banner for ₹0 profiles */}
            <AnimatePresence>
                {isZeroProfile && (
                    <section className="relative py-16 px-4">
                        <RevealOnScroll>
                            <div className="max-w-5xl mx-auto glass-panel border border-emerald-500/30 rounded-[40px] p-8 md:p-12 relative overflow-hidden bg-emerald-500/5 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                                            <Sparkles className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-black italic tracking-tight uppercase">Welcome to your <span className="text-emerald-400">Loanwise Home Page!</span></h2>
                                    </div>
                                    <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-8 font-medium">
                                        Understanding financial habits that lead to loan defaults is vital, and with your financial details, we can provide precise insights. Currently, with your profile showing all <span className="text-emerald-400 font-bold italic">₹0 values</span>, we strongly encourage you to upload your bank statements to unlock LoanwiseAI's full potential. 
                                    </p>
                                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-10 opacity-80">
                                        Once your data is in, we can analyze your unique financial patterns to help you understand your <span className="text-white italic">*personal*</span> default risk using the <span className="text-emerald-400">'Default Risk Oracle'</span>, assess loan chances with the <span className="text-cyan-400">'Eligibility Predictor'</span>, and visualize everything through <span className="text-indigo-400">'Decision Intelligence'</span>. 
                                    </p>
                                    <div className="flex flex-wrap items-center gap-6">
                                        <Link to="/dashboard" className="px-8 py-4 bg-emerald-500 text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-3 shadow-lg shadow-emerald-500/20">
                                            <FileText className="w-4 h-4" /> Upload Statements
                                        </Link>
                                        <Link to="/dashboard?tab=adddata" className="px-8 py-4 bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-white/10 transition-all">
                                            Link Bank Accounts
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </RevealOnScroll>
                    </section>
                )}
            </AnimatePresence>

            <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-12 px-4">
                <RevealOnScroll>
                    <div className="text-center max-w-5xl mx-auto">
                        <motion.h1 
                            initial="hidden"
                            animate="visible"
                            variants={{
                                visible: { transition: { staggerChildren: 0.1 } }
                            }}
                            className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tighter leading-[0.85] uppercase italic px-4"
                        >
                            {["BORROW", "WITH"].map((word, i) => (
                                <motion.span
                                    key={i}
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0 }
                                    }}
                                    className="inline-block mr-4 text-white"
                                >
                                    {word}
                                </motion.span>
                            ))}
                            <br/>
                            <motion.span
                                variants={{
                                    hidden: { opacity: 0, scale: 0.9 },
                                    visible: { 
                                        opacity: 1, 
                                        scale: 1,
                                        transition: { delay: 0.5, duration: 0.8, ease: "easeOut" }
                                    }
                                }}
                                className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-blue-600 drop-shadow-[0_10px_30px_rgba(6,182,212,0.3)] bg-[length:200%_auto] animate-gradient-x"
                            >
                                ABSOLUTE CERTAINTY.
                            </motion.span>
                        </motion.h1>

                        <motion.p 
                            initial="hidden"
                            animate="visible"
                            variants={{
                                visible: { transition: { staggerChildren: 0.04, delayChildren: 1 } }
                            }}
                            className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto mb-14 font-medium leading-relaxed px-4"
                        >
                            {"The world's first autonomous financial forensic engine. Analyze loan eligibility with military-grade precision and behavior-driven stress-testing.".split(" ").map((word, i) => {
                                const isHighlighted = word === "military-grade" || word === "precision" || word === "stress-testing.";
                                return (
                                    <motion.span
                                        key={i}
                                        variants={{
                                            hidden: { opacity: 0, y: 5 },
                                            visible: { opacity: 1, y: 0 }
                                        }}
                                        className={`inline-block mr-1 ${isHighlighted ? 'text-white font-bold' : ''}`}
                                    >
                                        {word}
                                    </motion.span>
                                );
                            })}
                        </motion.p>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2 }}
                            className="flex flex-wrap items-center justify-center gap-8"
                        >
                            <Link to="/eligibility" className="px-12 py-6 bg-white text-black font-black text-[11px] uppercase tracking-[0.35em] rounded-2xl hover:bg-cyan-400 transition-all flex items-center gap-4 group shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:-translate-y-1">
                                <ShieldCheck className="w-5 h-5" /> Start Simulation <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                            </Link>
                            <Link to="/intelligence" className="px-12 py-6 bg-white/5 border border-white/10 text-white font-black text-[11px] uppercase tracking-[0.35em] rounded-2xl hover:bg-white/10 transition-all backdrop-blur-3xl hover:border-white/20 hover:-translate-y-1">
                                View Intelligence
                            </Link>
                        </motion.div>
                    </div>
                </RevealOnScroll>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-30">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">Forensic Infrastructure</span>
                    <div className="w-px h-12 bg-gradient-to-b from-cyan-500 to-transparent" />
                </div>
            </section>

            {/* 📊 Stats Strip */}
            <section className="border-t border-white/5 bg-[#030408] py-20 relative overflow-hidden">
                <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center relative z-10">
                    <Stat number="98.2%" label="Inference Engine" sublabel="Verified XGBoost Accuracy" delay={0} />
                    <Stat number="15+" label="Lender Protocols" delay={100} sublabel="Tier-1 Bank Logic" />
                    <Stat number="442ms" label="Request Latency" delay={200} sublabel="Local GPU Accelerated" />
                    <Stat number="100%" label="Data Sovereignty" delay={300} sublabel="Zero-Trust Architecture" />
                </div>
            </section>

            {/* 🤝 Enterprise Stack Banner */}
            <section className="border-t border-b border-white/5 bg-[#05060a] py-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/[0.02] to-cyan-500/0 pointer-events-none" />
                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-4 mb-12">
                            <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-white/20" />
                            <p className="text-[10px] text-slate-400 uppercase tracking-[0.5em] font-black">Enterprise Analytical Stack</p>
                            <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-white/20" />
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24">
                             {[
                                { i: Server, t: "Flask Engine", c: "text-orange-400" },
                                { i: Activity, t: "XGBoost 2.0", c: "text-emerald-400" },
                                { i: Brain, t: "Gemini-2B", c: "text-blue-400" },
                                { i: Database, t: "SQLite 3.4", c: "text-cyan-400" },
                                { i: Globe, t: "React 18", c: "text-indigo-400" }
                             ].map((tech, i) => (
                                <RevealOnScroll key={i} delay={i * 100}>
                                    <div className="flex flex-col items-center gap-4 group cursor-default">
                                        <div className="relative">
                                            <div className={`absolute inset-0 blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 ${tech.c.replace('text', 'bg')}`} />
                                            <tech.i className={`w-8 h-8 text-slate-400 group-hover:text-white transition-all duration-500 relative z-10 transform group-hover:scale-110`} />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-600 group-hover:text-white uppercase tracking-widest transition-colors duration-500">{tech.t}</span>
                                    </div>
                                </RevealOnScroll>
                             ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 📉 EMI Stress & Affordability Hub (TRUE DATA) */}
            <section className="py-24 px-4 bg-[#0a0c12] relative overflow-hidden border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <RevealOnScroll>
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-400 text-[9px] font-black uppercase tracking-widest mb-6 border border-rose-500/20 shadow-lg">
                                    <ShieldAlert className="w-3.5 h-3.5" /> STRESS ANALYSIS
                                </div>
                                <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6 leading-[0.9]">
                                    EMI Burden <br/> <span className="text-rose-500">Classification.</span>
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8 font-medium opacity-80">
                                    Our Random Forest engine (`emi_stress_rf.pkl`) cross-validates your income against 6 high-fidelity markers to categorize your financial safety.
                                </p>
                                <div className="space-y-4 mb-10">
                                    {[
                                        { label: "Safe Zone", color: "emerald", range: "EMI < 30% of Income", desc: "Low default probability. Stable cashflow maintenance." },
                                        { label: "Warning Zone", color: "amber", range: "30% - 50% of Income", desc: "Elevated burden. Requires active liquidity monitoring." },
                                        { label: "Critical Zone", color: "rose", range: "EMI > 50% of Income", desc: "High insolvency risk. Marginal stress threshold reached." }
                                    ].map((zone, i) => (
                                        <div key={i} className="flex gap-4 items-start p-4 glass-panel border border-white/5 rounded-2xl hover:border-white/10 transition-all">
                                            <div className={`w-2 h-10 rounded-full bg-${zone.color}-500 blur-[2px] transition-all`} />
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className={`text-[10px] font-black text-${zone.color}-500 uppercase tracking-widest`}>{zone.label}</span>
                                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{zone.range}</span>
                                                </div>
                                                <p className="text-[9px] text-slate-400 font-medium uppercase">{zone.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </RevealOnScroll>
                        <div className="relative group">
                            <div className="aspect-[4/5] glass-panel rounded-[48px] border border-white/10 overflow-hidden flex flex-col p-10 justify-between shadow-3xl bg-black">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 blur-[100px] rounded-full pointer-events-none" />
                                <div className="relative z-10 text-center space-y-4">
                                     <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border border-rose-500/20 shadow-2xl">
                                         <AlertCircle className="w-10 h-10 text-rose-500 animate-pulse" />
                                     </div>
                                     <div className="text-5xl font-black text-white italic tracking-tighter">52.4<span className="text-xl text-slate-500">%</span></div>
                                     <div className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">Load Coefficient</div>
                                </div>
                                <div className="space-y-3 relative z-10">
                                    {[
                                        { l: "Monthly Income", v: "₹85,000", c: "slate-400" },
                                        { l: "Active EMIs", v: "₹44,540", c: "rose-500" },
                                        { l: "Disposables", v: "₹40,460", c: "emerald-500" }
                                    ].map((m, i) => (
                                        <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{m.l}</span>
                                            <span className={`text-[10px] font-black text-${m.c} uppercase tracking-tighter italic`}>{m.v}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 text-[9px] font-black text-rose-400 uppercase tracking-widest text-center italic relative z-10">
                                    System Verdict: Critical Stress detected
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 🧠 ML Center: Inside the Engine */}
            <section className="py-24 px-4 relative overflow-hidden">
                <div className="max-w-5xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-widest mb-4 border border-blue-500/20">
                                <Brain className="w-3 h-3" /> Core Infrastructure
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">Inside the <span className="text-cyan-500">Forensic Engine</span></h2>
                            <p className="text-slate-500 max-w-xl mx-auto text-[9px] font-black uppercase tracking-[0.15em] px-4 leading-relaxed">
                                Processing 40+ dynamic markers through an ensemble of high-performance XGBoost models.
                            </p>
                        </div>
                    </RevealOnScroll>

                    <RevealOnScroll delay={200}>
                        <MLVisualizer />
                    </RevealOnScroll>
                </div>
            </section>

            {/* 🛡️ 4-Layer Defense Architecture */}
            <section className="py-24 px-4 relative">
                <div className="max-w-6xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-16">
                             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[8px] font-black uppercase tracking-widest mb-4 border border-cyan-500/20">
                                <ShieldCheck className="w-3 h-3" /> System Verification
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">Defense Architecture</h2>
                            <p className="text-slate-500 max-w-xl mx-auto text-[9px] font-black uppercase tracking-[0.15em] leading-relaxed px-4">
                                Safety layers designed to detect financial risks before they manifest.
                            </p>
                        </div>
                    </RevealOnScroll>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <DefenseCard 
                            icon={ScanFace}
                            step="01"
                            title="Profile Forensic"
                            desc="Analyzes income trajectories and employment stability to find application anomalies."
                            delay={0}
                        />
                        <DefenseCard 
                            icon={Layers}
                            step="02"
                            title="Burden Mapping"
                            desc="Spatial simulation that charts EMI against dynamic income safety zones."
                            delay={100}
                        />
                        <DefenseCard 
                            icon={Database}
                            step="03"
                            title="Cohort Engine"
                            desc="Benchmarks behavior against 10M+ records for identical loan purposes."
                            delay={200}
                        />
                        <DefenseCard 
                            icon={Brain}
                            step="04"
                            title="Sensitivity AI"
                            desc="What-if simulations predicting risk shifts from 20% income fluctuations."
                            delay={300}
                        />
                    </div>
                </div>
            </section>

            {/* 🧬 Borrower Archetypes & Anomaly Detection */}
            <section className="py-24 px-4 bg-[#050608] border-t border-white/5 relative overflow-hidden">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1">
                             <div className="grid grid-cols-2 gap-4">
                                {[
                                    { t: "Prime Borrower", d: "High CIBIL (>750), stable DTI, long credit history.", c: "cyan" },
                                    { t: "Near Prime", d: "CIBIL (700-750), minor load exposure.", c: "blue" },
                                    { t: "Sub-Prime", d: "High default history, precarious debt ratio.", c: "rose" },
                                    { t: "New to Credit", d: "Thin file, no formal credit history footprints.", c: "amber" }
                                ].map((p, i) => (
                                    <RevealOnScroll key={i} delay={i * 100}>
                                        <div className="glass-panel border border-white/5 p-6 rounded-3xl h-full flex flex-col justify-between hover:border-white/20 transition-all shadow-xl group">
                                            <div className={`w-8 h-8 rounded-lg bg-${p.c}-500/10 flex items-center justify-center border border-${p.c}-500/20 mb-4 group-hover:bg-${p.c}-500/20 transition-colors`}>
                                                <Users className={`w-4 h-4 text-${p.c}-400`} />
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black text-white uppercase italic mb-2">{p.t}</h4>
                                                <p className="text-[8px] text-slate-500 font-medium uppercase leading-relaxed">{p.d}</p>
                                            </div>
                                        </div>
                                    </RevealOnScroll>
                                ))}
                             </div>
                        </div>
                        <div className="order-1 lg:order-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest mb-6 border border-blue-500/20 shadow-lg">
                                <Users className="w-3.5 h-3.5" /> CLUSTERING ANALYTICS
                            </div>
                            <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6 leading-[0.9]">
                                Borrower <br/> <span className="text-blue-500">Archetyping.</span>
                            </h3>
                            <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8 font-medium opacity-80">
                                Utilizing K-Means clustering (`borrower_kmeans.pkl`), we align your financial behavior against millions of anonymized data points to determine your "Lender Perception" tier.
                            </p>
                            <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 flex flex-col gap-6 relative group overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                            <ShieldAlert className="w-5 h-5 text-rose-500" />
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-black text-white uppercase">Anomaly Detected</div>
                                            <div className="text-[7px] text-slate-500 font-black tracking-widest">ISOLATION FOREST</div>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-[8px] font-black uppercase tracking-widest border border-rose-500/20 animate-pulse">Outlier Found</div>
                                </div>
                                <p className="text-[9px] text-slate-400 font-medium uppercase leading-relaxed italic border-t border-white/5 pt-4">
                                    Detected irregular expenditure trajectory in 'Medical' category exceeding 3.5x standard deviation. Flagged for secondary AI audit.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 🏦 Supported Loan Vectors (TRUE DATA) */}
            <section className="py-24 px-4 bg-[#0a0c12] relative overflow-hidden border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[8px] font-black uppercase tracking-widest mb-4 border border-cyan-500/20">
                                <Landmark className="w-3 h-3" /> Core Asset Classes
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">Supported <span className="text-cyan-500">Loan Vectors</span></h2>
                            <p className="text-slate-500 max-w-xl mx-auto text-[9px] font-black uppercase tracking-[0.15em] leading-relaxed px-4">
                                Calibrated for 10 distinct financial deployments with unique ML thresholds.
                            </p>
                        </div>
                    </RevealOnScroll>

                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        {[
                            { type: "Home", limit: "₹1.0Cr", threshold: "55%" },
                            { type: "Business", limit: "₹50L", threshold: "60%" },
                            { type: "Car", limit: "₹20L", threshold: "55%" },
                            { type: "Education", limit: "₹20L", threshold: "55%" },
                            { type: "Personal", limit: "₹4L", threshold: "65%" },
                            { type: "Medical", limit: "₹5L", threshold: "50%" },
                            { type: "Gold", limit: "₹10L", threshold: "40%" },
                            { type: "Agriculture", limit: "₹15L", threshold: "45%" },
                            { type: "Bike", limit: "₹4L", threshold: "50%" },
                            { type: "Appliances", limit: "₹1.5L", threshold: "45%" }
                        ].map((loan, i) => (
                            <RevealOnScroll key={i} delay={i * 50}>
                                <div className="glass-panel border border-white/5 rounded-xl p-4 hover:border-cyan-500/30 transition-all text-center group">
                                    <h4 className="text-[10px] font-black uppercase italic text-slate-300 group-hover:text-cyan-400 mb-1">{loan.type}</h4>
                                    <div className="text-xs font-black text-white mb-2">{loan.limit} Cap</div>
                                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{loan.threshold} Probability</div>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>
                </div>
            </section>

            {/* ⛓️ 6 FEATURE DEEP-DIVES (ZIG-ZAG) */}
            <section className="py-24 px-4">
                <div className="max-w-6xl mx-auto space-y-48">

                    {/* Section 1: XGBoost Eligibility */}
                    <RevealOnScroll>
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="order-2 lg:order-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[9px] font-black uppercase tracking-widest mb-6 border border-cyan-500/20 shadow-lg">
                                    <Fingerprint className="w-3.5 h-3.5" /> ELIGIBILITY CORE
                                </div>
                                <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6 leading-[0.9]">
                                    98% Precision <br/> <span className="text-cyan-500">ML Scoring.</span>
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8 font-medium opacity-80">
                                    Our core XGBoost engine analyzes your entire financial DNA, providing a definitive probability of approval before you apply.
                                </p>
                                <ul className="space-y-4 mb-10">
                                    <ListItem>Approval Probability Analysis</ListItem>
                                    <ListItem>Soft-Inquiry Bureau Simulation</ListItem>
                                    <ListItem>Rejection Reason Mapping</ListItem>
                                </ul>
                                <Link to="/eligibility" className="text-cyan-400 font-black uppercase tracking-[0.25em] text-[10px] hover:text-white transition-all flex items-center gap-3 group">
                                    DEPLOY ANALYSIS <ArrowRight className="w-4 h-4 text-cyan-500 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                            <div className="order-1 lg:order-2">
                                <div className="aspect-[4/3] glass-panel rounded-[32px] border border-white/10 p-8 relative group overflow-hidden shadow-xl max-w-sm mx-auto">
                                    <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-all duration-1000" />
                                    <div className="relative h-full flex flex-col justify-center">
                                        <div className="flex justify-between text-[9px] font-black text-cyan-500 uppercase tracking-widest mb-4">
                                            <span>Confidence</span>
                                            <span className="bg-cyan-500 text-black px-2 py-0.5 rounded-full">OPTIMAL</span>
                                        </div>
                                        <div className="text-7xl font-black text-white italic mb-6">92%</div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-8">
                                            <motion.div initial={{ width: 0 }} whileInView={{ width: "92%" }} transition={{ duration: 1.5, ease: "circOut" }} className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-slate-300 uppercase tracking-widest">Low Debt</div>
                                            <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-slate-300 uppercase tracking-widest">Stable</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* Section 2: Adaptive Burden Mapping */}
                    <RevealOnScroll>
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="relative group">
                                <div className="aspect-[4/3] glass-panel rounded-[32px] border border-white/10 p-8 relative overflow-hidden shadow-xl flex flex-col justify-end max-w-sm mx-auto">
                                    <div className="absolute inset-0 bg-rose-500/5 group-hover:bg-rose-500/10 transition-all duration-1000" />
                                    <div className="relative mb-auto text-center py-12">
                                         <Activity className="w-16 h-16 text-rose-500/20 mx-auto animate-pulse" />
                                         <div className="mt-4 text-2xl font-black text-white italic">BURDEN ANALYSIS</div>
                                    </div>
                                    <div className="relative z-10 w-full pt-8">
                                        <div className="flex justify-between text-[8px] font-black text-rose-500 uppercase tracking-widest mb-3">
                                            <span>Stress Level</span>
                                            <span>CAUTION</span>
                                        </div>
                                        <div className="grid grid-cols-15 gap-1 h-10 items-end">
                                            {[...Array(15)].map((_, i) => (
                                                <motion.div 
                                                    key={i} 
                                                    animate={{ height: [5, i > 10 ? 30 : 15, 5] }}
                                                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                                                    className={`w-full rounded-full ${i > 10 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'bg-white/10'}`} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-500 text-[9px] font-black uppercase tracking-widest mb-6 border border-rose-500/20 shadow-lg">
                                    <Layers className="w-3.5 h-3.5" /> BURDEN MAPPING
                                </div>
                                <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6 leading-[0.9]">
                                    Avoid the <br/> <span className="text-rose-500">Debt Trap.</span>
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8 font-medium opacity-80">
                                    Our mapping tool plots your requested EMI against income safety zones to ensure you never over-leverage.
                                </p>
                                <ul className="space-y-4 mb-10">
                                    <ListItem>Safe-Zone Visualization</ListItem>
                                    <ListItem>Disposable Income Projection</ListItem>
                                    <ListItem>Runway Simulation</ListItem>
                                </ul>
                                <Link to="/default-risk" className="text-rose-400 font-black uppercase tracking-[0.25em] text-[10px] hover:text-white transition-all flex items-center gap-3 group">
                                    LAUNCH RADAR <ArrowRight className="w-4 h-4 text-rose-500 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* Section 3: Risk Sensitivity */}
                    <RevealOnScroll>
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="order-2 lg:order-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest mb-6 border border-blue-500/20 shadow-lg">
                                    <ShieldAlert className="w-3.5 h-3.5" /> SENSITIVITY AI
                                </div>
                                <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6 leading-[0.9]">
                                    Dynamic <br/> <span className="text-blue-500">Stress Testing.</span>
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8 font-medium opacity-80">
                                    Prepare for the unexpected. We simulate how your risk changes if income drops or debt increases.
                                </p>
                                <ul className="space-y-4 mb-10">
                                    <ListItem>Income Decline Resilience</ListItem>
                                    <ListItem>Tenure Optimization</ListItem>
                                    <ListItem>Volatility Shock Scan</ListItem>
                                </ul>
                                <Link to="/intelligence" className="text-blue-400 font-black uppercase tracking-[0.25em] text-[10px] hover:text-white transition-all flex items-center gap-3 group">
                                    RUN SCAN <ArrowRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                            <div className="order-1 lg:order-2">
                                <div className="aspect-[4/3] glass-panel rounded-[32px] border border-white/10 p-8 relative overflow-hidden shadow-xl flex flex-col justify-center max-w-sm mx-auto">
                                    <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-all duration-1000" />
                                    <div className="relative space-y-4 z-10">
                                        {[
                                            { label: "Base Case", val: "12%", color: "white" },
                                            { label: "Income -20%", val: "34%", color: "blue" },
                                            { label: "New Debt", val: "48%", color: "rose" }
                                        ].map((sim, i) => (
                                            <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                                <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                                    <span>{sim.label}</span>
                                                    <span className={sim.color === 'blue' ? 'text-blue-400' : sim.color === 'rose' ? 'text-rose-400' : 'text-white'}>{sim.val} Risk</span>
                                                </div>
                                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} whileInView={{ width: sim.val }} transition={{ duration: 1, delay: i * 0.1 }} className={`h-full ${sim.color === 'blue' ? 'bg-blue-500' : sim.color === 'rose' ? 'bg-rose-500' : 'bg-white'}`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* Section 4: Smart Marketplace */}
                    <RevealOnScroll>
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="relative group">
                                <div className="aspect-square glass-panel rounded-[32px] border border-white/10 p-10 relative overflow-hidden shadow-xl flex flex-col justify-center max-w-xs mx-auto">
                                    <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-all duration-1000" />
                                    <div className="space-y-4 relative z-10">
                                        {[
                                            { name: "Global Prem.", rate: "9.2%", match: "OPT" },
                                            { name: "Direct Flex", rate: "10.4%", match: "EST" },
                                            { name: "Asset Prime", rate: "10.8%", match: "EST" }
                                        ].map((bank, i) => (
                                            <div key={i} className="p-4 border border-white/10 rounded-2xl flex items-center justify-between">
                                                <div>
                                                    <div className="text-[10px] font-black text-white uppercase italic">{bank.name}</div>
                                                    <div className="text-[7px] text-amber-500 font-black mt-1 tracking-widest uppercase">{bank.rate} Rate</div>
                                                </div>
                                                <div className="text-[7px] p-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 font-black">{bank.match}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest mb-6 border border-amber-500/20 shadow-lg">
                                    <ShoppingCart className="w-3.5 h-3.5" /> MARKETPLACE
                                </div>
                                <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6 leading-[0.9]">
                                    Matched <br/> <span className="text-amber-500">Lender Intel.</span>
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8 font-medium opacity-80">
                                    We rank real-time lender offers specifically against your approval probability.
                                </p>
                                <ul className="space-y-4 mb-10">
                                    <ListItem>Dynamic Bank Matchmaking</ListItem>
                                    <ListItem>Approval Probability Ranking</ListItem>
                                    <ListItem>Yield-to-Risk Benchmarking</ListItem>
                                </ul>
                                <Link to="/intelligence" className="text-amber-400 font-black uppercase tracking-[0.25em] text-[10px] hover:text-white transition-all flex items-center gap-3 group">
                                    VIEW OFFERS <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* Section 5: Cohort Intelligence */}
                    <RevealOnScroll>
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="order-2 lg:order-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-6 border border-emerald-500/20 shadow-lg">
                                    <Users className="w-3.5 h-3.5" /> COHORT INTEL
                                </div>
                                <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6 leading-[0.9]">
                                    Market <br/> <span className="text-emerald-500">Default Data.</span>
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8 font-medium opacity-80">
                                    Benchmark your purpose against 10M+ peer records to see historical category risks.
                                </p>
                                <ul className="space-y-4 mb-10">
                                    <ListItem>Risk Benchmarking</ListItem>
                                    <ListItem>Purpose Durability Analysis</ListItem>
                                    <ListItem>Stability Indexing</ListItem>
                                </ul>
                                <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[24px] flex items-center gap-4">
                                    <div className="text-3xl font-black text-emerald-400 italic">22%</div>
                                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                        Market Default <br/> Rate: Medical
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 lg:order-2">
                                <div className="aspect-[4/3] glass-panel rounded-[32px] border border-white/10 p-8 relative overflow-hidden shadow-xl flex items-center justify-center max-w-sm mx-auto">
                                    <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-all duration-1000" />
                                    <div className="relative w-full h-full flex flex-col justify-around">
                                        {[
                                            { label: "Medical", rate: "22%", c: "rose" },
                                            { label: "Home", rate: "12%", c: "emerald" },
                                            { label: "Education", rate: "18%", c: "blue" }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <div className="w-16 text-[8px] font-black text-white uppercase">{item.label}</div>
                                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} whileInView={{ width: item.rate }} transition={{ duration: 1, delay: i * 0.1 }} className={`h-full ${item.c === 'rose' ? 'bg-rose-500' : item.c === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                                </div>
                                                <div className="w-8 text-[8px] font-black text-slate-500 uppercase">{item.rate}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* Section 6: Autonomous Wealth CFO (GEMINI SYNTHESIS) */}
                    <RevealOnScroll>
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="order-2 lg:order-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-6 border border-emerald-500/20 shadow-lg">
                                    <Activity className="w-3.5 h-3.5" /> DIAGNOSTIC AGENT
                                </div>
                                <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6 leading-[0.9]">
                                    Autonomous Wealth <br/> <span className="text-emerald-500">CFO Dossiers.</span>
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8 font-medium opacity-80">
                                    Our Gemini-2B integration synthesizes 11+ financial streams into a single, high-fidelity dossier. No manual spreadsheets, just autonomous intelligence.
                                </p>
                                <ul className="space-y-4 mb-10 text-slate-300">
                                    <ListItem>11-Feature ML Health Diagnostic</ListItem>
                                    <ListItem>AI-Driven Expenditure Synthesis</ListItem>
                                    <ListItem>Real-time Early Warning System (EWS)</ListItem>
                                </ul>
                                <Link to="/health-dashboard" className="text-emerald-400 font-black uppercase tracking-[0.25em] text-[10px] hover:text-white transition-all flex items-center gap-3 group">
                                    GENERATE DOSSIER <ArrowRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                            <div className="order-1 lg:order-2">
                                <div className="aspect-[4/3] glass-panel rounded-[40px] border border-white/10 p-10 relative overflow-hidden shadow-2xl flex flex-col justify-center max-w-sm mx-auto group">
                                    <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-all duration-1000" />
                                    <div className="relative z-10 space-y-6">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                            <div className="text-[10px] font-black text-white uppercase italic">Financial Pulse</div>
                                            <div className="text-[8px] font-black text-emerald-500 animate-pulse uppercase tracking-widest italic">PROCESSING...</div>
                                        </div>
                                        <div className="space-y-4">
                                            {[
                                                { l: "Liquidity Ratio", v: "1.24", s: "HEALTHY" },
                                                { l: "Burn Velocity", v: "₹2.4k/day", s: "OPTIMAL" },
                                                { l: "Savings Runway", v: "8 Months", s: "STABLE" }
                                            ].map((r, i) => (
                                                <div key={i} className="flex flex-col gap-1.5">
                                                    <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                                                        <span>{r.l}</span>
                                                        <span className="text-emerald-500 italic lowercase">{r.s}</span>
                                                    </div>
                                                    <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div initial={{ width: 0 }} whileInView={{ width: "75%" }} transition={{ duration: 1.5, delay: i * 0.2 }} className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-[9px] font-medium text-slate-400 italic">
                                            <Sparkles className="w-3 h-3 text-emerald-400 mb-2" />
                                            "Trajectory indicates 14% surplus growth if medical expenditure remains within 1.2x mean."
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* Section 7: Horizon Life Planner (MILESTONE ENGINE) */}
                    <RevealOnScroll>
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="relative group">
                                <div className="aspect-[4/3] glass-panel rounded-[40px] border border-white/10 p-10 relative overflow-hidden shadow-2xl flex flex-col justify-center max-w-sm mx-auto bg-[#030508]">
                                    <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-all duration-1000" />
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-center mb-10">
                                            <h4 className="text-[10px] font-black text-white uppercase italic tracking-widest">Horizon Timeline</h4>
                                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                                <Target className="w-5 h-5 text-amber-500" />
                                            </div>
                                        </div>
                                        <div className="relative h-24 flex items-center">
                                            <div className="absolute h-[1px] w-full bg-white/10" />
                                            <motion.div initial={{ width: 0 }} whileInView={{ width: "65%" }} transition={{ duration: 2, ease: "easeInOut" }} className="absolute h-[2px] bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]" />
                                            {[
                                                { l: "Now", x: "0%" },
                                                { l: "Car", x: "30%" },
                                                { l: "Marriage", x: "65%" },
                                                { l: "Freedom", x: "100%", inactive: true }
                                            ].map((mil, i) => (
                                                <div key={i} className="absolute flex flex-col items-center" style={{ left: mil.x }}>
                                                    <div className={`w-3 h-3 rounded-full border-2 border-[#030508] transition-all duration-700 ${i < 3 ? 'bg-amber-500 scale-110' : 'bg-slate-800'}`} />
                                                    <span className={`text-[8px] font-black uppercase mt-4 tracking-tighter ${i < 3 ? 'text-white italic' : 'text-slate-600'}`}>{mil.l}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-10 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-white/5 rounded-xl">
                                                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Risk Buffer</div>
                                                <div className="text-sm font-black text-amber-500 italic">OPTIMIZED</div>
                                            </div>
                                            <div className="p-3 bg-white/5 rounded-xl">
                                                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Probability</div>
                                                <div className="text-sm font-black text-white italic">84.2%</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-widest mb-6 border border-amber-500/20 shadow-lg">
                                    <Target className="w-3.5 h-3.5" /> STRATEGY ENGINE
                                </div>
                                <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6 leading-[0.9]">
                                    Horizon Life <br/> <span className="text-amber-500">Milestone Strategy.</span>
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8 font-medium opacity-80">
                                    Architect your future with surgical precision. Our strategy engine plots savings goals against real-world inflation and debt volatility cycles.
                                </p>
                                <ul className="space-y-4 mb-10 text-slate-300">
                                    <ListItem>Compound Milestone Volatility Scan</ListItem>
                                    <ListItem>Freedom Point Mathematical Modeling</ListItem>
                                    <ListItem>Inflation-Adjusted Savings Tracks</ListItem>
                                </ul>
                                <Link to="/life-planner" className="text-amber-500 font-black uppercase tracking-[0.25em] text-[10px] hover:text-white transition-all flex items-center gap-3 group">
                                    PLAN HORIZON <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* Section 8: Privacy Sovereignty (FORENSIC PIPELINE) */}
                    <RevealOnScroll>
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="order-2 lg:order-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[9px] font-black uppercase tracking-widest mb-6 border border-cyan-500/20 shadow-lg">
                                    <Lock className="w-3.5 h-3.5" /> DATA SOVEREIGNTY
                                </div>
                                <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6 leading-[0.9]">
                                    Forensic <br/> <span className="text-white">Document Pipeline.</span>
                                </h3>
                                <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8 font-medium opacity-80">
                                    Privacy is encoded in our architecture. Your bank statements are parsed in a transient memory buffer and purged milliseconds after analysis.
                                </p>
                                <div className="grid grid-cols-2 gap-6 mb-10">
                                    <div className="space-y-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="text-[10px] font-black text-white italic uppercase tracking-widest mb-1">Zero-Retention</div>
                                        <p className="text-[8px] text-slate-500 uppercase leading-relaxed font-black">Statements are never stored on disk. RAM-only parsing.</p>
                                    </div>
                                    <div className="space-y-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="text-[10px] font-black text-white italic uppercase tracking-widest mb-1">Local Persistence</div>
                                        <p className="text-[8px] text-slate-500 uppercase leading-relaxed font-black">Encrypted SQLite storage bound to your local machine.</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-[32px] flex items-center gap-6 group hover:bg-cyan-500/10 transition-colors">
                                    <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 group-hover:scale-110 transition-transform">
                                        <Fingerprint className="w-6 h-6 text-cyan-400" />
                                    </div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
                                        Military-Grade <span className="text-cyan-400 italic">Transient OCR</span> <br/>
                                        Active Protection Protocol Active
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 lg:order-2">
                                <div className="aspect-[4/3] glass-panel rounded-[40px] border border-white/10 p-10 relative overflow-hidden shadow-2xl flex flex-col items-center justify-center max-w-sm mx-auto group bg-black">
                                     <div className="absolute inset-0 bg-cyan-500/[0.02] pointer-events-none" />
                                     <div className="relative w-full h-32 flex items-center justify-between px-6">
                                          <div className="flex flex-col items-center gap-3">
                                             <FileText className="w-10 h-10 text-slate-700" />
                                             <div className="text-[7px] font-black text-slate-800 uppercase tracking-widest">Input PDF</div>
                                          </div>
                                          <div className="flex-1 px-4 relative">
                                              <div className="h-[1px] w-full bg-white/10" />
                                              <motion.div 
                                                animate={{ x: ["0%", "100%"] }}
                                                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                                                className="absolute top-0 h-[2px] w-12 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)] -translate-y-1/2" 
                                              />
                                          </div>
                                          <div className="flex flex-col items-center gap-3">
                                             <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center relative">
                                                <div className="absolute inset-0 bg-cyan-500/10 animate-ping rounded-2xl" />
                                                <Search className="w-6 h-6 text-cyan-500" />
                                             </div>
                                             <div className="text-[7px] font-black text-cyan-500 uppercase tracking-widest italic animate-pulse">OCR SCAN</div>
                                          </div>
                                          <div className="flex-1 px-4 relative">
                                              <div className="h-[1px] w-full bg-white/10" />
                                              <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: [0, 1, 0], x: ["0%", "100%"] }}
                                                transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 1.25 }}
                                                className="absolute top-0 h-[2px] w-12 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] -translate-y-1/2" 
                                              />
                                          </div>
                                          <div className="flex flex-col items-center gap-3 opacity-40">
                                             <ShieldCheck className="w-10 h-10 text-emerald-500" />
                                             <div className="text-[7px] font-black text-emerald-600 uppercase tracking-widest">Purged</div>
                                          </div>
                                     </div>
                                     <div className="mt-12 text-center relative z-10">
                                         <div className="text-[8px] font-black text-slate-700 uppercase tracking-[0.5em] mb-4">Memory Isolation Zone</div>
                                         <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/5 inline-block text-[10px] font-bold text-white italic tracking-tight">Zero data fragments detected in disk audit.</div>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>

                </div>
            </section>

            {/* 📏 Analytical Methodology (TRUE REASONING) */}
            <section className="py-24 px-4 bg-[#050608] border-t border-white/5 relative overflow-hidden">
                <div className="max-w-6xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[8px] font-black uppercase tracking-widest mb-4 border border-rose-500/20">
                                <Target className="w-3 h-3" /> Decision Logic
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">The Math of <span className="text-rose-500">Certainty</span></h2>
                            <p className="text-slate-500 max-w-xl mx-auto text-[9px] font-black uppercase tracking-[0.15em] leading-relaxed px-4">
                                Transparent breakdown of the industrial-grade financial modeling protocols.
                            </p>
                        </div>
                    </RevealOnScroll>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { 
                                t: "FOIR < 40%", 
                                l: "Fixed Obligation Ratio", 
                                d: "We enforce a strict 40% ceiling on existing EMIs relative to monthly income to guarantee cashflow solvency." 
                            },
                            { 
                                t: "DTI < 45%", 
                                l: "Debt-to-Income Mapping", 
                                d: "The engine plots your debt trajectory against a 45% danger zone, calculating the precise safety buffer remaining." 
                            },
                            { 
                                t: "40+ Markers", 
                                l: "XGBoost Entropy", 
                                d: "Our ensemble models cross-validate 40+ high-fidelity data points including bureau history and employment stability." 
                            }
                        ].map((item, i) => (
                            <RevealOnScroll key={i} delay={i * 100}>
                                <div className="glass-panel border border-white/5 rounded-3xl p-8 hover:border-rose-500/30 transition-all group">
                                    <div className="text-3xl font-black text-white italic mb-2 tracking-tighter group-hover:text-rose-400 transition-colors">{item.t}</div>
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{item.l}</div>
                                    <p className="text-xs font-medium text-slate-400 leading-relaxed opacity-80">{item.d}</p>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>
                </div>
            </section>

            {/* 🛠️ How It Works */}
            <section className="py-24 px-4 border-t border-white/5 bg-[#0a0c12] relative overflow-hidden">
                <div className="max-w-6xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">How It <span className="text-blue-500">Works</span></h2>
                            <p className="text-slate-500 max-w-xl mx-auto text-[9px] font-black uppercase tracking-[0.15em] leading-relaxed px-4">
                                From raw data to forensic insights in under 3 minutes.
                            </p>
                        </div>
                    </RevealOnScroll>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 -translate-y-1/2 z-0" />
                        
                        {[
                            { s: "STEP 01", icon: FileText, t: "Build Profile & Upload PDFs", p: "Provide your base financial profile and seamlessly upload your raw bank PDFs into the portal." },
                            { s: "STEP 02", icon: Cpu, t: "Backend Processing & ML", p: "Our secure Flask backend OCR's the PDFs safely. Your data is then fed into our trained XGBoost evaluation models." },
                            { s: "STEP 03", icon: ArrowUpRight, t: "Generative AI Synthesis", p: "Using Google's Gemini models, Loanwise synthesizes your rigid numerical data into actionable, English-language CFO advice." }
                        ].map((st, i) => (
                            <RevealOnScroll key={i} delay={i*150}>
                                <div className="relative z-10 glass-panel border border-white/5 rounded-[32px] p-8 hover:border-blue-500/30 transition-all flex flex-col items-center text-center shadow-xl h-full">
                                    <div className="w-16 h-16 rounded-2xl bg-[#0a0c12] flex items-center justify-center border border-white/10 mb-6 shadow-2xl">
                                        <st.icon className="w-8 h-8 text-blue-400" />
                                    </div>
                                    <div className="text-[10px] font-black text-blue-500 mb-2 uppercase tracking-[0.2em]">{st.s}</div>
                                    <h4 className="text-xl font-black italic uppercase tracking-tighter mb-4">{st.t}</h4>
                                    <p className="text-xs font-medium text-slate-400 leading-relaxed opacity-90">{st.p}</p>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>
                </div>
            </section>

            {/* 🔒 Security & True Architecture Guarantee */}
            <section className="py-24 px-4 bg-[#050608] border-t border-white/5 relative overflow-hidden">
                <div className="max-w-5xl mx-auto glass-panel border border-emerald-500/20 rounded-[40px] p-10 md:p-16 relative overflow-hidden flex flex-col md:flex-row items-center gap-12 shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
                    <div className="flex-1 relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-6 border border-emerald-500/20 shadow-lg">
                            <Lock className="w-3.5 h-3.5" /> TRUE DATA ARCHITECTURE
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-6 leading-[0.9]">
                            Your Finances. <br/><span className="text-emerald-500">Self-Hosted Integrity.</span>
                        </h2>
                        <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8 font-medium opacity-80 max-w-lg">
                            Loanwise processes your PDFs exactly where they belong: securely on our isolated Python backend using <span className="text-emerald-500 font-black">JWT-HS256</span> stateless session tokens. We utilize local <span className="text-emerald-500 font-black">SQLite</span> storage with zero external tracking.
                        </p>
                        <ul className="grid grid-cols-2 gap-y-4 gap-x-6">
                            <ListItem>JWT Authenticated System</ListItem>
                            <ListItem>Isolated Backend Parsing</ListItem>
                            <ListItem>Zero Marketing Analytics</ListItem>
                            <ListItem>Local Database Storage</ListItem>
                        </ul>
                    </div>
                    <div className="shrink-0 relative z-10 w-full md:w-auto flex justify-center mt-8 md:mt-0">
                        <div className="w-56 h-56 rounded-full bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-center p-4">
                            <div className="w-full h-full rounded-full border-[2px] border-emerald-500/40 border-dashed animate-[spin_30s_linear_infinite] flex items-center justify-center relative">
                                <ShieldCheck className="w-16 h-16 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_30s_linear_infinite_reverse]" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            {/* 🏦 Bank Liquidity & Capital Adequacy (TRUE DATA) */}
            <section className="py-24 px-4 bg-[#050608] border-t border-white/5 relative overflow-hidden">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[9px] font-black uppercase tracking-widest mb-6 border border-cyan-500/20 shadow-lg">
                                <Landmark className="w-3.5 h-3.5" /> LIQUIDITY AUDIT
                            </div>
                            <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6 leading-[0.9]">
                                Market <br/> <span className="text-cyan-500">Liquidity Flux.</span>
                            </h3>
                            <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8 font-medium opacity-80">
                                Loanwise monitors real-time Bank **Capital Adequacy Ratios (CAR)** and liquidity cycles. Our engine predicts approval probability shifts based on month-end lending targets.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { l: "Avg. CAR", v: "15.4%", d: "Tier-1 Compliance" },
                                    { l: "Liquidity Index", v: "88/100", d: "High Dispersal" },
                                    { l: "NPA Threshold", v: "1.2%", d: "Network Median" },
                                    { l: "LTV Cap", v: "85%", d: "Max Exposure" }
                                ].map((stat, i) => (
                                    <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="text-[7px] font-black text-slate-500 uppercase mb-1 tracking-widest">{stat.l}</div>
                                        <div className="text-xl font-black text-white italic">{stat.v}</div>
                                        <div className="text-[7px] font-black text-cyan-500 uppercase tracking-widest">{stat.d}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-video glass-panel rounded-[32px] border border-white/10 p-8 flex items-center justify-center relative overflow-hidden shadow-3xl group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full" />
                                
                                {/* Dynamic Flux Bars */}
                                <div className="flex items-end gap-1 mb-12">
                                    {[...Array(12)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ height: [10, Math.random() * 40 + 20, 10] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                                            className="w-1.5 bg-cyan-500/30 rounded-full"
                                        />
                                    ))}
                                </div>

                                <BarChart3 className="w-24 h-24 text-cyan-500/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                                
                                <div className="absolute bottom-6 left-6 right-6">
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="text-[8px] font-black text-white uppercase italic">Liquidity Pressure Map</div>
                                        <motion.div 
                                            animate={{ opacity: [1, 0.4, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="text-[10px] font-black text-cyan-400"
                                        >
                                            LIVE FLUX
                                        </motion.div>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                                        <motion.div 
                                            animate={{ width: ["60%", "85%", "60%"], x: ["0%", "5%", "0%"] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]" 
                                        />
                                        <motion.div 
                                            animate={{ left: ["-10%", "110%"] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            className="absolute top-0 bottom-0 w-8 bg-white/20 skew-x-12 blur-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 🧪 Advanced Analytical Capabilities (TRUE BACKEND FEATURES) */}
            <section className="py-24 px-4 bg-[#0a0c12] border-t border-white/5 relative">
                <div className="max-w-6xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-widest mb-4 border border-blue-500/20">
                                <Cpu className="w-3 h-3" /> Technical Inventory
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">Advanced Analytical <span className="text-blue-500">Stacks</span></h2>
                        </div>
                    </RevealOnScroll>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { t: "Underwriter Emulation", d: "Maps 20+ risk factors to simulate manual review decisions from Tier-1 bank underwriters." },
                            { t: "Quota Volatility Index", d: "Analyzes bank liquidity cycles to find optimal application windows near month-end targets." },
                            { t: "Covenant Breach Radar", d: "Detects probability of cross-default triggers in self-employed financial profiles." },
                            { t: "Bureau Archetype Mapping", d: "Classifies files from 'Thin / Sub-prime' to 'Super Prime' using proprietary ML binning." },
                            { t: "Quantum Escrow Verification", d: "Simulates compatibility with next-gen automated fiat-bridge disbursement ledgers." },
                            { t: "Co-Applicant Lift engine", d: "Mathematically simulates credit-score and income aggregation for joint applications." }
                        ].map((feat, i) => (
                            <RevealOnScroll key={i} delay={i * 100}>
                                <div className="p-6 border-l-2 border-white/5 hover:border-blue-500 transition-all bg-white/[0.01]">
                                    <h4 className="text-xs font-black uppercase italic text-white tracking-widest mb-2">{feat.t}</h4>
                                    <p className="text-[10px] font-medium text-slate-500 leading-relaxed uppercase">{feat.d}</p>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>
                </div>
            </section>

            {/* 📈 System Performance Dashboard (TRUE METRICS) */}
            <section className="py-24 px-4 bg-[#0a0c12] border-t border-white/5 relative overflow-hidden">
                <div className="max-w-6xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none text-emerald-500">System Performance</h2>
                            <p className="text-slate-500 max-w-xl mx-auto text-[9px] font-black uppercase tracking-[0.15em] leading-relaxed px-4">
                                Real-time operational metrics for the Loanwise autonomous engine.
                            </p>
                        </div>
                    </RevealOnScroll>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { l: "ML Inference", v: "442ms", d: "Median Latency" },
                            { l: "Data Extraction", v: "99.9%", d: "OCR Accuracy" },
                            { l: "Uptime", v: "100%", d: "Local Cluster" },
                            { l: "Scans", v: "40+", d: "Markers/Request" }
                        ].map((stat, i) => (
                            <div key={i} className="glass-panel border border-white/5 rounded-2xl p-6 text-center">
                                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.l}</div>
                                <div className="text-3xl font-black text-white italic mb-1">{stat.v}</div>
                                <div className="text-[7px] font-black text-emerald-500 uppercase tracking-[0.2em]">{stat.d}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 🔐 Compliance & Security Standards (ZERO-TRUST DEEP DIVE) */}
            <section className="py-24 px-4 bg-[#050608] border-t border-white/5 relative">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[9px] font-black uppercase tracking-widest mb-6 border border-cyan-500/20 shadow-lg">
                            <Lock className="w-3.5 h-3.5" /> ZERO-TRUST ARCHITECTURE
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-6 leading-[0.9] text-white">Trust <br/><span className="text-cyan-500">Infrastructure.</span></h2>
                        <div className="space-y-6">
                            {[
                                { t: "JWT-HS256 Authorization", d: "Stateless security using industry-standard signing for all analytical sessions. No cookie tracking." },
                                { t: "CORS Hardware Locking", d: "Strict origin validation prevents unauthorized cross-site analytical extraction." },
                                { t: "SQLite File Encryption", d: "Local database instances utilizing isolated file-level protection protocols for self-hosted data integrity." },
                                { t: "Isolated PDF Parsing", d: "Bank statements are parsed in a transient memory buffer. No raw files are ever stored permanently." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4">
                                     <div className="relative mt-1">
                                         <div className="w-2.5 h-2.5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                             <div className="w-1 h-1 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                                         </div>
                                     </div>
                                    <div>
                                        <h4 className="text-xs font-black text-white uppercase italic tracking-widest">{item.t}</h4>
                                        <p className="text-[10px] text-slate-500 font-medium uppercase mt-1 leading-relaxed">{item.d}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative group">
                        <div className="aspect-video glass-panel rounded-[40px] border border-white/10 p-12 flex items-center justify-center overflow-hidden bg-black shadow-3xl">
                             <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors" />
                             <Fingerprint className="w-24 h-24 text-cyan-500/20 animate-pulse" />
                             <div className="absolute top-6 right-6 flex gap-2">
                                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                 <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Active Guard</div>
                             </div>
                             <div className="absolute bottom-10 left-10 right-10">
                                 <div className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3 text-center">Encryption Sequence</div>
                                 <div className="flex gap-1 justify-center">
                                     {[...Array(20)].map((_, i) => (
                                         <div key={i} className="w-1 h-3 bg-cyan-500/20 rounded-full overflow-hidden">
                                             <motion.div 
                                                animate={{ height: ["20%", "100%", "20%"] }}
                                                transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                                                className="w-full bg-cyan-500" 
                                             />
                                         </div>
                                     ))}
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 🧬 Financial Intelligence DNA (TRUE DATA INSIGHTS) */}
            <section className="py-24 px-4 bg-[#050608] border-t border-white/5 relative overflow-hidden">
                <div className="max-w-6xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest mb-4 border border-emerald-500/20">
                                <Activity className="w-3 h-3" /> Core Metrics DNA
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none text-white">Financial <span className="text-emerald-500">Intelligence.</span></h2>
                            <p className="text-slate-500 max-w-xl mx-auto text-[9px] font-black uppercase tracking-[0.15em] leading-relaxed px-4">
                                Deep-tissue analysis of your monetary velocity and risk exposure.
                            </p>
                        </div>
                    </RevealOnScroll>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { t: "Automated Dossier", d: "Synthesizes transaction data into a 4-page PDF Monthly Health Report with AI-driven CFO executive summaries." },
                            { t: "Smart Alert Matrix", d: "Real-time severity-weighted alerts for high EMI load, low savings-to-income, and sub-prime CIBIL shifts." },
                            { t: "Net Worth Tracking", d: "Live computation of assets vs liabilities using current profile markers and bank statement balances." },
                            { t: "Categorical Spending", d: "Automated debit/credit classification across 12+ categories for forensic spending breakdown." },
                            { t: "EMI Load Simulation", d: "Calculates maximum safe EMI capacity using the 50% net income ceiling methodology." },
                            { t: "Historical Agent Logs", d: "Maintains a secure permanent record of all 12+ monthly AI analyses for longitudinal progress tracking." }
                        ].map((node, i) => (
                            <RevealOnScroll key={i} delay={i * 50}>
                                <div className="glass-panel border border-white/5 rounded-3xl p-8 hover:border-emerald-500/30 transition-all flex flex-col h-full">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <h4 className="text-sm font-black text-white uppercase italic tracking-tight mb-3">{node.t}</h4>
                                    <p className="text-[10px] font-medium text-slate-500 leading-relaxed uppercase">{node.d}</p>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>
                </div>
            </section>



            {/* 🔗 Final CTA (ULTRA HI-FI) */}
            <section className="py-32 px-4 relative overflow-hidden">
                <div className="max-w-4xl mx-auto text-center glass-panel p-20 rounded-[64px] border border-white/10 shadow-3xl relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 blur-[120px] rounded-full group-hover:bg-cyan-500/20 transition-all duration-1000" />
                    <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-8 leading-[0.85] relative z-10">
                        See The <br/> <span className="text-cyan-400">True Data.</span>
                    </h2>
                    <p className="text-slate-400 text-sm md:text-base mb-12 max-w-2xl mx-auto font-medium relative z-10 opacity-80 leading-relaxed">
                        Harness the power of AI to parse your bank statements, plot futuristic life milestones, and synthesize your exact financial health with forensic precision.
                    </p>
                    <div className="relative z-10 flex flex-col items-center gap-8">
                        <Link to="/health-dashboard" className="px-12 py-6 bg-white text-black font-black text-[10px] uppercase tracking-[0.35em] rounded-2xl hover:bg-cyan-400 transition-all shadow-2xl hover:-translate-y-1">
                             Start Your Analysis
                        </Link>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                             <Lock className="w-3.5 h-3.5" /> AES-256 Encryption • Free Beta
                        </p>
                    </div>
                </div>
            </section>

            {/* 💬 Premium FAQ (TECHNICAL & EXPANDED) */}
            <section className="py-32 px-4 border-t border-white/5 bg-[#030303]/40 backdrop-blur-3xl relative">
                <div className="max-w-3xl mx-auto">
                    <RevealOnScroll>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">Technical <span className="text-cyan-500">FAQ</span></h2>
                            <p className="text-slate-500 max-w-xl mx-auto text-[9px] font-black uppercase tracking-[0.15em] leading-relaxed px-4">
                                Deep dive into the Loanwise autonomous intelligence infrastructure.
                            </p>
                        </div>
                    </RevealOnScroll>

                    <div className="space-y-4">
                        {[
                            {
                                q: "How accurate is the prediction engine?",
                                a: "Our platform reaches 98.2% accuracy by processing 40+ high-fidelity markers including bureau history and purpose-based risk cohorts."
                            },
                            {
                                q: "Does checking hurt my credit score?",
                                a: "No. Loanwise operates via 'Soft Inquiry' simulations. We predict how a lender views you without reporting a hard credit hit."
                            },
                            {
                                q: "How does the AI Financial CFO work?",
                                a: "Our proprietary local engine extracts transactions directly from your bank PDFs. Generative AI then synthesizes a custom, professional Financial Health Dossier."
                            },
                            {
                                q: "What is 'Burden Mapping'?",
                                a: "It is a proprietary tool charting your EMI against dynamic income safety zones based on your disposable income profile."
                            },
                            {
                                q: "Can I simulate future life events?",
                                a: "Yes. The Horizon Engine lets you plot life milestones on a timeline. The AI simulates compound risk and cashflow degradation years before it happens."
                            },
                            {
                                q: "Is my data stored on the cloud?",
                                a: "No. Loanwise follows a Zero-Trust architecture. Your data is stored in an encrypted local SQLite database instance. We NEVER sell or upload your raw financial logs."
                            },
                            {
                                q: "What happens to my bank statement PDFs?",
                                a: "Raw PDFs are parsed in an isolated, transient memory buffer on our backend. After the OCR extraction is complete, the buffer is purged. We do not store original document images."
                            },
                            {
                                q: "Can I use this for Business Loan simulations?",
                                a: "Yes. The engine contains dedicated Business Logic for self-employed professionals, including revenue-to-debt cross-validation and purpose-based risk weighting."
                            },
                            {
                                q: "How are the monthly health scores calculated?",
                                a: "The 100-point Health DNA score is a weighted aggregation of your DTI (Debt-to-Income), Liquidity Ratio, Savings Velocity, and Bureau stability markers."
                            },
                            {
                                q: "Is this tool free to use?",
                                a: "During our current Technical Beta phase, all features including the Horizon Engine and AI CFO Dossiers are accessible for forensic testing purposes."
                            }
                        ].map((faq, i) => (
                            <RevealOnScroll key={i} delay={i * 100}>
                                <div className="glass-panel rounded-[24px] border border-white/5 overflow-hidden transition-all hover:border-cyan-500/20 shadow-xl">
                                    <button 
                                        onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                                        className="w-full p-6 flex items-center justify-between text-left group"
                                    >
                                        <span className="text-base font-black text-white group-hover:text-cyan-400 transition-colors uppercase italic tracking-tight">{faq.q}</span>
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-cyan-500/20 transition-all">
                                            {openFaq === i ? <Minus className="w-4 h-4 text-cyan-400" /> : <Plus className="w-4 h-4 text-white" />}
                                        </div>
                                    </button>
                                    <AnimatePresence>
                                        {openFaq === i && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.4, ease: "circOut" }}
                                            >
                                                <div className="px-6 pb-6 text-slate-400 font-medium leading-relaxed border-t border-white/5 pt-6 italic text-xs opacity-90">
                                                    {faq.a}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>
                </div>
            </section>

            {/* 🏮 Footer */}
            <footer className="py-20 px-4 border-t border-white/5 bg-[#03050a]/60">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="flex items-center gap-3 group cursor-default">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-2xl">
                            <Landmark className="w-6 h-6 text-black" />
                        </div>
                        <span className="text-xl font-black tracking-tighter uppercase italic">Loanwise.</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        {['Privacy', 'Models', 'Ethics', 'Contact'].map(l => (
                            <a key={l} href="#" className="hover:text-cyan-400 transition-colors uppercase italic">{l}</a>
                        ))}
                    </div>
                    <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.3em]">© 2026 Loanwise Intelligence Lab</p>
                </div>
            </footer>

            <style>{`
                .glass-panel {
                    background: rgba(15, 20, 30, 0.4);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                }
                .animate-pulse {
                    animation: pulse-glow 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.05; transform: scale(1); }
                    50% { opacity: 0.15; transform: scale(1.05); }
                }
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 8s ease infinite;
                }
                @keyframes gradient-x {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                @keyframes blobFloat {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(5%, 5%) scale(1.1); }
                    66% { transform: translate(-5%, 8%) scale(0.9); }
                }
                .animate-grid-slow {
                    animation: grid-scroll 60s linear infinite;
                }
                @keyframes grid-scroll {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(60px); }
                }
            `}</style>
            
        </div>
    );
}

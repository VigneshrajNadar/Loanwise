import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, CheckCircle2, ShieldAlert, Sparkles, Building2, Banknote, Percent, Clock, Search, MapPin, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:5001/api';

// Known local NBFCs injected by the scraper engine
const LOCAL_NBFC_NAMES = ['Muthoot Capital', 'Shriram Finance', 'Gujarat Housing Board', 'Ugro Capital', 'Kerala Bank', 'Bandhan Bank'];

const SCRAPER_CATEGORIES = [
    { id: 'all', label: 'Recommended For You' },
    { id: 'bike', label: 'Two Wheeler' },
    { id: 'car', label: 'Auto / Car Loan' },
    { id: 'house', label: 'Home Loan' },
    { id: 'education', label: 'Education' },
    { id: 'medical', label: 'Medical' },
    { id: 'vacation', label: 'Vacation' },
    { id: 'wedding', label: 'Wedding' },
    { id: 'small_business', label: 'Small Business' },
    { id: 'debt_consolidation', label: 'Personal / Debt' }
];

export function MarketOffers({ initialOffers, decisionType, creditScore }) {
    const [offers, setOffers] = useState(initialOffers || []);
    const [activeTab, setActiveTab] = useState('all');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setOffers(initialOffers || []);
        setActiveTab('all');
    }, [initialOffers]);

    const fetchOffers = async (type) => {
        setActiveTab(type);
        if (type === 'all') {
            setOffers(initialOffers || []);
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('lw_token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const { data } = await axios.get(`${API_BASE}/market-offers?type=${type}&score=${creditScore || 700}`, { headers });
            setOffers(data);
        } catch (err) {
            console.error("Failed to fetch custom market offers");
            setOffers([]);
        } finally {
            setIsLoading(false);
        }
    };

    if (decisionType === 'Avoid Loan') {
        return null; // AI blocks bad debt.
    }

    if (!offers || offers.length === 0) return null;

    return (
        <div className="w-full mt-10 mb-16 relative">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-8 gap-6">
                <div>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-cyan-400" /> Live Market Scraper
                    </h3>
                    <p className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest flex items-center gap-2">
                        {decisionType === 'Recommend Loan' ? (
                            <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Pre-Approved Offers (Highly Safe)</>
                        ) : (
                            <><ShieldAlert className="w-4 h-4 text-amber-400" /> Proceed with Caution (Moderate Risk)</>
                        )}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-start xl:justify-end flex-1 max-w-3xl border border-white/5 bg-black/40 p-2 rounded-2xl">
                    {SCRAPER_CATEGORIES.map(cat => (
                        <button 
                            key={cat.id} 
                            onClick={() => fetchOffers(cat.id)}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                activeTab === cat.id ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'hover:bg-white/5 text-slate-500 hover:text-white'
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative min-h-[300px]">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center py-20">
                            <Search className="w-8 h-8 text-cyan-500 animate-bounce mb-4" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Scanning Global Rates...</p>
                        </motion.div>
                    ) : (
                        <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {offers.map((bank, index) => (
                                <motion.a 
                                    key={`${index}-${bank.name}`} 
                                    href={bank.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`glass-panel p-6 rounded-3xl border flex flex-col group transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                                        (activeTab === 'all' ? bank.is_match : bank.is_match) ? 'border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-500/60 cursor-pointer relative overflow-hidden shadow-[0_0_15px_rgba(34,211,238,0.05)]' : 'border-white/10 bg-black/40 hover:border-white/20'
                                    }`}
                                >
                                    {(activeTab === 'all' ? bank.is_match : bank.is_match) && (
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[30px] rounded-full pointer-events-none" />
                                    )}
                                    
                                    <div className="flex justify-between items-start mb-6 shrink-0 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl transition-all ${bank.is_match ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}`}>
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-white leading-tight">{bank.name}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {bank.is_match && <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Optimal Target</span>}
                                                    {LOCAL_NBFC_NAMES.includes(bank.name) && (
                                                        <span className="flex items-center gap-1 text-[8px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                                            <MapPin className="w-2.5 h-2.5" /> Local NBFC
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 cursor-pointer" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 flex-1 mb-4 relative z-10">
                                         <div className="bg-black/30 p-3 rounded-2xl border border-white/5 flex flex-col justify-center transition-colors group-hover:bg-black/50">
                                             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Percent className="w-3 h-3" /> Advertised Rate</p>
                                             <p className="text-xl font-black text-emerald-400 tracking-tighter">{bank.rate}</p>
                                         </div>
                                         <div className="bg-black/30 p-3 rounded-2xl border border-white/5 flex flex-col justify-center transition-colors group-hover:bg-black/50">
                                             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Banknote className="w-3 h-3" /> Limit Ceiling</p>
                                             <p className="text-lg font-black text-white tracking-tighter">{bank.max}</p>
                                         </div>
                                    </div>

                                    {/* True APR Badge */}
                                    {bank.true_apr && (
                                        <div className="relative z-10 mb-3 flex items-center justify-between bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                                            <div>
                                                <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">True APR (incl. fees)</p>
                                                <p className="text-sm font-black text-rose-300">{bank.true_apr}</p>
                                            </div>
                                            <p className="text-[9px] font-bold text-rose-400/60 italic">{bank.hidden_fee_note}</p>
                                        </div>
                                    )}

                                    <div className="mt-auto flex items-center gap-2 pt-4 border-t border-white/5 relative z-10">
                                        <Clock className="w-3 h-3 text-slate-500" />
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Available Tenure: <span className="text-slate-300">{bank.tenure} Mo</span></p>
                                    </div>
                                </motion.a>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
        </div>
    );
}

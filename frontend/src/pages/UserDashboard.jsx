import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { RefreshCw, Sparkles, Brain } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { TabOverview } from './dashboard/TabOverview';
import { TabTransactions } from './dashboard/TabTransactions';
import { TabHistory } from './dashboard/TabHistory';
import { TabAdvisor } from './dashboard/TabAdvisor';
import { TabProfile } from './dashboard/TabProfile';

const API = 'http://localhost:5001/api';

export default function UserDashboard() {
  const {user, token, isAuthenticated} = useAuth();
  const { openChat } = useChat();
  const location = useLocation();
  const navigate = useNavigate();

  const [summary,   setSummary]   = useState(null);
  const [analyses,  setAnalyses]  = useState([]);
  const [alerts,    setAlerts]    = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Sync tab with URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['overview', 'transactions', 'advisor', 'history', 'adddata'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/dashboard?tab=${tab}`, { replace: true });
  };
  
  const headers = {Authorization:`Bearer ${token}`};

  const load = useCallback(async()=>{
    if(!token) return;
    try {
      const [sR,hR,aR] = await Promise.all([
        axios.get(`${API}/user/profile-summary`,{headers}),
        axios.get(`${API}/user/history`,{headers}),
        axios.get(`${API}/user/alerts`,{headers}),
      ]);
      setSummary(sR.data);
      setAnalyses(hR.data.analyses||[]);
      setAlerts(aR.data.alerts||[]);
    } catch(e){}
  },[token]);

  useEffect(()=>{load();},[load]);

  if(!isAuthenticated) return (
    <div className="min-h-screen bg-[#060B14] flex items-center justify-center">
      <div className="text-center bg-[#111827] border border-[#1f2937] p-10 rounded-3xl">
        <Brain className="w-16 h-16 text-indigo-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"/>
        <h2 className="text-2xl font-bold text-white mb-2">Sign in required</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">Access your AI-powered financial command center.</p>
        <a href="/login" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4"/> Authenticate
        </a>
      </div>
    </div>
  );

  const unread = (alerts||[]).filter(a=>!a.is_read).length;

  const tabs = [
    {id:'overview',  label:'Overview'},
    {id:'transactions',label:'Transactions'},
    {id:'advisor',   label:'AI Advisor', badge:unread},
    {id:'history',   label:'History',    badge:analyses.length},
    {id:'adddata',   label:'My Profile'},
  ];

  return (
    <div className="min-h-screen bg-[#060b14] pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {user?.name?.split(' ')[0]}'s Dashboard
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-slate-400">Personal finance command center powered by Agentic AI.</p>
              <button 
                onClick={() => openChat('General Overview')}
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all uppercase tracking-wider"
              >
                <Sparkles className="w-3 h-3"/> Ask LoanwiseAI
              </button>
            </div>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 px-4 py-2 bg-[#111827] border border-[#1f2937] rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors hover:border-slate-600 box-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <RefreshCw className="w-3.5 h-3.5"/>Sync Data
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-[#111827]/80 backdrop-blur-md border border-[#1f2937] rounded-xl w-fit mb-8 overflow-x-auto custom-scrollbar shadow-lg shadow-black/20">
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>handleTabChange(t.id)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab===t.id 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}>
              {t.label}
              {t.badge>0&&<span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center justify-center min-w-[20px] ${activeTab===t.id?'bg-white/20 text-white':'bg-[#2d3748] text-slate-300'} ${t.id==='advisor'&&unread>0&&activeTab!==t.id?'bg-rose-500 text-white':''}`}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[500px]">
            <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.2, ease:"easeOut"}}>
                {activeTab==='overview'     && <TabOverview summary={summary} alerts={alerts} analyses={analyses} onTabChange={handleTabChange}/>}
                {activeTab==='transactions' && <TabTransactions token={token}/>}
                {activeTab==='advisor'      && <TabAdvisor token={token}/>}
                {activeTab==='history'      && <TabHistory analyses={analyses}/>}
                {activeTab==='adddata'      && <TabProfile token={token}/>}
            </motion.div>
            </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Zap, ChevronRight, MessageSquare, X, Maximize2, Minimize2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const fmt = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

const PAGE_SUGGESTIONS = {
  "Home Page": [
    { label: 'Check Eligibility', q: 'Based on average profiles, what factors should I improve to get a loan?' },
    { label: 'Analyze Default Risk', q: 'What common financial habits lead to loan defaults?' },
    { label: '50-30-20 Budget', q: 'Show me my 50-30-20 budget breakdown for my income.' },
    { label: 'Platform Tour', q: 'What can I do with Loanwise Decision Intelligence?' },
    { label: 'Improve Credit Score', q: 'What specific steps can I take to improve my estimated credit score?' },
    { label: 'Interest Savings', q: 'How much interest can I save if I pay an extra 10% towards my EMI?' },
    { label: 'Emergency Fund', q: 'Is my ₹ current savings enough for my ₹ expenses?' },
    { label: 'Tax Deductions', q: 'Explain how I can use Section 80C and 24(b) for tax savings on my loan.' },
    { label: 'New Loan Capacity', q: 'Can I safely afford another loan with my current debt-to-income ratio?' },
    { label: 'Investment Potential', q: 'Based on my net savings, how much SIP should I start for wealth generation?' }
  ],
  "Decision Intelligence": [
    { label: 'Analyze Spending', q: 'What does my spending trajectory tell you about my financial health?' },
    { label: 'Burn Rate Impact', q: 'How does a high monthly burn rate affect future loan approvals?' },
    { label: 'Cash Flow Projection', q: 'How can I project my cash flow accurately for the next 6 months?' },
    { label: 'Debt-to-Income', q: 'What is a healthy debt-to-income ratio for new loans?' },
    { label: 'Expense Optimization', q: 'What discretionary expenses should I cut down based on average budgets?' },
    { label: 'Income Volatility', q: 'How does irregular income affect my predicted loan capability?' },
    { label: 'Savings Rate', q: 'What should my ideal savings rate be compared to my monthly expenses?' },
    { label: 'Financial Stress', q: 'What are the early indicators of financial stress in a cash flow chart?' },
    { label: 'Credit Utilization', q: 'How does my credit card utilization impact the long term projections?' },
    { label: 'Wealth Trajectory', q: 'What small changes today will drastically improve my wealth trajectory over 5 years?' }
  ],
  "Default Risk Oracle": [
    { label: 'Identify Red Flags', q: 'What are the biggest red flags in my profile that might lead to default?' },
    { label: 'Tenure Sensitivity', q: 'How does extending my loan tenure impact my risk of default overtime?' },
    { label: 'Avoid Default', q: 'What are the top 3 severe actions I should take to avoid missing an EMI?' },
    { label: 'Emergency Fund', q: 'Is my ₹ current savings enough for my ₹ expenses?' },
    { label: 'Restructuring Loans', q: 'When should I consider restructuring my loan to prevent defaulting?' },
    { label: 'Income Shock', q: 'How vulnerable is my profile to a sudden 20% drop in income?' },
    { label: 'Avalanche Priority', q: 'Should I prioritize paying high-interest or high-balance loans first?' },
    { label: 'Missed Payments', q: 'What is the exact impact of a single 30-day late payment on my profile?' },
    { label: 'Moratoriums', q: 'How do loan moratoriums affect my long term default risk probability?' },
    { label: 'Safe Ratios', q: 'What EMI-to-Income ratio guarantees I will be safe from default?' }
  ],
  "Eligibility Predictor": [
    { label: 'Improve Odds', q: 'What specific metrics must I improve to raise my ml-driven approval odds?' },
    { label: 'Safe Borrowing Limit', q: 'How do you calculate my suggested safe borrowing limit?' },
    { label: 'Reduce EMI burden', q: 'How can I reduce my EMI burden based on my income?' },
    { label: 'Credit Score Impact', q: 'What specific steps can I take to improve my estimated credit score?' },
    { label: 'Optimal Loan Tenure', q: 'What is the optimal loan tenure I should choose for my income profile?' },
    { label: 'DTI Limits', q: 'What is the exact debt-to-income limit lenders look for in my tier?' },
    { label: 'Job Stability', q: 'How much does my current employment duration impact my approval odds?' },
    { label: 'Pre-Approval Steps', q: 'What should I do 3 months before applying for a loan to ensure approval?' },
    { label: 'Rejection Reasons', q: 'What are the most common hidden reasons a loan algorithm rejects an application?' },
    { label: 'Secured vs Unsecured', q: 'How do my odds change if I apply for a secured loan instead of unsecured?' }
  ],
  "default": [
    { label: 'Reduce EMI burden', q: 'How can I reduce my EMI burden based on my income?' },
    { label: 'Emergency Fund', q: 'Is my ₹ current savings enough for my ₹ expenses?' },
    { label: 'Loan Prepayment', q: 'Should I prepay my ₹ loan amount or invest the extra cash?' },
    { label: 'Credit Score', q: 'What specific steps can I take to improve my estimated credit score?' },
    { label: '80C & 24(b)', q: 'Explain how I can use Section 80C and 24(b) for tax savings on my loan.' },
    { label: 'Afford New Loan?', q: 'Can I safely afford another loan with my current debt-to-income ratio?' },
    { label: 'Investment SIP', q: 'Based on my net savings of ₹, how much SIP should I start?' },
    { label: 'Default Risk', q: 'What are the red flags in my profile that might lead to a loan default?' },
    { label: 'Budget Breakdown', q: 'Show me my 50-30-20 budget breakdown for my income.' },
    { label: 'Avalanche Strategy', q: 'Explain why the Avalanche debt payoff method is better for me.' }
  ]
};

export function Section10AIChat({ data: propData, manual: propManual, activeSection: propActiveSection }) {
  const { isOpen, toggleChat, activeSection: globalActiveSection, closeChat } = useChat();
  const { isAuthenticated, token } = useAuth();
  
  const activeSection = propActiveSection || globalActiveSection || 'General Overview';
  const currentSuggestions = PAGE_SUGGESTIONS[activeSection] || PAGE_SUGGESTIONS.default;

  const [profileData, setProfileData] = useState(propManual || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBig, setIsBig] = useState(false);
  const [history, setHistory] = useState([]);
  const bottomRef = useRef(null);

  const fetchProfile = useCallback(async () => {
    if (!token || profileData) return;
    try {
      const res = await axios.get('http://127.0.0.1:5001/api/user/profile-summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(res.data);
    } catch (e) {
      console.error("Chatbot failed to fetch profile", e);
    }
  }, [token, profileData]);

  useEffect(() => {
    if (isAuthenticated) fetchProfile();
  }, [isAuthenticated, fetchProfile]);

  useEffect(() => {
    const isProfileAvailable = !!(profileData && profileData.monthly_income);
    const initialGreeting = isProfileAvailable 
      ? `Hi! I'm LoanwiseAI. I've analyzed your complete financial profile (Income: ${fmt(profileData.monthly_income)}, EMI: ${fmt(profileData.total_emi)}). How can I help you today?`
      : `Hi! I'm LoanwiseAI, your intelligent AI financial advisor. How can I help you with your loan journey today?`;
    
    setMessages([{ role: 'ai', text: initialGreeting, ts: new Date() }]);
  }, [profileData]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [messages, isOpen, isBig]);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');
    const userMsg = { role: 'user', text: q, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5001/api/ai-chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: q,
          profile: profileData || {},
          history: history.slice(-6),
          context: activeSection || 'General Dashboard Overview',
        })
      });
      
      if (!res.ok) throw new Error('API Error');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = '';
      
      setMessages(prev => [...prev, { role: 'ai', text: '', source: 'gemini', ts: new Date() }]);
      setLoading(false);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        answer += chunk;
        setMessages(prev => {
          const newMsg = [...prev];
          newMsg[newMsg.length - 1].text = answer;
          return newMsg;
        });
      }
      
      setHistory(prev => [...prev, { question: q, answer }]);
    } catch {
      setLoading(false);
      setMessages(prev => [...prev, { role: 'ai', text: 'Connection error — check if Flask is running.', ts: new Date() }]);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-end justify-end pointer-events-none p-6">
            <motion.div
              layout
              initial={{ opacity: 0, y: 100, scale: 0.8, transformOrigin: 'bottom right' }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                width: isBig ? 'min(95vw, 1000px)' : '380px',
                height: isBig ? 'min(90vh, 800px)' : '520px',
              }}
              exit={{ opacity: 0, y: 100, scale: 0.8 }}
              className="pointer-events-auto bg-[#0d1424] border border-slate-800/80 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden ring-1 ring-emerald-500/10"
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-slate-800/60 flex-shrink-0">
                <div className="bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-500/30">
                  <Bot className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white text-base">Loanwise AI Advisor</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400/80 uppercase tracking-widest font-black">
                      Gemini Engine • {activeSection}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsBig(!isBig)} 
                    className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                  >
                    {isBig ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={closeChat} 
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat Body Wrapper */}
              <div className={`flex flex-1 overflow-hidden ${isBig ? 'flex-row' : 'flex-col'}`}>
                
                {/* Desktop Suggestions Sidebar */}
                {isBig && (
                  <div className="w-72 border-r border-slate-800/60 bg-[#070b14]/30 p-5 overflow-y-auto no-scrollbar hidden md:block">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Recommended Topics</p>
                    <div className="space-y-2">
                      {currentSuggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => send(s.q)}
                          className="w-full text-left p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-xs text-slate-400 hover:text-emerald-300 transition-all flex items-center justify-between group"
                        >
                          {s.label}
                          <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0a0f1e]/30" style={{ scrollbarWidth: 'none' }}>
                    {messages.map((m, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : ''}`}
                      >
                        {m.role === 'ai' && (
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-emerald-400" />
                          </div>
                        )}
                        <div className={`max-w-[85%] rounded-[24px] px-5 py-3.5 text-sm leading-relaxed shadow-xl ${
                          m.role === 'user'
                            ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white rounded-tr-none'
                            : 'bg-slate-800/90 text-slate-200 border border-slate-700/50 rounded-tl-none backdrop-blur-md'
                        }`}>
                          {m.text}
                          {m.source && (
                            <div className="flex items-center gap-1 mt-2 justify-end opacity-40 text-[10px] uppercase font-bold tracking-tighter">
                              <Zap className="w-2.5 h-2.5" /> via {m.source}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {loading && (
                      <div className="flex gap-4">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <Bot className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="bg-slate-800/90 border border-slate-700/50 rounded-3xl rounded-tl-none px-6 py-4 flex items-center gap-1.5">
                          {[0, 1, 2].map(i => (
                            <span key={i} className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {/* Mobile Suggestions */}
                  {!isBig && (
                    <div className="px-5 py-3 border-t border-slate-800/30 overflow-x-auto whitespace-nowrap scrollbar-hide flex gap-2 no-scrollbar bg-[#0d1424]">
                      {currentSuggestions.slice(0, 10).map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => send(s.q)}
                          className="px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-[11px] text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="p-5 bg-[#0d1424] border-t border-slate-800/60">
                    <div className="relative flex items-center max-w-4xl mx-auto w-full">
                      <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                        placeholder="Type your question..."
                        className="w-full bg-[#070b14] border border-slate-700/70 rounded-2xl pl-5 pr-14 py-4 text-white text-sm focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all outline-none"
                      />
                      <button
                        onClick={() => send()}
                        disabled={!input.trim() || loading}
                        className="absolute right-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:grayscale transition-all rounded-xl text-white flex items-center gap-2"
                      >
                        <span className="hidden sm:inline text-xs font-bold">Ask AI</span>
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl shadow-[0_10px_40px_-10px_rgba(16,185,129,0.5)] flex items-center justify-center text-white border border-emerald-400/30 transition-all"
      >
        {isOpen ? <X className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />}
        {!isOpen && (
           <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-[3px] border-[#070b14] flex items-center justify-center text-[10px] font-black">1</span>
        )}
      </motion.button>
    </>
  );
}

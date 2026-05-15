import { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { createRoot } from 'react-dom/client';
import html2pdf from 'html2pdf.js';
import MonthlyReportPDF from '../../components/MonthlyReportPDF';
import { ShieldAlert, ChevronRight, DollarSign, CreditCard, Wallet, Target, Clock, Plus, Brain, Settings, Activity, FileText, RefreshCw } from 'lucide-react';
import { SectionCard, SectionHeader, KpiCard, GaugeChart, DonutChart, Sparkline, VerdictBadge, Pill } from './DashboardWidgets';

export function TabOverview({summary, alerts, analyses, onTabChange}) {
  const { token } = useAuth();
  const { openChat } = useChat();
  const [generating, setGenerating] = useState(false);

  const inc  = summary?.monthly_income||0;
  const emi  = summary?.total_emi||0;
  const sav  = summary?.savings||0;
  const net  = summary?.net_monthly||0;
  const score= summary?.health_score||0;
  const cibil = summary?.cibil_score||0;
  const netWorth = summary?.net_worth||0;
  const emiRatio = summary?.emi_ratio||0;
  const critical = (alerts||[]).filter(a=>a.severity==='Critical'&&!a.is_read);

  // Fake sparkline data for demo if needed, or derived from txns
  const sparkData = [2000, 1500, 3000, 1200, 4000, 2500, 1800];

  const handleDownloadReport = async () => {
    setGenerating(true);
    try {
        const r = await axios.get('http://localhost:5001/api/user/monthly-report', { headers: { Authorization: `Bearer ${token}` } });
        
        // Create an off-screen container
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        document.body.appendChild(container);
        
        const root = createRoot(container);
        root.render(<MonthlyReportPDF data={r.data} userName={summary?.name || 'User'} />);
        
        // Give React time to render the DOM component
        setTimeout(() => {
            const element = container.querySelector('#monthly-report-pdf-content');
            if (element) {
                html2pdf().set({
                    margin: 0,
                    filename: `Loanwise_Monthly_Report_${new Date().toLocaleString('en-IN', { month: 'short', year: 'numeric' })}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' }
                }).from(element).save().then(() => {
                    root.unmount();
                    container.remove();
                    setGenerating(false);
                });
            } else {
                root.unmount();
                container.remove();
                setGenerating(false);
            }
        }, 1200);
        
    } catch (e) {
        console.error("Report generation failed:", e);
        alert("Failed to generate AI report. Please check API configuration or connection.");
        setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header & Report Action */}
      <div className="flex items-center justify-between bg-[#111827] border border-[#1f2937] p-4 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" /> Financial Overview
          </h2>
          <p className="text-xs text-slate-400 mt-1">Snapshot of your net worth, spending, and AI metrics.</p>
        </div>
        <button 
            onClick={handleDownloadReport} 
            disabled={generating}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
        >
            {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {generating ? 'ANALYZING...' : 'GET MONTHLY REPORT'}
        </button>
      </div>

      {/* Critical banner */}
      {critical.length>0 && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5"/>
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-300">{critical[0].title}</p>
            <p className="text-xs text-rose-400/80 mt-0.5">{critical[0].message}</p>
          </div>
          <button onClick={()=>onTabChange('advisor')} className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-0.5 shrink-0">Details<ChevronRight className="w-3 h-3"/></button>
        </div>
      )}

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Health Score Main Gauge */}
        <div className="col-span-2 bg-[#111827] border border-[#1f2937] rounded-2xl p-5 flex items-center justify-around">
            <GaugeChart score={score} label="Health Score" />
            <div className="h-16 w-px bg-[#1f2937]"></div>
            <GaugeChart score={cibil} max={900} label="CIBIL Score" />
        </div>
        
        <KpiCard icon={DollarSign} label="Monthly Income" value={`₹${(inc/1000).toFixed(0)}K`} sub="Net take-home" accent="emerald"/>
        
        <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-5 transition-all duration-300 hover:border-[#374151]">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Net Worth</span>
                <Wallet className="w-4 h-4 text-purple-400"/>
            </div>
            <p className="text-2xl font-bold text-white mb-2">₹{(netWorth>=10000000) ? (netWorth/10000000).toFixed(2)+'Cr' : (netWorth>=100000) ? (netWorth/100000).toFixed(2)+'L' : netWorth}</p>
            <Sparkline data={sparkData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Donut */}
        <div className="lg:col-span-1">
            <SectionCard className="h-full">
                <SectionHeader icon={CreditCard} title="Monthly Spending" />
                <div className="p-5">
                    <DonutChart data={summary?.spending_by_cat || {}} />
                    <div className="mt-6 pt-4 border-t border-[#1f2937] flex justify-between items-center">
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">EMI Ratio</p>
                            <p className={`text-lg font-bold ${emiRatio>40 ? 'text-rose-400' : 'text-emerald-400'}`}>{emiRatio}%</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Net Surplus</p>
                            <p className={`text-lg font-bold ${net>0 ? 'text-indigo-400' : 'text-rose-400'}`}>₹{(net/1000).toFixed(0)}K</p>
                        </div>
                    </div>
                </div>
            </SectionCard>
        </div>

        {/* Recent Analyses */}
        <div className="lg:col-span-2">
            <SectionCard className="h-full">
                <SectionHeader icon={Clock} iconColor="text-slate-400" title="Recent AI Predictions"
                right={<button onClick={()=>onTabChange('history')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">View all<ChevronRight className="w-3 h-3"/></button>}/>
                {(!analyses || analyses.length===0)?(
                <div className="px-5 py-10 text-center flex flex-col items-center justify-center h-[200px]">
                    <Activity className="w-8 h-8 text-slate-700 mx-auto mb-2"/>
                    <p className="text-slate-500 text-sm">No predictive analyses run yet.</p>
                </div>
                ):(
                <div className="divide-y divide-[#1f2937]">
                    {[...analyses].reverse().slice(0,4).map((a,i)=>{
                        return (
                            <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-[#111827]/60 transition-colors">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-semibold text-white truncate capitalize">{a.module.replace('_', ' ')}</p>
                                    <span className="text-[10px] text-slate-500">{new Date(a.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs text-slate-400 truncate">{a.input_summary || 'Inputs provided'}</p>
                            </div>
                            <VerdictBadge verdict={a.verdict}/>
                            </div>
                        );
                    })}
                </div>
                )}
            </SectionCard>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {label:'Upload Bank PDF', sub:'Auto-extract txns', onClick:()=>onTabChange('transactions'), icon:Plus,      color:'emerald'},
          {label:'Chat with Advisor', sub:'Ask about finances', onClick:()=>openChat('Financial Overview'),    icon:Brain,     color:'purple'},
          {label:'Update Profile',    sub:'CIBIL & Goals',    onClick:()=>onTabChange('adddata'),      icon:Settings,  color:'teal'},
          {label:'Analysis History',  sub:'See past reports', onClick:()=>onTabChange('history'),      icon:Clock,     color:'amber'},
        ].map(q=>(
          <button key={q.label} onClick={q.onClick}
            className="flex items-start gap-3 p-4 bg-[#111827] border border-[#1f2937] rounded-2xl hover:border-[#374151] hover:bg-[#161f2e] transition-all text-left group">
            <div className={`p-2 rounded-lg bg-${q.color}-500/10 shrink-0 mt-0.5 group-hover:bg-${q.color}-500/20 transition-colors`}><q.icon className={`w-4 h-4 text-${q.color}-400`}/></div>
            <div>
              <p className="text-sm font-semibold text-white">{q.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{q.sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

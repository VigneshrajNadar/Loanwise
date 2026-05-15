import { useState, useEffect, useCallback, useRef } from 'react';
import { Trash2, PlusCircle, ArrowUpCircle, ArrowDownCircle, BarChart2, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { SectionCard, SectionHeader, KpiCard, fmtK } from './DashboardWidgets';
import { motion } from 'framer-motion';

const CATEGORIES = ['Salary','EMI','Food & Dining','Rent','Investment','Shopping','Medical','Travel','Utilities','Entertainment','Insurance','Transfer','Other'];
const CAT_COLORS = {'Salary':'#10b981','EMI':'#f43f5e','Food & Dining':'#f59e0b','Rent':'#6366f1','Investment':'#06b6d4','Shopping':'#ec4899','Medical':'#8b5cf6','Travel':'#14b8a6','Utilities':'#64748b','Entertainment':'#fb923c','Insurance':'#84cc16','Transfer':'#94a3b8','Other':'#475569'};
const API = 'http://localhost:5001/api';

export function TabTransactions({token}) {
  const today = new Date().toISOString().split('T')[0];
  const [txns,    setTxns]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving] = useState(false);
  
  // Manual entry params
  const [date,    setDate]   = useState(today);
  const [desc,    setDesc]   = useState('');
  const [amt,     setAmt]    = useState('');
  const [cat,     setCat]    = useState('Food & Dining');
  const [type,    setType]   = useState('debit');
  
  // Upload state
  const curMonth = (new Date()).toISOString().slice(0, 7);
  const [filterMonth, setFilterMonth] = useState('all');
  const [searchTxt, setSearchTxt] = useState('');
  const [uploadStatus, setUploadStatus] = useState(null); // {status: 'loading'|'done'|'error', msg: ''}
  const fileInputRef = useRef(null);

  const headers = {Authorization:`Bearer ${token}`};

  const load = useCallback(async()=>{
    setLoading(true);
    try {
        const r=await axios.get(`${API}/user/transactions`,{headers});
        setTxns(r.data.transactions||[]);
    } catch(e){} finally { setLoading(false); }
  },[token]);
  useEffect(()=>{load();},[load]);

  const submitManual = async e=>{
    e.preventDefault();
    setSaving(true);
    await axios.post(`${API}/user/transactions`,{date,description:desc,amount:parseFloat(amt),category:cat,type},{headers});
    setDesc(''); setAmt(''); setSaving(false); load();
  };

  const parseOrUploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isPDF = file.name.toLowerCase().endsWith('.pdf');
    const isCSV = file.name.toLowerCase().endsWith('.csv');
    if (!isPDF && !isCSV) return alert("Only .pdf or .csv allowed");

    const endpoint = isPDF ? '/user/transactions/upload-pdf' : '/user/transactions/upload';
    const formData = new FormData();
    formData.append('file', file);

    setUploadStatus({ status: 'loading', msg: isPDF ? 'Extracting via AI...' : 'Parsing CSV...' });
    try {
        const res = await axios.post(`${API}${endpoint}`, formData, { headers: { ...headers, 'Content-Type': 'multipart/form-data' }});
        if (res.data.ok) {
            setUploadStatus({ status: 'done', msg: `Saved ${res.data.saved} records.` });
            load();
            setTimeout(() => setUploadStatus(null), 3000);
        } else {
            setUploadStatus({ status: 'error', msg: res.data.error || 'Failed' });
        }
    } catch (err) {
        setUploadStatus({ status: 'error', msg: err?.response?.data?.error || 'Upload error' });
    }
  };

  const del = async id=>{await axios.delete(`${API}/user/transactions/${id}`,{headers}); load();};

  // Processing data
  const filteredTxns = txns.filter(t => {
      let matchesM = filterMonth === 'all' ? true : t.date.startsWith(filterMonth);
      let matchesS = searchTxt ? t.description?.toLowerCase().includes(searchTxt.toLowerCase()) || t.category?.toLowerCase().includes(searchTxt.toLowerCase()) : true;
      return matchesM && matchesS;
  });

  const debits  = filteredTxns.filter(t=>t.type==='debit').reduce((s,t)=>s+t.amount,0);
  const credits = filteredTxns.filter(t=>t.type==='credit').reduce((s,t)=>s+t.amount,0);
  
  // Get active months
  const months = [...new Set(txns.map(t => t.date.slice(0, 7)))].sort().reverse();
  const catMap  = {};
  filteredTxns.filter(t=>t.type==='debit').forEach(t=>{catMap[t.category]=(catMap[t.category]||0)+t.amount;});
  const topCats = Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,6);

  const iCls = "w-full px-3 py-2.5 bg-[#1a2234] border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-slate-600";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Transactions</h2>
          <div className="flex gap-2 bg-[#111827] border border-[#1f2937] rounded-lg p-1">
              <button onClick={()=>setFilterMonth('all')} className={`px-3 py-1 text-xs font-medium rounded ${filterMonth==='all' ? 'bg-[#1f2937] text-white' : 'text-slate-400 hover:text-white'}`}>All Time</button>
              {months.slice(0,3).map(m => (
                <button key={m} onClick={()=>setFilterMonth(m)} className={`px-3 py-1 text-xs font-medium rounded ${filterMonth===m ? 'bg-[#1f2937] text-white' : 'text-slate-400 hover:text-white'}`}>{m}</button>
              ))}
          </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={ArrowUpCircle} label="Total Credits" value={fmtK(credits)} accent="emerald"/>
        <KpiCard icon={ArrowDownCircle} label="Total Debits" value={fmtK(debits)} accent="rose"/>
        <KpiCard icon={BarChart2} label="Net Flow" value={fmtK(credits-debits)} accent={credits>debits?'teal':'amber'}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            {/* Action Bar: Upload + Manual */}
            <SectionCard>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#1f2937]">
                    <div className="p-6 flex flex-col items-center justify-center text-center">
                        <input type="file" ref={fileInputRef} onChange={parseOrUploadFile} accept=".csv, .pdf" className="hidden" />
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex flex-col items-center justify-center mb-3 text-indigo-400">
                            <UploadCloud className="w-6 h-6"/>
                        </div>
                        <h3 className="text-sm font-semibold text-white mb-1">Import Statement</h3>
                        <p className="text-xs text-slate-400 mb-4 max-w-xs px-2">Upload your bank statement (PDF or CSV). The AI will extract and categorize transactions.</p>
                        
                        {uploadStatus?.status === 'loading' ? (
                            <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium">
                                <span className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin"></span>
                                {uploadStatus.msg}
                            </div>
                        ) : uploadStatus?.status === 'done' ? (
                            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                                <CheckCircle2 className="w-4 h-4" /> {uploadStatus.msg}
                            </div>
                        ) : uploadStatus?.status === 'error' ? (
                            <p className="text-rose-400 text-xs font-medium bg-rose-500/10 py-1.5 px-3 rounded-lg break-words w-full">{uploadStatus.msg}</p>
                        ) : (
                            <button onClick={()=>fileInputRef.current?.click()} className="px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors w-full">Choose CSV / PDF</button>
                        )}
                    </div>
                    
                    <div className="p-5">
                        <div className="mb-3 text-sm font-semibold text-white">Manual Entry</div>
                        <form onSubmit={submitManual} className="space-y-3">
                            <div className="flex gap-2">
                                <input type="date" value={date} onChange={e=>setDate(e.target.value)} required className={`${iCls} w-[40%] flex-shrink-0`}/>
                                <select value={type} onChange={e=>setType(e.target.value)} className={`${iCls} w-[60%] flex-shrink-0 bg-[#1a2234]`}>
                                    <option value="debit">Expense</option><option value="credit">Income</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <input type="number" min="0" step="any" value={amt} onChange={e=>setAmt(e.target.value)} required placeholder="Amount (₹)" className={`${iCls} w-[35%] flex-shrink-0`}/>
                                <input type="text" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Description" className={`${iCls} w-[65%] flex-shrink-0`}/>
                            </div>
                            <div className="flex gap-2">
                                <select value={cat} onChange={e=>setCat(e.target.value)} className={iCls}>
                                    {CATEGORIES.map(c=><option key={c} className="bg-[#1a2234]">{c}</option>)}
                                </select>
                                <button type="submit" disabled={saving} className="px-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium shrink-0 shadow-lg shadow-indigo-600/20">Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            </SectionCard>

            {/* Ledger */}
            <SectionCard>
                <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-b border-[#1f2937] bg-[#1a2234]/50 gap-3">
                    <span className="text-sm font-semibold text-white">Ledger ({filteredTxns.length})</span>
                    <input type="text" placeholder="Search entries..." value={searchTxt} onChange={e=>setSearchTxt(e.target.value)}
                        className="w-full sm:w-56 px-3 py-1.5 bg-[#111827] border border-[#1f2937] rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500/50" />
                </div>
                {loading && filteredTxns.length===0 ? <p className="text-center py-10 text-slate-500">Loading...</p> : 
                 filteredTxns.length===0 ? (
                <p className="text-center text-slate-500 text-sm py-16">No transactions found.</p>
                ):(
                <div className="divide-y divide-[#1f2937] max-h-[500px] overflow-y-auto">
                    {filteredTxns.map(t=>(
                    <div key={t.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#1a2234] transition-colors">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#0f172a]" style={{border: `1px solid ${CAT_COLORS[t.category]||'#475569'}`}}>
                            <FileText className="w-3.5 h-3.5" style={{color: CAT_COLORS[t.category]||'#475569'}}/>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate font-medium">{t.description||'Manual Entry'}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{t.date} · {t.category}</p>
                        </div>
                        <p className={`text-sm font-semibold shrink-0 tabular-nums ${t.type==='credit'?'text-emerald-400':'text-rose-400'}`}>
                        {t.type==='credit'?'+':'-'}{fmtK(t.amount)}
                        </p>
                        <button onClick={()=>del(t.id)} className="text-slate-600 hover:text-rose-400 transition-colors ml-2 shrink-0"><Trash2 className="w-4 h-4"/></button>
                    </div>
                    ))}
                </div>
                )}
            </SectionCard>
        </div>

        <div className="space-y-6">
            {/* Category breakdown */}
            {topCats.length>0&&(
                <SectionCard>
                <SectionHeader icon={BarChart2} iconColor="text-indigo-400" title="Top Spending Categories"/>
                <div className="p-5 space-y-4">
                    {topCats.map(([c,v])=>{
                    const pct = debits>0?(v/debits*100).toFixed(1):0;
                    const col = CAT_COLORS[c]||'#64748b';
                    return (
                        <div key={c} className="group">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-xs font-medium text-slate-300">{c}</span>
                                <span className="text-xs text-slate-400">{fmtK(v)} <span className="text-[10px] text-slate-600 font-mono">({pct}%)</span></span>
                            </div>
                            <div className="flex-1 bg-[#1f2937] rounded-full h-1.5 overflow-hidden">
                                <motion.div className="h-full rounded-full" style={{background:col}} initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.7}}/>
                            </div>
                        </div>
                    );
                    })}
                </div>
                </SectionCard>
            )}
        </div>
      </div>
    </div>
  );
}

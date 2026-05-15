import React from 'react';
import { motion } from 'framer-motion';
import { LayoutList, UploadCloud, FileText, CheckCircle, XCircle, Activity, Zap } from 'lucide-react';
import { fadeUp } from './shared';

function Field({ label, name, value, onChange, type='text', required, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-400 font-medium">{label}{required&&<span className="text-emerald-400 ml-0.5">*</span>}</label>
      {children || <input name={name} value={value} type={type} onChange={onChange}
        className="w-full bg-[#0a0f1e] border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-all"/>}
    </div>
  );
}
function H({ title }) {
  return <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3 pb-2 border-b border-slate-700/50">{title}</h3>;
}
function Sel({ label, name, value, onChange, opts }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-400 font-medium">{label}</label>
      <select name={name} value={value} onChange={onChange}
        className="w-full bg-[#0a0f1e] border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none">
        {opts.map(o=><option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

export function InputPage({ manual, setManual, file, setFile, error, onAnalyze }) {
  const h = e => setManual(p=>({...p,[e.target.name]:e.target.value}));

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <motion.div {...fadeUp(0)} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 text-emerald-400 text-xs font-semibold mb-4">
            <Zap className="w-3 h-3"/> Powered by 6 ML Models · AI Advisor
          </div>
          <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 mb-3">Loan Financial Health</h1>
          <p className="text-slate-400 max-w-xl mx-auto">Fill your financial profile. Optionally upload a bank statement. Get 11 ML-powered insights + AI chat.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Manual Form */}
          <motion.div {...fadeUp(0.1)} className="lg:col-span-2 bg-[#0d1424]/90 backdrop-blur border border-slate-800/70 rounded-3xl p-7 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-emerald-500/15 p-2.5 rounded-xl border border-emerald-500/25"><LayoutList className="w-5 h-5 text-emerald-400"/></div>
              <div><h2 className="font-bold text-white text-lg">Financial Profile</h2><p className="text-xs text-slate-500">* required fields</p></div>
            </div>
            {error&&<div className="mb-4 flex items-center gap-2 p-3 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-xl text-sm"><XCircle className="w-4 h-4 flex-shrink-0"/>{error}</div>}

            <div className="space-y-6 max-h-[68vh] overflow-y-auto pr-2" style={{scrollbarWidth:'thin',scrollbarColor:'#1e293b transparent'}}>
              {/* Personal */}
              <div><H title="Personal Info"/>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Monthly Income (₹)" name="monthly_income" value={manual.monthly_income} onChange={h} required/>
                  <Field label="Dependents" name="dependents" type="number" value={manual.dependents} onChange={h}/>
                  <Sel label="Employment" name="employment_type" value={manual.employment_type} onChange={h} opts={['Salaried','Self Employed','Business Owner','Freelancer']}/>
                  <Sel label="Loan Type" name="loan_type" value={manual.loan_type} onChange={h} opts={['Personal','Home','Car','Education','Business']}/>
                </div>
              </div>
              {/* Loan */}
              <div><H title="Loan Details"/>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Loan Amount (₹)" name="loan_amount" value={manual.loan_amount} onChange={h}/>
                  <Field label="EMI Amount (₹)" name="emi_amount" value={manual.emi_amount} onChange={h} required/>
                  <Field label="Loan Tenure (Months)" name="loan_tenure" type="number" value={manual.loan_tenure} onChange={h} required/>
                  <Field label="Interest Rate (%)" name="interest_rate" value={manual.interest_rate} onChange={h}/>
                </div>
              </div>
              {/* Expenses */}
              <div><H title="Monthly Expenses"/>
                <div className="grid grid-cols-3 gap-3">
                  {[['Rent / Housing','rent'],['Food & Groceries','food'],['Transport','transport'],['Utilities','utilities'],['Insurance','insurance'],['Other','other_expenses']].map(([l,n])=>(
                    <Field key={n} label={`${l} (₹)`} name={n} value={manual[n]} onChange={h}/>
                  ))}
                </div>
              </div>
              {/* Credit */}
              <div><H title="Credit & Savings"/>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Credit Card Payments (₹)" name="credit_card_payments" value={manual.credit_card_payments} onChange={h}/>
                  <Field label="Credit Utilization (%)" name="credit_utilization" type="number" value={manual.credit_utilization} onChange={h}/>
                  <Field label="Account Balance (₹)" name="account_balance" value={manual.account_balance} onChange={h}/>
                  <Field label="Emergency Savings (₹)" name="current_savings" value={manual.current_savings} onChange={h}/>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Upload + Button */}
          <div className="flex flex-col gap-5">
            <motion.div {...fadeUp(0.15)} className="bg-[#0d1424]/90 backdrop-blur border border-slate-800/70 rounded-3xl p-6 shadow-2xl flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-teal-500/15 p-2.5 rounded-xl border border-teal-500/25"><UploadCloud className="w-5 h-5 text-teal-400"/></div>
                <div><h2 className="font-bold text-white">Bank Statement</h2><p className="text-xs text-slate-500">Optional — deeper insights</p></div>
              </div>
              <div className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer group relative transition-all ${file?'border-emerald-500/50 bg-emerald-500/5':'border-slate-700 hover:border-teal-400/50'}`}>
                <input type="file" accept=".pdf,.csv" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e=>setFile(e.target.files[0])}/>
                {file ? (
                  <><CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2"/>
                    <p className="text-emerald-400 font-semibold text-sm">{file.name}</p>
                    <p className="text-slate-500 text-xs mt-1">Ready for ML extraction</p></>
                ) : (
                  <><UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-teal-400 mx-auto mb-2 transition-colors"/>
                    <p className="font-semibold text-sm mb-1 text-slate-300">Upload PDF or CSV</p>
                    <p className="text-slate-500 text-xs">Bank / credit card statement</p></>
                )}
              </div>
              <div className="mt-4 space-y-2">
                {['Salary & income detection','EMI & loan payments','Spending categories (Swiggy, Uber…)','Balance trend','Anomaly detection'].map(t=>(
                  <div key={t} className="flex items-center gap-2 text-xs text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0"/>{t}</div>
                ))}
              </div>
              {file&&<button onClick={()=>setFile(null)} className="mt-3 w-full text-xs text-slate-600 hover:text-rose-400 transition-colors">× Remove file</button>}
            </motion.div>

            <motion.div {...fadeUp(0.2)}>
              <button onClick={onAnalyze}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-500/25 transition-all active:scale-[0.97] text-sm flex items-center justify-center gap-2">
                <Activity className="w-4 h-4"/>
                {file ? 'Analyze Profile + Statement' : 'Analyze Financial Profile'}
              </button>
              <p className="text-center text-xs text-slate-600 mt-2">* required fields must be filled</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

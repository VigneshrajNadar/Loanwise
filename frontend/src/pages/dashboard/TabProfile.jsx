import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, DollarSign, CreditCard, Wallet, Target, Activity, Settings, CheckCircle2, Trash2, Plus } from 'lucide-react';
import { SectionCard, SectionHeader } from './DashboardWidgets';

const API = 'http://localhost:5001/api';

export function TabProfile({token}) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [emis, setEmis] = useState([]);

  // EMI Builder State
  const [emiLabel,  setEmiLabel]  = useState('');
  const [emiAmt,    setEmiAmt]    = useState('');
  const [emiType,   setEmiType]   = useState('Home Loan');
  const [emiMonths, setEmiMonths] = useState('');
  
  const headers = {Authorization:`Bearer ${token}`};

  useEffect(()=>{
    axios.get(`${API}/user/financial-profile`,{headers}).then(r=>{
      if (r.data) {
          setData(r.data);
          setEmis(r.data.emis || []);
      }
    }).catch(()=>{});
  },[token]);

  const submit = async e=>{
    e.preventDefault(); setLoading(true);
    const payload = { ...data, emis };
    // Also compute annual_income so downstream pages can read it directly
    payload.annual_income = (Number(payload.monthly_income) || 0) * 12;
    await axios.post(`${API}/user/financial-profile`, payload, {headers});
    // Persist to localStorage so Default Risk + Decision AI pages can read profile data without a token
    localStorage.setItem('user_profile', JSON.stringify(payload));
    setSaved(true); setTimeout(()=>setSaved(false), 3000); setLoading(false);
  };

  const update = (k, v) => setData(p => ({...p, [k]: v}));

  const addEmi = ()=>{
      if(!emiLabel || !emiAmt) return;
      setEmis(p=>[...p,{label:emiLabel, type:emiType, remaining_months:parseInt(emiMonths)||0, amount:parseFloat(emiAmt)}]);
      setEmiLabel(''); setEmiAmt(''); setEmiMonths(''); setEmiType('Home Loan');
  };
  
  const removeEmi = idx => setEmis(p=>p.filter((_,i)=>i!==idx));
  
  const iCls = "w-full px-3 py-2.5 bg-[#1a2234]/50 border border-[#1f2937] rounded-xl text-sm text-white focus:outline-none focus:border-teal-500/50 transition-colors placeholder-slate-600";
  const iClsSmall = "w-full px-3 py-2 bg-[#1a2234] border border-[#1f2937] rounded-lg text-xs text-white focus:outline-none focus:border-teal-500/50 transition-colors placeholder-slate-600";
  const lCls = "block text-xs font-medium text-slate-400 mb-1.5";

  // Section configs
  const identity = [
      {k:'age', l:'Age', t:'number', p:'28'},
      {k:'city_tier', l:'City Tier', opts:['Metro','Tier 1','Tier 2','Tier 3']},
      {k:'occupation', l:'Occupation', t:'text', p:'Software Engineer'},
      {k:'company_name', l:'Company Name', t:'text', p:'Tech Corp'},
      {k:'work_experience_years', l:'Years of Experience', t:'number', p:'5'},
      {k:'dependents', l:'Dependents', t:'number', p:'0'}
  ];

  const income = [
      {k:'monthly_income', l:'Monthly In-hand Salary (₹)', t:'number', p:'120000'},
      {k:'annual_bonus', l:'Annual Bonus (₹)', t:'number', p:'200000'},
      {k:'other_income', l:'Other Monthly Income (₹)', t:'number', p:'0'},
      {k:'employment_type', l:'Employment', opts:['Salaried','Self-Employed','Freelancer','Business Owner','Government']}
  ];

  const expenses = [
      {k:'monthly_expenses', l:'Base Living Expenses (₹)', t:'number', p:'35000'},
      {k:'rent', l:'Rent (₹)', t:'number', p:'20000'},
      {k:'insurance_premium', l:'Monthly Insurance (₹)', t:'number', p:'3000'}
  ];

  const credit = [
      {k:'cibil_score', l:'Current CIBIL Score', t:'number', p:'750'},
      {k:'credit_cards_count', l:'Active Credit Cards', t:'number', p:'0'},
      {k:'credit_utilization', l:'Card Utilization (%)', t:'number', p:'0'}
  ];

  const assets = [
      {k:'savings', l:'Bank Savings — Liquid (₹)', t:'number', p:'100000'},
      {k:'investments', l:'Mutual Funds / Stocks (₹)', t:'number', p:'500000'},
      {k:'ppf_nps', l:'PF / NPS / Ret. Corpus (₹)', t:'number', p:'0'},
      {k:'gold_value', l:'Gold Value (₹)', t:'number', p:'0'},
      {k:'net_worth_assets', l:'Real Estate Value (₹)', t:'number', p:'0'}
  ];

  const goals = [
      {k:'goal_home_amount', l:'Home Goal Amount (₹)', t:'number', p:'15000000'},
      {k:'goal_home_years', l:'Home Goal Timeline (Yrs)', t:'number', p:'5'},
      {k:'goal_retirement_years', l:'Years to Retirement', t:'number', p:'30'}
  ];

  const handleNumInput = (e, k) => {
      const v = e.target.value;
      if (v === '') update(k, ''); 
      else update(k, Number(v));
  };

  const renderField = (f) => (
      <div key={f.k}>
          <label className={lCls}>{f.l}</label>
          {f.opts ? (
              <select value={data[f.k]||f.opts[0]} onChange={e=>update(f.k, e.target.value)} className={iCls}>
                  {f.opts.map(o=><option key={o} value={o} className="bg-[#1a2234]">{o}</option>)}
              </select>
          ) : (
              <input 
                  type={f.t} min="0" step="any" 
                  value={data[f.k] ?? ''} 
                  onChange={e => f.t === 'number' ? handleNumInput(e, f.k) : update(f.k, e.target.value)} 
                  placeholder={f.p} 
                  className={iCls}
              />
          )}
      </div>
  );

  return (
    <form onSubmit={submit} className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-white"><User className="w-5 h-5 text-teal-400"/> Financial Profile</h2>
            <p className="text-xs text-slate-500 mt-0.5">Leave blank or enter 0 for fields that don't apply to you.</p>
          </div>
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shrink-0">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : saved ? <><CheckCircle2 className="w-4 h-4"/> Saved!</> : <><Settings className="w-4 h-4"/> Save Profile</>}
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SectionCard><SectionHeader icon={User} iconColor="text-blue-400" title="1. Identity & Work"/><div className="p-5 grid gap-4">{identity.map(renderField)}</div></SectionCard>
          <SectionCard><SectionHeader icon={DollarSign} iconColor="text-emerald-400" title="2. Income Details"/><div className="p-5 grid gap-4">{income.map(renderField)}</div></SectionCard>
          
          <SectionCard className="md:col-span-2 lg:col-span-1 border-rose-500/20">
              <SectionHeader icon={Activity} iconColor="text-rose-400" title="3. Monthly Outflows"/>
              <div className="p-5 grid gap-4">
                  {expenses.map(renderField)}
                  
                  {/* EMIs Builder Section */}
                  <div className="mt-4 pt-5 border-t border-[#1f2937]">
                      <p className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
                          Active EMIs
                          <span className="text-rose-400">Total: ₹{(emis.reduce((s,e)=>s+(Number(e.amount)||0),0)).toLocaleString('en-IN')}/mo</span>
                      </p>
                      
                      <div className="space-y-2 mb-4">
                          {emis.map((e,i)=>(
                          <div key={i} className="flex items-center gap-2 p-2 bg-[#1a2234] border border-[#1f2937] rounded-lg">
                              <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-semibold text-white truncate">{e.label}</p>
                                  <p className="text-[10px] text-slate-500">{e.type} {e.remaining_months ? `(${e.remaining_months}mo)` : ''}</p>
                              </div>
                              <span className="text-[11px] text-rose-400 font-semibold px-2">₹{Number(e.amount).toLocaleString('en-IN')}</span>
                              <button type="button" onClick={()=>removeEmi(i)} className="text-slate-500 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
                          ))}
                          {emis.length === 0 && <p className="text-[11px] text-slate-500 italic">No active EMIs added.</p>}
                      </div>

                      {/* Add New EMI */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#1f2937]/50">
                          <input type="text" value={emiLabel} onChange={e=>setEmiLabel(e.target.value)} placeholder="Bank / Label" className={iClsSmall}/>
                          <select value={emiType} onChange={e=>setEmiType(e.target.value)} className={iClsSmall}>
                              <option className="bg-[#1a2234]">Home Loan</option>
                              <option className="bg-[#1a2234]">Auto Loan</option>
                              <option className="bg-[#1a2234]">Personal Loan</option>
                              <option className="bg-[#1a2234]">Credit Card</option>
                              <option className="bg-[#1a2234]">Other</option>
                          </select>
                          <input type="number" min="0" value={emiAmt} onChange={e=>setEmiAmt(e.target.value)} placeholder="₹ / month" className={iClsSmall}/>
                          <input type="number" min="1" value={emiMonths} onChange={e=>setEmiMonths(e.target.value)} placeholder="Months left" className={iClsSmall}/>
                          <button type="button" onClick={addEmi} className="col-span-2 py-2 bg-[#1a2234] hover:bg-[#1f2937] border border-[#1f2937] text-slate-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors mt-1">
                              <Plus className="w-3.5 h-3.5 text-emerald-400"/> Add EMI
                          </button>
                      </div>
                  </div>
              </div>
          </SectionCard>

          <SectionCard><SectionHeader icon={CreditCard} iconColor="text-indigo-400" title="4. Credit Profile"/><div className="p-5 grid gap-4">{credit.map(renderField)}</div></SectionCard>
          <SectionCard><SectionHeader icon={Wallet} iconColor="text-purple-400" title="5. Assets & Investments"/><div className="p-5 grid gap-4">{assets.map(renderField)}</div></SectionCard>
          <SectionCard><SectionHeader icon={Target} iconColor="text-amber-400" title="6. Financial Goals"/><div className="p-5 grid gap-4">{goals.map(renderField)}</div></SectionCard>

          {/* Sticky Save Footer */}
          <div className="mt-8 flex items-center justify-between p-4 bg-teal-500/10 border border-teal-500/30 rounded-2xl">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className={`w-5 h-5 text-teal-400 ${saved ? "scale-110" : "scale-100"} transition-transform`} />
                  </div>
                  <div>
                      <h4 className="text-sm font-bold text-teal-400">Save Your Configuration</h4>
                      <p className="text-xs text-teal-400/80">Updating your profile enables more accurate analysis.</p>
                  </div>
              </div>
              <button type="submit" disabled={loading} className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-[#0f172a] text-sm font-bold tracking-wide rounded-xl transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 min-w-[140px]">
                  {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}
              </button>
          </div>
      </div>
    </form>
  );
}

import React from 'react';
import { Card, SectionTitle, fmt } from '../drp/shared';
import { 
  CheckCircle, XCircle, TrendingUp, TrendingDown, Target, AlertCircle, 
  Zap, FileText, Cpu, Building2, Calendar, Briefcase, UserPlus, ShieldPlus, ListChecks, ArrowRight
} from 'lucide-react';

export function Section1CoreStatus({ result }) {
  const { eligible, probability, suggestedLimit, loanType, threshold } = result.core_status;
  return (
    <section>
      <SectionTitle n={1} title="Approval Probability & Status" subtitle="The core Machine Learning verdict based on thousands of prior loan approvals"/>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={`relative overflow-hidden ${eligible ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
           <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-full ${eligible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {eligible ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase text-slate-500">Status</p>
                 <p className={`text-2xl font-black ${eligible ? 'text-emerald-400' : 'text-rose-400'}`}>
                   {eligible ? 'Pre-Approved' : 'High Rejection Risk'}
                 </p>
              </div>
           </div>
           <div className="space-y-1">
             <div className="flex justify-between items-end">
               <span className="text-xs font-bold text-slate-400">Approval Probability</span>
               <span className="text-xl font-black text-white">{probability}%</span>
             </div>
             <div className="h-2 bg-slate-800 rounded-full w-full overflow-hidden">
               <div className={`h-full ${eligible ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${probability}%` }} />
             </div>
             <p className="text-[10px] text-slate-500 mt-2 font-medium">Model threshold for {loanType} is {threshold}%. You are {Math.abs(probability - threshold).toFixed(1)}% {eligible ? 'above' : 'below'} the cut-off.</p>
           </div>
        </Card>
        
        <Card className="flex flex-col justify-center">
           <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Suggested Safe Limit</p>
           <p className="text-5xl font-black text-white">{fmt(suggestedLimit)}</p>
           <p className="text-xs text-slate-400 font-medium mt-4 leading-relaxed">
             Based on your residual income (after existing EMIs), this is the maximum guaranteed limit our system recommends.
           </p>
        </Card>
      </div>
    </section>
  );
}

export function Section2DriverAnalysis({ result }) {
  const { positive, negative } = result.driver_analysis;
  return (
    <section>
      <SectionTitle n={2} title="Approval Driver Analysis" subtitle="Key factors dynamically influencing your specific decision"/>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="border-emerald-500/10">
           <h3 className="text-sm font-black text-emerald-400 uppercase italic tracking-tighter mb-4 flex items-center gap-2">
             <TrendingUp className="w-5 h-5"/> Propelling Factors
           </h3>
           <div className="space-y-3">
             {positive.length ? positive.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-emerald-500/10">
                   <div className="w-2 h-2 rounded-full bg-emerald-500" />
                   <p className="text-xs text-slate-300 font-bold">{f}</p>
                </div>
             )) : <p className="text-xs text-slate-500 p-3 italic">No major propelling factors identified.</p>}
           </div>
         </Card>
         <Card className="border-rose-500/10">
           <h3 className="text-sm font-black text-rose-400 uppercase italic tracking-tighter mb-4 flex items-center gap-2">
             <TrendingDown className="w-5 h-5"/> Drag Factors
           </h3>
           <div className="space-y-3">
             {negative.length ? negative.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-rose-500/10">
                   <div className="w-2 h-2 rounded-full bg-rose-500" />
                   <p className="text-xs text-slate-300 font-bold">{f}</p>
                </div>
             )) : <p className="text-xs text-slate-500 p-3 italic">No major drag factors identified.</p>}
           </div>
         </Card>
      </div>
    </section>
  );
}

export function Section3BoundaryMapping({ result }) {
  const { current_dti, max_allowed_dti, buffer } = result.boundary_mapping;
  return (
    <section>
      <SectionTitle n={3} title="Debt-to-Income Boundary Mapping" subtitle="Visualizing your FOIR (Fixed Obligation to Income Ratio) limits"/>
      <Card>
        <div className="flex justify-between items-end mb-4">
           <div>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Current DTI</p>
              <p className="text-3xl font-black text-white">{current_dti}%</p>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Max Bank Threshold</p>
              <p className="text-3xl font-black text-rose-400">{max_allowed_dti}%</p>
           </div>
        </div>
        <div className="h-4 bg-slate-800 rounded-full w-full overflow-hidden flex relative">
           <div className={`${current_dti > max_allowed_dti ? 'bg-rose-500' : 'bg-indigo-500'} h-full transition-all`} style={{ width: `${Math.min(100, current_dti)}%` }} />
           <div className="absolute top-0 bottom-0 w-0.5 bg-rose-500" style={{ left: `${max_allowed_dti}%` }} />
        </div>
        <p className="text-xs text-slate-400 font-medium mt-4 text-center">
           {buffer > 0 ? `You have a ${buffer.toFixed(1)}% buffer before hitting the rejection zone.` : `You've exceeded the DTI limit by ${Math.abs(buffer).toFixed(1)}%.`}
        </p>
      </Card>
    </section>
  );
}

export function Section4HiddenFactors({ result }) {
  const factors = result.hidden_factors;
  return (
    <section>
      <SectionTitle n={4} title="Hidden Risk Factors" subtitle="Subtle variables underwriters look for manually"/>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {factors.map((f, i) => (
            <Card key={i} className="flex items-start gap-4 p-5 bg-amber-500/5 border-amber-500/10">
               <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
               <p className="text-sm font-bold text-slate-300 leading-relaxed">{f}</p>
            </Card>
         ))}
      </div>
    </section>
  );
}

export function Section5FastTrack({ result }) {
  const steps = result.fast_track;
  return (
    <section>
      <SectionTitle n={5} title="Score Improvement Fast-Track" subtitle="Highest ROI actions to bump odds within 30 days"/>
      <div className="space-y-4">
         {steps.map((st, i) => (
            <Card key={i} className="group border-emerald-500/20 bg-transparent flex flex-col md:flex-row items-center gap-6 p-6">
               <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Zap className="w-6 h-6" />
               </div>
               <div className="flex-1 text-center md:text-left">
                  <h3 className="text-lg font-black text-white">{st.action}</h3>
                  <p className="text-xs text-slate-500 uppercase font-bold mt-1">Estimated Impact Time: 15-30 Days</p>
               </div>
               <div className="text-center md:text-right">
                  <p className="text-3xl font-black text-emerald-400">+{st.point_bump}%</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Prob. Boost</p>
               </div>
            </Card>
         ))}
      </div>
    </section>
  );
}

export function Section6BureauArchetype({ result }) {
  const arch = result.bureau_archetype;
  return (
    <section>
      <SectionTitle n={6} title="Bureau Archetype Match" subtitle="How lending computers categorize your profile instantly"/>
      <Card className="text-center py-12">
        <Target className="w-16 h-16 text-indigo-400 mx-auto mb-6 opacity-80" />
        <p className="text-xs font-black uppercase text-slate-500 tracking-[0.3em] mb-2">Automated Categorization</p>
        <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
           {arch}
        </p>
      </Card>
    </section>
  );
}

export function Section7UnderwriterEmulation({ result }) {
  const { notes, risk_tier } = result.underwriter;
  return (
    <section>
      <SectionTitle n={7} title="AI Underwriter Emulation" subtitle="Simulated manual review notes of a human underwriter"/>
      <Card className="relative overflow-hidden bg-slate-900">
        <div className="absolute right-0 top-0 opacity-5 pointer-events-none p-4"><FileText className="w-32 h-32"/></div>
        <div className="flex items-center gap-3 mb-6">
           <Cpu className="w-6 h-6 text-teal-400" />
           <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">System Log 0x489F</p>
        </div>
        <p className="font-mono text-sm text-teal-400/80 leading-relaxed mb-6 border-l-2 border-teal-500/30 pl-4 py-2">
           {notes}
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 border border-white/5">
           <span className="text-[10px] uppercase font-black text-slate-500">Manual Risk Tier:</span>
           <span className={`text-xs font-black uppercase ${risk_tier === 'Low' ? 'text-emerald-400' : risk_tier === 'High' ? 'text-rose-400' : 'text-amber-400'}`}>
             {risk_tier}
           </span>
        </div>
      </Card>
    </section>
  );
}

export function Section8OptimalSizing({ result }) {
  const { requested, guaranteed_approval_limit, max_stretch_limit } = result.optimal_sizing;
  return (
    <section>
      <SectionTitle n={8} title="Optimal Loan Sizing" subtitle="The absolute maximums before algorithm rejection"/>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="opacity-80">
           <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Requested Amount</p>
           <p className="text-2xl font-black text-white">{fmt(requested)}</p>
        </Card>
        <Card className="bg-emerald-500/10 border-emerald-500/20">
           <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Guaranteed Limit</p>
           <p className="text-2xl font-black text-emerald-400">{fmt(guaranteed_approval_limit)}</p>
        </Card>
        <Card className="bg-rose-500/5">
           <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Max Stretch Limit</p>
           <p className="text-2xl font-black text-rose-400">{fmt(max_stretch_limit)}</p>
        </Card>
      </div>
    </section>
  );
}

export function Section9MatchingLenders({ result }) {
  const { tier_1, tier_2 } = result.matching_lenders;
  return (
    <section>
      <SectionTitle n={9} title="Best Matching Lenders" subtitle="Lending institutions mathematically suited to your profile"/>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
           <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Tier 1 Banks</h3>
           </div>
           <div className="flex flex-wrap gap-2">
             {tier_1.map((b,i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 text-xs font-bold border border-indigo-500/20">{b}</span>
             ))}
           </div>
        </Card>
        <Card>
           <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-5 h-5 text-slate-400" />
              <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">NBFCs / Tier 2</h3>
           </div>
           <div className="flex flex-wrap gap-2">
             {tier_2.map((b,i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold border border-white/5">{b}</span>
             ))}
           </div>
        </Card>
      </div>
    </section>
  );
}

export function Section10SeasonalTrends({ result }) {
  return (
    <section>
      <SectionTitle n={10} title="Seasonal & Trend Approval Rates" subtitle="How current market liquidity impacts your odds today"/>
      <Card className="flex items-center gap-6 p-8 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
         <Calendar className="w-12 h-12 text-purple-400 shrink-0" />
         <p className="text-lg font-bold text-white leading-relaxed">{result.seasonal_trends}</p>
      </Card>
    </section>
  );
}

export function Section11EmploymentWeighting({ result }) {
  const w = result.employment_weighting;
  return (
    <section>
      <SectionTitle n={11} title="Employment Stability Weighting" subtitle="How your income source modifies your basic approval score"/>
      <Card>
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-800 rounded-xl"><Briefcase className="w-6 h-6 text-slate-300" /></div>
              <div>
                 <p className="text-[10px] font-black uppercase text-slate-500">Employment Category</p>
                 <p className="text-xl font-black text-white">{w.category}</p>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-1">ML Confidence Multiplier</p>
              <div className="inline-flex items-center px-3 py-1 rounded bg-slate-900 border border-white/10 text-xs text-amber-400 font-bold">
                 {w.ml_confidence_multiplier}
              </div>
           </div>
         </div>
      </Card>
    </section>
  );
}

export function Section12VerificationFriction({ result }) {
  const fr = result.verification_friction;
  return (
    <section>
      <SectionTitle n={12} title="Verification Friction Points" subtitle="Expected delays during processing and KYC"/>
      <Card className="space-y-3">
         {fr.map((f, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-white/5 flex gap-4 items-start">
               <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
               <p className="text-sm font-bold text-slate-300">{f}</p>
            </div>
         ))}
      </Card>
    </section>
  );
}

export function Section13CoApplicantBoost({ result }) {
  const { base_prob, simulated_prob_with_spouse } = result.coapplicant_boost;
  return (
    <section>
      <SectionTitle n={13} title="Co-Applicant Power Boost" subtitle="Simulated odds if a strong earning partner is added"/>
      <Card>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
               <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4">Probability Trajectory</p>
               <div className="flex items-center gap-4">
                  <div className="text-center">
                     <p className="text-xl font-black text-slate-400">{base_prob}%</p>
                     <p className="text-[9px] font-bold uppercase text-slate-500">Solo</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-emerald-500" />
                  <div className="text-center">
                     <p className="text-3xl font-black text-emerald-400">{simulated_prob_with_spouse}%</p>
                     <p className="text-[9px] font-bold uppercase text-slate-500">Co-App</p>
                  </div>
               </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
               <UserPlus className="w-8 h-8 text-emerald-400 shrink-0" />
               <p className="text-xs font-bold text-emerald-300 leading-relaxed">
                  Adding a salaried co-applicant dramatically reduces FOIR and instantly pushes probabilities near certainty.
               </p>
            </div>
         </div>
      </Card>
    </section>
  );
}

export function Section14CollateralOffset({ result }) {
  const c = result.collateral_offset;
  return (
    <section>
      <SectionTitle n={14} title="Collateral Risk Offset" subtitle="How securing the loan changes approval parameters"/>
      <Card className={c.status === 'Secured' ? 'border-emerald-500/20' : ''}>
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
               <ShieldPlus className="w-6 h-6 text-indigo-400" />
               <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Collateral Offset Engine</h3>
            </div>
            <span className="px-2 py-1 rounded bg-slate-800 text-[10px] font-black uppercase text-slate-400">{c.status} Type</span>
         </div>
         {c.status === 'Unsecured' ? (
            <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/20 text-center">
               <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Simulated Secured Probability</p>
               <p className="text-3xl font-black text-indigo-400 mb-1">{c.hypothetical_secured_prob}%</p>
               <p className="text-xs text-slate-400">If backed by property/gold, approval odds rocket by ~20%.</p>
            </div>
         ) : (
            <p className="text-sm font-bold text-emerald-400 bg-emerald-500/10 p-4 rounded-xl">{c.benefit}</p>
         )}
      </Card>
    </section>
  );
}

export function Section15PreApprovalChecklist({ result }) {
  const list = result.pre_approval_checklist;
  return (
    <section>
      <SectionTitle n={15} title="Pre-Approval Checklist & Timeline" subtitle="Exact steps required in the next 72 hours for funding"/>
      <Card className="border-dashed border-2">
         <div className="flex items-center gap-3 mb-6">
            <ListChecks className="w-6 h-6 text-teal-400" />
            <h3 className="text-sm font-black text-white uppercase">Action Required</h3>
         </div>
         <div className="space-y-4">
            {list.map((item, i) => (
               <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50">
                  <div className="w-6 h-6 rounded-full border-2 border-slate-600 shrink-0" />
                  <p className="text-sm font-bold text-slate-300">{item}</p>
               </div>
            ))}
         </div>
      </Card>
    </section>
  );
}

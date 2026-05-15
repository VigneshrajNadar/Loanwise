import React from 'react';
import { Activity, TrendingUp, CreditCard, TrendingDown, User } from 'lucide-react';
import { KPI, Card, SectionTitle, fmt, pct, fadeUp } from './shared';
import { motion } from 'framer-motion';

export function Section3LoanInsights({ data }) {
  const f  = data.features;
  const d  = data.extractedData;
  const ld = data.loanDetails || {};
  const bp = data.borrowerProfile || {};

  return (
    <section>
      <SectionTitle n={3} title="Loan Insights" subtitle="EMI stress, risk, borrower intelligence"/>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <KPI title="EMI Stress" value={f.emiStress.status} sub={`EMI Ratio: ${pct(f.emiStress.emiRatio)}`}
          icon={Activity}
          color={f.emiStress.status==='Safe'?'text-emerald-400':f.emiStress.status==='Warning'?'text-amber-400':'text-rose-400'}
          bg={f.emiStress.status==='Safe'?'bg-emerald-400/10':'bg-amber-400/10'}
          border={f.emiStress.status==='Safe'?'border-emerald-500/20':'border-amber-500/20'} delay={0.05}/>
        <KPI title="Affordability" value={f.affordability.status} sub={`Disposable: ${fmt(f.affordability.remaining)}`}
          icon={TrendingUp} color="text-blue-400" bg="bg-blue-400/10" border="border-blue-500/20" delay={0.07}/>
        <KPI title="Over-Borrowing" value={f.overBorrowing.status} sub={`Active loans: ${d.number_of_active_loans}`}
          icon={CreditCard}
          color={f.overBorrowing.status==='Safe'?'text-emerald-400':'text-rose-400'}
          bg={f.overBorrowing.status==='Safe'?'bg-emerald-400/10':'bg-rose-400/10'}
          border={f.overBorrowing.status==='Safe'?'border-emerald-500/20':'border-rose-500/20'} delay={0.09}/>
        <KPI title="Lifestyle Impact" value={`-${f.lifestyleImpact.reductionPct}%`} sub="Due to EMI obligations"
          icon={TrendingDown} color="text-purple-400" bg="bg-purple-400/10" border="border-purple-500/20" delay={0.11}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Loan details */}
        <Card delay={0.13}>
          <h3 className="font-semibold text-white mb-4">Loan Details</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Loan Amount',   fmt(ld.loanAmount)],
              ['Tenure',        `${ld.tenure} months`],
              ['Interest Rate', `${ld.interestRate}%`],
              ['Loan Type',     ld.loanType],
              ['Monthly EMI',   fmt(d.emi_amount)],
              ['Credit Util.',  `${d.credit_utilization}%`],
            ].map(([l,v])=>(
              <div key={l} className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/50">
                <p className="text-xs text-slate-500 mb-1">{l}</p>
                <p className="font-bold text-white text-sm">{v||'—'}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Borrower Profile */}
        <Card delay={0.16}>
          <h3 className="font-semibold text-white mb-4">Borrower Profile (ML Clustering)</h3>
          <div className="flex items-center gap-5 mb-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center border-4"
              style={{borderColor:bp.color+'40', backgroundColor:bp.color+'15'}}>
              <User className="w-8 h-8" style={{color:bp.color}}/>
            </div>
            <div>
              <p className="font-bold text-xl text-white">{bp.profile}</p>
              <p className="text-sm text-slate-400 mt-1">Payment Consistency: <span className="font-bold" style={{color:bp.color}}>{bp.consistency}%</span></p>
            </div>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mb-1">
            <div className="h-2 rounded-full transition-all duration-700" style={{width:`${bp.consistency}%`, backgroundColor:bp.color}}/>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1"><span>High Risk</span><span>Responsible</span></div>
          <div className="mt-4 p-3 rounded-xl border text-xs" style={{backgroundColor:bp.color+'08', borderColor:bp.color+'30', color:bp.color}}>
            ML Prediction · K-Means Clustering · Trained on Lending Club dataset
          </div>
        </Card>
      </div>
    </section>
  );
}

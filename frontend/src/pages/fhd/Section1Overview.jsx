import React from 'react';
import { ShieldCheck, Target, PiggyBank, AlertTriangle } from 'lucide-react';
import { KPI, Card, SectionTitle, fmt, pct, fadeUp } from './shared';
import { motion } from 'framer-motion';

export function Section1Overview({ data }) {
  const f = data.features;
  const hs = f.healthScore.score;
  const lb = f.emiStress.loanBurden;
  const cov = f.emergencyFund.coverageMonths;
  const risk = f.missedEmiRisk.riskPct;

  return (
    <section>
      <SectionTitle n={1} title="Financial Health Overview" subtitle="Core ML-powered metrics"/>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        <KPI title="Health Score" value={`${hs}/100`}
          sub={hs>=70?'Strong position':hs>=40?'Needs attention':'High risk'}
          icon={ShieldCheck}
          color={hs>=70?'text-emerald-400':'text-amber-400'}
          bg={hs>=70?'bg-emerald-400/10':'bg-amber-400/10'}
          border={hs>=70?'border-emerald-500/20':'border-amber-500/20'} delay={0.06}/>
        <KPI title="Loan Burden" value={pct(lb)}
          sub={lb<=35?'Healthy · <35% recommended':'Above safe threshold'}
          icon={Target}
          color={lb<=35?'text-emerald-400':'text-rose-400'}
          bg={lb<=35?'bg-emerald-400/10':'bg-rose-400/10'}
          border={lb<=35?'border-emerald-500/20':'border-rose-500/20'} delay={0.09}/>
        <KPI title="Savings Coverage" value={`${cov} mo`}
          sub={`Recommended: 6 months · ${f.emergencyFund.status}`}
          icon={PiggyBank}
          color={f.emergencyFund.status==='Adequate'?'text-teal-400':'text-amber-400'}
          bg="bg-teal-400/10" border="border-teal-500/20" delay={0.12}/>
        <KPI title="Missed EMI Risk" value={pct(risk)}
          sub={f.missedEmiRisk.defaultWarning}
          icon={AlertTriangle}
          color={risk>40?'text-rose-400':'text-amber-400'}
          bg={risk>40?'bg-rose-400/10':'bg-amber-400/10'}
          border={risk>40?'border-rose-500/20':'border-amber-500/20'} delay={0.15}/>
      </div>

      {/* Score factors */}
      <Card delay={0.18}>
        <p className="text-sm font-semibold text-slate-300 mb-4">Score Breakdown — Why {hs}/100</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(f.healthScore.factors||[]).map((fac,i)=>(
            <div key={i} className={`flex items-start gap-2 p-3 rounded-xl border ${fac.impact==='+'?'bg-emerald-500/5 border-emerald-500/20':'bg-rose-500/5 border-rose-500/20'}`}>
              <span className={`text-lg font-black leading-none ${fac.impact==='+'?'text-emerald-400':'text-rose-400'}`}>{fac.impact}</span>
              <div>
                <p className="text-xs font-bold text-white">{fac.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{fac.note}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

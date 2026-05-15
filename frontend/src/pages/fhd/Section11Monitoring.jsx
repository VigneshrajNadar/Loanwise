import React from 'react';
import { Card, SectionTitle } from './shared';
import { Bell, Clock, ShieldAlert, CheckCircle2, TrendingUp } from 'lucide-react';

export function Section11Monitoring({ data }) {
  const al = data.alerts || [];
  const f  = data.features;

  return (
    <section>
      <SectionTitle n={11} title="Smart Monitoring & Alerts" subtitle="Real-time financial safety net & anomaly detection"/>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <Card delay={0.05}>
          <div className="flex items-center gap-2 mb-5">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-white">Critical Notifications</h3>
          </div>
          
          <div className="space-y-3">
            {al.length > 0 ? al.map((a, i) => (
              <div key={i} className={`flex items-start gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.01] ${
                a.type === 'danger' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' :
                a.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
                'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              }`}>
                {a.type === 'danger' ? <ShieldAlert className="w-5 h-5 flex-shrink-0" /> : <Bell className="w-5 h-5 flex-shrink-0" />}
                <div>
                  <p className="text-sm font-bold capitalize">{a.type} Priority</p>
                  <p className="text-sm opacity-80 mt-1">{a.msg}</p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500 opacity-60">
                <CheckCircle2 className="w-12 h-12 mb-3" />
                <p className="text-sm font-medium">No active alerts. All systems normal.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Schedule & Behavior */}
        <div className="space-y-6">
          <Card delay={0.1}>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-teal-400" />
              <h3 className="font-semibold text-white">Automated EMI Reminders</h3>
            </div>
            <div className="p-5 rounded-2xl bg-[#1e293b]/40 border border-slate-700/50 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Scheduled Window</p>
                <p className="text-lg font-black text-white">{f.smartReminder.schedule}</p>
              </div>
              <div className="px-3 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-lg text-xs font-bold">
                AUTO-ENABLED
              </div>
            </div>
          </Card>

          <Card delay={0.15}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-white">Spending Anomaly Scanner</h3>
            </div>
            <div className={`p-5 rounded-2xl border flex items-center gap-4 ${
              f.spendingBehavior.isAnomaly ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
            }`}>
              <div className={`p-3 rounded-full ${f.spendingBehavior.isAnomaly ? 'bg-rose-500/20' : 'bg-emerald-500/20'}`}>
                {f.spendingBehavior.isAnomaly ? <ShieldAlert className="w-6 h-6 text-rose-400" /> : <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
              </div>
              <div>
                <p className={`text-sm font-bold ${f.spendingBehavior.isAnomaly ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {f.spendingBehavior.isAnomaly ? 'Anomaly Detected!' : 'Spending Behavior: Normal'}
                </p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {f.spendingBehavior.isAnomaly 
                    ? 'Unusual spending pattern detected this month based on Isolation Forest ML model. Review largest transactions.' 
                    : 'Your daily transaction distribution aligns perfectly with your 6-month historical average.'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import { Shield, TrendingUp, AlertTriangle, CheckCircle2, PieChart, Activity, DollarSign, Brain } from 'lucide-react';

// Light themed A4 sized container for PDF generation
// We use inline styles for ALL colors because html2pdf (html2canvas) crashes on Tailwind v4's 'oklch()' color functions.
export default function MonthlyReportPDF({ data, userName = "User" }) {
    if (!data) return null;

    const {
        health_score = 0,
        health_score_change = '-',
        executive_summary = '',
        best_decision = '',
        worst_decision = '',
        top_3_action_items = [],
        analyses_history = [],
        metrics = {},
        alerts = []
    } = data;

    const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const currentMonth = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    const scoreColor = health_score >= 70 ? '#059669' : health_score >= 50 ? '#f59e0b' : '#e11d48'; // emerald-600, amber-500, rose-600
    const scoreBg = health_score >= 70 ? '#d1fae5' : health_score >= 50 ? '#fef3c7' : '#ffe4e6'; // emerald-100, amber-100, rose-100

    return (
        <div id="monthly-report-pdf-content" className="w-[794px] min-h-[1123px] p-12 font-sans overflow-hidden" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 pb-8 mb-8" style={{ borderColor: '#f1f5f9' }}>
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#4f46e5' }}>
                            <Activity className="w-6 h-6" style={{ color: '#ffffff' }} />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight" style={{ color: '#0f172a' }}>Loanwise</h1>
                    </div>
                    <p className="font-medium" style={{ color: '#64748b' }}>Monthly Financial Health Report</p>
                    <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Prepared for <span className="font-bold" style={{ color: '#334155' }}>{userName}</span></p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black" style={{ color: '#4f46e5' }}>{currentMonth}</p>
                    <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Generated: {today}</p>
                </div>
            </div>

            {/* Health Score Overview */}
            <div className="grid grid-cols-3 gap-6 mb-10">
                <div className="col-span-1 border rounded-2xl p-6" style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
                    <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>
                        <Shield className="w-4 h-4" /> Overall Health
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black tracking-tighter" style={{ color: scoreColor }}>{health_score}</span>
                        <span className="font-medium text-lg" style={{ color: '#94a3b8' }}>/100</span>
                    </div>
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: '#e2e8f0' }}>
                        <p className="text-sm font-medium" style={{ color: '#475569' }}>
                            Trend: <span className="font-bold" style={{ color: '#4f46e5' }}>{health_score_change}</span>
                        </p>
                    </div>
                </div>

                <div className="col-span-2 border rounded-2xl p-6" style={{ backgroundColor: '#eef2ff', borderColor: '#e0e7ff' }}>
                    <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#4f46e5' }}>
                        <Brain className="w-4 h-4" /> Fractional CFO Executive Summary
                    </div>
                    <p className="leading-relaxed font-medium" style={{ color: '#334155' }}>
                        {executive_summary}
                    </p>
                </div>
            </div>

            {/* Wins & Mistakes */}
            <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="border rounded-2xl p-6" style={{ backgroundColor: '#ecfdf5', borderColor: '#d1fae5' }}>
                    <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#059669' }}>
                        <TrendingUp className="w-4 h-4" /> Highlight of the Month
                    </div>
                    <p className="leading-relaxed text-sm font-medium" style={{ color: '#334155' }}>
                        {best_decision}
                    </p>
                </div>
                
                <div className="border rounded-2xl p-6" style={{ backgroundColor: '#fff1f2', borderColor: '#ffe4e6' }}>
                    <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#e11d48' }}>
                        <AlertTriangle className="w-4 h-4" /> Area of Concern
                    </div>
                    <p className="leading-relaxed text-sm font-medium" style={{ color: '#334155' }}>
                        {worst_decision}
                    </p>
                </div>
            </div>

            {/* Dashboard Core Metrics */}
            <div className="mb-10">
                <h3 className="text-lg font-black mb-4 flex items-center gap-2" style={{ color: '#0f172a' }}>
                    <DollarSign className="w-5 h-5" style={{ color: '#4f46e5' }} /> Core Dashboard Metrics
                </h3>
                <div className="grid grid-cols-4 gap-4">
                    <div className="border rounded-xl p-4 text-center" style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>CIBIL Score</p>
                        <p className="text-3xl font-black" style={{ color: metrics.cibil >= 750 ? '#059669' : '#e11d48' }}>{metrics.cibil || 'N/A'}</p>
                    </div>
                    <div className="border rounded-xl p-4 text-center" style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>EMI Load</p>
                        <p className="text-3xl font-black" style={{ color: metrics.emi_ratio > 50 ? '#e11d48' : '#059669' }}>{metrics.emi_ratio}%</p>
                    </div>
                    <div className="border rounded-xl p-4 text-center" style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>Active EMIs</p>
                        <p className="text-3xl font-black" style={{ color: '#334155' }}>₹{(metrics.current_emis / 1000).toFixed(1)}k</p>
                    </div>
                    <div className="border rounded-xl p-4 text-center" style={{ backgroundColor: '#eef2ff', borderColor: '#e0e7ff' }}>
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#4f46e5' }}>Max Eligibility</p>
                        <p className="text-3xl font-black" style={{ color: '#4f46e5' }}>₹{(metrics.max_homeloan / 100000).toFixed(1)}L</p>
                    </div>
                </div>
            </div>

            {/* Action Items */}
            <div className="mb-10">
                <h3 className="text-lg font-black mb-4 flex items-center gap-2" style={{ color: '#0f172a' }}>
                    <CheckCircle2 className="w-5 h-5" style={{ color: '#4f46e5' }} /> Action Plan for Next Month
                </h3>
                <div className="border rounded-2xl overflow-hidden" style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
                    {top_3_action_items.map((item, i) => (
                        <div key={i} className="flex gap-4 p-5 border-b last:border-0 items-start" style={{ borderColor: '#f1f5f9' }}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                                {i + 1}
                            </div>
                            <p className="font-medium leading-relaxed" style={{ color: '#334155' }}>{item}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* System Alerts */}
            {alerts && alerts.length > 0 && (
                <div className="mb-10" style={{ pageBreakInside: 'avoid' }}>
                    <h3 className="text-lg font-black mb-4 flex items-center gap-2" style={{ color: '#0f172a' }}>
                        <AlertTriangle className="w-5 h-5" style={{ color: '#e11d48' }} /> Active Risk Alerts
                    </h3>
                    <div className="space-y-3">
                        {alerts.map((al, idx) => (
                            <div key={idx} className="p-4 rounded-xl border flex gap-3 items-start" style={{ 
                                backgroundColor: al.severity === 'Critical' ? '#fff1f2' : al.severity === 'Warning' ? '#fef3c7' : '#f8fafc',
                                borderColor: al.severity === 'Critical' ? '#ffe4e6' : al.severity === 'Warning' ? '#fde68a' : '#f1f5f9'
                            }}>
                                <div className="mt-0.5 shrink-0">
                                    {al.severity === 'Critical' || al.severity === 'Warning' ? (
                                        <AlertTriangle className="w-5 h-5" style={{ color: al.severity === 'Critical' ? '#e11d48' : '#d97706' }} />
                                    ) : (
                                        <Shield className="w-5 h-5" style={{ color: '#64748b' }} />
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-sm mb-1" style={{ color: al.severity === 'Critical' ? '#9f1239' : al.severity === 'Warning' ? '#92400e' : '#334155' }}>
                                        {al.title || 'System Notification'}
                                    </p>
                                    <p className="text-sm font-medium" style={{ color: al.severity === 'Critical' ? '#be123c' : al.severity === 'Warning' ? '#b45309' : '#475569' }}>
                                        {al.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Detailed Analysis Reports */}
            <div className="mt-12" style={{ pageBreakBefore: 'always' }}>
                <h2 className="text-2xl font-black mb-6 flex items-center gap-2" style={{ color: '#0f172a' }}>
                    <Brain className="w-6 h-6" style={{ color: '#4f46e5' }} /> Comprehensive Agent Reports
                </h2>
                
                <div className="space-y-6">
                    {analyses_history && analyses_history.length > 0 ? analyses_history.map((ah, i) => (
                        <div key={i} className="border rounded-2xl p-6" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', pageBreakInside: 'avoid' }}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-lg font-bold" style={{ color: '#0f172a' }}>{ah.module}</h4>
                                    <p className="text-xs font-medium uppercase tracking-widest mt-1" style={{ color: '#64748b' }}>{ah.date}</p>
                                </div>
                                <div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest" style={{
                                    backgroundColor: ah.verdict === 'Positive' || ah.verdict === 'Approved' ? '#ecfdf5' : ah.verdict === 'Negative' || ah.verdict === 'Rejected' || ah.verdict === 'Critical' ? '#fff1f2' : '#f8fafc',
                                    color: ah.verdict === 'Positive' || ah.verdict === 'Approved' ? '#059669' : ah.verdict === 'Negative' || ah.verdict === 'Rejected' || ah.verdict === 'Critical' ? '#e11d48' : '#475569',
                                    border: `1px solid ${ah.verdict === 'Positive' || ah.verdict === 'Approved' ? '#d1fae5' : ah.verdict === 'Negative' || ah.verdict === 'Rejected' || ah.verdict === 'Critical' ? '#ffe4e6' : '#e2e8f0'}`
                                }}>
                                    {ah.verdict || 'Neutral'}
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Inputs Analyzed</span>
                                <p className="text-sm mt-1 leading-relaxed font-medium" style={{ color: '#475569' }}>{ah.input}</p>
                            </div>
                            
                            <div className="p-4 rounded-xl border" style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
                                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#4f46e5' }}>Agent Synthesized Output</span>
                                <p className="text-sm mt-2 leading-relaxed" style={{ color: '#334155' }}>
                                    {ah.output}
                                </p>
                            </div>
                        </div>
                    )) : (
                        <div className="p-10 text-center border rounded-2xl" style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
                            <p className="font-medium" style={{ color: '#64748b' }}>No agent analyses have been run yet this month.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t-2 text-center" style={{ borderColor: '#f1f5f9' }}>
                <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                    Automatically generated by Loanwise Agent AI • Confidential Financial Document
                </p>
            </div>
        </div>
    );
}


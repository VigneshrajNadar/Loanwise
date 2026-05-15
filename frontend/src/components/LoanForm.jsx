import { useState } from 'react';
import { IndianRupee, Briefcase, CreditCard, Building2, HelpCircle, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

const LOAN_TYPES = [
    { value: 'Home',        label: 'Home Loan',      icon: '🏠', desc: 'Property purchase' },
    { value: 'Car',         label: 'Car Loan',        icon: '🚗', desc: 'New or used vehicle' },
    { value: 'Bike',        label: 'Bike Loan',       icon: '🏍️', desc: 'Two-wheeler purchase' },
    { value: 'Business',    label: 'Business Loan',   icon: '🏢', desc: 'Business capital' },
    { value: 'Gold',        label: 'Gold Loan',       icon: '🥇', desc: 'Against gold collateral' },
    { value: 'Personal',    label: 'Personal Loan',   icon: '💳', desc: 'Unsecured personal use' },
    { value: 'Education',   label: 'Education Loan',  icon: '🎓', desc: 'Tuition & college fees' },
    { value: 'Appliances',  label: 'Appliances EMI',  icon: '📺', desc: 'Electronics & appliances' },
    { value: 'Medical',     label: 'Medical Loan',    icon: '🏥', desc: 'Healthcare expenses' },
    { value: 'Agriculture', label: 'Agriculture Loan',icon: '🌾', desc: 'Farming & kisan credit' },
];

export default function LoanForm({ onSubmit, isLoading }) {
    const [formData, setFormData] = useState({
        income: '',
        loanAmount: '',
        creditScore: '',
        employmentType: 'Salaried',
        existingEMIs: '',
        loanType: 'Personal',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const inputClasses = "w-full bg-[#0F1629] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all";
    const labelClasses = "block text-sm font-medium text-slate-300 mb-1.5";
    const iconWrapperClasses = "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── Loan Type Grid Selector ── */}
            <div>
                <label className={labelClasses + " flex items-center gap-1.5"}>
                    <Tag className="w-4 h-4 text-emerald-400" />
                    Loan Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
                    {LOAN_TYPES.map((lt) => {
                        const selected = formData.loanType === lt.value;
                        return (
                            <motion.button
                                key={lt.value}
                                type="button"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setFormData({ ...formData, loanType: lt.value })}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                                    selected
                                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                                        : 'bg-[#0F1629] border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                                }`}
                            >
                                <span className="text-xl mb-1">{lt.icon}</span>
                                <span className="text-xs font-medium leading-tight">{lt.label}</span>
                            </motion.button>
                        );
                    })}
                </div>
                {/* Selected loan type description */}
                {formData.loanType && (() => {
                    const lt = LOAN_TYPES.find(l => l.value === formData.loanType);
                    return lt ? (
                        <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                            <span>{lt.icon}</span> {lt.desc}
                        </p>
                    ) : null;
                })()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Income */}
                <div className="space-y-1">
                    <label className={labelClasses}>Monthly Income (₹)</label>
                    <div className="relative">
                        <div className={iconWrapperClasses}><IndianRupee className="w-5 h-5" /></div>
                        <input type="number" name="income" required min="0" placeholder="e.g. 50000"
                            className={`${inputClasses} pl-10`} value={formData.income} onChange={handleChange} />
                    </div>
                </div>

                {/* Loan Amount */}
                <div className="space-y-1">
                    <label className={labelClasses}>Requested Loan Amount (₹)</label>
                    <div className="relative">
                        <div className={iconWrapperClasses}><Building2 className="w-5 h-5" /></div>
                        <input type="number" name="loanAmount" required min="1000" placeholder="e.g. 500000"
                            className={`${inputClasses} pl-10`} value={formData.loanAmount} onChange={handleChange} />
                    </div>
                </div>

                {/* Credit Score */}
                <div className="space-y-1">
                    <label className={labelClasses}>
                        Credit Score
                        <span className="ml-2 text-xs text-slate-500 inline-flex items-center" title="A score between 300 and 900">
                            <HelpCircle className="w-3 h-3 mr-1" /> (300–900)
                        </span>
                    </label>
                    <div className="relative">
                        <div className={iconWrapperClasses}><CreditCard className="w-5 h-5" /></div>
                        <input type="number" name="creditScore" required min="300" max="900" placeholder="e.g. 750"
                            className={`${inputClasses} pl-10`} value={formData.creditScore} onChange={handleChange} />
                    </div>
                </div>

                {/* Existing EMIs */}
                <div className="space-y-1">
                    <label className={labelClasses}>Existing Monthly EMIs (₹)</label>
                    <div className="relative">
                        <div className={iconWrapperClasses}><IndianRupee className="w-5 h-5" /></div>
                        <input type="number" name="existingEMIs" required min="0" placeholder="e.g. 5000"
                            className={`${inputClasses} pl-10`} value={formData.existingEMIs} onChange={handleChange} />
                    </div>
                </div>

                {/* Employment Type */}
                <div className="space-y-1 md:col-span-2">
                    <label className={labelClasses}>Employment Type</label>
                    <div className="relative">
                        <div className={iconWrapperClasses}><Briefcase className="w-5 h-5" /></div>
                        <select name="employmentType" required
                            className={`${inputClasses} pl-10 appearance-none`}
                            value={formData.employmentType} onChange={handleChange}>
                            <option value="Salaried">Salaried</option>
                            <option value="Self-Employed">Self-Employed</option>
                            <option value="Business Owner">Business Owner</option>
                            <option value="Freelancer">Freelancer</option>
                            <option value="Retired">Retired / Pensioner</option>
                            <option value="Student">Student</option>
                        </select>
                    </div>
                </div>
            </div>

            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 glass-button bg-emerald-600/20 border-emerald-500/30 text-emerald-400 font-semibold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <>Analyse My Eligibility — {LOAN_TYPES.find(l => l.value === formData.loanType)?.icon} {formData.loanType} Loan</>
                )}
            </motion.button>
        </form>
    );
}

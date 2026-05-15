from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
import joblib
import pandas as pd
import numpy as np
import os
import math
from services.scraper_service import BankScraperService

loan_intelligence_bp = Blueprint('loan_intelligence', __name__)

# ── Load model artifacts ─────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR    = os.path.join(BASE_DIR, 'model')

try:
    risk_clf     = joblib.load(os.path.join(MODEL_DIR, 'default_model.pkl'))
    model_cols   = joblib.load(os.path.join(MODEL_DIR, 'default_model_columns.pkl'))
    label_encs   = joblib.load(os.path.join(MODEL_DIR, 'default_label_encoders.pkl'))
    print("Intelligence Module artifacts loaded successfully.")
except Exception as e:
    print(f"Error loading Intelligence Module artifacts: {e}")
    risk_clf = model_cols = label_encs = None


# ── Feature Logic ────────────────────────────────────────────────

def calculate_savings_growth(monthly_savings, tenure_mo, rate=0.07):
    """Calculates Future Value of a SIP/Savings."""
    r = rate / 12
    n = tenure_mo
    fv = monthly_savings * ((pow(1 + r, n) - 1) / r) * (1 + r)
    return round(fv)

def get_purpose_risk(purpose):
    risks = {
        'debt_consolidation': 22,
        'credit_card': 18,
        'home_improvement': 12,
        'small_business': 45,
        'major_purchase': 15,
        'medical': 20,
        'house': 10,
        'car': 8,
        'other': 25,
    }
    return risks.get(purpose, 20)

def predict_risk_proba(data_dict):
    """Helper to predict probability using the loaded model."""
    if not risk_clf: return 0.5
    df = pd.DataFrame([data_dict])[model_cols]
    return float(risk_clf.predict_proba(df)[0][1])

@loan_intelligence_bp.route('/initial-recommendations', methods=['GET'])
def initial_recommendations():
    """Returns generic top-rated offers for page load."""
    offers = BankScraperService.get_real_time_offers(purpose="other", credit_score=700)
    return jsonify({"offers": offers})

@loan_intelligence_bp.route('/loan-decision-analysis', methods=['POST'])
def loan_decision_analysis():
    if not risk_clf:
        return jsonify({"error": "ML Model not fully loaded"}), 500

    try:
        req = request.get_json()

        # Inputs
        loan_amnt    = float(req.get('loan_amount', 200000))
        int_rate     = float(req.get('interest_rate', 12))
        loan_term    = float(req.get('loan_term', 36))
        income       = float(req.get('annual_income', 600000))
        credit_score = float(req.get('credit_score', 700))
        purpose      = str(req.get('loan_purpose', 'debt_consolidation'))
        
        # Extended fields for risk model
        dti            = float(req.get('debt_to_income', 20))
        emp_length     = float(req.get('emp_length', 5))
        revol_util     = float(req.get('revol_util', 30))
        open_accounts  = float(req.get('open_accounts', 5))
        delinquencies  = float(req.get('delinquencies', 0))
        total_accounts = float(req.get('total_accounts', 10))
        inq_last_6m    = float(req.get('credit_inquiries', 0))
        home_own       = str(req.get('home_ownership', 'RENT'))

        # 1. Encodings
        try:
            home_own_enc = label_encs['home_ownership'].transform([home_own])[0]
        except:
            home_own_enc = label_encs['home_ownership'].transform(['RENT'])[0]

        try:
            purpose_enc = label_encs['purpose'].transform([purpose])[0]
        except:
            purpose_enc = label_encs['purpose'].transform(['other'])[0]

        # Monthly installment internal calculation
        r_monthly = (int_rate / 100) / 12
        def get_emi(principal, rate_mo, term):
            if rate_mo > 0:
                return (principal * rate_mo * (1 + rate_mo)**term) / ((1 + rate_mo)**term - 1)
            return principal / term

        current_emi = get_emi(loan_amnt, r_monthly, loan_term)

        # 2. Main Risk Prediction
        base_features = {
            'loan_amnt': loan_amnt, 'term': loan_term, 'int_rate': int_rate,
            'installment': current_emi, 'annual_inc': income, 'dti': dti,
            'emp_length': emp_length, 'home_ownership': home_own_enc,
            'purpose': purpose_enc, 'open_acc': open_accounts,
            'revol_util': revol_util, 'delinq_2yrs': delinquencies,
            'total_acc': total_accounts, 'inq_last_6mths': inq_last_6m
        }
        pd_rate = predict_risk_proba(base_features)

        # 3. Dynamic Optimisation Nodes (What-If Analysis)
        # Simulation A: Loan is 20% smaller
        sim_a_emi = get_emi(loan_amnt * 0.8, r_monthly, loan_term)
        features_a = base_features.copy()
        features_a['loan_amnt'] = loan_amnt * 0.8
        features_a['installment'] = sim_a_emi
        pd_a = predict_risk_proba(features_a)

        # Simulation B: Income is 20% higher
        features_b = base_features.copy()
        features_b['annual_inc'] = income * 1.2
        pd_b = predict_risk_proba(features_b)

        # 4. EMI vs Income Analysis
        monthly_income = income / 12
        emi_to_income_ratio = (current_emi / monthly_income) * 100
        
        affordability_status = "Safe"
        if emi_to_income_ratio > 35:
            affordability_status = "Dangerous"
        elif emi_to_income_ratio > 20:
            affordability_status = "Moderate"

        affordability_data = {
            "ratio": round(emi_to_income_ratio, 1),
            "status": affordability_status,
            "monthly_income": round(monthly_income),
            "emi": round(current_emi),
            "zones": [
                {"label": "Safe", "min": 0, "max": 20, "color": "#10b981"},
                {"label": "Moderate", "min": 20, "max": 35, "color": "#f59e0b"},
                {"label": "Dangerous", "min": 35, "max": 100, "color": "#ef4444"}
            ]
        }

        # 5. Decision Assistant
        decision = "Recommend Loan"
        decision_reason = "Loan looks affordable and risk is low."
        if pd_rate > 0.6 or emi_to_income_ratio > 40:
            decision = "Avoid Loan"
            decision_reason = "High default risk or EMI exceeds 40% of your income."
        elif pd_rate > 0.3 or emi_to_income_ratio > 30:
            decision = "Moderate Risk"
            decision_reason = "Caution advised: Risk or EMI-to-income ratio is elevated."

        # 6. Loan vs Savings
        total_interest = (current_emi * loan_term) - loan_amnt
        savings_fv = calculate_savings_growth(current_emi, loan_term)
        savings_vs_loan = {
            "loan_cost": round(total_interest),
            "savings_future_value": savings_fv,
            "opportunity_cost": round(savings_fv - loan_amnt),
            "message": "Saving might yield better wealth long-term." if savings_fv > loan_amnt + total_interest else "Loan is a good tool for current needs."
        }

        # 7. Credit Score Impact
        score_impact = -15 
        if dti > 30: score_impact -= 20
        else: score_impact -= 10
        predicted_score = max(300, credit_score + score_impact)

        # 8. Purpose Risk (Cohort Analysis)
        purpose_risk_pct = get_purpose_risk(purpose)
        cohort_risk_level = "Low"
        if purpose_risk_pct > 20 or pd_rate > 0.4: cohort_risk_level = "High"
        elif purpose_risk_pct > 12 or pd_rate > 0.2: cohort_risk_level = "Moderate"

        # 9. LIVE BANK OFFERS (Scraper) + Hyper-Local NBFC Injection + True APR
        bank_offers_raw = BankScraperService.get_real_time_offers(purpose=purpose, credit_score=credit_score)
        # Inject hyper-local NBFCs based on purpose category 
        local_nbfcs = []
        if purpose in ['bike', 'car']:
            local_nbfcs = [
                {"name": "Muthoot Capital", "rate": "9.10%", "tenure": "12-48", "max": "10L", "url": "https://www.muthootcapital.com", "is_match": True, "true_apr": "11.3%", "hidden_fee_note": "1.5% processing fee"},
                {"name": "Shriram Finance", "rate": "9.50%", "tenure": "12-48", "max": "15L", "url": "https://www.shriramfinance.in", "is_match": True, "true_apr": "11.8%", "hidden_fee_note": "2% processing fee"},
            ]
        elif purpose in ['house', 'home_improvement']:
            local_nbfcs = [
                {"name": "Gujarat Housing Board", "rate": "8.10%", "tenure": "60-240", "max": "50L", "url": "https://ghb.gujarat.gov.in", "is_match": True, "true_apr": "9.2%", "hidden_fee_note": "Gov. subsidized"},
            ]
        elif purpose in ['small_business', 'other']:
            local_nbfcs = [
                {"name": "Ugro Capital", "rate": "14.00%", "tenure": "12-60", "max": "20L", "url": "https://www.ugrocapital.com", "is_match": True, "true_apr": "16.5%", "hidden_fee_note": "2.5% processing"},
            ]
        # Inject True APR into all regular offers
        bank_offers = []
        for b in bank_offers_raw:
            rate_num = float(b['rate'].replace('%',''))
            true_apr = round(rate_num + 2.0, 2)  # +2% average processing fee simulation
            bank_offers.append({**b, "true_apr": f"{true_apr}%", "hidden_fee_note": "~2% processing included"})
        bank_offers = local_nbfcs + bank_offers  # prepend local matches

        # 10. EMI BOUNCE RISK PREDICTOR
        buffer_months = max(0.5, round((income * 0.15) / current_emi, 1)) if current_emi > 0 else 6
        bounce_risk = {
            "survival_months": buffer_months,
            "risk_profile": "High Risk" if buffer_months < 2 else "Stable",
            "message": f"{'CRITICAL WARNING: You only have a ~'+str(buffer_months)+'-month liquid buffer. If you lose your job, this loan will instantly bankrupt you. DO NOT TAKE THIS LOAN.' if decision == 'Avoid Loan' else 'Your savings can comfortably absorb this EMI for ~'+str(buffer_months)+' months if income stops. This makes the loan a safe calculation.'}"
        }

        # 11. TAX SHIELD BENEFITS
        tax_shield = {}
        if purpose in ['house', 'medical']:
            tax_shield = {
                "status": "Eligible", 
                "section": "Section 24(b) / 80D", 
                "max_deduction": "Applicable", 
                "benefit": f"{'Even with tax deductions, the fundamental EMI burden is too dangerous. Avoid taking this.' if decision == 'Avoid Loan' else 'Massive tax deductions heavily subsidise the real cost of this debt. This is a brilliant strategic move to take the loan.'}"
            }
        else:
            tax_shield = {
                "status": "Not Eligible", 
                "section": "N/A", 
                "max_deduction": "₹0", 
                "benefit": f"{'Not only is this loan inherently risky for your profile, it also offers absolutely NO tax benefits. Stay away.' if decision == 'Avoid Loan' else 'This purpose lacks tax deductions, but your income comfortably supports it. Taking it is still financially viable.'}"
            }

        # 12. PRE-PAYMENT FORECLOSURE SIMULATOR 
        prepayment = {}
        saved_interest = total_interest * 0.18 # Rough estimate of paying 1 extra EMI per year
        prepayment = {
            "strategy": "Pay 1 Extra EMI / Year",
            "interest_saved": int(saved_interest),
            "tenure_reduction": f"~{int(loan_term * 0.15)} months",
            "message": f"{'If you ignore our advice and take this dangerous loan, you MUST overpay 1 EMI/year to escape the debt trap faster.' if decision == 'Avoid Loan' else 'Once you take this recommended loan, use your annual bonus to pay 1 extra EMI. You will save ₹'+str(int(saved_interest))+' effortlessly.'}"
        }

        # 13. REFINANCING HORIZON
        refinance = {
            "optimal_month": int(loan_term * 0.3) if loan_term > 24 else "N/A",
            "rate_drop_required": "1.5% to 2.0%",
            "message": f"{'Do not take this loan hoping to refinance later. The initial burden is too severe for your current DTI.' if decision == 'Avoid Loan' else 'Take this loan today, and if market rates drop in '+str(int(loan_term * 0.3))+' months, initiate a balance transfer to optimise it further.'}"
        }

        # 14. HIDDEN FEES & INSURANCE COST
        proc_fee = int(loan_amnt * 0.02)
        ins_fee = int(loan_amnt * 0.015)
        hidden_fees = {
            "processing_fee_est": proc_fee,
            "forced_insurance_est": ins_fee,
            "total_deductions": proc_fee + ins_fee,
            "actual_disbursed": int(loan_amnt - (proc_fee + ins_fee)),
            "message": f"{'The bank will deduct ₹'+str(proc_fee + ins_fee)+' upfront. You are paying thousands in fees for a loan that will ruin your cashflow. Reject the offer.' if decision == 'Avoid Loan' else 'Expect ₹'+str(proc_fee + ins_fee)+' in processing deductions. Since the loan is affordable, this is an acceptable cost of capital.'}"
        }

        # 15. LIFESTYLE INFLATION CAP
        existing_emi = float(req.get('existing_emi', 0))
        living_expenses = float(req.get('living_expenses', monthly_income * 0.5))
        
        discretionary_allowance = int(monthly_income - living_expenses - existing_emi - current_emi)
        lifestyle = {
            "discretionary_budget": discretionary_allowance, 
            "existing_obligations": int(living_expenses + existing_emi),
            "status": "Severe Cutbacks Required" if discretionary_allowance < (monthly_income * 0.05) else "Easily Manageable",
            "message": f"{'Taking this loan drops your discretionary budget to dangerously low levels. You will suffer severe lifestyle constraints. Avoid it.' if decision == 'Avoid Loan' else 'You can afford this EMI while maintaining a positive lifestyle allowance. Proceed confidently.'}"
        }

        # BEHAVIORAL SPLURGE PREDICTOR (Upgrade #9)
        splurge_ratio = living_expenses / monthly_income if monthly_income > 0 else 0
        splurge_warning = None
        if splurge_ratio > 0.60:
            splurge_warning = {
                "triggered": True,
                "title": "High Lifestyle Volatility Detected",
                "severity": "Critical" if splurge_ratio > 0.75 else "Warning",
                "message": f"Your current living expenses consume {round(splurge_ratio * 100, 1)}% of your net income. This EMI demands robotic financial discipline you haven't structurally demonstrated. This is a severe behavioural risk.",
                "advice": "Before taking this loan, reduce your monthly lifestyle spend by at least 15% for 3 consecutive months to prove self-discipline."
            }
        else:
            splurge_warning = {
                "triggered": False,
                "title": "Spending Pattern: Disciplined",
                "severity": "None",
                "message": f"Your living costs are only {round(splurge_ratio * 100, 1)}% of your income — well within control. You show the financial discipline needed to sustain this EMI reliably.",
                "advice": "Maintain your current expense discipline throughout the loan tenure for maximum financial health."
            }

        # 16. MACRO-ECONOMIC RATE CYCLE OPTIMIZER (Upgrade #7)
        # Detects peak inflation zone and recommends Fixed vs Floating intelligently
        rate_zone = "Elevated" if int_rate > 11 else "Moderate" if int_rate > 9 else "Low"
        if int_rate > 11:
            rate_type_recommendation = "Fixed Rate"
            macro_rationale = "Current rates are in a Hawkish/Elevated cycle (>11%). Lock in a Fixed Rate immediately before further hikes erode your purchasing power and make EMIs unmanageable."
        elif int_rate > 9:
            rate_type_recommendation = "Floating Rate" if loan_term > 36 else "Fixed Rate"
            macro_rationale = f"Rates are at moderate levels. {'A Floating Rate is ideal for your long tenure as the RBI will likely cut rates over the next 2-3 years, reducing your EMI automatically.' if loan_term > 36 else 'Lock in a Fixed Rate — your short tenure means you will exit before any rate cuts benefit you.'}"
        else:
            rate_type_recommendation = "Fixed Rate"
            macro_rationale = "Rates are historically low. Lock in this Fixed Rate immediately — this is a generational opportunity unlikely to repeat for 5-7 years."
        macro = {
            "cycle": f"{rate_zone} Rate Cycle ({'Hawkish' if int_rate > 11 else 'Neutral' if int_rate > 9 else 'Dovish'})",
            "recommended_type": rate_type_recommendation,
            "message": f"{'Even with the rate type optimized, your core financial risk is too elevated. Do not take this debt.' if decision == 'Avoid Loan' else macro_rationale}"
        }

        # 17. DEBT STRATEGY - Smart Avalanche Auto-Trigger (Upgrade #8)
        # If existing EMIs are extremely high, auto-recommend Debt Consolidation Avalanche
        avalanche_triggered = existing_emi > 30000
        if avalanche_triggered:
            consolidation_saving = int(existing_emi * 0.25)  # rough 25% saving estimate
            debt_strat = {
                "recommended_method": "Avalanche Consolidation",
                "logic": f"ALERT: Your active EMI burden (₹{int(existing_emi):,}/mo) is critically high. Instead of taking a fresh new loan, take a single Top-Up Consolidation Loan to eliminate all existing debts simultaneously. Estimated monthly saving: ₹{consolidation_saving:,}. This restructuring move is mathematically superior to managing multiple debt streams.",
                "avalanche_triggered": True,
                "consolidation_target_emi": int(existing_emi * 0.75)
            }
        else:
            debt_strat = {
                "recommended_method": "Avalanche Method" if int_rate > 14 else "Snowball Method",
                "logic": f"{'We strongly advise against taking this high-risk loan. If forced, prioritize clearing this specific high-interest debt immediately to avoid a debt spiral.' if decision == 'Avoid Loan' else 'This loan fits a wealth-building strategy. Schedule consistent auto-pays and let inflation devalue the debt over the tenure.'}",
                "avalanche_triggered": False,
                "consolidation_target_emi": None
            }

        # 18. PEER BENCHMARKING
        diff_from_peer = (emi_to_income_ratio - 25.0) 
        peer_benchmark = {
            "comparison": "Heavier Burden" if diff_from_peer > 0 else "Lighter Burden",
            "delta": round(abs(diff_from_peer), 1),
            "message": f"{'Taking this loan makes your debt burden '+str(round(abs(diff_from_peer), 1))+'% heavier than your peers. You are over-leveraged compared to the market average. Abort.' if decision == 'Avoid Loan' else 'You are carrying a lighter burden than peers in your income bracket. You have unparalleled financial flexibility to take this loan.'}"
        }

        # 19. EMERGENCY BUFFER REQUIREMENT
        emergency = {
            "required_liquid": int((monthly_income * 3) + (current_emi * 6)),
            "breakdown": "3 Months Living Expenses + 6 Months EMI Backup",
            "message": f"{'Your DTI is stretched. DO NOT SIGN the loan agreement unless you instantly possess ₹'+str(int((monthly_income * 3) + (current_emi * 6)))+' in pure liquid cash.' if decision == 'Avoid Loan' else 'Your profile is incredibly safe. Just ensure you mentally earmark a standard 6-month emergency buffer alongside this new EMI.'}"
        }

        # 20. NEGOTIATION LEVERAGE SCORE
        leverage_score = min(100, int((credit_score / 850) * 100) - int(emi_to_income_ratio))
        leverage = {
            "score": leverage_score,
            "status": "High Power" if leverage_score > 70 else "Weak Power",
            "message": f"{'Your leverage is absolutely zero because your risk is too high. Abandon the loan application before it permanently damages your FICO score.' if decision == 'Avoid Loan' else 'Your pristine risk profile gives you immense leverage. Demand the bank drops the interest rate by 0.5% before you agree to sign.'}"
        }

        # 21. ALTERNATIVE FINANCING OPTIONS
        alt = {
            "primary_alternative": "Overdraft against Fixed Deposit" if loan_amnt < 500000 else "Loan Against Property",
            "estimated_rate": "7.5% - 9.0%",
            "message": f"{'Since an unsecured loan is currently too dangerous for you, pledge collateral instead to drop your EMI burden drastically.' if decision == 'Avoid Loan' else 'While this loan is highly recommended, utilizing a Gold Loan or FD-backed overdraft could instantly save you an extra 2-3% on rates.'}"
        }

        # Post-Approval Action Plan
        action_plan = [
            {"step": 1, "title": "Set Up Auto-Debit", "action": "Link salary account for automated EMI deduction on the 1st of every month to avoid late fees.", "priority": "Critical"},
            {"step": 2, "title": "Build 3-Month Buffer", "action": f"Maintain ₹{int(current_emi * 3):,} as a dedicated EMI reserve fund in a liquid savings account.", "priority": "High"},
            {"step": 3, "title": "Avoid New Credit", "action": "Do not apply for any new loans or credit cards for at least 6 months to protect your CIBIL score post-disbursement.", "priority": "High"},
        ]

        # 22. YIELD CURVE ARBITRAGE (Carry Trade)
        arbitrage = {
            "viable": "Highly Viable" if int_rate <= 11 and dti < 35 else "Non-Viable",
            "spread": f"{round(14 - int_rate, 1)}%",
            "message": f"You cannot borrow at {int_rate}% to invest at 12%. The extremely negative spread and your high DTI make this financial suicide." if decision == 'Avoid Loan' else f"You can theoretically borrow at {int_rate}% and deploy capital into index funds (historical 14% CAGR) for a positive {round(14 - int_rate, 1)}% arbitrage spread."
        }

        # 22. REAL-TIME INFLATION DEVALUATION
        inflation_impact = {
            "current_emi_value": int(current_emi),
            "future_emi_real_value": int(current_emi / ((1 + 0.06)**(loan_term/12))),
            "message": "Inflation will devalue your debt long-term, but your DTI is so critically strained that you will likely default before feeling the benefit." if decision == 'Avoid Loan' else f"Thanks to ~6% annual inflation, the true purchasing power cost of your final EMI will effectively be only ₹{int(current_emi / ((1 + 0.06)**(loan_term/12)))} in today's money."
        }

        # 23. ALTERNATIVE ASSET LIQUIDATION
        liquidation = {
            "tax_implication": "12.5% LTCG or 20% STCG",
            "recommendation": "Liquidate Assets" if decision == 'Avoid Loan' else "Hold Assets, Take Loan",
            "message": "Selling existing highly-taxed stock/crypto assets is painful, but taking this high-risk loan is far worse. Liquidate assets if you desperately need funds." if decision == 'Avoid Loan' else "Avoid triggering capital gains taxes. Taking this affordable loan is mathematically superior to prematurely liquidating your market portfolio."
        }

        # 24. GEOPOLITICAL CAREER RISK
        career_risk = {
            "industry_exposure": "High AI / Macro Exposure" if income > 1500000 else "Standard Macro Exposure",
            "tenure_risk": "Dangerous Mismatch" if loan_term > 36 and income > 1500000 else "Manageable Horizon",
            "message": "You are taking on a multi-year liability when global macroeconomic shocks are common. Your extremely weak risk profile strongly demands rejecting this." if decision == 'Avoid Loan' else f"Taking a {int(loan_term)}-month loan locks your liquidity. Fortunately, your income and DTI ratios suggest you could effortlessly survive moderate career volatility."
        }

        result_payload = {
            # The original 7
            "decision": {
                "decision": decision,
                "reason": decision_reason,
                "risk_probability": round(pd_rate * 100, 1),
                "emi": round(current_emi)
            },
            "risk_simulation": {
                "base_prob": round(pd_rate * 100, 2),
                "simulations": [
                    {"label": "If Loan is 20% smaller", "prob": round(pd_a * 100, 2)},
                    {"label": "If Income is 20% higher", "prob": round(pd_b * 100, 2)}
                ]
            },
            "savings_vs_loan": savings_vs_loan,
            "credit_impact": {
                "current_score": int(credit_score),
                "impact": score_impact,
                "predicted_score": int(predicted_score)
            },
            "purpose_analysis": {
                "purpose": purpose,
                "historical_default_rate": f"{purpose_risk_pct}%",
                "risk_level": cohort_risk_level
            },
            "affordability": affordability_data,
            "recommended_loans": bank_offers,
            
            # The new 13
            "bounce_risk": bounce_risk,
            "tax_shield": tax_shield,
            "prepayment_sim": prepayment,
            "refinancing_horizon": refinance,
            "hidden_fees": hidden_fees,
            "lifestyle_inflation_cap": lifestyle,
            "splurge_predictor": splurge_warning,
            "macro_rate_cycle": macro,
            "debt_strategy": debt_strat,
            "peer_benchmarking": peer_benchmark,
            "emergency_buffer": emergency,
            "negotiation_leverage": leverage,
            "alternative_financing": alt,
            "post_approval_plan": [
                {"step": p["step"], "title": p["title"], "action": p["action"], "priority": p["priority"]}
                for p in action_plan
            ],

            # ULTRA PRO MAX: The new 4
            "arbitrage": arbitrage,
            "inflation_impact": inflation_impact,
            "liquidation": liquidation,
            "career_risk": career_risk
        }

        # Save analysis to DB if user is logged in
        try:
            from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
            verify_jwt_in_request(optional=True)
            uid = get_jwt_identity()
            if uid:
                from database import save_analysis
                save_analysis(int(uid), "loan_decision", decision, req, result_payload)
        except Exception:
            pass  # Never break predictions due to DB errors

        return jsonify(result_payload)

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 400

@loan_intelligence_bp.route('/market-offers', methods=['GET'])
def get_market_offers():
    loan_type = request.args.get('type', 'other').lower()
    score = request.args.get('score', 700, type=int)
    offers = BankScraperService.get_real_time_offers(purpose=loan_type, credit_score=score)
    return jsonify(offers), 200

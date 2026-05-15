from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import (
    get_user_by_id, get_user_analyses, get_transactions, save_transaction,
    delete_transaction, get_alerts, save_alert, mark_alerts_read,
    upsert_user_profile, get_user_profile, get_db,
    save_agent_plan, get_agent_plan, update_agent_plan_json,
    save_agent_history, get_agent_history, save_analysis
)
import os, json, csv
from io import StringIO, BytesIO
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

try:
    from google import genai
    from google.genai import types as genai_types
    gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
except Exception:
    gemini_client = None

try:
    from pdfminer.high_level import extract_text as pdf_extract_text
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False

user_bp = Blueprint('user', __name__)

# ── Formatters ────────────────────────────────────────────────────────────────
def fmt_inr(n):
    try:
        return f"₹{int(float(n or 0)):,}"
    except:
        return "₹0"

def _summarise_input(module, inp):
    if module == 'eligibility':
        return f"Income={fmt_inr(inp.get('income',0))}, Credit={inp.get('credit_score',0)}, Loan={fmt_inr(inp.get('loanAmount',0))}"
    elif module == 'default':
        return f"Income={fmt_inr(inp.get('annual_income',0))}, DTI={inp.get('debt_to_income',0)}%, Loan={fmt_inr(inp.get('loan_amount',0))}"
    elif module in ('decision', 'loan_decision'):
        return f"Income={fmt_inr(inp.get('annual_income',0))}, Loan={fmt_inr(inp.get('loan_amount',0))}, Rate={inp.get('interest_rate',0)}%"
    elif module == 'health':
        return f"Income={fmt_inr(inp.get('monthly_income',0))}, EMI={fmt_inr(inp.get('emi_amount',0))}"
    return ""

# ── Financial Calculations ─────────────────────────────────────────────────────
def _compute_health_score(profile, analyses, txns):
    score = 50
    inc   = profile.get('monthly_income', 0)
    exp   = profile.get('monthly_expenses', 0)
    sav   = profile.get('savings', 0)
    emis  = profile.get('emis', [])
    total_emi = sum(e.get('amount', 0) for e in emis) if emis else 0
    cibil = profile.get('cibil_score', 0)

    if inc > 0:
        emi_ratio = total_emi / inc
        if emi_ratio < 0.3:   score += 15
        elif emi_ratio < 0.5: score += 5
        else:                 score -= 15

        sav_ratio = sav / (inc * 12) if inc > 0 else 0
        if sav_ratio > 0.5:   score += 15
        elif sav_ratio > 0.2: score += 8
        else:                 score -= 5

        if exp > 0:
            net = inc - exp - total_emi
            if net > inc * 0.3:  score += 10
            elif net < 0:        score -= 20

    # CIBIL bonus
    if cibil >= 750:   score += 10
    elif cibil >= 700: score += 5
    elif 0 < cibil < 600: score -= 10

    # Analysis history
    for a in analyses[:5]:
        v = (a.get('verdict') or '').lower()
        if 'eligible' in v or 'recommend' in v: score += 3
        elif any(k in v for k in ['avoid','not eligible','high risk']): score -= 5

    return max(0, min(100, score))

def _compute_net_worth(profile):
    sav  = profile.get('savings', 0)
    inv  = profile.get('investments', 0)
    ppf  = profile.get('ppf_nps', 0)
    gold = profile.get('gold_value', 0)
    re   = profile.get('net_worth_assets', 0)
    emis = profile.get('emis', [])
    total_emi_outstanding = sum(
        e.get('amount', 0) * e.get('remaining_months', 0)
        for e in emis if isinstance(e, dict)
    )
    assets      = sav + inv + ppf + gold + re
    liabilities = total_emi_outstanding
    return assets, liabilities, assets - liabilities

# ── Smart Alerts ──────────────────────────────────────────────────────────────
def _generate_smart_alerts(user_id, profile, analyses, txns):
    alerts = []
    inc       = profile.get('monthly_income', 0)
    emis      = profile.get('emis', [])
    total_emi = sum(e.get('amount', 0) for e in emis) if emis else 0
    sav       = profile.get('savings', 0)
    cibil     = profile.get('cibil_score', 0)

    if inc > 0 and total_emi / inc > 0.4:
        alerts.append(("emi_overload", "Critical", "⚠️ EMI Burden Critical",
            f"Your total EMI of {fmt_inr(total_emi)} is {round(total_emi/inc*100,1)}% of income — above the safe 40% threshold.",
            "Prioritize prepaying the highest-interest loan to reduce EMI burden."))

    high_risk = [a for a in analyses if a.get('verdict') and
                 any(k in (a['verdict'].lower()) for k in ['high risk','avoid','not eligible','❌'])]
    if len(high_risk) >= 2:
        alerts.append(("repeated_risk", "Critical", "🚨 Repeated Loan Rejection Signals",
            f"You've had {len(high_risk)} negative predictions. Lenders will flag this pattern.",
            "Wait 60 days, reduce DTI by 10%, then re-apply."))

    if inc > 0 and sav < inc * 3:
        alerts.append(("low_savings", "Warning", "💰 Low Emergency Fund",
            f"Your savings of {fmt_inr(sav)} cover less than 3 months of income. Target: {fmt_inr(inc*6)}.",
            "Set up an auto-sweep of ₹5,000/month to a liquid mutual fund."))

    if 0 < cibil < 650:
        alerts.append(("low_cibil", "Warning", "📉 Low CIBIL Score",
            f"Your CIBIL score of {cibil} is below the lender minimum of 700. Loan applications will be rejected.",
            "Clear any overdue EMIs immediately and avoid new credit inquiries for 6 months."))

    if txns:
        month_debit  = sum(t['amount'] for t in txns if t.get('type') == 'debit')
        month_credit = sum(t['amount'] for t in txns if t.get('type') == 'credit')
        if month_credit > 0 and month_debit > month_credit * 0.9:
            alerts.append(("overspending", "Warning", "🔴 Spending Exceeds 90% of Income",
                f"Recorded expenses ({fmt_inr(month_debit)}) consuming {round(month_debit/month_credit*100,1)}% of income.",
                "Review discretionary categories and cut the top spender."))

    if not analyses and not txns:
        alerts.append(("no_data", "Info", "📊 Build Your Financial Profile",
            "Run your first analysis or add transactions to get personalized AI insights.",
            "Start with the Loan Eligibility Predictor."))

    existing = [a['type'] for a in get_alerts(user_id)]
    for a_type, severity, title, msg, action in alerts:
        if a_type not in existing:
            save_alert(user_id, a_type, severity, title, msg, action)

# ── Gemini Context Builder ─────────────────────────────────────────────────────
def _build_gemini_context(user, profile, analyses, txns, alerts_list):
    lines = [f"User: {user['name']} | Member since: {user['created_at'][:10]}"]

    if profile:
        inc       = profile.get('monthly_income', 0)
        bonus     = profile.get('annual_bonus', 0)
        other_inc = profile.get('other_income', 0)
        total_emi = sum(e.get('amount', 0) for e in profile.get('emis', []))
        assets, liabilities, net_worth = _compute_net_worth(profile)

        lines.append("\n=== FINANCIAL PROFILE ===")
        lines.append(f"  Age: {profile.get('age',0)} | Occupation: {profile.get('occupation','')} at {profile.get('company_name','')} ({profile.get('work_experience_years',0)} yrs exp)")
        lines.append(f"  Employment: {profile.get('employment_type','')} | City: {profile.get('city_tier','')} | Dependents: {profile.get('dependents',0)}")
        lines.append(f"  Monthly Income: {fmt_inr(inc)} | Annual Bonus: {fmt_inr(bonus)} | Other Income: {fmt_inr(other_inc)}/mo")
        lines.append(f"  Monthly Expenses: {fmt_inr(profile.get('monthly_expenses',0))} | Rent: {fmt_inr(profile.get('rent',0))} | Insurance: {fmt_inr(profile.get('insurance_premium',0))}/mo")
        lines.append(f"  Total EMIs: {fmt_inr(total_emi)}/mo | EMI Ratio: {round(total_emi/inc*100,1) if inc>0 else 0}%")
        lines.append(f"  Liquid Savings: {fmt_inr(profile.get('savings',0))} | MF/Stocks: {fmt_inr(profile.get('investments',0))} | PPF/NPS: {fmt_inr(profile.get('ppf_nps',0))} | Gold: {fmt_inr(profile.get('gold_value',0))} | Real Estate: {fmt_inr(profile.get('net_worth_assets',0))}")
        lines.append(f"  Total Assets: {fmt_inr(assets)} | Liabilities: {fmt_inr(liabilities)} | Net Worth: {fmt_inr(net_worth)}")
        lines.append(f"  CIBIL Score: {profile.get('cibil_score',0)} | Credit Cards: {profile.get('credit_cards_count',0)} | Utilization: {profile.get('credit_utilization',0)}%")
        lines.append(f"  Goal — Home Purchase: {fmt_inr(profile.get('goal_home_amount',0))} in {profile.get('goal_home_years',0)} years")
        lines.append(f"  Goal — Retirement in: {profile.get('goal_retirement_years',30)} years")
        if profile.get('emis'):
            lines.append(f"  Individual EMIs: {' | '.join([e.get('label','Loan')+' '+fmt_inr(e.get('amount',0))+' ('+str(e.get('remaining_months',0))+'mo left)' for e in profile['emis']])}")

    if analyses:
        lines.append(f"\n=== LOAN ANALYSIS HISTORY ({len(analyses)} total) ===")
        for a in analyses[:10]:
            lines.append(f"  [{a['created_at'][:10]}] {a['module'].upper()} → {a['verdict']} | {_summarise_input(a['module'], a['input'])}")

    if txns:
        total_debit  = sum(t['amount'] for t in txns if t.get('type') == 'debit')
        total_credit = sum(t['amount'] for t in txns if t.get('type') == 'credit')
        # Category breakdown
        cat_map = {}
        for t in txns:
            if t.get('type') == 'debit':
                cat_map[t['category']] = cat_map.get(t['category'], 0) + t['amount']
        top_cats = sorted(cat_map.items(), key=lambda x: -x[1])[:5]

        lines.append(f"\n=== TRANSACTION SUMMARY ({len(txns)} entries) ===")
        lines.append(f"  Total Credits: {fmt_inr(total_credit)} | Total Debits: {fmt_inr(total_debit)} | Net: {fmt_inr(total_credit-total_debit)}")
        lines.append(f"  Top Spending Categories: {' | '.join([f'{c}: {fmt_inr(v)}' for c,v in top_cats])}")
        
        txns_str = ' | '.join([f"{t['date']} {t['description'][:20]} {t['type'].upper()} {fmt_inr(t['amount'])}" for t in txns[:8]])
        lines.append(f"  Recent Transactions: {txns_str}")

    if alerts_list:
        active = [a for a in alerts_list if a.get('severity') in ['Critical','Warning']]
        if active:
            lines.append(f"\n=== ACTIVE ALERTS ({len(active)}) ===")
            for a in active[:3]:
                lines.append(f"  [{a['severity']}] {a['title']}: {a['message']}")

    return "\n".join(lines)

# ── Auto-categorizer ──────────────────────────────────────────────────────────
CAT_KEYWORDS = {
    'Salary':        ['salary','sal','payroll','wages','stipend'],
    'EMI':           ['emi','loan','bajaj','muthoot','hdfc loan','iciciloan'],
    'Food & Dining': ['zomato','swiggy','restaurant','cafe','mcdonalds','kfc','starbucks','food','dining','blinkit','dunzo'],
    'Rent':          ['rent','tenant','landlord','pg','house'],
    'Investment':    ['zerodha','groww','upstox','mutual fund','sip','ppf','nps','kuvera','coin'],
    'Shopping':      ['amazon','flipkart','myntra','nykaa','ajio','shopping','retail','meesho','tata cliq'],
    'Medical':       ['apollo','pharmacy','hospital','clinic','medical','medplus','netmeds','1mg'],
    'Travel':        ['uber','ola','irctc','makemytrip','goibibo','flight','train','bus','rapido','yulu'],
    'Utilities':     ['electricity','water','gas','bescom','jio','airtel','vi','bill','recharge','broadband','bsnl'],
    'Entertainment': ['netflix','prime','hotstar','spotify','movie','bookmyshow','pvr','inox','youtube'],
    'Insurance':     ['lic','insurance','policy','maxbupa','hdfcergo','star health','term plan'],
    'Transfer':      ['upi','transfer','neft','rtgs','imps','phonepe','gpay','paytm','sent to'],
}

def _get_category(desc):
    d = desc.lower()
    for cat, keywords in CAT_KEYWORDS.items():
        if any(kw in d for kw in keywords):
            return cat
    return 'Other'

# ── Routes ────────────────────────────────────────────────────────────────────
@user_bp.route('/api/user/history', methods=['GET'])
@jwt_required()
def history():
    uid = int(get_jwt_identity())
    analyses = get_user_analyses(uid, 50)
    # Enrich with display summary
    for a in analyses:
        a['input_summary'] = _summarise_input(a['module'], a['input'])
    return jsonify({"analyses": analyses}), 200


@user_bp.route('/api/user/profile-summary', methods=['GET'])
@jwt_required()
def profile_summary():
    uid      = int(get_jwt_identity())
    user     = get_user_by_id(uid)
    analyses = get_user_analyses(uid, 50)
    txns     = get_transactions(uid, 50)
    profile  = get_user_profile(uid)

    module_counts = {}
    for a in analyses:
        module_counts[a['module']] = module_counts.get(a['module'], 0) + 1

    health_score = _compute_health_score(profile, analyses, txns)
    assets, liabilities, net_worth = _compute_net_worth(profile)

    total_emi = sum(e.get('amount', 0) for e in profile.get('emis', [])) if profile else 0
    inc       = profile.get('monthly_income', 0) if profile else 0
    sav       = profile.get('savings', 0) if profile else 0

    # Monthly spending breakdown from transactions
    cat_map = {}
    for t in txns:
        if t.get('type') == 'debit':
            cat_map[t['category']] = cat_map.get(t['category'], 0) + t['amount']

    return jsonify({
        "name":            user['name'],
        "email":           user['email'],
        "total_analyses":  len(analyses),
        "module_breakdown":module_counts,
        "member_since":    user['created_at'],
        "health_score":    health_score,
        "monthly_income":  inc,
        "total_emi":       total_emi,
        "emi_ratio":       round(total_emi / inc * 100, 1) if inc > 0 else 0,
        "savings":         sav,
        "savings_months":  round(sav / inc, 1) if inc > 0 else 0,
        "net_monthly":     inc - profile.get('monthly_expenses', 0) - total_emi if profile else 0,
        "net_worth":       net_worth,
        "total_assets":    assets,
        "cibil_score":     profile.get('cibil_score', 0) if profile else 0,
        "age":             profile.get('age', 0) if profile else 0,
        "occupation":      profile.get('occupation', '') if profile else '',
        "spending_by_cat": cat_map,
    }), 200

@user_bp.route('/api/user/monthly-report', methods=['GET'])
@jwt_required()
def monthly_report():
    import json, re
    uid      = int(get_jwt_identity())
    user     = get_user_by_id(uid)
    analyses = get_user_analyses(uid, 50)
    txns     = get_transactions(uid, 50)
    profile  = get_user_profile(uid)

    health_score = _compute_health_score(profile, analyses, txns)
    assets, liabilities, net_worth = _compute_net_worth(profile)
    
    # --- Core Profile Metrics ---
    inc      = profile.get('monthly_income', 0) if profile else 0
    expenses = profile.get('monthly_expenses', 0) if profile else 0
    savings  = profile.get('savings', 0) if profile else 0
    emis_list= profile.get('emis', []) if profile else []
    total_emis = sum(e.get('amount', 0) for e in emis_list)
    emi_ratio  = round((total_emis / inc) * 100, 1) if inc > 0 else 0
    cibil      = profile.get('cibil_score', 0) if profile else 0
    age        = profile.get('age', 0) if profile else 0
    occupation = profile.get('occupation', 'N/A') if profile else 'N/A'
    net_monthly= inc - expenses - total_emis
    max_emi    = (inc * 0.5) - total_emis if inc > 0 else 0
    max_homeloan = max(max_emi * 120, 0)  # 20yr home loan @ ~10% ROI rule of thumb
    max_carloan  = max(max_emi * 52,  0)  # 5yr car loan

    # --- Spending Breakdown ---
    cat_map = {}
    total_sent = 0.0
    for t in txns:
        if t.get('type') == 'debit':
            cat_map[t['category']] = cat_map.get(t['category'], 0) + float(t['amount'])
            total_sent += float(t['amount'])
    sorted_cats = sorted(cat_map.items(), key=lambda x: x[1], reverse=True)

    # --- Alerts ---
    _generate_smart_alerts(uid, profile, analyses, txns)
    raw_alerts = get_alerts(uid, 20)
    clean_alerts = [{"title": a.get("title",""), "message": a.get("message",""), "severity": a.get("severity","Info")} for a in raw_alerts]

    # --- Full Analysis History (all modules, full output) ---
    clean_analyses = []
    for a in analyses[:12]:
        out_raw = a.get("output", "") or ""
        if isinstance(out_raw, dict):
            import json as _j
            out_raw = _j.dumps(out_raw, indent=2)
        out_raw = str(out_raw)
        clean_analyses.append({
            "module": a.get("module", "analysis").replace("_", " ").title(),
            "verdict": a.get("verdict", "Neutral"),
            "date": str(a.get("created_at", "")).split("T")[0],
            "input": a.get("input_summary") or "Inputs provided to AI agent",
            "output": out_raw[:800] + ("..." if len(out_raw) > 800 else "")
        })

    # --- Core metrics dict ---
    metrics = {
        "income": inc, "expenses": expenses, "savings": savings,
        "total_emis": total_emis, "emi_ratio": emi_ratio, "cibil": cibil,
        "net_worth": net_worth, "net_monthly": net_monthly,
        "max_homeloan": max_homeloan, "max_carloan": max_carloan,
        "age": age, "occupation": occupation
    }

    if not gemini_client:
        return jsonify({
            "health_score": health_score, "health_score_change": "N/A",
            "best_decision": "No AI configuration found.",
            "worst_decision": "Cannot determine without AI key.",
            "top_3_action_items": ["Review spending", "Update goals", "Improve CIBIL"],
            "executive_summary": "AI not configured. Core metrics from your profile are shown below.",
            "metrics": metrics, "spending_by_cat": dict(sorted_cats),
            "analyses_history": clean_analyses, "alerts": clean_alerts
        }), 200

    context = _build_gemini_context(user, profile, analyses, txns, raw_alerts)
    prompt = f"""You are a professional financial advisor generating a monthly report for {user['name']}.
Full financial context: {context}
Health Score: {health_score}/100. EMI Ratio: {emi_ratio}%. CIBIL: {cibil}.

Output ONLY this JSON (no markdown, no explanation):
{{
  "health_score_change": "<e.g. '+3 pts' or 'Stable'>",
  "best_decision": "<1 sentence: their best financial behavior this month>",
  "worst_decision": "<1 sentence: biggest risk or worst decision>",
  "top_3_action_items": ["<item1>", "<item2>", "<item3>"],
  "executive_summary": "<2-3 sentences: professional CFO-level summary>"
}}"""

    try:
        resp = gemini_client.models.generate_content(model="gemma-2b-it", contents=prompt)
        text = resp.text.strip()
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            text = match.group(0)
        parsed = json.loads(text)
    except Exception as e:
        print(f"[monthly-report] AI error: {e}")
        parsed = {
            "health_score_change": "Stable",
            "best_decision": "Maintained active financial monitoring.",
            "worst_decision": "Could not determine — please re-run for fresh AI synthesis.",
            "top_3_action_items": ["Review your biggest expense category", "Maintain EMI below 50% of income", "Target CIBIL above 750"],
            "executive_summary": f"Your current health score stands at {health_score}/100. Your EMI burden is {emi_ratio}% and CIBIL is {cibil}. Focus on the action items below to improve your score next month."
        }

    parsed['health_score']      = health_score
    parsed['metrics']           = metrics
    parsed['spending_by_cat']   = dict(sorted_cats)
    parsed['analyses_history']  = clean_analyses
    parsed['alerts']            = clean_alerts
    return jsonify(parsed), 200

# ── Transactions ───────────────────────────────────────────────────────────────

@user_bp.route('/api/user/transactions', methods=['GET'])
@jwt_required()
def get_txns():
    uid = int(get_jwt_identity())
    return jsonify({"transactions": get_transactions(uid, 200)}), 200


@user_bp.route('/api/user/transactions', methods=['POST'])
@jwt_required()
def add_txn():
    uid  = int(get_jwt_identity())
    data = request.get_json() or {}
    save_transaction(uid, data.get('date'), data.get('description', ''),
                     data.get('amount', 0), data.get('category', 'Other'), data.get('type', 'debit'))
    return jsonify({"ok": True}), 201


@user_bp.route('/api/user/transactions/bulk', methods=['POST'])
@jwt_required()
def bulk_txns():
    uid   = int(get_jwt_identity())
    items = request.get_json() or []
    for t in items:
        save_transaction(uid, t.get('date'), t.get('description', ''),
                         t.get('amount', 0), t.get('category', 'Other'), t.get('type', 'debit'))
    return jsonify({"ok": True, "saved": len(items)}), 201


@user_bp.route('/api/user/transactions/upload', methods=['POST'])
@jwt_required()
def upload_txns():
    """Accept CSV bank statement and auto-categorize."""
    uid = int(get_jwt_identity())
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if not file.filename.endswith('.csv'):
        return jsonify({"error": "Only CSV files supported here. Use /upload-pdf for PDF."}), 400
    try:
        content    = file.read().decode('utf-8', errors='ignore')
        csv_reader = csv.DictReader(StringIO(content))
        saved_count = 0
        for row in csv_reader:
            keys     = {k.lower().strip(): v for k, v in row.items() if k}
            date_col = next((c for c in keys if 'date' in c), None)
            desc_col = next((c for c in keys if any(x in c for x in ['desc','narrat','particular','remark','detail'])), None)
            if not date_col or not desc_col:
                continue
            date = keys.get(date_col, '')
            desc = keys.get(desc_col, '')

            debit_col  = next((c for c in keys if any(x in c for x in ['debit','withdrawal','dr'])), None)
            credit_col = next((c for c in keys if any(x in c for x in ['credit','deposit','cr'])), None)
            amt_col    = next((c for c in keys if 'amount' in c), None)

            amt, t_type = 0, 'debit'
            if debit_col and keys.get(debit_col,'').strip():
                try: amt = float(keys[debit_col].replace(',','').replace('₹','').strip()); t_type = 'debit'
                except: pass
            if amt == 0 and credit_col and keys.get(credit_col,'').strip():
                try: amt = float(keys[credit_col].replace(',','').replace('₹','').strip()); t_type = 'credit'
                except: pass
            if amt == 0 and amt_col:
                try:
                    raw = float(keys[amt_col].replace(',','').replace('₹','').strip())
                    amt = abs(raw); t_type = 'credit' if raw > 0 else 'debit'
                except: pass

            if amt > 0:
                save_transaction(uid, date, desc, amt, _get_category(desc), t_type)
                saved_count += 1

        return jsonify({"ok": True, "saved": saved_count}), 201
    except Exception as e:
        return jsonify({"error": f"CSV parse failed: {str(e)}"}), 500


@user_bp.route('/api/user/transactions/upload-pdf', methods=['POST'])
@jwt_required()
def upload_pdf():
    """Accept a PDF bank statement, extract text and parse via Gemini."""
    uid = int(get_jwt_identity())
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Only PDF files allowed"}), 400

    if not PDF_SUPPORT:
        return jsonify({"error": "PDF support not installed on server. Please upload a CSV."}), 500

    try:
        raw_bytes = file.read()
        text      = pdf_extract_text(BytesIO(raw_bytes))
        text      = text[:8000]  # Limit context size
    except Exception as e:
        return jsonify({"error": f"Could not read PDF: {str(e)}"}), 500

    if not gemini_client:
        return jsonify({"error": "Gemini API key not configured. Cannot parse PDF."}), 500

    prompt = f"""You are a bank statement parser. Extract ALL transactions from this bank statement text.
Return ONLY a JSON array, no markdown. Each item must have:
{{"date": "YYYY-MM-DD", "description": "...", "amount": 1234.56, "type": "debit or credit"}}

Rules:
- date format must be YYYY-MM-DD (convert DD/MM/YYYY or other formats)
- amount must be a positive float
- type is "debit" for withdrawals/debits, "credit" for deposits/credits
- Skip rows without clear amounts
- If monthly balance rows exist, skip them

BANK STATEMENT TEXT:
{text}

JSON array only:"""

    try:
        resp = gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        raw  = resp.text.strip().replace("```json","").replace("```","").strip()
        txns = json.loads(raw)
        if not isinstance(txns, list):
            return jsonify({"error": "Gemini returned unexpected format"}), 500

        saved = 0
        for t in txns:
            try:
                date = str(t.get('date',''))
                desc = str(t.get('description',''))
                amt  = float(t.get('amount', 0))
                typ  = 'credit' if t.get('type','debit').lower() == 'credit' else 'debit'
                if amt > 0 and date:
                    save_transaction(uid, date, desc, amt, _get_category(desc), typ)
                    saved += 1
            except:
                continue

        return jsonify({"ok": True, "saved": saved}), 201
    except json.JSONDecodeError:
        return jsonify({"error": "Gemini could not parse the statement. Try a CSV export instead."}), 500
    except Exception as e:
        return jsonify({"error": f"PDF parsing failed: {str(e)}"}), 500


@user_bp.route('/api/user/transactions/<int:txn_id>', methods=['DELETE'])
@jwt_required()
def del_txn(txn_id):
    uid = int(get_jwt_identity())
    delete_transaction(txn_id, uid)
    return jsonify({"ok": True}), 200


# ── Alerts ────────────────────────────────────────────────────────────────────
@user_bp.route('/api/user/alerts', methods=['GET'])
@jwt_required()
def alerts():
    uid      = int(get_jwt_identity())
    profile  = get_user_profile(uid)
    analyses = get_user_analyses(uid, 20)
    txns     = get_transactions(uid, 50)
    _generate_smart_alerts(uid, profile, analyses, txns)
    return jsonify({"alerts": get_alerts(uid, 20)}), 200


@user_bp.route('/api/user/alerts/read', methods=['POST'])
@jwt_required()
def read_alerts():
    uid = int(get_jwt_identity())
    mark_alerts_read(uid)
    return jsonify({"ok": True}), 200


# ── Financial Profile ──────────────────────────────────────────────────────────
@user_bp.route('/api/user/financial-profile', methods=['GET'])
@jwt_required()
def get_fp():
    uid = int(get_jwt_identity())
    return jsonify(get_user_profile(uid)), 200


@user_bp.route('/api/user/financial-profile', methods=['POST'])
@jwt_required()
def set_fp():
    uid  = int(get_jwt_identity())
    data = request.get_json() or {}
    upsert_user_profile(uid, data)
    return jsonify({"ok": True}), 200


# ── Agentic AI Chat ───────────────────────────────────────────────────────────
@user_bp.route('/api/user/ai-chat', methods=['POST'])
@jwt_required()
def ai_chat():
    """
    Advanced agentic AI chat with full financial context.
    Expects: { messages: [{role: 'user'|'assistant', content: '...'}] }
    Returns: { response: '...', suggestions: ['...'] }
    """
    uid         = int(get_jwt_identity())
    data        = request.get_json() or {}
    messages    = data.get('messages', [])

    user        = get_user_by_id(uid)
    profile     = get_user_profile(uid)
    analyses    = get_user_analyses(uid, 20)
    txns        = get_transactions(uid, 30)
    alerts_list = get_alerts(uid, 10)
    health_score = _compute_health_score(profile, analyses, txns)
    assets, liabilities, net_worth = _compute_net_worth(profile)

    context = _build_gemini_context(user, profile, analyses, txns, alerts_list)

    system_instruction = f"""You are LoanWise AI — an elite personal finance agent for {user['name']}.
You have FULL and EXCLUSIVE access to their real financial data shown below.

{context}

=== COMPUTED METRICS ===
  Health Score: {health_score}/100
  Net Worth: {fmt_inr(net_worth)} (Assets: {fmt_inr(assets)} - Liabilities: {fmt_inr(liabilities)})

=== YOUR AGENTIC CAPABILITIES ===
1. 🔍 DATA ANALYSIS — Detect patterns, anomalies, and risks from their real data
2. 📊 CALCULATIONS — EMI formula: P×r×(1+r)^n/((1+r)^n-1) | SIP: P×((1+r)^n-1)/r×(1+r)
3. ⚠️ RISK DETECTION — Proactively flag issues before they're asked
4. 📋 ACTION PLANNING — Create step-by-step plans with EXACT ₹ amounts and dates
5. 🎯 GOAL TRACKING — Evaluate if they're on track for home purchase, retirement

=== BEHAVIORAL RULES ===
- ALWAYS use EXACT numbers from their data (not approximations)
- Every answer MUST cite the specific data used: "Based on your ₹X income..."
- When answering financial questions, SHOW the calculation (e.g., EMI calculation)
- Format numbers in Indian system: ₹ with lakhs/crores as appropriate
- End critical answers with: "⚡ AGENT ACTION: [specific next step with amount + deadline]"
- Be concise but data-rich — 150-300 words per response
- If asked about eligibility, calculate it using their REAL income + CIBIL data
- Detect spending category patterns and call them out proactively"""

    if not gemini_client:
        # Rule-based fallback
        last_msg = messages[-1]['content'] if messages else ''
        inc = profile.get('monthly_income', 0) if profile else 0
        response = _rule_based_chat(user['name'], profile, analyses, txns, health_score, net_worth, last_msg)
        return jsonify({"response": response, "suggestions": _get_suggestions(profile, analyses)}), 200

    try:
        # Build Gemini conversation contents
        contents = []
        for msg in messages[-12:]:  # Last 12 messages for context
            role    = 'user' if msg['role'] == 'user' else 'model'
            content = msg['content']
            # Inject context into the FIRST user message only
            if role == 'user' and not contents:
                content = f"[Context injected — I have full access to your financial data]\n\n{content}"
            contents.append(genai_types.Content(
                role=role,
                parts=[genai_types.Part(text=content)]
            ))

        if not contents:
            contents = [genai_types.Content(role='user', parts=[genai_types.Part(text="Hello, introduce yourself and give me a quick headline of my financial situation.")])]

        resp = gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents,
            config=genai_types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
                max_output_tokens=600,
            )
        )
        response = resp.text.strip()
        return jsonify({
            "response":    response,
            "suggestions": _get_suggestions(profile, analyses)
        }), 200

    except Exception as e:
        print(f"AI Chat error: {e}")
        last_msg = messages[-1]['content'] if messages else ''
        response = _rule_based_chat(user['name'], profile, analyses, txns, health_score, net_worth, last_msg)
        return jsonify({"response": response, "suggestions": _get_suggestions(profile, analyses)}), 200


def _get_suggestions(profile, analyses):
    """Return 3 context-aware quick suggestions."""
    inc   = profile.get('monthly_income', 0) if profile else 0
    emis  = profile.get('emis', []) if profile else []
    total_emi = sum(e.get('amount', 0) for e in emis)
    cibil = profile.get('cibil_score', 0) if profile else 0

    suggestions = []
    if total_emi > inc * 0.4:
        suggestions.append("How do I reduce my EMI burden?")
    if cibil > 0 and cibil < 700:
        suggestions.append("How can I improve my CIBIL score?")
    if profile and profile.get('goal_home_amount', 0) > 0:
        suggestions.append(f"Am I ready for a ₹{int(profile['goal_home_amount']/100000)}L home loan?")
    suggestions += [
        "Analyze my overall financial health",
        "Create a savings plan for 6 months",
        "Should I invest in mutual funds now?",
        "What's my loan eligibility right now?",
    ]
    return suggestions[:4]


def _rule_based_chat(name, profile, analyses, txns, health_score, net_worth, query):
    inc   = profile.get('monthly_income', 0) if profile else 0
    emis  = profile.get('emis', []) if profile else []
    total_emi = sum(e.get('amount', 0) for e in emis)
    sav   = profile.get('savings', 0) if profile else 0
    cibil = profile.get('cibil_score', 0) if profile else 0
    emi_ratio = round(total_emi/inc*100,1) if inc > 0 else 0

    q = query.lower()
    if 'health' in q or 'financial' in q:
        return f"📊 **Financial Health Report for {name}**\n\nYour Health Score is **{health_score}/100**.\n\n• Monthly Income: {fmt_inr(inc)}\n• Total EMIs: {fmt_inr(total_emi)} ({emi_ratio}% of income — {'⚠️ High' if emi_ratio > 40 else '✅ Safe'})\n• Savings: {fmt_inr(sav)} ({round(sav/inc,1) if inc > 0 else 0} months buffer)\n• CIBIL Score: {cibil if cibil > 0 else 'Not set'}\n• Net Worth: {fmt_inr(net_worth)}\n\n⚡ AGENT ACTION: {'Reduce EMI ratio below 35% by prepaying the highest-rate loan first.' if emi_ratio > 40 else 'Build emergency fund to ' + fmt_inr(inc*6) + ' (6 months income).'}"
    elif 'emi' in q or 'loan' in q:
        return f"📋 **EMI Analysis for {name}**\n\nCurrent total EMIs: **{fmt_inr(total_emi)}/month** ({emi_ratio}% of income).\n\n{'⚠️ This exceeds the 40% safe threshold. Risk of default if income drops.' if emi_ratio > 40 else '✅ Within safe EMI-to-income ratio of 40%.'}\n\nTo reduce burden:\n1. Pay off smallest EMI first (Snowball method)\n2. Refinance highest rate loan\n3. Avoid taking new credit for 6 months\n\n⚡ AGENT ACTION: Identify the loan with the highest interest rate and make one extra payment this month."
    elif 'invest' in q or 'sip' in q:
        surplus = inc - profile.get('monthly_expenses',0) - total_emi if profile else 0
        sip_amt = max(0, int(surplus * 0.3))
        corpus_10yr = int(sip_amt * ((1.01**120 - 1) / 0.01) * 1.01) if sip_amt > 0 else 0
        return f"📈 **Investment Plan for {name}**\n\nYour monthly surplus is ~{fmt_inr(surplus)}. I recommend allocating **30% = {fmt_inr(sip_amt)}/month** to SIP.\n\nAt 12% CAGR over 10 years:\n→ Corpus = **{fmt_inr(corpus_10yr)}**\n\nRecommended split:\n• 60% Nifty 50 Index Fund\n• 30% Mid Cap Fund\n• 10% International/Sectoral\n\n⚡ AGENT ACTION: Open Zerodha/Groww today and start a {fmt_inr(sip_amt)} monthly SIP in Nifty 50 Index Fund."
    else:
        return f"Hello {name}! I'm your LoanWise AI. 👋\n\nQuick financial snapshot:\n• Health Score: **{health_score}/100**\n• Net Worth: **{fmt_inr(net_worth)}**\n• Monthly Income: {fmt_inr(inc)} | EMI Burden: {emi_ratio}%\n• CIBIL: {cibil if cibil > 0 else 'Not set'}\n\nAsk me anything — loan eligibility, savings plan, investment advice, or debt management. I have full access to your financial data!"


# ── Life Event Sequencer ───────────────────────────────────────────────────
@user_bp.route('/api/user/life-event-planner', methods=['POST'])
@jwt_required()
def life_event_planner():
    uid       = int(get_jwt_identity())
    user      = get_user_by_id(uid)
    profile   = get_user_profile(uid)
    analyses  = get_user_analyses(uid, 10)
    txns      = get_transactions(uid, 30)
    
    data      = request.get_json() or {}
    events    = data.get('events', []) # [{name, year, cost}, ...]
    horizon   = int(data.get('horizon', 5))
    
    # Financial baseline
    inc       = float(profile.get('monthly_income', 0) or 0) if profile else 50000
    sav       = float(profile.get('savings', 0) or 0) if profile else 0
    cibil     = int(profile.get('cibil_score', 0) or 0) if profile else 700
    emis      = profile.get('emis', []) if profile else []
    total_emi = sum(float(e.get('amount', 0) or 0) for e in emis)

    # Determine projection window (尊重用户选择 vs 事件最远年份)
    max_event_year = max([int(e.get('year', 2025)) for e in events]) if events else 2025
    current_year   = 2025
    # 我们取 1. 用户选择的 horizon 2. 处理最远事件所需的年数 之间的最大值
    proj_years     = max(horizon, (max_event_year - current_year) + 1)
    proj_years     = min(proj_years, 16) # Cap at 15 years projection (plus current)

    # Analyze transactions for fixed vs discretionary spending
    fixed_spending = sum(float(t.get('amount', 0)) for t in txns if t.get('category') in ['Bills', 'EMI', 'Rent', 'Utilities'])
    monthly_avg_spending = sum(float(t.get('amount', 0)) for t in txns) / (len(txns)/30 if txns else 1)
    discretionary = max(0, monthly_avg_spending - fixed_spending)

    context = _build_gemini_context(user, profile, analyses, txns, [])
    
    prompt = f"""You are a High-Stakes Financial Strategist for {user['name']}.
User is planning these future life events (Note Category, Priority, and Downpayment PCT):
{json.dumps(events, indent=2)}

{context}

Financial Profile:
- Monthly Income: {inc}
- Current Fixed EMIs/Rent: {fixed_spending}
- Discretionary Spending Pattern: {discretionary}/mo
- Current Savings Liquid: {sav}
- CIBIL Score: {cibil}

Strategic Directives for {proj_years} Years:
1. Priority Logic: If DTI gets too tight, explicitly advise delaying 'Low' or 'Medium' priority events to protect 'High/Critical' goals.
2. Downpayment Logic: The loan burden for an event is ONLY driven by (Cost - Downpayment PCT). If current Savings {sav} + projected surplus cannot cover these downpayments, throw a 'Tight' or 'Critical' liquidity warning.
3. Tax Logic: Use the 'Category' (e.g., Home, Education, Car) to generate specific 'tax_implications'.

Generate a JSON response (ONLY JSON) with this EXACT structure:
{{
  "summary": "Overall feasibility...",
  "projections": [
    {{ "year": 2025, "dti": 30.5, "cibil": 710, "status": "Safe|Risk|Critical", "advice": "..." }},
    ... (up to {current_year + proj_years - 1})
  ],
  "readiness_scores": {{
    "Goal Name from Input": {{ "score": 85, "justification": "Why this score? Mention income/EMI ratio or Downpayment mismatch." }},
    ... (for all events)
  }},
  "liquidity_check": {{
    "status": "Healthy|Tight|Critical",
    "insight": "Explain if their downpayment aspirations match their cash reality."
  }},
  "tax_implications": [
    "Specific tax tip based strictly on the event Categories provided..."
  ],
  "sequencing_strategy": [
    "Strategic advice 1 based on Priority...",
    "Strategic advice 2 based on Downpayments..."
  ],
  "cannibalization_risk": "Specific warning if one event kills authorization for another."
}}
Return the data as a clean JSON block."""

    if gemini_client:
        try:
            resp = gemini_client.models.generate_content(model="gemma-3-27b-it", contents=prompt)
            raw  = resp.text.strip().replace("```json","").replace("```","").strip()
            parsed = json.loads(raw)
        except Exception as e:
            print(f"Life planner AI error: {e}")
            parsed = _fallback_life_plan(inc, total_emi, sav, cibil, events, proj_years)
            parsed['is_fallback'] = True
    else:
        parsed = _fallback_life_plan(inc, total_emi, sav, cibil, events, proj_years)

    # ── Save to Analysis History ───────────────────────────────────────────────
    try:
        num_events = len(events)
        total_cost = sum(float(e.get('cost', 0) or 0) for e in events)
        verdict_str = f"{num_events} milestones, {horizon}yr horizon, Total ₹{int(total_cost):,}"
        save_analysis(uid, 'life_planner', verdict_str,
                      { 'events': events, 'horizon': horizon },
                      parsed)
    except Exception as e:
        print(f"Life planner history save error: {e}")

    return jsonify(parsed), 200


@user_bp.route('/api/user/life-event-history', methods=['GET'])
@jwt_required()
def life_event_history():
    """Return all saved Life Planner analysis runs for the logged-in user."""
    uid = int(get_jwt_identity())
    all_analyses = get_user_analyses(uid, 50)
    # Filter to only life_planner module
    history = [a for a in all_analyses if a.get('module') == 'life_planner']
    for h in history:
        # Safely decode events from the stored input
        h['events']  = h['input'].get('events', [])
        h['horizon'] = h['input'].get('horizon', 5)
    return jsonify(history), 200


def _fallback_life_plan(inc, total_emi, sav, cibil, events, proj_years=6):
    # Simple mathematical projection for specified years
    current_year = 2025
    projections = []
    readiness = {}
    
    for i in range(proj_years):
        year = current_year + i
        year_events = [e for e in events if int(e.get('year', 0)) == year]
        
        # Calculate impact
        total_event_cost = sum(float(e.get('cost', 0) or 0) for e in year_events)
        
        # DTI logic: Assume 15% of annual income as extra "debt burden" per 10L cost if not saved?
        # This is a very rough estimate for fallback
        added_emi = (total_event_cost / 60) # 5yr loan assumption
        year_dti = round(((total_emi + added_emi) / inc) * 100, 1) if inc > 0 else 0
        year_cibil = max(300, min(900, cibil + (i * 10) - (20 if year_dti > 45 else 0)))

        projections.append({
            "year": year,
            "dti": year_dti,
            "cibil": year_cibil,
            "status": "Safe" if year_dti < 40 else ("Risk" if year_dti < 50 else "Critical"),
            "advice": f"Plan for {len(year_events)} events." if year_events else "Buffer building phase."
        })

    return {
        "summary": "Mathematical projection (Fallback Mode). Please check AI connectivity for strategic sequencing.",
        "projections": projections,
        "sequencing_strategy": ["Ensure 6-month buffer before large year events.", "Total estimated cost: " + str(sum(float(e.get('cost', 0) or 0) for e in events))],
        "cannibalization_risk": "DTI peaks at " + str(max(p['dti'] for p in projections)) + "%"
    }


# ── Objective-Driven Agentic AI ────────────────────────────────────────────────
@user_bp.route('/api/user/agent-history', methods=['GET'])
@jwt_required()
def agent_history_list():
    uid = int(get_jwt_identity())
    history = get_agent_history(uid, 10)
    return jsonify(history), 200


@user_bp.route('/api/user/agent-plan', methods=['GET'])
@jwt_required()
def get_current_agent_plan():
    uid = int(get_jwt_identity())
    plan = get_agent_plan(uid)
    if not plan:
        return jsonify({"has_plan": False}), 200
    return jsonify({"has_plan": True, "objective": plan['objective'], "plan": plan['plan_data']}), 200

@user_bp.route('/api/user/agent-action', methods=['POST'])
@jwt_required()
def execute_agent_action():
    uid = int(get_jwt_identity())
    data = request.get_json() or {}
    action_type = data.get('action_type', 'create_reminder')
    title = data.get('title', 'Automation Set')
    message = data.get('message', 'Custom automation scheduled by the user.')
    
    # Run the physical action (save the alert for real)
    save_alert(
        uid, "agent_reminder", "Info",
        "⚡ Agent Action: " + title,
        message,
        "View Dashboard"
    )
    
    # Update the Active Plan to reflect that the user enabled it
    plan = get_agent_plan(uid)
    if plan and 'plan_data' in plan:
        plan_data = plan['plan_data']
        # Init executed_actions if not present
        if 'executed_actions' not in plan_data:
            plan_data['executed_actions'] = []
            
        # Log this action into the active plan's state
        plan_data['executed_actions'].append({
            "action_type": action_type,
            "title": title,
            "message": message
        })
        
        # Save modifications back to DB
        update_agent_plan_json(uid, plan_data)
        
        return jsonify({"ok": True, "plan": plan_data}), 200
    
    return jsonify({"ok": True, "note": "Action executed but no active plan was updated."}), 200
@user_bp.route('/api/user/agent-advice', methods=['GET', 'POST'])
@jwt_required()
def agent_advice():
    uid         = int(get_jwt_identity())
    user        = get_user_by_id(uid)
    analyses    = get_user_analyses(uid, 20)
    txns        = get_transactions(uid, 50)
    profile     = get_user_profile(uid)
    alerts_list = get_alerts(uid, 10)

    _generate_smart_alerts(uid, profile, analyses, txns)
    health_score = _compute_health_score(profile, analyses, txns)
    _, _, net_worth = _compute_net_worth(profile)
    
    # Custom goal/objective passed by user
    data = (request.get_json() or {}) if request.method == 'POST' else {}
    objective = (data.get('objective') or data.get('prompt') or "Optimize my overall financial health and reduce risk.").strip()

    # Let Gemini generate a plan regardless of if the profile is empty

    context = _build_gemini_context(user, profile, analyses, txns, alerts_list)

    gemini_prompt = f"""You are a world-class personal finance Agent for {user['name']}.

{context}

Health Score: {health_score}/100 | Net Worth: {fmt_inr(net_worth)}

User's explicit current objective: "{objective}"

Act as an Agentic AI. Analyze ALL their data specifically to satisfy this objective. 
Generate a JSON response (ONLY JSON, no markdown fences) with EXACTLY these keys:
{{
  "health_score": {health_score},
  "next_action": "Single highest-impact action with exact numbers tailored for this objective.",
  "personalized_plan": [{{"step":1,"title":"...","action":"...","impact":"Critical|High|Medium","timeline":"..."}}],
  "risk_patterns": [{{"pattern":"...","severity":"Critical|Warning|Info","explanation":"...","detected_from":"..."}}],
  "behavioral_insights": [{{"insight":"...","data_point":"...","recommendation":"..."}}],
  "automations": [{{"trigger":"...","action":"...","benefit":"...","setup":"Exact step-by-step setup"}}],
  "roadmap": [{{"period":"Next 30 Days|Next 60 Days|Next 90 Days","milestone":"...","tasks":["...","...","..."]}}],
  "progress": {{"trend":"Improving|Stable|Declining|No Data","description":"..."}},
  "executed_actions": [{{"action_type": "create_reminder", "title": "...", "message": "..."}}],
  "dynamic_chart": {{"title": "Visual Analysis", "type": "bar", "data": [{{"name": "...", "value": 123}}]}}
}}

Rules: Use REAL numbers. 4-5 plan steps. 3 roadmap periods. 3-4 automations. Act autonomously and proactively put 1-3 specific 'create_reminder' actions in `executed_actions`. ALWAYS compute and array a `dynamic_chart` based on the user's objective (e.g. projecting debt vs savings, cash flow over 6 months, etc)."""

    if gemini_client:
        try:
            resp = gemini_client.models.generate_content(model="gemma-3-27b-it", contents=gemini_prompt)
            raw    = resp.text.strip().replace("```json","").replace("```","").strip()
            parsed = json.loads(raw)
            parsed['health_score'] = health_score
        except Exception as e:
            print(f"Gemini agent-advice error: {e}")
            parsed = _rule_based_agent(user['name'], profile, analyses, txns, health_score, objective)
            parsed['is_fallback'] = True
            parsed['error_msg'] = "Gemini API Rate Limit Exceeded (15 requests/min). Showing data-driven fallback plan. Please wait 60 seconds." if "429" in str(e) else "AI connection failed. Showing data-driven fallback plan."
    else:
        parsed = _rule_based_agent(user['name'], profile, analyses, txns, health_score, objective)

    # Auto-execute the agent's actions
    executed = parsed.get("executed_actions", [])
    for act in executed:
        if act.get("action_type") == "create_reminder":
            save_alert(
                uid, "agent_reminder", "Info",
                "⚡ Agent Action: " + act.get("title", "Scheduled Task"),
                act.get("message", "Auto-scheduled by your Financial Agent"),
                "View Dashboard"
            )

    # Persist the plan (latest active plan) + always append to history log
    save_agent_plan(uid, objective, parsed)
    save_agent_history(uid, objective, parsed)

    return jsonify(parsed), 200


def _rule_based_agent(name, profile, analyses, txns, health_score, objective=''):
    # ── Pull real numbers from profile ──────────────────────────────────
    inc        = float(profile.get('monthly_income', 0) or 0) if profile else 0
    emis       = profile.get('emis', []) if profile else []
    total_emi  = sum(float(e.get('amount', 0) or 0) for e in emis)
    sav        = float(profile.get('savings', 0) or 0) if profile else 0
    investments= float(profile.get('investments', 0) or 0) if profile else 0
    cibil      = int(profile.get('cibil_score', 0) or 0) if profile else 0
    expenses   = float(profile.get('monthly_expenses', 0) or 0) if profile else 0
    net_worth  = sav + investments
    emi_ratio  = total_emi / inc if inc > 0 else 0
    free_cash  = max(0, inc - total_emi - expenses)
    emergency_target = inc * 6
    emergency_gap    = max(0, emergency_target - sav)

    # ── Analyse history ─────────────────────────────────────────────────
    high_risk  = [a for a in analyses if a.get('verdict') and any(k in str(a['verdict']).lower() for k in ['high risk','avoid','❌','not eligible','critical'])]
    positive   = [a for a in analyses if a.get('verdict') and any(k in str(a['verdict']).lower() for k in ['eligible ✅','recommend','grade a','grade b','low risk'])]
    by_module  = {}
    for a in analyses:
        m = a.get('module', 'other')
        by_module.setdefault(m, []).append(a)
    trend      = "Improving" if len(positive) > len(high_risk) else ("Declining" if len(high_risk) >= 2 else "Stable")
    recent_5   = analyses[:5]

    # ── Transaction intel ───────────────────────────────────────────────
    total_txn_out  = sum(float(t.get('amount', 0) or 0) for t in txns if str(t.get('flow','')) == 'out')
    avg_monthly_spend = total_txn_out / 3 if txns else 0  # rough 3-month avg
    largest_expense_cat = 'General'
    if txns:
        from collections import Counter
        cat_totals = Counter()
        for t in txns:
            if str(t.get('flow','')) == 'out':
                cat_totals[t.get('category','Other')] += float(t.get('amount', 0) or 0)
        if cat_totals:
            largest_expense_cat = cat_totals.most_common(1)[0][0]

    # ── Objective-aware dynamic plan ────────────────────────────────────
    obj_lower = objective.lower()
    is_home_loan = any(w in obj_lower for w in ['home','house','property','flat'])
    is_emi_reduce = any(w in obj_lower for w in ['emi','debt','reduce','burden','loan'])
    is_savings = any(w in obj_lower for w in ['sav','invest','corpus','wealth'])
    is_credit = any(w in obj_lower for w in ['cibil','credit','score'])

    # Primary directive based on objective + real data
    if is_home_loan:
        directive = (f"For a Home Loan, you need 20% down payment. Based on current savings {fmt_inr(sav)}, "
                     f"you need {fmt_inr(max(0, 2000000 - sav))} more. Invest {fmt_inr(free_cash * 0.6)}/mo in a liquid fund to reach this in "
                     f"{int(max(0, 2000000 - sav) / max(1, free_cash * 0.6))} months.")
    elif is_emi_reduce:
        directive = (f"Your current EMI load is {fmt_inr(total_emi)}/mo ({round(emi_ratio*100,1)}% of income). "
                     f"Prepay the highest-interest loan first using your {fmt_inr(free_cash)}/mo free cash flow. "
                     f"Target <30% FOIR to unlock better loan terms.")
    elif is_credit:
        directive = (f"Your CIBIL score is {cibil}. {'Prime lending territory.' if cibil >= 750 else 'Needs improvement.'} "
                     f"Reduce utilization, automate EMI payments to avoid late marks, and avoid new inquiries for 90 days.")
    elif inc > 0:
        directive = (f"Build emergency fund to {fmt_inr(emergency_target)} (6 months income). "
                     f"Gap is {fmt_inr(emergency_gap)}. At {fmt_inr(free_cash * 0.4)}/mo saving rate, reachable in "
                     f"{int(emergency_gap / max(1, free_cash * 0.4))} months.")
    else:
        directive = "Update your Dashboard Profile with income and EMI details to get a personalized action plan."

    # Plan steps (data-driven)
    plan = []
    step = 1
    if emergency_gap > 0:
        plan.append({"step":step,"title":"Emergency Fund","action":f"Gap of {fmt_inr(emergency_gap)} remaining. Save {fmt_inr(free_cash*0.4)}/mo → reach target in {int(emergency_gap/max(1,free_cash*0.4))} months.","impact":"Critical","timeline":"3-6 months"})
        step += 1
    if emi_ratio > 0.3:
        plan.append({"step":step,"title":"EMI Ratio Reduction","action":f"Current FOIR: {round(emi_ratio*100,1)}%. Prepay {fmt_inr(total_emi*0.1)}/mo extra on shortest EMI. Target: <30%.","impact":"High","timeline":"60-90 days"})
        step += 1
    if cibil > 0 and cibil < 720:
        plan.append({"step":step,"title":"Credit Score Recovery","action":f"Current CIBIL: {cibil}. Automate all {len(emis)} EMI payments via NACH. Avoid new inquiries for 60 days.","impact":"High","timeline":"30-60 days"})
        step += 1
    if free_cash > 5000:
        plan.append({"step":step,"title":"Surplus Deployment","action":f"{fmt_inr(free_cash)}/mo free after all outflows. Split: 60% liquid fund + 40% index SIP.","impact":"High","timeline":"This week"})
        step += 1
    if high_risk:
        plan.append({"step":step,"title":"Risk Pattern Correction","action":f"{len(high_risk)} high-risk results in history. Review and address: {', '.join(set(a.get('module','') for a in high_risk[:3]))}.","impact":"Critical","timeline":"Immediate"})
        step += 1
    # Ensure minimum 3 steps
    if len(plan) < 3:
        plan.append({"step":step,"title":"Financial Profile Setup","action":"Complete your Dashboard Profile (income, EMIs, savings, investments) for fully personalized advice.","impact":"Medium","timeline":"Today"})

    # Risk patterns from real history
    risk_patterns = []
    if high_risk:
        risk_patterns.append({"pattern":f"{len(high_risk)} High-Risk Module Results","severity":"Critical" if len(high_risk) >= 3 else "Warning","explanation":f"Modules with negative verdicts: {', '.join(set(a.get('module','') for a in high_risk))}.","detected_from":"Analysis history"})
    if emi_ratio > 0.4:
        risk_patterns.append({"pattern":"FOIR Breach","severity":"Critical","explanation":f"EMI takes {round(emi_ratio*100,1)}% of income. Most banks require <40%. You are at risk of loan rejection.","detected_from":"Profile data"})
    if cibil > 0 and cibil < 650:
        risk_patterns.append({"pattern":"Sub-Prime Credit","severity":"Warning","explanation":f"CIBIL {cibil} is below the 650 minimum for most personal loans. This increases rejection probability.","detected_from":"Profile data"})
    if sav < inc * 3:
        risk_patterns.append({"pattern":"Insufficient Emergency Buffer","severity":"Warning","explanation":f"Savings {fmt_inr(sav)} cover only {round(sav/max(1,inc), 1)} months of income. Target: 6 months.","detected_from":"Profile data"})
    if not risk_patterns:
        risk_patterns.append({"pattern":"Clean Risk Profile","severity":"Info","explanation":f"No critical risks detected across {len(analyses)} analyses.","detected_from":"Full history scan"})

    # Behavioral insights from real data
    behavioral = []
    if emi_ratio > 0:
        behavioral.append({"insight":"EMI Concentration" if emi_ratio > 0.35 else "Healthy Debt Ratio","data_point":f"EMI-to-Income: {round(emi_ratio*100,1)}% ({fmt_inr(total_emi)}/mo)","recommendation":f"{'Prepay aggressively to free cash flow.' if emi_ratio > 0.35 else 'Maintain this ratio and grow income side.'}"})
    if avg_monthly_spend > 0:
        behavioral.append({"insight":f"Top Spend Category: {largest_expense_cat}","data_point":f"Avg monthly outflow: {fmt_inr(avg_monthly_spend)} across {len(txns)} transactions","recommendation":f"Review {largest_expense_cat} category for 10-15% discretionary cuts."})
    if len(analyses) > 5:
        behavioral.append({"insight":f"Active Borrower Pattern ({len(analyses)} simulations)","data_point":f"{len(positive)} positive vs {len(high_risk)} high-risk outcomes","recommendation":f"{'Consistent approvals — you qualify for premium rates.' if len(positive) > len(high_risk) else 'High rejection rate suggests profile needs strengthening before applying.'}"})

    # Automations (data-driven targets)
    automations = [
        {"trigger":"Monthly salary credit","action":f"Auto-sweep {fmt_inr(free_cash*0.4)}/mo to Emergency Liquid Fund","benefit":f"Build {fmt_inr(emergency_target)} buffer in {int(emergency_gap/max(1,free_cash*0.4))} months","setup":f"Bank netbanking → Standing Instructions → Transfer {fmt_inr(free_cash*0.4)} to savings account on salary day"},
        {"trigger":"Monthly surplus","action":f"Nifty 50 Index SIP — {fmt_inr(free_cash*0.3)}/mo","benefit":f"Estimated {fmt_inr(free_cash*0.3*12*10*2.5)} corpus in 10 years at 12% CAGR","setup":"Zerodha/Groww → Index Fund → Monthly SIP → Set and forget"},
    ]
    if emis:
        automations.append({"trigger":"EMI due dates","action":f"NACH mandate for all {len(emis)} EMIs via bank netbanking","benefit":"Zero late payment marks. CIBIL stays clean.","setup":"Bank portal → Loan repayment → NACH authority → Authorize each lender"})
    if investments < inc * 12:
        automations.append({"trigger":"Quarterly review","action":"Portfolio rebalancing alert (set Google Calendar reminder)","benefit":"Prevent portfolio drift, lock in gains","setup":"Set calendar → Every 3 months → Review mutual funds and rebalance to 60/40 equity/debt"})

    # Roadmap
    roadmap = [
        {"period":"Next 30 Days","milestone":"Stabilize & Automate","tasks":[f"Set up NACH for all {len(emis)} EMIs",f"Open liquid fund. Target {fmt_inr(emergency_target)}","Review top spending category","Re-run eligibility check after changes"]},
        {"period":"Next 60 Days","milestone":"Reduce Debt Burden","tasks":[f"Extra {fmt_inr(total_emi*0.05)}/mo payment on highest-rate loan","Freeze new credit inquiries",f"Bring FOIR from {round(emi_ratio*100,1)}% toward <35%"]},
        {"period":"Next 90 Days","milestone":"Build Creditworthiness","tasks":[f"Target CIBIL {min(900, cibil+30) if cibil else 750}+",f"3-month emergency fund ({fmt_inr(inc*3)})","Re-run Default Risk Oracle with updated profile"]},
    ]

    return {
        "health_score":      health_score,
        "next_action":       directive,
        "personalized_plan": plan,
        "risk_patterns":     risk_patterns,
        "behavioral_insights": behavioral,
        "automations":       automations,
        "roadmap":           roadmap,
        "progress":          {"trend":trend,"description":f"Based on {len(analyses)} total analyses. {len(positive)} positive outcomes, {len(high_risk)} high-risk outcomes."},
        "executed_actions":  [{"action_type": "create_reminder", "title": "Check plan execution", "message": "Remember to follow your newly generated financial plan."}],
        "dynamic_chart":     {"title": "Assets vs Debts", "type": "bar", "data": [
            {"name": "Total Monthly EMIs", "value": int(total_emi)},
            {"name": "Free Cash Flow", "value": int(free_cash)},
            {"name": "Savings", "value": int(sav)}
        ]}
    }

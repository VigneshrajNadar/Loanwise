import pandas as pd
import pdfplumber
import json
import io
import re

def extract_financial_data(file_stream=None, filename=None, manual_data=None):
    """
    Unified Data Extraction Layer
    Converts CSV, PDF, or Manual Form data into a normalized financial dataset.
    """
    # 1. Start with default baseline values
    normalized_data = {
        'monthly_income': 0.0,
        'monthly_expenses': 0.0,
        'emi_amount': 0.0,
        'loan_amount': 0.0,
        'credit_utilization': 0.0,
        'account_balance': 0.0,
        'dependents': 0,
        'existing_loans': 0,
        'credit_card_payments': 0.0,
        'expenses_before_loan': 0.0,
        'expenses_after_loan': 0.0,
        'discretionary_spending': 0.0,
        'income_variation': 0.0,
        'spending_trends': 0.0,
        'recent_large_expenses': 0.0,
        'previous_payment_delays': 0.0,
        'emi_delay_frequency': 0.0,
        'income_drop': 0.0,
        'spending_increase': 0.0,
        'account_balance_trend': 0.0,
        'monthly_spending_pattern': 0.0,
        'current_savings': 0.0,
        'job_stability': 1.0, # 1 for stable
        'number_of_active_loans': 0,
        'bnpl_usage': 0.0,
        'credit_limit': 0.0,
        'monthly_repayment_total': 0.0,
        'late_payment_frequency': 0.0,
        'loan_duration': 0.0,
        'payment_consistency': 1.0,
        'salary_date': 1,
        'transaction_history': [],
        'payment_history': [],
        
        # New Granular fields
        'loan_tenure': 0,
        'interest_rate': 0.0,
        'rent': 0.0,
        'utilities': 0.0,
        'food': 0.0,
        'transport': 0.0,
        'insurance': 0.0,
        'other_expenses': 0.0,
        'employment_type': 'Salaried',
        'loan_type': 'Personal'
    }

    # 2. Extract from File (CSV or PDF)
    if file_stream and filename:
        ext = filename.split('.')[-1].lower()
        if ext == 'csv':
            try:
                df = pd.read_csv(file_stream)
                df.columns = [c.strip().lower() for c in df.columns]

                # ── Keyword-based category detection from transaction descriptions ──
                CATEGORY_KEYWORDS = {
                    'food':          ['swiggy', 'zomato', 'grocery', 'supermarket', 'restaurant', 'cafe', 'food', 'bakery', 'vegetables'],
                    'rent':          ['rent', 'housing', 'landlord', 'property', 'maintenance'],
                    'transport':     ['uber', 'ola', 'metro', 'bus', 'petrol', 'fuel', 'transport', 'travel'],
                    'entertainment': ['netflix', 'prime', 'hotstar', 'spotify', 'movie', 'entertainment', 'shopping', 'amazon', 'flipkart'],
                    'utilities':     ['electricity', 'water', 'gas', 'broadband', 'mobile', 'recharge', 'utility', 'insurance'],
                    'emi':           ['emi', 'loan', 'repayment', 'installment'],
                    'income':        ['salary', 'credit', 'income', 'pay', 'transfer in', 'neft cr', 'imps cr'],
                }
                cat_totals = {k: 0.0 for k in CATEGORY_KEYWORDS}

                desc_col = next((c for c in ['description', 'narration', 'particulars', 'detail', 'remarks', 'category'] if c in df.columns), None)
                amt_col  = next((c for c in ['amount', 'debit', 'credit', 'transaction_amount', 'expense', 'income'] if c in df.columns), None)

                if desc_col and amt_col:
                    for _, row in df.iterrows():
                        desc = str(row.get(desc_col, '')).lower()
                        try:
                            amt = abs(float(str(row[amt_col]).replace(',', '').replace('-', '')))
                        except:
                            amt = 0.0
                        for cat, keys in CATEGORY_KEYWORDS.items():
                            if any(k in desc for k in keys):
                                cat_totals[cat] += amt
                                break

                    if cat_totals['income'] > 0:
                        normalized_data['monthly_income'] = cat_totals['income']
                    if cat_totals['food'] > 0:
                        normalized_data['food'] = cat_totals['food']
                    if cat_totals['rent'] > 0:
                        normalized_data['rent'] = cat_totals['rent']
                    if cat_totals['transport'] > 0:
                        normalized_data['transport'] = cat_totals['transport']
                    if cat_totals['utilities'] > 0:
                        normalized_data['utilities'] = cat_totals['utilities']
                    if cat_totals['entertainment'] > 0:
                        normalized_data['discretionary_spending'] = cat_totals['entertainment']
                        normalized_data['other_expenses'] = cat_totals['entertainment']
                    if cat_totals['emi'] > 0:
                        normalized_data['emi_amount'] = cat_totals['emi']

                    normalized_data['spending_analysis_from_file'] = cat_totals

                # Fallback: direct column names
                if normalized_data['monthly_income'] == 0.0 and 'income' in df.columns:
                    normalized_data['monthly_income'] = float(df['income'].mean())
                if 'account_balance' in df.columns:
                    normalized_data['account_balance'] = float(df['account_balance'].iloc[-1])
                if 'loan_amount' in df.columns:
                    normalized_data['loan_amount'] = float(df['loan_amount'].max())

                normalized_data['transaction_history'] = df.fillna(0).to_dict(orient='records')
            except Exception as e:
                print(f"Error parsing CSV: {e}")

        elif ext == 'pdf':
            try:
                text = ""
                with pdfplumber.open(file_stream) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"

                # Smart regex extraction
                salary_matches  = re.findall(r'(?:salary|credit|income)[^\d]*([\d,]+)', text, re.IGNORECASE)
                emi_matches     = re.findall(r'(?:emi|loan payment|installment)[^\d]*([\d,]+)', text, re.IGNORECASE)
                balance_matches = re.findall(r'(?:closing balance|balance)[^\d]*([\d,]+)', text, re.IGNORECASE)
                expense_matches = re.findall(r'(?:total debit|total expense)[^\d]*([\d,]+)', text, re.IGNORECASE)

                if salary_matches:
                    normalized_data['monthly_income'] = float(salary_matches[0].replace(',', ''))
                if emi_matches:
                    normalized_data['emi_amount'] = float(emi_matches[0].replace(',', ''))
                if balance_matches:
                    normalized_data['account_balance'] = float(balance_matches[-1].replace(',', ''))
                if expense_matches:
                    normalized_data['monthly_expenses'] = float(expense_matches[0].replace(',', ''))

                normalized_data['transaction_history'].append({
                    "source": "PDF",
                    "detected_salary": salary_matches[0] if salary_matches else None,
                    "detected_emi": emi_matches[0] if emi_matches else None,
                    "preview": text[:200]
                })
            except Exception as e:
                print(f"Error parsing PDF: {e}")

    # 3. Merge Manual Data (Form fields)
    # Manual data overrides file estimations if provided
    if manual_data and isinstance(manual_data, dict):
        for key, value in manual_data.items():
            if value is not None and str(value).strip() != "":
                # Convert string numerals to float/int securely where applicable
                try:
                    if key in ['transaction_history', 'payment_history']:
                        # Handle JSON strings for arrays if submitted via form data
                        if isinstance(value, str):
                            normalized_data[key] = json.loads(value)
                        else:
                            normalized_data[key] = value
                    else:
                        normalized_data[key] = float(value)
                except (ValueError, TypeError):
                    normalized_data[key] = value

    # Apply some logical defaults if still 0 but related fields have values
    if normalized_data['monthly_income'] == 0.0 and normalized_data['account_balance'] > 0:
        normalized_data['monthly_income'] = normalized_data['account_balance'] * 0.2
        
    # If granular expenses are provided, sum them up and override monthly_expenses
    granular_expenses = ['rent', 'utilities', 'food', 'transport', 'insurance', 'other_expenses']
    sum_granular = sum([normalized_data.get(k, 0.0) for k in granular_expenses])
    if sum_granular > 0:
        normalized_data['monthly_expenses'] = sum_granular
    elif normalized_data['monthly_expenses'] == 0.0 and normalized_data['monthly_income'] > 0:
        normalized_data['monthly_expenses'] = normalized_data['monthly_income'] * 0.4
        
    if normalized_data['loan_amount'] > 0 and normalized_data['emi_amount'] == 0:
        normalized_data['emi_amount'] = normalized_data['loan_amount'] * 0.05
    
    # Estimate derived values if missing needed by ML
    if normalized_data['current_savings'] == 0.0:
        normalized_data['current_savings'] = normalized_data['account_balance']
        
    if normalized_data['credit_utilization'] == 0.0 and normalized_data['credit_limit'] > 0:
        normalized_data['credit_utilization'] = (normalized_data['credit_card_payments'] / normalized_data['credit_limit']) * 100
        
    # Map loan_tenure alias
    if normalized_data['loan_tenure'] == 0 and normalized_data['loan_duration'] > 0:
        normalized_data['loan_tenure'] = normalized_data['loan_duration']
    elif normalized_data['loan_duration'] == 0 and normalized_data['loan_tenure'] > 0:
        normalized_data['loan_duration'] = normalized_data['loan_tenure']

    return normalized_data

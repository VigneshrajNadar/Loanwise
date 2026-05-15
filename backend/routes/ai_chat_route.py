from flask import Blueprint, request, jsonify, Response, stream_with_context
import requests
import json
import re
import traceback

ai_chat_bp = Blueprint('ai_chat', __name__)

import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)
else:
    client = None

# ─── Rule-based fallback advisor ─────────────────────────────────────────────
def rule_based_response(question: str, profile: dict) -> str:
    q = question.lower()
    inc  = profile.get('monthly_income', 0)
    emi  = profile.get('emi_amount', 0)
    exp  = profile.get('monthly_expenses', 0)
    sav  = profile.get('current_savings', 0)
    loan = profile.get('loan_amount', 0)
    rate = profile.get('interest_rate', 0)
    tenure = profile.get('loan_tenure', 0)
    burden = round((emi / inc * 100), 1) if inc > 0 else 0
    net_sav = inc - exp - emi
    sav_rate = round((net_sav / inc * 100), 1) if inc > 0 else 0
    cov_months = round(sav / exp, 1) if exp > 0 else 0

    # Intent routing
    if any(k in q for k in ['emi', 'installment', 'monthly payment']):
        return (
            f"Your current EMI is ₹{emi:,.0f}/month, which is {burden}% of your income. "
            f"{'This is healthy — keep it below 35%.' if burden < 35 else 'This is above the safe threshold of 35%. Consider prepaying or restructuring your loan.'} "
            f"With ₹{inc:,.0f} income, you have ₹{net_sav:,.0f} left after EMI and expenses."
        )
    elif any(k in q for k in ['savings', 'save', 'emergency fund']):
        shortfall = max(0, 6 * exp - sav)
        return (
            f"You currently have ₹{sav:,.0f} in savings, covering {cov_months} months of expenses. "
            f"{'Great — you meet the 6-month emergency fund benchmark!' if cov_months >= 6 else f'You need ₹{shortfall:,.0f} more to reach the recommended 6-month buffer of ₹{6*exp:,.0f}.'} "
            f"Your savings rate is {sav_rate}%. Aim for at least 20% of income."
        )
    elif any(k in q for k in ['invest', 'mutual fund', 'sip', 'stock', 'fd']):
        investable = max(0, net_sav - 0.5 * exp)
        return (
            f"Based on your profile, you can potentially invest ₹{investable:,.0f}/month. "
            f"Consider starting an SIP in diversified equity mutual funds for long-term wealth. "
            f"For emergency parking, use liquid funds or high-yield savings accounts. "
            f"Only invest what exceeds your 6-month emergency fund (currently {cov_months} months covered)."
        )
    elif any(k in q for k in ['prepay', 'foreclose', 'pay off', 'early']):
        saved_interest = round(loan * (rate / 100) * (tenure / 12) * 0.4)
        return (
            f"Prepaying your ₹{loan:,.0f} loan at {rate}% can save you approximately ₹{saved_interest:,.0f} in interest. "
            f"Use the avalanche method: prepay the loan with the highest interest rate first. "
            f"Even a single extra EMI per year can cut your tenure by 2-3 months."
        )
    elif any(k in q for k in ['credit', 'cibil', 'score', 'credit card']):
        return (
            f"To improve your credit score: 1) Pay all EMIs on time (biggest factor at 35%). "
            f"2) Keep credit utilization below 30%. 3) Avoid applying for multiple loans simultaneously. "
            f"4) Maintain a mix of secured and unsecured credit. Your current EMI burden of {burden}% "
            f"{'looks healthy for your credit profile.' if burden < 40 else 'may negatively impact your credit score — reduce it below 40%.'}"
        )
    elif any(k in q for k in ['budget', 'spend', 'expense', 'reduce', 'cut']):
        discretionary = max(0, exp - (0.65 * exp))
        return (
            f"Your monthly expenses are ₹{exp:,.0f}. "
            f"Using the 50-30-20 rule: ₹{0.5*inc:,.0f} for needs, ₹{0.3*inc:,.0f} for wants, ₹{0.2*inc:,.0f} for savings. "
            f"You're currently spending {round(exp/inc*100,1)}% of income on expenses. "
            f"Try to identify and cut ~₹{round(exp*0.1):,.0f}/month in discretionary spending."
        )
    elif any(k in q for k in ['tax', '80c', 'deduction', 'income tax']):
        tax_save = min(150000, loan * 0.12)
        return (
            f"Indian tax benefits for loan borrowers: "
            f"Section 80C: Up to ₹1,50,000 deduction on home loan principal repayment. "
            f"Section 24(b): Up to ₹2,00,000 deduction on home loan interest. "
            f"Section 80E: Full deduction on education loan interest (no limit, 8 years). "
            f"Based on your loan of ₹{loan:,.0f}, you could save approx ₹{tax_save:,.0f} in tax."
        )
    elif any(k in q for k in ['risk', 'default', 'missed', 'delay']):
        return (
            f"Key actions to prevent loan default: "
            f"1) Set up auto-debit for your ₹{emi:,.0f} EMI — never miss due to forgetfulness. "
            f"2) Maintain {cov_months} months savings (target: 6 months). "
            f"3) Notify your lender immediately if you face financial stress — they can offer moratorium options. "
            f"4) Avoid taking new credit when EMI burden is above 35% (yours: {burden}%)."
        )
    elif any(k in q for k in ['afford', 'can i', 'should i take', 'new loan']):
        safe_emi = round(inc * 0.35) - emi
        return (
            f"Based on your income of ₹{inc:,.0f} and existing EMI of ₹{emi:,.0f}, "
            f"you can safely afford an additional EMI of up to ₹{max(0,safe_emi):,.0f}/month "
            f"while staying within the 35% EMI-to-income threshold. "
            f"{'Your current burden leaves healthy room for a new loan.' if burden < 25 else 'Your existing burden is already significant. Be cautious about adding new debt.'}"
        )
    else:
        return (
            f"Based on your financial profile: Income ₹{inc:,.0f} | EMI ₹{emi:,.0f} | Savings ₹{sav:,.0f}. "
            f"Your loan burden is {burden}% ({'healthy' if burden < 35 else 'above safe limit'}), "
            f"savings coverage is {cov_months} months ({'adequate' if cov_months >= 6 else 'below recommended 6 months'}), "
            f"and savings rate is {sav_rate}%. "
            f"Ask me about savings, EMI stress, investment, prepayment, credit score, budgeting, or tax benefits!"
        )

# ─── Gemini-powered response ──────────────────────────────────────────────────
def build_system_prompt(profile: dict, context: str) -> str:
    prompt = f"""You are LoanwiseAI, a professional Indian fintech financial advisor integrated into the Loanwise loan monitoring platform.

User's Financial Profile:
- Monthly Income: ₹{profile.get('monthly_income', 0):,.0f}
- Monthly EMI: ₹{profile.get('emi_amount', 0):,.0f}
- Loan Amount: ₹{profile.get('loan_amount', 0):,.0f}
- Loan Tenure: {profile.get('loan_tenure', 0)} months
- Interest Rate: {profile.get('interest_rate', 0)}%
- Monthly Expenses: ₹{profile.get('monthly_expenses', 0):,.0f}
- Current Savings: ₹{profile.get('current_savings', 0):,.0f}
- Account Balance: ₹{profile.get('account_balance', 0):,.0f}
- EMI-to-Income Ratio: {round(profile.get('emi_amount', 0)/max(1,profile.get('monthly_income',1))*100,1)}%
- Employment: {profile.get('employment_type', 'Salaried')}
- Dependents: {profile.get('dependents', 0)}

You must:
1. Give precise, actionable advice using the user's actual numbers (always use ₹ for Indian rupees)
2. Be concise (max 4-5 sentences)
3. Reference specific figures from their profile
4. Include a concrete actionable step at the end
5. Be warm, professional, and speak like a trusted financial advisor
6. Do NOT ask follow-up questions — give direct advice

Do not say you cannot help. Always provide a useful answer."""

    if context:
        prompt += f"\n\n[CRITICAL PAGE CONTEXT]\nRight now, the user is looking at the following dashboard section/page: '{context}'.\n"
        
        # Inject highly-specific optimized behaviors based on the page
        if context == "Home Page":
            prompt += "You are the Welcome Intelligence. If their profile shows ₹0, aggressively encourage them to upload their bank statements to unlock your full power. Give a brief tour: they can use the 'Eligibility Predictor' to check loan chances, 'Default Risk Oracle' for safety, or 'Decision Intelligence' for charts."
        elif context == "Decision Intelligence":
            prompt += "You are a Data Analyst AI. The user is looking at predictive charts and historical trends. Focus heavily on identifying spending habits, burn rates, and projecting their future financial health. Use analytical, data-driven language."
        elif context == "Default Risk Oracle":
            prompt += "You are a Risk Assessment AI. The user is looking at their risk profile. Focus exclusively on identifying red flags, early warning signs like tenure sensitivity, and providing severe but actionable steps to prevent loan default."
        elif context == "Eligibility Predictor":
            prompt += "You are a Loan Underwriting AI. The user is looking at their ML-driven approval odds. Guide them specifically on what metrics (income, debt-ratio) they need to improve to raise their chances of getting a loan approved."
        else:
            prompt += "Tailor your response to be highly relevant to this specific page or section. Explain the metrics they are currently viewing."
        
    return prompt


@ai_chat_bp.route('/api/ai-chat', methods=['POST'])
def ai_chat():
    data    = request.get_json(force=True)
    question = data.get('question', '').strip()
    profile  = data.get('profile', {})
    history  = data.get('history', [])
    context  = data.get('context', '') # New context parameter from frontend

    if not question:
        return jsonify({'error': 'No question provided'}), 400

    def generate():
        if not client:
            yield "⚠️ SYSTEM ERROR: The Gemini API Key is missing! \n\nI need you to add your `GEMINI_API_KEY` to the `.env` file inside the `backend` folder, and then **restart the backend server** so I can work properly! Without it, I am unable to connect to the Gemini Engine."
            return

        try:
            system_prompt = build_system_prompt(profile, context)
            
            # Format history for new genai Client
            formatted_history = []
            for msg in history[-6:]:
                formatted_history.append(types.Content(role="user", parts=[types.Part.from_text(text=msg['question'])]))
                formatted_history.append(types.Content(role="model", parts=[types.Part.from_text(text=msg['answer'])]))
                
            chat = client.chats.create(
                model="gemini-2.5-flash",
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                ),
                history=formatted_history
            )
            
            context_advisory = f"\n[IMPORTANT CONTEXT] The user is currently active on the page/section: '{context}'. Please frame your answer around this context immediately." if context else ""
            full_prompt = f"{context_advisory}\n\n[USER QUESTION]\n{question}"
            
            response_stream = chat.send_message_stream(full_prompt)
            for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            print(f"Gemini streaming error: {e}")
            traceback.print_exc()
            yield f"\n\nERROR: Failed to generate response from Google Gemini API. Please check your API key and terminal logs. Details: {str(e)}"

    return Response(stream_with_context(generate()), mimetype='text/plain')

@ai_chat_bp.route('/api/ai-chat/status', methods=['GET'])
def ai_status():
    if client:
        return jsonify({'ollama': True, 'models': ['gemini-2.5-flash'], 'ready': True})
    return jsonify({'ollama': False, 'models': [], 'ready': False})

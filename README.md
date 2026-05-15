# Loanwise Fintech Platform

## Overview
Loanwise is an enterprise-grade fintech platform built to provide advanced financial health assessments, accurate rate predictions, loan viability analysis, and robust biometric security intelligence. Combining a dynamic frontend with a powerful machine learning backend, Loanwise offers "forensic" financial capabilities designed for both lenders and individual users. It parses real financial documents and runs multi-model inference to return deep analytical insights.

## Tech Stack
Based on the project's architecture and configuration files, the application strictly utilizes the following tools:

### Frontend
- **Framework & Build**: React.js 19 (`react`, `react-dom`), Vite (`vite`, `@vitejs/plugin-react`)
- **Routing**: React Router DOM (`react-router-dom`)
- **Styling**: Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`), utility helpers (`clsx`, `tailwind-merge`)
- **Visualizations**: Recharts (`recharts`) for dynamic charts, liquidity flux maps, and cohort intelligence visualizations
- **Animations**: Framer Motion (`framer-motion`) for staggered text reveals and micro-animations
- **Data Fetching**: Axios (`axios`)
- **Icons**: Lucide React (`lucide-react`)
- **Exporting**: HTML2PDF.js (`html2pdf.js`) for generating dynamic PDF reports from DOM elements

### Backend
- **Framework**: Python 3, Flask (`flask`, `flask-cors`, `Werkzeug`)
- **Database**: SQLite (via standard Python `sqlite3`)
- **Data Extraction**: PDFPlumber (`pdfplumber`) for reading uploaded bank statements, Python `json` and `re` (Regex) for smart parsing
- **API Integrations**: Google Gemini API (`google.genai`) for the conversational AI Chat feature

### Machine Learning & Data Processing
- **Data Manipulation**: Pandas (`pandas`), Numpy (`numpy`)
- **Algorithms & ML**: Scikit-Learn (`scikit-learn`), XGBoost (`xgboost`)
- **Model Persistence**: Joblib (`joblib`)
- **Dataset Fetching**: Kagglehub (`kagglehub`)

---

## Machine Learning Models: Purpose & Expected Output

Loanwise leverages a multi-model architecture. Below is a detailed report of the specific models trained and deployed within the platform:

### 1. Loan Decision AI (`loan_model.pkl`)
- **Algorithm**: XGBoost Classifier
- **Purpose**: Evaluates applicant financial parameters (income, DTI, credit history) to determine overall loan viability.
- **Expected Output**: A boolean decision (Approve/Reject) accompanied by a model-backed Safety Score (e.g., 85/100).

### 2. Default Risk Model (`default_model.pkl`)
- **Algorithm**: Random Forest Classifier
- **Purpose**: Analyzes historical financial behaviors to predict the exact probability of a user defaulting on a loan, robust to overfitting through ensemble techniques.
- **Expected Output**: Risk classification ("Fully Paid" vs "Charged Off") and an explicit Default Risk Percentage.

### 3. Rate Prediction Model (`rate_fairness_model.pkl`)
- **Algorithm**: Regression Model (Random Forest / XGBoost Regressor)
- **Purpose**: Suggests fair, non-predatory interest rates by analyzing the applicant's risk tier and financial health metrics.
- **Expected Output**: An estimated, fair interest rate percentage (e.g., 10.5%).

### 4. EMI Stress Model (`emi_stress_rf.pkl`)
- **Algorithm**: Random Forest Classifier
- **Purpose**: Predicts an applicant's financial stress levels by evaluating their current Debt-to-Income (DTI) ratio, monthly expenses, and requested loan installment.
- **Expected Output**: Categorical stress level indicating financial strain (`0`: Safe, `1`: Warning, `2`: Critical).

### 5. Spending Anomaly Model (`spending_anomaly_if.pkl`)
- **Algorithm**: Isolation Forest
- **Purpose**: Detects unusual or anomalous spending patterns in a user's transaction history (from uploaded bank statements) to prevent fraud.
- **Expected Output**: Anomaly flag (`-1` for anomaly, `1` for normal transaction).

### 6. Borrower Behavior Clustering Model (`borrower_kmeans.pkl`)
- **Algorithm**: K-Means Clustering
- **Purpose**: Groups users into distinct behavioral cohorts based on their repayment delays and payment amounts to tailor financial advice dynamically.
- **Expected Output**: Cluster ID (e.g., Cohort 0: Responsible, Cohort 1: Moderate Risk, Cohort 2: High Risk).

---

## Data Handling & Preprocessing
The application uses a unified Data Extraction layer (`data_extraction.py`) to process user inputs:
- **PDF & CSV Parsing**: `pdfplumber` and `pandas` parse transaction histories. Regular expressions dynamically extract income, EMI, and balance figures.
- **Keyword Categorization**: Transactions are automatically mapped to categories (Food, Rent, Transport, Utilities, Entertainment, etc.) using dictionary-based keyword matching.
- **Imputation**: Missing data (like Monthly Expenses) is synthesized intelligently from DTI and Income if not explicitly provided.
- **Privacy & Security**: Sensitive credentials like the Gemini API Key are loaded strictly through hidden `.env` configurations.

## Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/VigneshrajNadar/Loanwise.git
cd Loanwise
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt

# Create a .env file to store your API keys securely
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env

# Run the Flask API
python app.py
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

> **Note**: Do not commit your `.env` file or hardcode your Gemini API Key in the source code. The included `.gitignore` guarantees that `.env` files remain safely on your local machine.

## License
MIT License

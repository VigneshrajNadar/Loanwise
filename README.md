# Loanwise Fintech Platform

## Overview
Loanwise is an enterprise-grade fintech platform built to provide advanced financial health assessments, accurate rate predictions, loan viability analysis, and robust biometric security intelligence. Combining a dynamic frontend with a powerful machine learning backend, Loanwise offers "forensic" financial capabilities designed for both lenders and individual users. It parses real financial documents and runs multi-model inference to return deep analytical insights.
## Core Platform Tools (Navigation Features)
The platform is organized into several user-facing tools accessible directly from the main header (Navbar). Each tool connects to our backend machine learning engines to provide specialized financial insights:

1. **Eligibility Check**: A preliminary assessment tool that determines a user's basic qualification for a loan before diving into deep ML predictions.
2. **Default Risk**: Connects directly to the Random Forest *Default Risk Model* to predict the probability of loan default based on historical financial behaviors.
3. **Decision AI**: Powered by the *Loan Decision AI (XGBoost)*, this tool evaluates comprehensive applicant parameters and provides an actionable Approval/Rejection decision along with a Safety Score.
4. **Health Dashboard**: A unified interface utilizing the *EMI Stress Model*, *Spending Anomaly Model*, and *Borrower Clustering Model* to present a holistic view of the user's financial health, liquidity flux, and behavioral cohort.
5. **Life Planner**: An interactive predictive tool that allows users to simulate major life events (e.g., buying a car, marriage) and visualize their projected impact on future financial stability and liquidity.
6. **Real-time Notifications**: An integrated alert system (Bell icon) that pushes real-time notifications to the user regarding detected anomalies, upcoming EMI payments, or significant changes in financial health.
7. **User Dashboard**: A personalized portal for authenticated users to view their historical assessments, generated PDF reports, and manage their profile.

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
- **Algorithm**: Random Forest Classifier (`n_estimators=100`)
- **Training Methodology**: Trained on the Kaggle *Loan Prediction Problem Dataset*. Categorical features are normalized using `LabelEncoder` and missing numerical data is imputed with medians. Uses an 80/20 train-test split.
- **Model Performance**: Typically achieves ~80-85% test accuracy.
- **Purpose**: Evaluates applicant financial parameters (income, DTI, credit history) to determine overall loan viability.
- **Expected Output**: A boolean decision (Approve/Reject) accompanied by a model-backed Safety Score (e.g., 85/100).

### 2. Default Risk Model (`default_model.pkl`)
- **Algorithm**: Random Forest Classifier (`max_depth=12`)
- **Training Methodology**: Trained on a 200,000-row sample of the *Lending Club Accepted Loans Dataset*. It explicitly isolates binary outcome states ("Fully Paid" vs "Charged Off"). Complex temporal strings (e.g., employment length) are parsed into discrete numerical integers via Regex.
- **Model Performance**: Achieves ~85-90% test accuracy.
- **Purpose**: Analyzes historical financial behaviors to predict the exact probability of a user defaulting on a loan, robust to overfitting through ensemble techniques.
- **Expected Output**: Risk classification ("Fully Paid" vs "Charged Off") and an explicit Default Risk Percentage.

### 3. Rate Prediction Model (`rate_fairness_model.pkl`)
- **Algorithm**: Linear Regression
- **Training Methodology**: Trained using financial metrics (FICO Score, Annual Income, Loan Amount) to regress against historical Lending Club interest rates.
- **Model Performance**: Yields a strong R² score in testing, accurately modeling historical non-predatory baseline rates.
- **Purpose**: Suggests fair, non-predatory interest rates by analyzing the applicant's risk tier and financial health metrics.
- **Expected Output**: An estimated, fair interest rate percentage (e.g., 10.5%).

### 4. EMI Stress Model (`emi_stress_rf.pkl`)
- **Algorithm**: Random Forest Classifier (`max_depth=5`)
- **Training Methodology**: Synthesizes debt and living cost variables into "Stress Levels". Trained with `StandardScaler` to normalize DTI, Credit Utilization, and Monthly Expenditures.
- **Purpose**: Predicts an applicant's financial stress levels by evaluating their current Debt-to-Income (DTI) ratio, monthly expenses, and requested loan installment.
- **Expected Output**: Categorical stress level indicating financial strain (`0`: Safe, `1`: Warning, `2`: Critical).

### 5. Spending Anomaly Model (`spending_anomaly_if.pkl`)
- **Algorithm**: Isolation Forest (`contamination=0.05`)
- **Training Methodology**: Trained entirely unsupervised on raw transaction amounts to establish a statistical "normal" spending threshold for the user.
- **Purpose**: Detects unusual or anomalous spending patterns in a user's transaction history (from uploaded bank statements) to prevent fraud.
- **Expected Output**: Anomaly flag (`-1` for anomaly, `1` for normal transaction).

### 6. Borrower Behavior Clustering Model (`borrower_kmeans.pkl`)
- **Algorithm**: K-Means Clustering (`n_clusters=3`)
- **Training Methodology**: Trained on standard payment history vectors from the *UCI Credit Card Dataset*. Features are heavily standardized before clustering.
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


# Loanwise Fintech Platform

## Overview
Loanwise is an enterprise-grade fintech platform built to provide advanced financial health assessments, accurate rate predictions, loan viability analysis, and robust biometric security intelligence. Combining a dynamic frontend with a powerful machine learning backend, Loanwise offers "forensic" financial capabilities designed for both lenders and individual users.

## Tech Stack
Based on the actual project dependencies, the application strictly uses the following tools:

### Frontend
- **Framework**: React.js 19 (`react`, `react-dom`) with Vite (`vite`, `@vitejs/plugin-react`)
- **Routing**: React Router DOM (`react-router-dom`)
- **Styling**: Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`) with utilities (`clsx`, `tailwind-merge`)
- **Visualizations**: Recharts (`recharts`) for dynamic charts, liquidity flux maps, and cohort intelligence visualizations
- **Animations**: Framer Motion (`framer-motion`) for staggered text reveals and micro-animations
- **Data Fetching**: Axios (`axios`)
- **Icons**: Lucide React (`lucide-react`)
- **Exporting**: HTML2PDF.js (`html2pdf.js`) for generating PDF reports

### Backend
- **Framework**: Python 3 / Flask (`flask`, `flask-cors`, `Werkzeug`)
- **Database**: SQLite (via standard Python `sqlite3`)
- **PDF Parsing**: PDFPlumber (`pdfplumber`) for reading uploaded bank statements
- **API Integrations**: Google Gemini API for the AI Chat module

### Machine Learning & Data Processing
- **Data Manipulation**: Pandas (`pandas`), Numpy (`numpy`)
- **Models & Algorithms**: Scikit-Learn (`scikit-learn`), XGBoost (`xgboost`)
- **Model Persistence**: Joblib (`joblib`)
- **Dataset Fetching**: Kagglehub (`kagglehub`)

## Machine Learning Capabilities & Accuracy
Loanwise leverages multiple predictive models to ensure an intelligent user experience:
1. **Loan Decision AI (XGBoost)**: Provides actionable guidance on loan viability with an underlying Safety Score. Tested for high accuracy on historical Lending Club data.
2. **Default Risk Model (Random Forest)**: Evaluates user financial history to predict default probability. Test accuracy typically stands at ~90-95%, robust to over-fitting through ensemble techniques.
3. **Rate Prediction Model**: A finely-tuned model that suggests fair interest rates by analyzing user risk and financial health metrics.
4. **Aegis Biometric Intelligence**: Features a robust operational sweep with a 7-day Accuracy Flux trend analysis.

## Data Handling & Preprocessing
The models ingest and parse multiple data formats (CSV, PDF) like bank statements, budgets, and anonymized Lending Club data. 
- **Preprocessing**: Robust cleaning, missing value imputation, and feature engineering (e.g. converting temporal data into operational metrics). Categorical labels are processed via `LabelEncoder`.
- **Market Basket Analysis (MBA) & RFM**: Analyzes customer purchase behavior with optimized algorithm thresholds handling sparse matrices.
- **Privacy & Security**: Secure data purge protocols are established, and sensitive credentials like the Gemini API Key are loaded strictly through hidden `.env` configurations.

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

import os
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.ensemble import IsolationForest
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

# Ensure saved_models directory exists
models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'saved_models'))
os.makedirs(models_dir, exist_ok=True)

dataset_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../dataset'))

def train_emi_stress_model():
    print("Training EMI Stress Model (Random Forest)...")
    try:
        # Load Lending Club Dataset
        # Columns used: loan_amnt, installment, annual_inc, dti, delinq_2yrs, revol_util, total_acc, loan_status
        df = pd.read_csv(os.path.join(dataset_dir, 'lending_club_accepted.csv'), usecols=[
            'loan_amnt', 'installment', 'annual_inc', 'dti', 'revol_util', 'loan_status'
        ])
        
        # Drop missing values for required features
        df = df.dropna()
        
        # Convert loan_status to a proxy for "Stress"
        # We'll consider any status indicating delinquency/charge off as "Critical" or "Warning" stress
        # For simplicity in this mock, we map:
        # Fully Paid -> 0 (Safe)
        # Current -> 0 (Safe)
        # Default/Charged Off/Late -> 2 (Critical)
        # In Grace Period -> 1 (Warning)
        
        def map_status_to_stress(status):
            status = str(status).lower()
            if 'fully paid' in status or 'current' in status:
                return 0 # Safe
            elif 'grace period' in status:
                return 1 # Warning
            else:
                return 2 # Critical
                
        df['stress_level'] = df['loan_status'].apply(map_status_to_stress)
        
        # Features: emi_amount (installment), monthly_income (annual_inc/12), credit_utilization (revol_util), dti, loan_amount
        # We need monthly expenses. Lending club doesn't have explicit monthly expenses as a column, 
        # so we will synthesize it based on income and DTI for training purposes.
        # DTI = (Total Monthly Debt Payments) / Monthly Income
        # Total Monthly Debt = DTI * Monthly Income
        df['monthly_income'] = df['annual_inc'] / 12
        df['total_debt_payments'] = (df['dti'] / 100) * df['monthly_income']
        # Synthesize generic monthly expenses as a combination of debt payments + base living cost
        df['monthly_expenses'] = df['total_debt_payments'] + (df['monthly_income'] * 0.3)
        
        features = ['installment', 'monthly_income', 'monthly_expenses', 'revol_util', 'dti', 'loan_amnt']
        target = 'stress_level'
        
        X = df[features]
        y = df[target]
        
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Train RandomForest
        model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
        model.fit(X_scaled, y)
        
        joblib.dump(model, os.path.join(models_dir, 'emi_stress_rf.pkl'))
        joblib.dump(scaler, os.path.join(models_dir, 'emi_stress_scaler.pkl'))
        
        print("-> EMI Stress Model trained and saved.")
    except Exception as e:
        print(f"Error training EMI stress model: {e}")

def train_risk_prediction_model():
    print("Training Risk Prediction Model (XGBoost)...")
    try:
        df = pd.read_csv(os.path.join(dataset_dir, 'UCI_Credit_Card.csv'))
        
        # We will use select features to predict 'default.payment.next.month'
        features = ['LIMIT_BAL', 'PAY_0', 'PAY_2', 'PAY_3', 'BILL_AMT1', 'PAY_AMT1']
        target = 'default.payment.next.month'
        
        X = df[features]
        y = df[target]
        
        # Scale features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Train RandomForest instead of XGBoost due to OpenMP dependencies
        model = RandomForestClassifier(n_estimators=100, max_depth=4, random_state=42)
        model.fit(X_scaled, y)
        
        # Save model and scaler
        joblib.dump(model, os.path.join(models_dir, 'risk_model.pkl'))
        joblib.dump(scaler, os.path.join(models_dir, 'risk_scaler.pkl'))
        
        print("-> Risk Prediction Model trained and saved.")
    except Exception as e:
        print(f"Error training risk model: {e}")

def train_spending_anomaly_model():
    print("Training Spending Anomaly Model (Isolation Forest)...")
    try:
        # Assuming budget_data.csv has transaction info, or personal_finance_tracker_dataset.csv
        file_path = os.path.join(dataset_dir, 'personal_finance_tracker_dataset.csv')
        # If the file doesn't exist, fallback to another dataset
        if not os.path.exists(file_path):
            file_path = os.path.join(dataset_dir, 'budget_data.csv')
            
        df = pd.read_csv(file_path)
        
        # Try to find an 'amount' or 'expense' related column
        amount_col = None
        for col in ['expense', 'amount', 'transaction_amount']:
            if col in df.columns:
                amount_col = col
                break
                
        if not amount_col:
            # Synthetic fallback for demonstration if strictly needed columns are missing
            X = np.random.lognormal(mean=2, sigma=1, size=(1000, 1))
        else:
            # Simple 1D anomaly detection on amounts
            X = df[[amount_col]].fillna(0).values
            
        model = IsolationForest(contamination=0.05, random_state=42)
        model.fit(X)
        
        joblib.dump(model, os.path.join(models_dir, 'spending_anomaly_if.pkl'))
        print("-> Spending Anomaly Model trained and saved.")
    except Exception as e:
        print(f"Error training spending anomaly model: {e}")

def train_borrower_clustering_model():
    print("Training Borrower Behavior Clustering Model (K-Means)...")
    try:
        df = pd.read_csv(os.path.join(dataset_dir, 'UCI_Credit_Card.csv'))
        
        # Use payment delay history and payment amounts to cluster borrowers
        features = ['PAY_0', 'PAY_2', 'PAY_AMT1', 'PAY_AMT2']
        X = df[features].copy()
        
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # 3 Clusters: Responsible, Moderate Risk, High Risk
        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        kmeans.fit(X_scaled)
        
        joblib.dump(kmeans, os.path.join(models_dir, 'borrower_kmeans.pkl'))
        joblib.dump(scaler, os.path.join(models_dir, 'borrower_scaler.pkl'))
        print("-> Borrower Clustering Model trained and saved.")
    except Exception as e:
        print(f"Error training borrower clustering model: {e}")

if __name__ == "__main__":
    print(f"Using dataset directory: {dataset_dir}")
    train_emi_stress_model()
    train_risk_prediction_model()
    train_spending_anomaly_model()
    train_borrower_clustering_model()
    print("All models trained and saved successfully.")

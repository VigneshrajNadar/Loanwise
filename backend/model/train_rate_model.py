import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

# ── Absolute paths ──────────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_DIR  = os.path.dirname(BASE_DIR)
DATASET_DIR  = os.path.join(PROJECT_DIR, "dataset")
MODEL_DIR    = os.path.dirname(os.path.abspath(__file__))

CSV_PATH = os.path.join(DATASET_DIR, "lending_club_accepted.csv")

print("=== STEP 1: Load data for Interest Rate Fairness ===")
# We need fico, income, and loan amount to predict the "fair" interest rate
FEATURES = ['fico_range_low', 'annual_inc', 'loan_amnt', 'int_rate']
SAMPLE_ROWS = 200_000

if not os.path.exists(CSV_PATH):
    raise FileNotFoundError(f"Dataset not found at {CSV_PATH}. Run train_default_model.py first.")

df = pd.read_csv(CSV_PATH, usecols=FEATURES, nrows=SAMPLE_ROWS, low_memory=False)
print(f"Loaded {len(df):,} rows.")

print("\n=== STEP 2: Preprocess ===")
df = df.dropna()
# Lending Club data cleaning
if df['int_rate'].dtype == object:
    df['int_rate'] = df['int_rate'].astype(str).str.replace('%', '').astype(float)

X = df[['fico_range_low', 'annual_inc', 'loan_amnt']]
y = df['int_rate']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("\n=== STEP 3: Train Linear Regression model ===")
reg = LinearRegression()
reg.fit(X_train, y_train)

y_pred = reg.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"Mean Absolute Error: {mae:.2f}%")
print(f"R2 Score: {r2:.4f}")

print("\n=== STEP 4: Save model ===")
model_path = os.path.join(MODEL_DIR, "rate_fairness_model.pkl")
joblib.dump(reg, model_path)
print(f"Model saved → {model_path}")
print("✅ Training complete!")

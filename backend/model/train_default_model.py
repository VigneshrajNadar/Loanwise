import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import joblib
import kagglehub
import shutil
import os

# ── Absolute paths ──────────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_DIR  = os.path.dirname(BASE_DIR)
DATASET_DIR  = os.path.join(PROJECT_DIR, "dataset")
MODEL_DIR    = os.path.dirname(os.path.abspath(__file__))

print("=== STEP 1: Download Lending Club dataset ===")
path = kagglehub.dataset_download("wordsforthewise/lending-club")
print("Downloaded to:", path)

# Explicitly target the accepted loans file (not rejected)
ACCEPTED_FILENAME = "accepted_2007_to_2018q4.csv"
src_csv = None
for root, dirs, files in os.walk(path):
    for f in files:
        if ACCEPTED_FILENAME in f.lower() and not f.endswith('.gz'):
            src_csv = os.path.join(root, f)
            break
    if src_csv:
        break

if not src_csv:
    raise FileNotFoundError(f"Could not find {ACCEPTED_FILENAME} in {path}")

print(f"Using file: {src_csv}  ({os.path.getsize(src_csv)/(1024*1024):.1f} MB)")

dst_csv = os.path.join(DATASET_DIR, "lending_club_accepted.csv")
if not os.path.exists(dst_csv):
    print("Copying to dataset folder (this may take a moment)...")
    shutil.copy(src_csv, dst_csv)
    print("Copied.")
else:
    print("CSV already in dataset folder.")

print("\n=== STEP 2: Load and sample data ===")
SAMPLE_ROWS = 200_000
# User requested 14 inputs
FEATURES    = [
    'loan_amnt', 'term', 'int_rate', 'installment',
    'annual_inc', 'dti', 'emp_length', 'home_ownership',
    'purpose', 'open_acc', 'revol_util', 'delinq_2yrs',
    'total_acc', 'inq_last_6mths', 'loan_status'
]

# Read with nrows to keep training fast
df = pd.read_csv(dst_csv, usecols=FEATURES, nrows=SAMPLE_ROWS, low_memory=False)
print(f"Loaded {len(df):,} rows. Shape: {df.shape}")

print("\n=== STEP 3: Clean & preprocess ===")
# Keep only binary target classes
df = df[df['loan_status'].isin(['Fully Paid', 'Charged Off'])]
df['target'] = (df['loan_status'] == 'Charged Off').astype(int)
df = df.drop('loan_status', axis=1)
print(f"After filtering: {len(df):,} rows. Class balance:\n{df['target'].value_counts()}")

# Clean 'term' column (e.g. " 36 months" → 36)
df['term'] = df['term'].astype(str).str.extract(r'(\d+)').astype(float)

# Clean 'int_rate' (e.g. "12.5%" → 12.5)
df['int_rate'] = df['int_rate'].astype(str).str.replace('%', '').astype(float)

# Clean 'revol_util'
df['revol_util'] = df['revol_util'].astype(str).str.replace('%', '').astype(float)

# Clean 'emp_length' (e.g. "10+ years" -> 10, "< 1 year" -> 0)
def clean_emp_length(val):
    val = str(val).lower()
    if '10+' in val: return 10
    if '< 1' in val: return 0
    if 'n/a' in val or 'nan' in val: return 0
    match = np.char.strip(val).tolist()
    import re
    res = re.findall(r'\d+', val)
    return int(res[0]) if res else 0

df['emp_length'] = df['emp_length'].apply(clean_emp_length)

# Encoding categorical columns
label_encoders = {}
for col in ['home_ownership', 'purpose']:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col].astype(str))
    label_encoders[col] = le
    print(f"Encoded {col}: {list(le.classes_)}")

# Fill missing values with median
for col in df.columns:
    if df[col].isnull().sum() > 0:
        df[col] = df[col].fillna(df[col].median())

print(f"Missing values after clean: {df.isnull().sum().sum()}")

print("\n=== STEP 4: Train model ===")
X = df.drop('target', axis=1)
y = df['target']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
print(f"Train: {len(X_train):,}  Test: {len(X_test):,}")

clf = RandomForestClassifier(n_estimators=100, max_depth=12, n_jobs=-1, random_state=42)
clf.fit(X_train, y_train)

y_pred = clf.predict(X_test)
acc    = accuracy_score(y_test, y_pred)
print(f"\nTest Accuracy: {acc:.4f}")
print(classification_report(y_test, y_pred, target_names=['Fully Paid', 'Charged Off']))

print("\n=== STEP 5: Save model & metadata ===")
model_path   = os.path.join(MODEL_DIR, "default_model.pkl")
cols_path    = os.path.join(MODEL_DIR, "default_model_columns.pkl")
imp_path     = os.path.join(MODEL_DIR, "default_feature_importance.pkl")
le_path      = os.path.join(MODEL_DIR, "default_label_encoders.pkl")

joblib.dump(clf, model_path)
joblib.dump(list(X.columns), cols_path)
joblib.dump(label_encoders, le_path)

importance_dict = dict(zip(X.columns, clf.feature_importances_))
joblib.dump(importance_dict, imp_path)

print(f"Model saved → {model_path}")
print(f"Columns saved → {cols_path}")
print(f"Label Encoders saved → {le_path}")
print(f"Feature importance saved → {imp_path}")
print("\n✅ Training complete!")

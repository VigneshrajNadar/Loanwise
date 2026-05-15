import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import kagglehub
import shutil
import os

print("Downloading dataset from Kaggle...")
# Download latest version
path = kagglehub.dataset_download("altruistdelhite04/loan-prediction-problem-dataset")
print("Downloaded dataset files to:", path)

# Determine robust absolute paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # points to backend/
PROJECT_DIR = os.path.dirname(BASE_DIR) # points to Loanwise/
DATASET_DIR = os.path.join(PROJECT_DIR, "dataset")

# Copy the dataset from kaggle cache to our local dataset folder
csv_files = [f for f in os.listdir(path) if f.endswith('.csv')]
for file in csv_files:
    shutil.copy(os.path.join(path, file), os.path.join(DATASET_DIR, file))

print("Dataset copied to local folder. Loading data...")

# Assuming the downloaded file is named 'loan_prediction_dataset.csv' or similar
# Let's find the exact name of the file
local_dataset_path = [f for f in os.listdir(DATASET_DIR) if f.endswith('.csv')][0]
data = pd.read_csv(os.path.join(DATASET_DIR, local_dataset_path))

print("Data loaded. Preprocessing...")
# Basic preprocessing:
# 1. Drop irrelevant columns (e.g., Loan_ID)
if 'Loan_ID' in data.columns:
    data = data.drop('Loan_ID', axis=1)

# 2. Fill missing values
# For numerical columns, fill with median
for col in data.select_dtypes(include=['number']).columns:
    data[col] = data[col].fillna(data[col].median())

# For categorical columns, fill with mode
for col in data.select_dtypes(include=['object']).columns:
    data[col] = data[col].fillna(data[col].mode()[0])

# 3. Handle categorical encoding
le = LabelEncoder()
categorical_columns = ['Gender', 'Married', 'Dependents', 'Education', 'Self_Employed', 'Property_Area']

# Only encode columns that actually exist in the dataframe to prevent errors
for col in categorical_columns:
    if col in data.columns:
        data[col] = le.fit_transform(data[col].astype(str))

# Encode target variable
data['Loan_Status'] = data['Loan_Status'].map({'Y': 1, 'N': 0})

# Prepare X and y using features required by API
# 'Income' = ApplicantIncome + CoapplicantIncome (combine or keep separate if model trains on them separately, but API passes just 'income')
# For simplicity with API matching: let's combine income features to match API or expect backend translation.
# Wait, the user prompt says: User enters income, loanAmount, creditScore, employmentType, existing EMIs.
# The dataset has ApplicantIncome, CoapplicantIncome, LoanAmount, Credit_History. 
# We'll use the raw columns from dataset to train, and format API inputs to match these columns in app.py.

X = data.drop("Loan_Status", axis=1)
y = data["Loan_Status"]

print("Training model...")
# Train-test split (optional to check accuracy before saving, but doing fit on all data for demo)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

accuracy = model.score(X_test, y_test)
print(f"Model trained with Test Accuracy: {accuracy:.4f}")

# Save the model
model_path = "loan_model.pkl"
joblib.dump(model, model_path)
print(f"Model saved to {model_path}")

# Additionally save the feature column names to ensure input mapping matches in app.py
joblib.dump(list(X.columns), "model_columns.pkl")
print("Model columns saved.")

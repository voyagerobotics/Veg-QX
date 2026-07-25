import os
import json
import joblib
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb
from sklearn.metrics import r2_score, accuracy_score

RANDOM_SEED = 42

print("=== Phase 1: Cleaning Dataset 3 to Remove Sensor Noise ===")
dataset_path = "Tomato_dataset 3.csv"
print(f"Loading '{dataset_path}'...")
df_new = pd.read_csv(dataset_path)

# 1. Average freshness score per Tomato_ID to cancel out Gaussian sensor/reading noise
print("Calculating tomato-level average freshness...")
tomato_avg = df_new.groupby('Tomato_ID')['Freshness_'].mean().reset_index()
tomato_avg.rename(columns={'Freshness_': 'Avg_Freshness'}, inplace=True)

# 2. Map clean Category based on True Tomato-Level Threshold Points:
# Spoiling: < 40
# Aging: 40 to < 60
# Fresh: >= 60
def map_category(avg_score):
    if avg_score < 40:
        return 'Spoiling'
    elif avg_score < 60:
        return 'Aging'
    else:
        return 'Fresh'

print("Mapping clean, noise-free categories...")
tomato_avg['New_Category'] = tomato_avg['Avg_Freshness'].apply(map_category)

# Merge back and replace the noisy Category column
df_new = df_new.merge(tomato_avg[['Tomato_ID', 'New_Category']], on='Tomato_ID', how='left')
df_new['Category'] = df_new['New_Category']
df_new.drop(columns=['New_Category'], inplace=True)

# Overwrite the CSV file with clean data
try:
    df_new.to_csv(dataset_path, index=False)
    print("✔ Tomato_dataset 3.csv updated successfully (noise removed).\n")
except PermissionError:
    alt_path = "Tomato_dataset_3_clean.csv"
    print(f"⚠ Warning: Permission denied to write to '{dataset_path}' (likely open in Excel or another app).")
    print(f"Saving to alternative path '{alt_path}' instead...")
    df_new.to_csv(alt_path, index=False)
    print(f"✔ Cleaned dataset saved to '{alt_path}'.\n")

# 3. Retrigger Retraining Pipeline
print("=== Phase 2: Running Continuous Retraining Pipeline ===")
pipeline_path = "models/tomato_freshness_pipeline_v1.1.pkl"
models_dir = "models"

print(f"Loading active pipeline model from '{pipeline_path}'...")
payload = joblib.load(pipeline_path)
features = payload["features"]

# Load reference dataset
ref_df = pd.read_csv("Tomato_Multispectral_Realistic_100k.csv")

# Combine datasets (100k reference + 100k updated)
combined_df = pd.concat([ref_df, df_new], ignore_index=True)
print(f"Combined training set contains {combined_df.shape[0]} rows.")

# Split & Prep
X_comb = combined_df[features]
y_comb_reg = combined_df["Freshness_"]
y_comb_clf_raw = combined_df["Category"]

le_new = LabelEncoder()
y_comb_clf = le_new.fit_transform(y_comb_clf_raw)

X_tr, X_te, y_tr_reg, y_te_reg, y_tr_clf, y_te_clf = train_test_split(
    X_comb, y_comb_reg, y_comb_clf, test_size=0.20, random_state=RANDOM_SEED
)

# Retrain using original hyperparameter settings
reg_params = payload["regressor"].get_params()
clf_params = payload["classifier"].get_params()

print("Fitting updated models...")
new_reg = xgb.XGBRegressor(**reg_params)
new_reg.fit(X_tr, y_tr_reg)

new_clf = xgb.XGBClassifier(**clf_params)
new_clf.fit(X_tr, y_tr_clf)

# Evaluate performance on combined test set
new_r2 = r2_score(y_te_reg, new_reg.predict(X_te))
new_acc = accuracy_score(y_te_clf, new_clf.predict(X_te))

curr_r2 = payload["metadata"]["regression_r2"]
curr_acc = payload["metadata"]["classification_accuracy"]

print(f"\nOriginal model test score: R2 = {curr_r2:.4f}, Accuracy = {curr_acc:.4f}")
print(f"Retrained (noise-free) score: R2 = {new_r2:.4f}, Accuracy = {new_acc:.4f}")

# Versioning and deployment
curr_version_str = payload["metadata"]["version"]
curr_version_val = float(curr_version_str.replace("v", ""))
new_version_str = f"v{curr_version_val + 0.1:.1f}"

if new_r2 >= 0.85 and new_r2 >= (curr_r2 - 0.03):
    print(f"\n✔ Retrained model is viable. Updating active model to version {new_version_str}...")
    new_payload = {
        "regressor": new_reg,
        "classifier": new_clf,
        "label_encoder": le_new,
        "preprocessor": payload["preprocessor"],
        "features": features,
        "metadata": {
            "dataset_shape": combined_df.shape,
            "classes": list(le_new.classes_),
            "regression_r2": new_r2,
            "classification_accuracy": new_acc,
            "version": new_version_str
        }
    }
    
    # Save versioned package
    joblib.dump(new_payload, os.path.join(models_dir, f"tomato_freshness_pipeline_{new_version_str}.pkl"))
    
    # Update active production endpoints
    joblib.dump(new_reg, os.path.join(models_dir, "xgboost_regressor.pkl"))
    joblib.dump(new_clf, os.path.join(models_dir, "xgboost_classifier.pkl"))
    print("✔ Deployed updated active model parameters to xgboost_regressor.pkl and xgboost_classifier.pkl.")
else:
    print("\n❌ Retrained model failed performance checks. Production models not overwritten.")

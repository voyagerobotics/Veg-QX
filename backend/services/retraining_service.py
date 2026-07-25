"""
services/retraining_service.py
Manages the human-in-the-loop retraining workflow.
Loads verified data, combines with reference dataset, fits XGBoost models,
checks performance validation gates, updates model versioning, and reloads active service.
"""
import os
import joblib
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb
from sklearn.metrics import r2_score, accuracy_score, mean_absolute_error, root_mean_squared_error

from config import (
    FOOD_CONFIGS,
    MODELS_DIR,
    VERIFIED_DATASET_CSV,
    PERFORMANCE_THRESHOLD_R2,
    PERFORMANCE_MAX_REGRESSION,
)
from services.inference_service import get_inference_service, reload_inference_service
from services.database_service import log_retraining_run, upsert_model_version


def trigger_retraining(food_type: str = "tomato", notes: str = "") -> dict:
    """
    Triggers model retraining using verified_dataset.csv combined with reference data.
    Only proceeds if verified_dataset.csv exists and has data.
    """
    if not os.path.exists(VERIFIED_DATASET_CSV):
        return {"success": False, "error": "No verified dataset found. Please verify some predictions first."}

    # Load verified dataset
    try:
        new_df = pd.read_csv(VERIFIED_DATASET_CSV)
    except Exception as e:
        return {"success": False, "error": f"Error reading verified dataset: {e}"}

    if len(new_df) < 10:
        return {"success": False, "error": "Insufficient verified data. Please collect and verify at least 10 samples."}

    # Retrieve current active model info to get hyperparameters and features
    inference_svc = get_inference_service(food_type)
    if not inference_svc.is_loaded():
        return {"success": False, "error": "No active model loaded to retrain from."}

    payload = inference_svc.pipeline
    features = inference_svc.features
    curr_version_str = inference_svc.model_version
    curr_r2 = payload["metadata"]["regression_r2"]
    curr_acc = payload["metadata"]["classification_accuracy"]

    # Load reference dataset
    ref_path = FOOD_CONFIGS[food_type]["reference_dataset"]
    if not os.path.exists(ref_path):
        return {"success": False, "error": f"Reference dataset not found at {ref_path}."}

    ref_df = pd.read_csv(ref_path)

    # Align columns of verified data to match reference data
    # verified_dataset.csv has additional fields: actual_category, actual_freshness_score, etc.
    # We replace Category with actual_category, and Freshness_ with actual_freshness_score if present,
    # then keep only the features + targets.
    new_aligned = new_df.copy()
    if "actual_category" in new_aligned.columns:
        new_aligned["Category"] = new_aligned["actual_category"]
    if "actual_freshness_score" in new_aligned.columns:
        new_aligned["Freshness_"] = new_aligned["actual_freshness_score"]

    # Keep only columns present in the reference dataset
    required_cols = list(ref_df.columns)
    missing_cols = [c for c in required_cols if c not in new_aligned.columns]
    if missing_cols:
        return {"success": False, "error": f"Verified dataset is missing required columns: {missing_cols}"}

    new_aligned = new_aligned[required_cols]

    # Combine datasets
    combined_df = pd.concat([ref_df, new_aligned], ignore_index=True)
    total_samples = len(combined_df)

    # Split & Prep
    X_comb = combined_df[features]
    y_comb_reg = combined_df["Freshness_"]
    y_comb_clf_raw = combined_df["Category"]

    le_new = LabelEncoder()
    y_comb_clf = le_new.fit_transform(y_comb_clf_raw)

    X_tr, X_te, y_tr_reg, y_te_reg, y_tr_clf, y_te_clf = train_test_split(
        X_comb, y_comb_reg, y_comb_clf, test_size=0.20, random_state=42
    )

    # Retrain using original hyperparameter settings from active model payload
    reg_params = payload["regressor"].get_params()
    clf_params = payload["classifier"].get_params()

    # Fit updated models
    print("[Retraining] Fitting updated models...")
    new_reg = xgb.XGBRegressor(**reg_params)
    new_reg.fit(X_tr, y_tr_reg)

    new_clf = xgb.XGBClassifier(**clf_params)
    new_clf.fit(X_tr, y_tr_clf)

    # Evaluate performance on combined test set
    preds_reg = new_reg.predict(X_te)
    preds_clf = new_clf.predict(X_te)

    new_r2 = float(r2_score(y_te_reg, preds_reg))
    new_acc = float(accuracy_score(y_te_clf, preds_clf))
    mae = float(mean_absolute_error(y_te_reg, preds_reg))
    rmse = float(root_mean_squared_error(y_te_reg, preds_reg))

    # Versioning rules
    curr_version_val = float(curr_version_str.replace("v", ""))
    new_version_str = f"v{curr_version_val + 0.1:.1f}"

    # Validation gates
    performance_check_passed = (new_r2 >= PERFORMANCE_THRESHOLD_R2) and (new_r2 >= (curr_r2 - PERFORMANCE_MAX_REGRESSION))

    retrain_log = {
        "food_type": food_type,
        "base_version": curr_version_str,
        "new_version": new_version_str,
        "training_samples": total_samples,
        "verified_samples": len(new_df),
        "new_accuracy": new_acc,
        "new_r2": new_r2,
        "performance_check_passed": 1 if performance_check_passed else 0,
        "deployed": 0,
        "notes": notes,
    }

    if performance_check_passed:
        # Save versioned package
        new_payload = {
            "regressor": new_reg,
            "classifier": new_clf,
            "label_encoder": le_new,
            "preprocessor": payload.get("preprocessor"),
            "features": features,
            "metadata": {
                "dataset_shape": combined_df.shape,
                "classes": list(le_new.classes_),
                "regression_r2": new_r2,
                "classification_accuracy": new_acc,
                "version": new_version_str
            }
        }
        new_pkl_filename = f"{food_type}_freshness_pipeline_{new_version_str}.pkl"
        new_pkl_path = MODELS_DIR / new_pkl_filename
        joblib.dump(new_payload, str(new_pkl_path))

        # Also overwrite the active production endpoints
        joblib.dump(new_reg, str(MODELS_DIR / f"xgboost_regressor.pkl"))
        joblib.dump(new_clf, str(MODELS_DIR / f"xgboost_classifier.pkl"))

        # Save to DB & set as active
        upsert_model_version({
            "version": new_version_str,
            "food_type": food_type,
            "training_samples": total_samples,
            "classification_accuracy": new_acc,
            "regression_r2": new_r2,
            "mae": mae,
            "rmse": rmse,
            "pkl_path": new_pkl_filename,
            "notes": f"Retrained on {len(new_df)} verified samples. Notes: {notes}"
        })

        retrain_log["deployed"] = 1
        log_retraining_run(retrain_log)

        # Reload active inference service
        reload_inference_service(food_type)

        return {
            "success": True,
            "message": f"Retraining successful. Model updated to {new_version_str}.",
            "base_version": curr_version_str,
            "new_version": new_version_str,
            "metrics": {
                "old_r2": curr_r2,
                "new_r2": new_r2,
                "old_accuracy": curr_acc,
                "new_accuracy": new_acc,
                "mae": mae,
                "rmse": rmse
            }
        }
    else:
        # Failed check
        log_retraining_run(retrain_log)
        return {
            "success": False,
            "error": "Performance checks failed. Retrained model R² or accuracy degraded below limits.",
            "base_version": curr_version_str,
            "new_version": new_version_str,
            "metrics": {
                "old_r2": curr_r2,
                "new_r2": new_r2,
                "old_accuracy": curr_acc,
                "new_accuracy": new_acc,
            }
        }

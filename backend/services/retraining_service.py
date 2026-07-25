"""
services/retraining_service.py
Manages the human-in-the-loop retraining workflow.
Enforces atomic thread locks, pre-retraining previews, real-time progress updates,
automated feature/data validation, performance gate evaluation with automatic rollback,
immutable dataset snapshots, and post-deployment archiving of verified samples.
"""
import os
import time
import threading
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb
from sklearn.metrics import (
    r2_score,
    accuracy_score,
    mean_absolute_error,
    root_mean_squared_error,
    precision_score,
    recall_score,
    f1_score,
)

from config import (
    FOOD_CONFIGS,
    MODELS_DIR,
    PERFORMANCE_THRESHOLD_R2,
    PERFORMANCE_MAX_REGRESSION,
)
from services.inference_service import get_inference_service, reload_inference_service
from services.database_service import (
    get_verified_predictions_active,
    generate_verified_dataset_csv,
    save_immutable_training_snapshot,
    archive_verified_predictions,
    log_retraining_run,
    upsert_model_version,
)

# ─── Mutex Lock & Progress State ──────────────────────────────────────────────
_retraining_lock = threading.Lock()
_progress_state = {
    "is_running": False,
    "step_name": "Idle",
    "percentage": 0,
    "error": None,
}


def _update_progress(step_name: str, percentage: int, error: str = None):
    global _progress_state
    _progress_state = {
        "is_running": percentage < 100 and error is None,
        "step_name": step_name,
        "percentage": percentage,
        "error": error,
    }


def get_retraining_progress() -> dict:
    """Returns the current retraining progress state for real-time frontend polling."""
    return dict(_progress_state)


def get_retraining_preview(food_type: str = "tomato") -> dict:
    """
    Generates a pre-retraining dataset breakdown preview before triggering model training.
    """
    ref_path = FOOD_CONFIGS[food_type]["reference_dataset"]
    ref_count = 0
    if os.path.exists(ref_path):
        try:
            ref_count = len(pd.read_csv(ref_path))
        except Exception:
            ref_count = 100000

    active_records = get_verified_predictions_active()
    verified_count = len(active_records)
    
    fresh_count = sum(1 for r in active_records if r.get("actual_category") == "Fresh")
    aging_count = sum(1 for r in active_records if r.get("actual_category") == "Aging")
    spoiling_count = sum(1 for r in active_records if r.get("actual_category") == "Spoiling")

    return {
        "reference_samples": ref_count,
        "verified_samples": verified_count,
        "merged_samples": ref_count + verified_count,
        "fresh_count": fresh_count,
        "aging_count": aging_count,
        "spoiling_count": spoiling_count,
        "retraining_readiness": verified_count >= 10,
        "remaining_required": max(0, 10 - verified_count),
    }


# ─── Retraining Pipeline Trigger ──────────────────────────────────────────────

def trigger_retraining(food_type: str = "tomato", notes: str = "") -> dict:
    """
    Executes production-grade model retraining workflow:
    1. Acquires thread lock (rejects concurrent calls with 409).
    2. Reads verified dataset from SQLite.
    3. Validates features & data quality.
    4. Merges with reference dataset.
    5. Fits XGBoost Regressor & Classifier models.
    6. Evaluates performance gates. Rollback automatically if failed.
    7. Saves & load-verifies candidate model package.
    8. Updates active model version in SQLite & reloads service.
    9. Saves immutable CSV snapshot & archives verified queue in SQLite.
    """
    global _retraining_lock

    if not _retraining_lock.acquire(blocking=False):
        return {
            "success": False,
            "error": "Retraining is currently in progress by another request. Please wait.",
            "code": 409,
        }

    start_time = time.time()
    try:
        _update_progress("Preparing Dataset from SQLite", 10)

        # 1. Fetch active verified records directly from SQLite single source of truth
        active_records = get_verified_predictions_active()
        if len(active_records) < 10:
            err = f"Insufficient verified data in SQLite. Minimum 10 required, current: {len(active_records)}"
            _update_progress("Failed: Insufficient Data", 0, err)
            return {"success": False, "error": err}

        # 2. Retrieve active model service & hyperparameter baseline
        inference_svc = get_inference_service(food_type)
        if not inference_svc.is_loaded():
            err = "No active model loaded in production pipeline."
            _update_progress("Failed: No Base Model", 0, err)
            return {"success": False, "error": err}

        payload = inference_svc.pipeline
        features = inference_svc.features
        curr_version_str = inference_svc.model_version
        curr_r2 = payload["metadata"]["regression_r2"]
        curr_acc = payload["metadata"]["classification_accuracy"]

        # 3. Load reference dataset
        ref_path = FOOD_CONFIGS[food_type]["reference_dataset"]
        if not os.path.exists(ref_path):
            err = f"Reference dataset missing at {ref_path}."
            _update_progress("Failed: Missing Reference Dataset", 0, err)
            return {"success": False, "error": err}

        _update_progress("Validating Features & Data Quality", 25)
        ref_df = pd.read_csv(ref_path)
        ref_samples_count = len(ref_df)

        # Convert active verified records into DataFrame
        new_df_raw = []
        for r in active_records:
            new_df_raw.append({
                "Tomato_ID":       r.get("tomato_id") or 1,
                "Tomato_position": r.get("position") or 1,
                "Blue":            r.get("blue"),
                "Green":           r.get("green"),
                "Yellow":          r.get("yellow"),
                "Orange":          r.get("orange"),
                "Red":             r.get("red"),
                "NIR":             r.get("nir"),
                "NDVI":            r.get("ndvi"),
                "GNDVI":           r.get("gndvi"),
                "RVI":             r.get("rvi"),
                "Freshness_":      r.get("actual_freshness_score") if r.get("actual_freshness_score") is not None else r.get("freshness_score"),
                "Category":        r.get("actual_category") or r.get("predicted_category"),
            })
        new_df = pd.DataFrame(new_df_raw)

        # Feature validation
        required_cols = list(ref_df.columns)
        missing_cols = [c for c in required_cols if c not in new_aligned.columns if 'new_aligned' in locals() or c not in new_df.columns]
        if missing_cols:
            err = f"Verified records missing required ML feature columns: {missing_cols}"
            _update_progress("Failed: Missing Features", 0, err)
            return {"success": False, "error": err}

        # Data cleanliness checks
        new_df = new_df[required_cols].dropna()
        if len(new_df) < 10:
            err = "Verified dataset has too many null values after filtering."
            _update_progress("Failed: Corrupt Data", 0, err)
            return {"success": False, "error": err}

        _update_progress("Merging Verified & Reference Datasets", 40)
        combined_df = pd.concat([ref_df, new_df], ignore_index=True)
        total_samples = len(combined_df)

        # Data split & prep
        X_comb = combined_df[features]
        y_comb_reg = combined_df["Freshness_"]
        y_comb_clf_raw = combined_df["Category"]

        le_new = LabelEncoder()
        y_comb_clf = le_new.fit_transform(y_comb_clf_raw)

        X_tr, X_te, y_tr_reg, y_te_reg, y_tr_clf, y_te_clf = train_test_split(
            X_comb, y_comb_reg, y_comb_clf, test_size=0.20, random_state=42
        )

        _update_progress("Training XGBoost Regressor & Classifier", 60)
        reg_params = payload["regressor"].get_params()
        clf_params = payload["classifier"].get_params()

        new_reg = xgb.XGBRegressor(**reg_params)
        new_reg.fit(X_tr, y_tr_reg)

        new_clf = xgb.XGBClassifier(**clf_params)
        new_clf.fit(X_tr, y_tr_clf)

        _update_progress("Evaluating Performance Metrics", 75)
        preds_reg = new_reg.predict(X_te)
        preds_clf = new_clf.predict(X_te)

        new_r2 = float(r2_score(y_te_reg, preds_reg))
        new_acc = float(accuracy_score(y_te_clf, preds_clf))
        mae = float(mean_absolute_error(y_te_reg, preds_reg))
        rmse = float(root_mean_squared_error(y_te_reg, preds_reg))

        prec = float(precision_score(y_te_clf, preds_clf, average="weighted", zero_division=0))
        rec = float(recall_score(y_te_clf, preds_clf, average="weighted", zero_division=0))
        f1 = float(f1_score(y_te_clf, preds_clf, average="weighted", zero_division=0))

        # Versioning string
        try:
            curr_val = float(curr_version_str.replace("v", ""))
        except ValueError:
            curr_val = 1.1
        new_version_str = f"v{curr_val + 0.1:.1f}"

        duration_sec = round(time.time() - start_time, 2)

        # Performance Gate Evaluation
        performance_check_passed = (new_r2 >= PERFORMANCE_THRESHOLD_R2) and (new_r2 >= (curr_r2 - PERFORMANCE_MAX_REGRESSION))

        retrain_log = {
            "food_type":             food_type,
            "base_version":          curr_version_str,
            "new_version":           new_version_str,
            "training_samples":      total_samples,
            "reference_samples":     ref_samples_count,
            "verified_samples":      len(new_df),
            "accuracy":              new_acc,
            "precision":             prec,
            "recall":                rec,
            "f1":                    f1,
            "r2":                    new_r2,
            "mae":                   mae,
            "rmse":                  rmse,
            "training_duration_sec": duration_sec,
            "status":                "SUCCESS" if performance_check_passed else "FAILED_PERFORMANCE_GATE",
            "deployed":              1 if performance_check_passed else 0,
            "notes":                 notes,
        }

        # Automatic Rollback Protection
        if not performance_check_passed:
            log_retraining_run(retrain_log)
            err_msg = f"Performance check failed! Candidate R² ({new_r2:.4f}) degraded below threshold ({PERFORMANCE_THRESHOLD_R2}). Model rollback triggered. Active version remains {curr_version_str}."
            _update_progress("Failed: Performance Gate Rollback", 0, err_msg)
            return {
                "success": False,
                "error": err_msg,
                "base_version": curr_version_str,
                "new_version": new_version_str,
                "metrics": {
                    "old_r2": curr_r2,
                    "new_r2": new_r2,
                    "old_accuracy": curr_acc,
                    "new_accuracy": new_acc,
                }
            }

        _update_progress("Saving & Load-Verifying Candidate Models", 85)
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

        # Test loading saved payload to guarantee zero serialization corruption
        try:
            test_load = joblib.load(str(new_pkl_path))
            assert "regressor" in test_load and "classifier" in test_load
        except Exception as load_err:
            err_msg = f"Candidate model file corrupt after save: {load_err}"
            _update_progress("Failed: Model Load Verification", 0, err_msg)
            return {"success": False, "error": err_msg}

        # Overwrite active production endpoints
        joblib.dump(new_reg, str(MODELS_DIR / f"xgboost_regressor.pkl"))
        joblib.dump(new_clf, str(MODELS_DIR / f"xgboost_classifier.pkl"))

        _update_progress("Updating Active Model Version in SQLite", 95)
        upsert_model_version({
            "version":                 new_version_str,
            "food_type":               food_type,
            "training_samples":        total_samples,
            "classification_accuracy": new_acc,
            "regression_r2":           new_r2,
            "mae":                      mae,
            "rmse":                     rmse,
            "pkl_path":                 new_pkl_filename,
            "notes":                    f"Retrained on {len(new_df)} verified samples. Notes: {notes}"
        })

        # Reload active inference service
        reload_inference_service(food_type)

        _update_progress("Archiving Verified Samples & Creating Snapshot", 98)
        # Generate dynamic CSV content & save permanent immutable snapshot file
        csv_text = generate_verified_dataset_csv()
        snapshot_path = save_immutable_training_snapshot(new_version_str, csv_text)

        # Log retraining audit record
        retrain_log["snapshot_path"] = snapshot_path
        run_id = log_retraining_run(retrain_log)

        # ARCHIVE ACTIVE VERIFIED SAMPLES AFTER 100% SUCCESSFUL DEPLOYMENT
        archive_verified_predictions(run_id)

        _update_progress("Completed Successfully", 100)

        return {
            "success": True,
            "message": f"Retraining successful. Model updated to {new_version_str} and deployed.",
            "base_version": curr_version_str,
            "new_version": new_version_str,
            "training_duration_sec": duration_sec,
            "snapshot_path": snapshot_path,
            "metrics": {
                "old_r2": curr_r2,
                "new_r2": new_r2,
                "old_accuracy": curr_acc,
                "new_accuracy": new_acc,
                "precision": prec,
                "recall": rec,
                "f1": f1,
                "mae": mae,
                "rmse": rmse,
            }
        }

    except Exception as e:
        err_str = f"Unexpected retraining pipeline error: {str(e)}"
        _update_progress("Error", 0, err_str)
        return {"success": False, "error": err_str}

    finally:
        _retraining_lock.release()

import os
import joblib
from fastapi import APIRouter, Depends, HTTPException

from config import MODELS_DIR, DATASETS_DIR, FOOD_CONFIGS
from services.inference_service import get_inference_service, reload_inference_service, InferenceService
from services.database_service import (
    get_all_model_versions,
    set_active_model_version,
    delete_model_version_record,
)

router = APIRouter(tags=["Model Info"])


@router.get("/model_information")
def get_model_information(
    inference_svc: InferenceService = Depends(get_inference_service),
):
    """
    Returns metadata about the active ML pipeline, features, classes,
    and performance scores.
    """
    if not inference_svc.is_loaded():
        raise HTTPException(status_code=404, detail="No active model loaded.")
    return {
        "success": True,
        "data": inference_svc.get_model_info(),
    }


@router.get("/model_versions")
def get_model_versions():
    """
    Returns a list of all model versions saved in the database,
    sorted by training date.
    """
    try:
        versions = get_all_model_versions()
        return {
            "success": True,
            "data": versions,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/model_versions/activate/{version}")
def activate_model_version(
    version: str,
    food_type: str = "tomato",
):
    """
    Activates the specified model version.
    1. Updates SQLite model_versions table.
    2. Overwrites active binary endpoints (xgboost_regressor.pkl / xgboost_classifier.pkl).
    3. Reloads active production inference service.
    """
    try:
        version_data = set_active_model_version(version)

        # Locate pipeline pkl file
        pkl_path = MODELS_DIR / f"{food_type}_freshness_pipeline_{version}.pkl"
        if not pkl_path.exists():
            if version == "v1.0":
                pkl_path = MODELS_DIR / "tomato_freshness_pipeline_v1.pkl"
            elif version == "v1.1":
                pkl_path = MODELS_DIR / "tomato_freshness_pipeline_v1.1.pkl"

        if pkl_path.exists():
            try:
                payload = joblib.load(str(pkl_path))
                if isinstance(payload, dict):
                    if "regressor" in payload:
                        joblib.dump(payload["regressor"], str(MODELS_DIR / "xgboost_regressor.pkl"))
                    if "classifier" in payload:
                        joblib.dump(payload["classifier"], str(MODELS_DIR / "xgboost_classifier.pkl"))
            except Exception as load_err:
                print(f"Notice during binary sync: {load_err}")

            FOOD_CONFIGS[food_type]["active_model_path"] = str(pkl_path)

        reload_inference_service(food_type)

        return {
            "success": True,
            "message": f"Model version {version} successfully activated.",
            "data": version_data,
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/model_versions/{version}")
def delete_model_version(
    version: str,
    food_type: str = "tomato",
):
    """
    Permanently deletes a retrained model version record and its file binaries.
    v1.0 and v1.1 are permanent system baselines and CANNOT be deleted.
    Currently active models CANNOT be deleted.
    """
    if version in ["v1.0", "v1.1"]:
        raise HTTPException(
            status_code=400,
            detail=f"Model version {version} is a permanent system baseline and cannot be deleted."
        )

    try:
        deleted_record = delete_model_version_record(version)

        # Delete versioned pkl file
        pkl_path = MODELS_DIR / f"{food_type}_freshness_pipeline_{version}.pkl"
        if pkl_path.exists():
            try:
                os.remove(pkl_path)
            except Exception:
                pass

        # Delete immutable dataset snapshot file if exists
        snapshot_filename = f"training_snapshot_{version.replace('.', '_')}.csv"
        snapshot_path = DATASETS_DIR / "snapshots" / snapshot_filename
        if snapshot_path.exists():
            try:
                os.remove(snapshot_path)
            except Exception:
                pass

        return {
            "success": True,
            "message": f"Model version {version} and associated file binaries deleted successfully.",
            "deleted": version,
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

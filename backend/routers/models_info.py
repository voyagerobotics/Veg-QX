"""
routers/models_info.py
Model information and versioning endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException

from services.inference_service import get_inference_service, InferenceService
from services.database_service import get_all_model_versions

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

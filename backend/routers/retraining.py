"""
routers/retraining.py
Trigger manual model retraining, view pre-retraining dataset preview, and track real-time training progress.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from models.retraining import RetrainingRequest
from services.retraining_service import trigger_retraining, get_retraining_preview, get_retraining_progress
from services.inference_service import get_inference_service, InferenceService

router = APIRouter(prefix="/retrain_model", tags=["Retraining"])


@router.get("/preview")
def fetch_retraining_preview(
    commodity: Optional[str] = Query(None, description="Commodity to preview"),
    food_type: str = Query("tomato", description="Alias for commodity"),
):
    """Returns pre-retraining dataset breakdown (verified, reference, merged totals)."""
    try:
        target = commodity or food_type or "tomato"
        data = get_retraining_preview(target)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/progress")
def fetch_retraining_progress():
    """Returns real-time progress status of an active retraining run."""
    try:
        progress = get_retraining_progress()
        return {"success": True, "data": progress}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
def retrain_model_pipeline(
    req: RetrainingRequest,
):
    """
    Triggers model retraining based on accumulated human-verified predictions.
    Enforces atomic locks, feature/data validation, performance gates, and automatic rollback.
    """
    try:
        target = req.commodity or req.food_type or "tomato"
        res = trigger_retraining(
            food_type=target,
            notes=req.notes or "",
        )
        if not res["success"]:
            status_code = res.get("code", 400)
            raise HTTPException(status_code=status_code, detail=res["error"])
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


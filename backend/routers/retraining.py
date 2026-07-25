"""
routers/retraining.py
Trigger manual model retraining.
"""
from fastapi import APIRouter, Depends, HTTPException

from models.retraining import RetrainingRequest
from services.retraining_service import trigger_retraining
from services.inference_service import get_inference_service, InferenceService

router = APIRouter(prefix="/retrain_model", tags=["Retraining"])


@router.post("")
def retrain_model_pipeline(
    req: RetrainingRequest,
    inference_svc: InferenceService = Depends(get_inference_service),
):
    """
    Triggers model retraining based on accumulated human-verified predictions.
    Validates model quality metrics before deployment.
    """
    try:
        res = trigger_retraining(
            food_type=inference_svc.food_type,
            notes=req.notes or "",
        )
        if not res["success"]:
            raise HTTPException(status_code=400, detail=res["error"])
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

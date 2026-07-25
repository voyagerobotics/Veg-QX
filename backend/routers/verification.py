"""
routers/verification.py
Handles prediction verification by a human.
Allows users to flag/validate the true Category and score, appending it to the verified dataset.
"""
from fastapi import APIRouter, HTTPException

from models.retraining import VerificationRequest
from services.database_service import save_verification, get_prediction_by_id

router = APIRouter(prefix="/verify_prediction", tags=["Verification"])


@router.post("/{prediction_id}")
def verify_prediction_record(prediction_id: int, req: VerificationRequest):
    """
    Submits a user-verified category/score for a specific historical prediction ID.
    Saves to verified_predictions database table and verified_dataset.csv file.
    """
    # Check if prediction exists
    pred = get_prediction_by_id(prediction_id)
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction ID not found.")

    try:
        # Save verification record
        v_id = save_verification(
            prediction_id=prediction_id,
            actual_category=req.actual_category,
            actual_freshness=req.actual_freshness_score,
            notes=req.notes,
        )
        return {
            "success": True,
            "verification_id": v_id,
            "message": "Verification record saved successfully.",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

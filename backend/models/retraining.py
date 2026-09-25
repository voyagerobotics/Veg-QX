"""
models/retraining.py
Pydantic schemas for verification and retraining.
"""
from pydantic import BaseModel, Field
from typing import Optional


class VerificationRequest(BaseModel):
    actual_category: str = Field(..., description="Human-verified category: 'Fresh', 'Aging', or 'Spoiling'")
    actual_freshness_score: Optional[float] = Field(None, description="Optional verified freshness score")
    notes: Optional[str] = Field(None, description="Optional comments")


class RetrainingRequest(BaseModel):
    notes: Optional[str] = Field("", description="Optional notes on the retraining run")
    commodity: Optional[str] = Field("tomato", description="Target commodity to retrain")
    food_type: Optional[str] = Field("tomato", description="Alias for commodity")

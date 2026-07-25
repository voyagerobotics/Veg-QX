"""
routers/upload.py
Handles CSV and Excel file uploads for batch prediction.
Validates file columns, checks for missing data, and returns predicted results.
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import pandas as pd
import io

from services.inference_service import get_inference_service, InferenceService

router = APIRouter(prefix="/upload_csv", tags=["Upload"])


@router.post("")
async def upload_and_predict_dataset(
    file: UploadFile = File(...),
    inference_svc: InferenceService = Depends(get_inference_service),
):
    """
    Accepts CSV or XLSX dataset, validates required spectral columns,
    runs batch predictions, and returns a preview of the results.
    """
    filename = file.filename.lower()
    contents = await file.read()

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file format. Please upload a .csv, .xls, or .xlsx file."
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    # Column Validation
    required_cols = ["Blue", "Green", "Yellow", "Orange", "Red", "NIR"]
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns in dataset: {missing}"
        )

    # Clean missing values in spectral features
    df = df.dropna(subset=required_cols)
    if len(df) == 0:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file contains no valid rows (all target rows had null values)."
        )

    # Optional columns mapping
    if "Tomato_ID" not in df.columns:
        df["Tomato_ID"] = None
    if "Tomato_position" not in df.columns:
        df["Tomato_position"] = None
    if "input_source" not in df.columns:
        df["input_source"] = "csv_upload"

    try:
        # Run batch predictions
        pred_df = inference_svc.predict_batch(df)

        # Prepare summary stats
        summary = {
            "filename": file.filename,
            "total_samples": len(pred_df),
            "columns": list(pred_df.columns),
            "fresh_count": int((pred_df["category"] == "Fresh").sum()),
            "aging_count": int((pred_df["category"] == "Aging").sum()),
            "spoiling_count": int((pred_df["category"] == "Spoiling").sum()),
            "average_freshness": float(pred_df["freshness_score"].mean()),
        }

        # Convert preview subset to list of dicts (first 100 rows)
        preview_cols = required_cols + ["Tomato_ID", "Tomato_position", "freshness_score", "category", "NDVI", "GNDVI", "RVI"]
        # Filter columns to only what's available
        actual_preview_cols = [c for c in preview_cols if c in pred_df.columns]
        preview_data = pred_df[actual_preview_cols].head(100).replace({pd.NA: None, float('nan'): None}).to_dict(orient="records")

        return {
            "success": True,
            "summary": summary,
            "preview": preview_data,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

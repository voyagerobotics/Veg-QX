"""
routers/health.py
System health checks. Renders active status of serial ports, ML models, and SQLite DB.
"""
from fastapi import APIRouter, Depends
import os

from services.sensor_service import get_sensor_service, SensorService
from services.inference_service import get_inference_service, InferenceService
from services.database_service import get_connection

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
def health_check(
    sensor_svc: SensorService = Depends(get_sensor_service),
    inference_svc: InferenceService = Depends(get_inference_service),
):
    # Database check
    db_ok = False
    try:
        conn = get_connection()
        conn.execute("SELECT 1")
        conn.close()
        db_ok = True
    except Exception:
        pass

    # Model status
    model_ok = inference_svc.is_loaded()

    # USB status
    sensor_status = sensor_svc.get_status()

    # Overall health status
    overall = "healthy" if (db_ok and model_ok) else "degraded"

    return {
        "status": overall,
        "database_connected": db_ok,
        "model_loaded": model_ok,
        "model_version": inference_svc.model_version if model_ok else None,
        "usb_connected": sensor_status["is_connected"],
        "usb_port": sensor_status["port"],
        "sensor_ready": sensor_status["is_connected"] and sensor_status["esp32_detected"],
    }

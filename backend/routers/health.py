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
    commodity: str = "tomato",
    sensor_svc: SensorService = Depends(get_sensor_service),
):
    inference_svc = get_inference_service(commodity)
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

    # Active model descriptive name
    active_model_name = None
    if model_ok:
        meta = getattr(inference_svc, "metadata", {}) or {}
        reg_algo = str(meta.get("regressor_algorithm", "XGBoost"))
        if "LightGBM" in reg_algo:
            algo_code = "LGBM"
        elif "HistGradient" in reg_algo:
            algo_code = "HGB"
        elif "XGB" in reg_algo:
            algo_code = "XGB"
        else:
            algo_code = "XGB"

        raw_ver = inference_svc.model_version or "v1.0"
        if raw_ver.startswith(f"{commodity}_"):
            active_model_name = f"{algo_code}_{raw_ver}"
        elif raw_ver.startswith("v"):
            active_model_name = f"{algo_code}_{commodity}_{raw_ver}"
        else:
            active_model_name = f"{algo_code}_{raw_ver}"

    # USB status
    sensor_status = sensor_svc.get_status()
    available_ports = sensor_status.get("available_ports", [])
    detected_port = sensor_svc.find_esp32_port()

    # Overall health status
    overall = "healthy" if (db_ok and model_ok) else "degraded"

    return {
        "status": overall,
        "database_connected": db_ok,
        "model_loaded": model_ok,
        "model_version": inference_svc.model_version if model_ok else None,
        "active_model": active_model_name,
        "commodity": commodity,
        "usb_connected": sensor_status["is_connected"],
        "usb_port": sensor_status["port"] or detected_port,
        "available_ports": available_ports,
        "esp32_detected": sensor_status["esp32_detected"] or len(available_ports) > 0,
        "sensor_ready": sensor_status["is_connected"],
    }


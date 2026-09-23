"""
tests/test_multi_commodity_inference.py
Verifies end-to-end multi-commodity inference, OOD detection,
and FastAPI endpoint contracts across all canonical commodities:
Tomato, Carrot, Brinjal, Green Brinjal, Beetroot, Bitter Gourd.
"""
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Add project root and backend to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / "backend"))

from backend.config import COMMODITY_CONFIGS, FOOD_CONFIGS
from backend.services.inference_service import get_inference_service
from backend.main import app

client = TestClient(app)

CANONICAL_COMMODITIES = ["tomato", "carrot", "brinjal", "green_brinjal", "beetroot", "bitter_gourd"]

# Representative test readings
NORMAL_READING = {
    "Blue": 45.0,
    "Green": 65.0,
    "Yellow": 55.0,
    "Orange": 40.0,
    "Red": 25.0,
    "NIR": 88.0,
}

OOD_READING = {
    "Blue": 150.0,  # Physically impossible (>100)
    "Green": 160.0,
    "Yellow": 140.0,
    "Orange": 130.0,
    "Red": 120.0,
    "NIR": 10.0,    # Inverted NIR < Red for fresh green/pigmented vegetation
}


def test_commodity_configs_integrity():
    """Verify all canonical commodities exist and have valid thresholds."""
    for comm in CANONICAL_COMMODITIES:
        assert comm in COMMODITY_CONFIGS, f"Missing config for {comm}"
        cfg = COMMODITY_CONFIGS[comm]
        assert "fresh_threshold" in cfg
        assert "aging_threshold" in cfg
        assert cfg["fresh_threshold"] > cfg["aging_threshold"]
        assert "active_model_path" in cfg


def test_inference_service_all_commodities():
    """Verify inference works and returns valid scores for each commodity."""
    for comm in CANONICAL_COMMODITIES:
        svc = get_inference_service(comm)
        assert svc.is_loaded(), f"Service failed to load active model for {comm}"
        
        result = svc.predict_single(NORMAL_READING)
        assert "freshness_score" in result
        assert "category" in result
        assert "confidence_pct" in result
        assert 0.0 <= result["freshness_score"] <= 100.0
        assert result["category"] in ["Fresh", "Aging", "Spoiling"]
        assert 0.0 <= result["confidence_pct"] <= 100.0


def test_ood_detection():
    """Verify that anomalous / out-of-bounds readings trigger OOD warnings."""
    for comm in CANONICAL_COMMODITIES:
        svc = get_inference_service(comm)
        result = svc.predict_single(OOD_READING)
        assert result.get("is_ood") is True, f"Failed to trigger OOD for {comm} on extreme reading"
        assert len(result.get("ood_reasons", [])) > 0


def test_api_commodities_endpoint():
    """Verify GET /commodities returns list of all canonical commodities."""
    resp = client.get("/commodities")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    keys = [item["key"] for item in data["data"]]
    for comm in CANONICAL_COMMODITIES:
        assert comm in keys, f"API /commodities missing {comm}"


def test_api_predict_endpoints_multi_commodity():
    """Verify POST /predict works across all commodities with appropriate response models."""
    for comm in CANONICAL_COMMODITIES:
        payload = {
            "commodity": comm,
            "food_type": comm,
            "specimen_id": f"TEST_{comm.upper()}_01",
            **NORMAL_READING,
        }
        resp = client.post("/predict", json=payload)
        assert resp.status_code == 200, f"Predict failed for {comm}: {resp.text}"
        data = resp.json()
        assert data["commodity"] == comm
        assert data["category"] in ["Fresh", "Aging", "Spoiling"]
        assert 0.0 <= data["freshness_score"] <= 100.0
        assert data["model_version"] is not None


def test_api_model_information_multi_commodity():
    """Verify GET /model_information returns correct metadata per commodity."""
    for comm in CANONICAL_COMMODITIES:
        resp = client.get(f"/model_information?commodity={comm}")
        assert resp.status_code == 200, f"Model info failed for {comm}: {resp.text}"
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["food_type"] == comm

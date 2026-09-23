"""
test_tomato_regression.py
Regression test suite to ensure the active Tomato production model and pipeline
remain 100% stable, functional, and identical before, during, and after any multi-commodity expansion.
"""
import pytest
import joblib
import numpy as np
from pathlib import Path

# Paths
MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
TOMATO_MODEL_PATH = MODELS_DIR / "tomato_freshness_pipeline_v1.1.pkl"

EXPECTED_FEATURES = ["Blue", "Green", "Yellow", "Orange", "Red", "NIR", "NDVI", "GNDVI", "RVI"]
EXPECTED_CLASSES = ["Aging", "Fresh", "Spoiling"]


def compute_indices(nir: float, red: float, green: float):
    ndvi = (nir - red) / (nir + red) if (nir + red) != 0 else 0.0
    gndvi = (nir - green) / (nir + green) if (nir + green) != 0 else 0.0
    rvi = nir / red if red != 0 else 0.0
    return round(ndvi, 4), round(gndvi, 4), round(rvi, 4)


def test_tomato_model_file_exists():
    assert TOMATO_MODEL_PATH.exists(), f"Active Tomato model missing at {TOMATO_MODEL_PATH}"


def test_tomato_model_artifact_schema():
    payload = joblib.load(str(TOMATO_MODEL_PATH))
    assert isinstance(payload, dict), "Payload must be a dictionary"
    assert "regressor" in payload
    assert "classifier" in payload
    assert "label_encoder" in payload
    assert "features" in payload
    assert "metadata" in payload

    assert payload["features"] == EXPECTED_FEATURES, "Feature contract altered!"
    assert sorted(list(payload["metadata"]["classes"])) == sorted(EXPECTED_CLASSES)
    assert payload["metadata"]["version"] == "v1.1"


def test_tomato_prediction_logic():
    payload = joblib.load(str(TOMATO_MODEL_PATH))
    reg = payload["regressor"]
    clf = payload["classifier"]
    le = payload["label_encoder"]

    # Test cases: (raw_bands: Blue, Green, Yellow, Orange, Red, NIR) -> expected_category
    test_cases = [
        # Fresh: high NIR, high Green, low Red
        {"raw": (50.0, 55.0, 52.0, 40.0, 45.0, 380.0), "expected_category": "Fresh", "score_min": 60.0},
        # Aging: intermediate NIR, higher Red
        {"raw": (40.0, 45.0, 45.0, 65.0, 75.0, 350.0), "expected_category": "Aging", "score_min": 40.0, "score_max": 60.0},
        # Spoiling: collapsed NIR, high Red
        {"raw": (30.0, 35.0, 35.0, 110.0, 160.0, 120.0), "expected_category": "Spoiling", "score_max": 40.0},
    ]

    for tc in test_cases:
        b, g, y, o, r, nir = tc["raw"]
        ndvi, gndvi, rvi = compute_indices(nir, r, g)
        features = np.array([[b, g, y, o, r, nir, ndvi, gndvi, rvi]])

        score = float(reg.predict(features)[0])
        pred_idx = int(clf.predict(features)[0])
        cat = le.inverse_transform([pred_idx])[0]

        assert 0.0 <= score <= 100.0, f"Score out of bounds: {score}"
        assert cat == tc["expected_category"], f"Expected {tc['expected_category']}, got {cat}"

        if "score_min" in tc:
            assert score >= tc["score_min"], f"Expected score >= {tc['score_min']}, got {score}"
        if "score_max" in tc:
            assert score < tc["score_max"], f"Expected score < {tc['score_max']}, got {score}"


if __name__ == "__main__":
    pytest.main(["-v", __file__])

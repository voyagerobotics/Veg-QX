"""
services/inference_service.py
Loads the best XGBoost pipeline, computes vegetation indices,
runs regression (freshness score) and classification (category + confidence).
Supports any food type via the FOOD_CONFIGS dict in config.py.
"""
import glob
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Optional

from config import FOOD_CONFIGS, MODELS_DIR, PERFORMANCE_THRESHOLD_R2
from utils.index_calculator import compute_all_indices


class InferenceService:
    """
    Manages model loading and prediction for a specific food type.
    Auto-detects the best model by classification accuracy from available pkl files.
    """

    def __init__(self, food_type: str = "tomato"):
        self.food_type = food_type
        self.config    = FOOD_CONFIGS[food_type]
        self.pipeline  = None
        self.model_version: Optional[str] = None
        self.regressor  = None
        self.classifier = None
        self.label_encoder = None
        self.features   = None
        self.metadata: dict = {}

    def load_best_model(self) -> bool:
        """
        Scans models/ directory and loads the pipeline with the highest
        classification_accuracy. Falls back to the configured active_model_path.
        Returns True if loaded successfully.
        """
        pattern = str(MODELS_DIR / f"{self.food_type}_freshness_pipeline_v*.pkl")
        candidates = sorted(glob.glob(pattern))

        best_payload = None
        best_accuracy = -1.0

        for path in candidates:
            try:
                payload = joblib.load(path)
                acc = payload.get("metadata", {}).get("classification_accuracy", -1)
                if acc > best_accuracy:
                    best_accuracy = acc
                    best_payload = payload
                    best_payload["_path"] = path
            except Exception:
                continue

        # Fallback to configured active model path
        if best_payload is None:
            fallback = self.config.get("active_model_path")
            if fallback and Path(fallback).exists():
                try:
                    best_payload = joblib.load(fallback)
                    best_payload["_path"] = fallback
                except Exception as e:
                    raise RuntimeError(f"Could not load any model for {self.food_type}: {e}")
            else:
                raise FileNotFoundError(
                    f"No model files found for {self.food_type} in {MODELS_DIR}"
                )

        self._apply_payload(best_payload)
        print(f"[InferenceService] Loaded model '{self.model_version}' "
              f"(acc={self.metadata.get('classification_accuracy', '?'):.4f}, "
              f"R²={self.metadata.get('regression_r2', '?'):.4f})")
        return True

    def load_specific_version(self, version: str) -> bool:
        """Load a specific version by name, e.g. 'v1.0'."""
        path = MODELS_DIR / f"{self.food_type}_freshness_pipeline_{version}.pkl"
        if not path.exists():
            raise FileNotFoundError(f"Model file not found: {path}")
        payload = joblib.load(str(path))
        payload["_path"] = str(path)
        self._apply_payload(payload)
        return True

    def _apply_payload(self, payload: dict):
        self.pipeline      = payload
        self.regressor     = payload["regressor"]
        self.classifier    = payload["classifier"]
        self.label_encoder = payload["label_encoder"]
        self.features      = payload["features"]
        self.metadata      = payload.get("metadata", {})
        self.model_version = self.metadata.get("version", "unknown")

    def is_loaded(self) -> bool:
        return self.regressor is not None

    # ─── Prediction ───────────────────────────────────────────────────────────

    def predict_single(self, raw_bands: dict) -> dict:
        """
        Run inference on a single spectral reading.

        Parameters
        ----------
        raw_bands : dict with keys: Blue, Green, Yellow, Orange, Red, NIR
                    (NDVI, GNDVI, RVI are computed automatically)

        Returns
        -------
        dict with: freshness_score, category, confidence_fresh,
                   confidence_aging, confidence_spoiling, NDVI, GNDVI, RVI
        """
        if not self.is_loaded():
            raise RuntimeError("Model not loaded. Call load_best_model() first.")

        # Compute vegetation indices
        indices = compute_all_indices(
            nir=raw_bands["NIR"],
            red=raw_bands["Red"],
            green=raw_bands["Green"],
        )
        full_input = {**raw_bands, **indices}

        # Build feature DataFrame in correct column order
        X = pd.DataFrame([full_input])[self.features]

        # Regression: freshness score
        freshness_score = float(self.regressor.predict(X)[0])
        freshness_score = round(max(0.0, min(100.0, freshness_score)), 4)

        # Classification: category + confidence
        class_probs = self.classifier.predict_proba(X)[0]
        class_idx   = int(np.argmax(class_probs))
        category    = self.label_encoder.inverse_transform([class_idx])[0]

        # Map probabilities to named categories
        classes        = list(self.label_encoder.classes_)
        prob_dict      = dict(zip(classes, [round(float(p), 4) for p in class_probs]))
        confidence     = round(float(class_probs[class_idx]) * 100, 2)

        return {
            "freshness_score":      freshness_score,
            "category":             category,
            "confidence_pct":       confidence,
            "confidence_fresh":     prob_dict.get("Fresh", 0.0),
            "confidence_aging":     prob_dict.get("Aging", 0.0),
            "confidence_spoiling":  prob_dict.get("Spoiling", 0.0),
            "NDVI":                 indices["NDVI"],
            "GNDVI":                indices["GNDVI"],
            "RVI":                  indices["RVI"],
            "model_version":        self.model_version,
        }

    def predict_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Run inference on a DataFrame of spectral readings.
        Computes indices automatically if not already present.
        Returns the DataFrame with prediction columns appended.
        """
        if not self.is_loaded():
            raise RuntimeError("Model not loaded.")

        df = df.copy()

        # Compute missing indices
        if "NDVI" not in df.columns:
            df["NDVI"]  = df.apply(lambda r: compute_all_indices(r["NIR"], r["Red"], r["Green"])["NDVI"],  axis=1)
            df["GNDVI"] = df.apply(lambda r: compute_all_indices(r["NIR"], r["Red"], r["Green"])["GNDVI"], axis=1)
            df["RVI"]   = df.apply(lambda r: compute_all_indices(r["NIR"], r["Red"], r["Green"])["RVI"],   axis=1)

        X = df[self.features]

        df["freshness_score"] = self.regressor.predict(X).clip(0, 100).round(4)

        probs = self.classifier.predict_proba(X)
        df["category"] = self.label_encoder.inverse_transform(np.argmax(probs, axis=1))

        classes = list(self.label_encoder.classes_)
        for i, cls in enumerate(classes):
            df[f"confidence_{cls.lower()}"] = probs[:, i].round(4)

        df["model_version"] = self.model_version
        return df

    def get_model_info(self) -> dict:
        return {
            "food_type":                self.food_type,
            "model_version":            self.model_version,
            "classification_accuracy":  self.metadata.get("classification_accuracy"),
            "regression_r2":            self.metadata.get("regression_r2"),
            "training_samples":         self.metadata.get("dataset_shape", [None])[0],
            "features":                 self.features,
            "classes":                  self.metadata.get("classes", []),
        }


# ─── Singleton instances per food type ────────────────────────────────────────
_services: dict[str, InferenceService] = {}


def get_inference_service(food_type: str = "tomato") -> InferenceService:
    """Returns a cached InferenceService for the given food type."""
    if food_type not in _services:
        svc = InferenceService(food_type)
        svc.load_best_model()
        _services[food_type] = svc
    return _services[food_type]


def reload_inference_service(food_type: str = "tomato") -> InferenceService:
    """Forces a reload (used after retraining)."""
    svc = InferenceService(food_type)
    svc.load_best_model()
    _services[food_type] = svc
    return svc

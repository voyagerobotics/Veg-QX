# Developer Guide: Adding a New Commodity to VEG QX

This guide explains how to add a new fruit or vegetable commodity to the VEG QX platform in under 15 minutes, following the established zero-breakage architecture.

---

## Prerequisites
* Python 3.10+ virtual environment activated (`.\backend\venv\Scripts\activate`)
* Baseline spectral reference readings or calibration data (from lab measurements or AS7341 scans)

---

## Step 1: Define Configuration in `backend/config.py`

Open `backend/config.py` and append your commodity definition to `COMMODITY_CONFIGS`:

```python
    "green_chilli": {
        "display_name": "Green Chilli",
        "icon": "🌶️",
        "family": "Solanaceae",
        "features": ["Blue", "Green", "Yellow", "Orange", "Red", "NIR", "NDVI", "GNDVI", "RVI"],
        "raw_bands": ["Blue", "Green", "Yellow", "Orange", "Red", "NIR"],
        "computed_indices": ["NDVI", "GNDVI", "RVI"],
        "categories": ["Fresh", "Aging", "Spoiling"],
        "category_colors": {
            "Fresh": "#39ff14",
            "Aging": "#ff9500",
            "Spoiling": "#ff3b30",
        },
        "freshness_thresholds": {
            "Spoiling_max": 40,
            "Aging_max": 60,
        },
        "fresh_threshold": 60.0,
        "aging_threshold": 40.0,
        "positions_per_specimen": 10,
        "active_model_path": str(MODELS_DIR / "green_chilli" / "green_chilli_freshness_pipeline_active.pkl"),
        "reference_dataset": str(ML_MODEL_DIR / "data" / "synthetic" / "green_chilli" / "green_chilli_sample_100k.csv"),
    },
```

---

## Step 2: Extract or Define Calibration Profile

Add calibration parameters to `data/raw/reference/calibration_profiles.json`:

```json
  "green_chilli": {
    "num_specimens": 15,
    "num_readings": 150,
    "fresh_means": {
      "Blue": 35.2,
      "Green": 62.4,
      "Yellow": 45.1,
      "Orange": 30.0,
      "Red": 22.5,
      "NIR": 85.0
    },
    "sensor_noise_sigma": 0.85,
    "inter_specimen_std": 3.2
  }
```

---

## Step 3: Generate 10 Million Synthetic Rows

Run the streaming generator for the new commodity:

```powershell
.\backend\venv\Scripts\python.exe ml/dataset_generation/generate_commodity_dataset.py --commodity green_chilli --total-rows 10000000 --chunks 10
```

This outputs:
* `data/synthetic/green_chilli/train/chunk_001.parquet` through `chunk_010.parquet`
* `data/synthetic/green_chilli/green_chilli_sample_100k.csv`
* `data/synthetic/green_chilli/manifest.json`

---

## Step 4: Validate Synthetic Dataset

Run the automated data quality check:

```powershell
.\backend\venv\Scripts\python.exe ml/dataset_generation/validate_synthetic_data.py --commodity green_chilli
```

Review the resulting markdown report in `reports/dataset_quality_green_chilli.md`.

---

## Step 5: Benchmark & Train Models

Run the multi-algorithm benchmark and model training pipeline:

```powershell
.\backend\venv\Scripts\python.exe ml/training/train_commodity.py --commodity green_chilli
```

This will:
1. Load specimen groups and split (70% train / 15% val / 15% test).
2. Benchmark `XGBoost`, `LightGBM`, and `HistGradientBoosting`.
3. Select the best regressor ($R^2$) and classifier (Accuracy / F1).
4. Save:
   * `models/green_chilli/green_chilli_freshness_pipeline_v1.0.pkl`
   * `models/green_chilli/green_chilli_freshness_pipeline_active.pkl`
5. Generate `docs/MODEL_CARDS/MODEL_CARD_green_chilli.md`.

---

## Step 6: Register in SQLite Model Registry

Register the new active baseline in SQLite:

```powershell
.\backend\venv\Scripts\python.exe backend/scripts/register_commodity_models.py
```

---

## Step 7: Expose in Frontend Constants

Open `frontend/lib/constants.ts` and set `disabled: false` on the new commodity in `FOOD_TYPES`:

```typescript
  { value: "green_chilli", label: "Green Chilli", icon: "🌶️", status: "active", family: "Solanaceae" },
```

---

## Step 8: Run Regression Tests

Ensure zero regressions across both the baseline Tomato model and other commodities:

```powershell
.\backend\venv\Scripts\python.exe -m pytest tests/test_tomato_regression.py tests/test_multi_commodity_inference.py
```

All tests should pass with code 0!

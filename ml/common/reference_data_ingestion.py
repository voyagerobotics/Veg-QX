"""
reference_data_ingestion.py
Ingests real sensor measurement data from NDVI_Method1_Lab_Log.xlsx,
normalizes specimen names into the canonical commodity taxonomy,
computes empirical sensor noise (sigma_sensor) and specimen variances,
saves real holdout splits for unseen evaluation, and exports calibration parameters.
"""
import os
import json
import shutil
from pathlib import Path
import numpy as np
import pandas as pd

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
RAW_REF_DIR = BASE_DIR / "data" / "raw" / "reference"
VALIDATION_DIR = BASE_DIR / "data" / "validation"
RAW_REF_DIR.mkdir(parents=True, exist_ok=True)
VALIDATION_DIR.mkdir(parents=True, exist_ok=True)

SOURCE_XLSX = Path(r"D:\Downloads\NDVI_Method1_Lab_Log.xlsx")
TARGET_XLSX = RAW_REF_DIR / "NDVI_Method1_Lab_Log.xlsx"


def copy_source_file():
    if SOURCE_XLSX.exists() and not TARGET_XLSX.exists():
        shutil.copy2(str(SOURCE_XLSX), str(TARGET_XLSX))
        print(f"Copied source XLSX to {TARGET_XLSX}")
    elif not TARGET_XLSX.exists():
        raise FileNotFoundError(f"Source file {SOURCE_XLSX} not found!")


def normalize_commodity_name(sub_category: str, specimen_name: str = "") -> str:
    s = str(sub_category).strip().lower()
    spec = str(specimen_name).strip().lower()

    if "green" in s and ("brinjal" in s or "bringal" in s):
        return "green_brinjal"
    elif "brinjal" in s or "bringal" in s or "brinjal" in spec:
        if "green" in spec:
            return "green_brinjal"
        return "brinjal"
    elif "tomato" in s or "tomato" in spec:
        return "tomato"
    elif "beetroot" in s or "beetroot" in spec:
        return "beetroot"
    elif "carrot" in s or "carrot" in spec:
        return "carrot"
    elif "bitter" in s or "gourd" in s:
        return "bitter_gourd"
    elif "chilli" in s:
        return "green_chilli"
    elif "pea" in s:
        return "peas"
    return s.replace(" ", "_")


def ingest_and_calibrate():
    copy_source_file()
    df = pd.read_excel(str(TARGET_XLSX))
    print(f"Loaded {len(df)} records from {TARGET_XLSX.name}")

    # Map canonical commodity
    df["raw_specimen_name"] = df["Specimen_Name"]
    df["raw_sub_category"] = df["Sub_Category"]
    df["canonical_commodity"] = [
        normalize_commodity_name(sub, spec)
        for sub, spec in zip(df["Sub_Category"], df["Specimen_Name"])
    ]

    print("\nCanonical Commodity Counts:")
    print(df["canonical_commodity"].value_counts())

    # Sanitize numeric columns and fix data entry typos
    numeric_cols = [c for c in df.columns if any(k in c for k in ["RED", "NIR", "NDVI", "Sensor_Distance_mm", "Samples_Count"])]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Fix any corrupted burst values deterministically from RED and NIR
    for i in range(1, 6):
        red_col = f"RED_{i}"
        nir_col = f"NIR_{i}"
        ndvi_col = f"NDVI_{i}"
        if red_col in df.columns and nir_col in df.columns and ndvi_col in df.columns:
            corrupted_mask = df[ndvi_col].isna() | (df[ndvi_col] < -1.0) | (df[ndvi_col] > 1.0)
            if corrupted_mask.any():
                print(f"Correcting {corrupted_mask.sum()} invalid/corrupted values in {ndvi_col} using physical formula...")
                df.loc[corrupted_mask, ndvi_col] = (
                    (df.loc[corrupted_mask, nir_col] - df.loc[corrupted_mask, red_col]) /
                    (df.loc[corrupted_mask, nir_col] + df.loc[corrupted_mask, red_col])
                )

    # Save standardized master real data
    df.to_parquet(str(RAW_REF_DIR / "canonical_real_specimens.parquet"), index=False)
    df.to_csv(str(RAW_REF_DIR / "canonical_real_specimens.csv"), index=False)
    print(f"Saved canonical_real_specimens to {RAW_REF_DIR}")

    # Calibration dictionary per commodity
    calibration_profiles = {}

    for commodity, group in df.groupby("canonical_commodity"):
        n_samples = len(group)
        # Compute repeated burst noise
        red_burst_cols = [f"RED_{i}" for i in range(1, 6)]
        nir_burst_cols = [f"NIR_{i}" for i in range(1, 6)]
        ndvi_burst_cols = [f"NDVI_{i}" for i in range(1, 6)]

        red_intra_std = float(group[red_burst_cols].std(axis=1).median())
        nir_intra_std = float(group[nir_burst_cols].std(axis=1).median())
        ndvi_intra_std = float(group[ndvi_burst_cols].std(axis=1).median())

        # Inter-specimen statistics
        red_mean = float(group["RED_F8_Avg"].mean())
        red_std = float(group["RED_F8_Avg"].std()) if n_samples > 1 else 3.0
        nir_mean = float(group["NIR_Avg"].mean())
        nir_std = float(group["NIR_Avg"].std()) if n_samples > 1 else 30.0
        ndvi_mean = float(group["NDVI_Avg"].mean())
        ndvi_std = float(group["NDVI_Avg"].std()) if n_samples > 1 else 0.02

        profile = {
            "commodity": commodity,
            "real_sample_count": n_samples,
            "specimen_count": int(group["Specimen_Name"].nunique()),
            "sensor_noise": {
                "sigma_red_sensor": max(0.4, red_intra_std),
                "sigma_nir_sensor": max(0.8, nir_intra_std),
                "sigma_ndvi_sensor": max(0.001, ndvi_intra_std),
            },
            "real_distributions": {
                "red_mean": red_mean,
                "red_std": red_std,
                "red_min": float(group["RED_F8_Avg"].min()),
                "red_max": float(group["RED_F8_Avg"].max()),
                "nir_mean": nir_mean,
                "nir_std": nir_std,
                "nir_min": float(group["NIR_Avg"].min()),
                "nir_max": float(group["NIR_Avg"].max()),
                "ndvi_mean": ndvi_mean,
                "ndvi_std": ndvi_std,
                "ndvi_min": float(group["NDVI_Avg"].min()),
                "ndvi_max": float(group["NDVI_Avg"].max()),
            },
            "sensor_distance_mm": 50,
            "ambient_tested": list(group["Ambient_Conditions"].dropna().unique()),
        }
        calibration_profiles[commodity] = profile

        # Carve out Real Holdout Dataset (20% of specimens if >= 5 specimens)
        unique_specimens = group["Specimen_Name"].unique()
        if len(unique_specimens) >= 5:
            np.random.seed(42)
            n_holdout = max(1, int(len(unique_specimens) * 0.20))
            holdout_specimens = np.random.choice(unique_specimens, size=n_holdout, replace=False)
            holdout_df = group[group["Specimen_Name"].isin(holdout_specimens)].copy()
            holdout_path = VALIDATION_DIR / f"real_holdout_{commodity}.parquet"
            holdout_df.to_parquet(str(holdout_path), index=False)
            holdout_df.to_csv(str(VALIDATION_DIR / f"real_holdout_{commodity}.csv"), index=False)
            profile["real_holdout_specimens"] = list(holdout_specimens)
            profile["real_holdout_count"] = len(holdout_df)
            print(f"Created real holdout for {commodity} with {len(holdout_df)} records ({len(holdout_specimens)} specimens).")
        else:
            profile["real_holdout_specimens"] = []
            profile["real_holdout_count"] = 0

    # Save profiles JSON
    profile_path = RAW_REF_DIR / "calibration_profiles.json"
    with open(profile_path, "w") as f:
        json.dump(calibration_profiles, f, indent=2)
    print(f"\nCalibration profiles exported to {profile_path}")


if __name__ == "__main__":
    ingest_and_calibrate()

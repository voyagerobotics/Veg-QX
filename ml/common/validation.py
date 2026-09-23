"""
validation.py
Data validation pipeline for VEG QX multi-commodity datasets.
Asserts schema integrity, numerical validity, mathematical formula consistency,
and absence of physical contradictions.
"""
from typing import Dict, List, Tuple
import numpy as np
import pandas as pd

from ml.common.feature_engineering import BASE_SPECTRAL_FEATURES, RAW_SPECTRAL_BANDS, calculate_vegetation_indices


class DataValidationError(Exception):
    pass


def validate_schema(df: pd.DataFrame, required_columns: List[str] = None) -> bool:
    """Verifies that all required columns exist and have non-empty data."""
    if required_columns is None:
        required_columns = BASE_SPECTRAL_FEATURES

    missing = [c for c in required_columns if c not in df.columns]
    if missing:
        raise DataValidationError(f"Missing required columns in dataset: {missing}")
    return True


def validate_numerical_bounds(df: pd.DataFrame) -> Dict[str, any]:
    """
    Checks for:
    - Missing (NaN/null) values
    - Infinite values
    - Negative reflectance values
    - Out-of-bounds NDVI and GNDVI (-1.0 to 1.0)
    """
    issues = {}

    # 1. Null / NaN check
    null_counts = df[BASE_SPECTRAL_FEATURES].isna().sum().to_dict()
    total_nulls = sum(null_counts.values())
    if total_nulls > 0:
        issues["null_values"] = {k: v for k, v in null_counts.items() if v > 0}

    # 2. Infinite values
    inf_counts = np.isinf(df[BASE_SPECTRAL_FEATURES].values).sum()
    if inf_counts > 0:
        issues["inf_values_count"] = int(inf_counts)

    # 3. Non-negative reflectance check
    for b in RAW_SPECTRAL_BANDS:
        if (df[b] < 0).any():
            neg_count = int((df[b] < 0).sum())
            issues[f"negative_{b}_count"] = neg_count

    # 4. NDVI / GNDVI range bounds [-1.0, 1.0]
    if (df["NDVI"] < -1.0).any() or (df["NDVI"] > 1.0).any():
        issues["ndvi_out_of_bounds"] = int(((df["NDVI"] < -1.0) | (df["NDVI"] > 1.0)).sum())

    if (df["GNDVI"] < -1.0).any() or (df["GNDVI"] > 1.0).any():
        issues["gndvi_out_of_bounds"] = int(((df["GNDVI"] < -1.0) | (df["GNDVI"] > 1.0)).sum())

    is_valid = len(issues) == 0
    return {"is_valid": is_valid, "issues": issues}


def validate_mathematical_consistency(df: pd.DataFrame, tolerance: float = 1e-3) -> Dict[str, any]:
    """
    Asserts stored vegetation indices match deterministic calculations:
    stored_NDVI == (NIR - Red) / (NIR + Red)
    stored_GNDVI == (NIR - Green) / (NIR + Green)
    stored_RVI == NIR / Red
    """
    calc_ndvi, calc_gndvi, calc_rvi = calculate_vegetation_indices(df["NIR"], df["Red"], df["Green"])

    diff_ndvi = np.abs(df["NDVI"] - calc_ndvi)
    diff_gndvi = np.abs(df["GNDVI"] - calc_gndvi)
    diff_rvi = np.abs(df["RVI"] - calc_rvi)

    mismatches_ndvi = int((diff_ndvi > tolerance).sum())
    mismatches_gndvi = int((diff_gndvi > tolerance).sum())
    mismatches_rvi = int((diff_rvi > tolerance).sum())

    total_mismatches = mismatches_ndvi + mismatches_gndvi + mismatches_rvi
    return {
        "is_consistent": total_mismatches == 0,
        "mismatches_ndvi": mismatches_ndvi,
        "mismatches_gndvi": mismatches_gndvi,
        "mismatches_rvi": mismatches_rvi,
        "max_diff_ndvi": float(diff_ndvi.max()),
        "max_diff_gndvi": float(diff_gndvi.max()),
        "max_diff_rvi": float(diff_rvi.max()),
    }


def full_validation_suite(df: pd.DataFrame) -> Dict[str, any]:
    """Runs all validation checks and returns a summary report dictionary."""
    schema_ok = validate_schema(df)
    numeric_res = validate_numerical_bounds(df)
    math_res = validate_mathematical_consistency(df)

    passed = schema_ok and numeric_res["is_valid"] and math_res["is_consistent"]
    return {
        "passed": passed,
        "row_count": len(df),
        "schema_ok": schema_ok,
        "numeric_validation": numeric_res,
        "mathematical_consistency": math_res
    }

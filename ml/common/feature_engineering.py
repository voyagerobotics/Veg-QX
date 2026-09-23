"""
feature_engineering.py
Centralized feature engineering and optical vegetation index computation for VEG QX.
Ensures strict compliance with the base 9-feature contract across all commodities
and provides deterministic vegetation index calculation.
"""
from typing import Dict, List, Tuple, Union
import numpy as np
import pandas as pd

# Canonical base 9 features required by all inference engines
BASE_SPECTRAL_FEATURES = [
    "Blue",
    "Green",
    "Yellow",
    "Orange",
    "Red",
    "NIR",
    "NDVI",
    "GNDVI",
    "RVI"
]

RAW_SPECTRAL_BANDS = [
    "Blue",
    "Green",
    "Yellow",
    "Orange",
    "Red",
    "NIR"
]

COMPUTED_VEGETATION_INDICES = [
    "NDVI",
    "GNDVI",
    "RVI"
]


def calculate_vegetation_indices(
    nir: Union[float, np.ndarray, pd.Series],
    red: Union[float, np.ndarray, pd.Series],
    green: Union[float, np.ndarray, pd.Series]
) -> Tuple[Union[float, np.ndarray, pd.Series], Union[float, np.ndarray, pd.Series], Union[float, np.ndarray, pd.Series]]:
    """
    Computes standard vegetation indices:
    NDVI  = (NIR - Red) / (NIR + Red)
    GNDVI = (NIR - Green) / (NIR + Green)
    RVI   = NIR / Red
    """
    if isinstance(nir, (np.ndarray, pd.Series)):
        nir_arr = np.asarray(nir, dtype=np.float64)
        red_arr = np.asarray(red, dtype=np.float64)
        grn_arr = np.asarray(green, dtype=np.float64)

        denom_ndvi = nir_arr + red_arr
        denom_ndvi = np.where(denom_ndvi == 0.0, 1e-6, denom_ndvi)
        ndvi = np.round((nir_arr - red_arr) / denom_ndvi, 4)

        denom_gndvi = nir_arr + grn_arr
        denom_gndvi = np.where(denom_gndvi == 0.0, 1e-6, denom_gndvi)
        gndvi = np.round((nir_arr - grn_arr) / denom_gndvi, 4)

        denom_rvi = np.where(red_arr == 0.0, 1e-6, red_arr)
        rvi = np.round(nir_arr / denom_rvi, 4)

        return ndvi, gndvi, rvi
    else:
        nir_val = float(nir)
        red_val = float(red)
        grn_val = float(green)

        ndvi = round((nir_val - red_val) / (nir_val + red_val), 4) if (nir_val + red_val) != 0 else 0.0
        gndvi = round((nir_val - grn_val) / (nir_val + grn_val), 4) if (nir_val + grn_val) != 0 else 0.0
        rvi = round(nir_val / red_val, 4) if red_val != 0 else 0.0

        return ndvi, gndvi, rvi


def assemble_feature_vector(raw_bands: Dict[str, float]) -> Dict[str, float]:
    """
    Takes 6 raw spectral bands and returns complete 9-feature dictionary.
    """
    for b in RAW_SPECTRAL_BANDS:
        if b not in raw_bands:
            raise KeyError(f"Missing required raw spectral band: {b}")

    nir = float(raw_bands["NIR"])
    red = float(raw_bands["Red"])
    green = float(raw_bands["Green"])

    ndvi, gndvi, rvi = calculate_vegetation_indices(nir, red, green)

    assembled = {
        "Blue": float(raw_bands["Blue"]),
        "Green": green,
        "Yellow": float(raw_bands["Yellow"]),
        "Orange": float(raw_bands["Orange"]),
        "Red": red,
        "NIR": nir,
        "NDVI": float(ndvi),
        "GNDVI": float(gndvi),
        "RVI": float(rvi)
    }
    return assembled

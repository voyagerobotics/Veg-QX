"""
utils/index_calculator.py
Computes vegetation indices (NDVI, GNDVI, RVI) from raw spectral band values.
These are always computed server-side — the user never needs to calculate them manually.
"""


def compute_ndvi(nir: float, red: float) -> float:
    """
    Normalized Difference Vegetation Index.
    NDVI = (NIR - Red) / (NIR + Red)
    Range: [-1, 1]  |  Higher = healthier/fresher vegetation
    """
    denominator = nir + red
    if denominator == 0:
        return 0.0
    return round((nir - red) / denominator, 6)


def compute_gndvi(nir: float, green: float) -> float:
    """
    Green Normalized Difference Vegetation Index.
    GNDVI = (NIR - Green) / (NIR + Green)
    More sensitive to chlorophyll concentration than NDVI.
    """
    denominator = nir + green
    if denominator == 0:
        return 0.0
    return round((nir - green) / denominator, 6)


def compute_rvi(nir: float, red: float) -> float:
    """
    Ratio Vegetation Index.
    RVI = NIR / Red
    Reflects biomass. Higher = more biomass/freshness.
    """
    if red == 0:
        return 0.0
    return round(nir / red, 6)


def compute_all_indices(nir: float, red: float, green: float) -> dict:
    """
    Computes all three vegetation indices from raw spectral bands.
    Returns a dict with NDVI, GNDVI, RVI.
    """
    return {
        "NDVI":  compute_ndvi(nir, red),
        "GNDVI": compute_gndvi(nir, green),
        "RVI":   compute_rvi(nir, red),
    }

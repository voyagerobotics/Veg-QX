"""
generate_commodity_dataset.py
Industrial-grade, memory-efficient, chunked scientific synthetic dataset generator.
Generates 10,000,000 rows per canonical commodity, calibrated against real laboratory measurements.
Stores partitioned Parquet datasets with snappy compression and deterministic random seeds.
"""
import os
import sys
import time
import json
import argparse
from pathlib import Path
import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Set project base directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROFILES_PATH = BASE_DIR / "data" / "raw" / "reference" / "calibration_profiles.json"
OUTPUT_BASE_DIR = BASE_DIR / "data" / "synthetic"
OUTPUT_BASE_DIR.mkdir(parents=True, exist_ok=True)

DATASET_VERSION = "v1.0"
GENERATOR_VERSION = "generator_v2.0_calibrated"


def load_calibration_profiles():
    if not PROFILES_PATH.exists():
        raise FileNotFoundError(f"Calibration profiles not found at {PROFILES_PATH}. Run reference_data_ingestion.py first.")
    with open(PROFILES_PATH, "r") as f:
        return json.load(f)


def generate_specimen_batch(
    commodity: str,
    n_specimens: int,
    positions_per_specimen: int,
    start_specimen_id: int,
    calib_profile: dict,
    rng: np.random.Generator
) -> pd.DataFrame:
    """
    Generates a batch of rows anchored to a latent biological freshness score
    with realistic physiological reflectance curves and calibrated sensor noise.
    """
    real_dist = calib_profile["real_distributions"]
    noise_cfg = calib_profile["sensor_noise"]

    sigma_sensor_red = noise_cfg["sigma_red_sensor"]
    sigma_sensor_nir = noise_cfg["sigma_nir_sensor"]

    # 1. Generate Latent True Biological Freshness Score: F_true in [0, 100]
    # We sample a realistic distribution covering Fresh, Aging, Spoiling with natural variance
    freshness_latent = rng.uniform(0.0, 100.0, size=n_specimens)

    # 2. Specimen biological baseline offsets (cultivar, size, baseline reflectance variance)
    specimen_bias_red = rng.normal(0.0, real_dist["red_std"] * 0.4, size=n_specimens)
    specimen_bias_nir = rng.normal(0.0, real_dist["nir_std"] * 0.4, size=n_specimens)

    # Repeat for all spatial positions
    specimen_ids = np.repeat(np.arange(start_specimen_id, start_specimen_id + n_specimens), positions_per_specimen)
    positions = np.tile(np.arange(1, positions_per_specimen + 1), n_specimens)
    f_true_expanded = np.repeat(freshness_latent, positions_per_specimen)
    bias_red_expanded = np.repeat(specimen_bias_red, positions_per_specimen)
    bias_nir_expanded = np.repeat(specimen_bias_nir, positions_per_specimen)

    total_rows = n_specimens * positions_per_specimen

    # 3. Spatial surface variation & Sensor Gaussian noise
    spatial_noise_red = rng.normal(0.0, sigma_sensor_red * 2.5, size=total_rows)
    spatial_noise_nir = rng.normal(0.0, sigma_sensor_nir * 2.5, size=total_rows)

    sensor_noise_red = rng.normal(0.0, sigma_sensor_red, size=total_rows)
    sensor_noise_nir = rng.normal(0.0, sigma_sensor_nir, size=total_rows)

    f_norm = f_true_expanded / 100.0  # 1.0 = peak fresh, 0.0 = completely spoiled

    # 4. Commodity-Specific Photonic & Physiological Modeling
    if commodity == "carrot":
        # Fresh carrot: high NIR (root turgor), low Red, high Orange/Yellow
        base_nir = 180.0 + 260.0 * (f_norm ** 0.8) + bias_nir_expanded + spatial_noise_nir + sensor_noise_nir
        base_red = 65.0 - 52.0 * (f_norm ** 0.9) + bias_red_expanded + spatial_noise_red + sensor_noise_red
        base_orange = 80.0 + 130.0 * (f_norm ** 0.7) + rng.normal(0, 10, size=total_rows)
        base_yellow = 60.0 + 90.0 * (f_norm ** 0.7) + rng.normal(0, 8, size=total_rows)
        base_green = 20.0 + 35.0 * (f_norm ** 0.6) + rng.normal(0, 4, size=total_rows)
        base_blue = 15.0 + 25.0 * (f_norm ** 0.6) + rng.normal(0, 3, size=total_rows)

    elif commodity == "brinjal":
        # Purple brinjal: deep anthocyanin absorption (low Red), high spongy parenchyma reflection (NIR)
        base_nir = 220.0 + 360.0 * (f_norm ** 0.75) + bias_nir_expanded + spatial_noise_nir + sensor_noise_nir
        base_red = 48.0 - 38.0 * (f_norm ** 0.85) + bias_red_expanded + spatial_noise_red + sensor_noise_red
        base_orange = 25.0 - 15.0 * (f_norm ** 0.8) + rng.normal(0, 4, size=total_rows)
        base_yellow = 20.0 - 10.0 * (f_norm ** 0.8) + rng.normal(0, 3, size=total_rows)
        base_green = 18.0 + 15.0 * (f_norm ** 0.5) + rng.normal(0, 3, size=total_rows)
        base_blue = 25.0 + 20.0 * (f_norm ** 0.6) + rng.normal(0, 3, size=total_rows)

    elif commodity == "green_brinjal":
        # Green brinjal: chlorophyll skin reflection, very high NIR
        base_nir = 300.0 + 480.0 * (f_norm ** 0.7) + bias_nir_expanded + spatial_noise_nir + sensor_noise_nir
        base_red = 60.0 - 45.0 * (f_norm ** 0.9) + bias_red_expanded + spatial_noise_red + sensor_noise_red
        base_orange = 35.0 + 20.0 * ((1.0 - f_norm) ** 1.2) + rng.normal(0, 5, size=total_rows) # yellowing on aging
        base_yellow = 40.0 + 30.0 * ((1.0 - f_norm) ** 1.2) + rng.normal(0, 5, size=total_rows)
        base_green = 30.0 + 55.0 * (f_norm ** 0.8) + rng.normal(0, 6, size=total_rows)
        base_blue = 22.0 + 30.0 * (f_norm ** 0.7) + rng.normal(0, 4, size=total_rows)

    elif commodity == "beetroot":
        # Beetroot: Betalain absorption in green/yellow/orange; dense taproot cellular reflection
        base_nir = 200.0 + 320.0 * (f_norm ** 0.8) + bias_nir_expanded + spatial_noise_nir + sensor_noise_nir
        base_red = 70.0 - 48.0 * (f_norm ** 0.8) + bias_red_expanded + spatial_noise_red + sensor_noise_red
        base_orange = 25.0 + 20.0 * ((1.0 - f_norm) ** 1.1) + rng.normal(0, 4, size=total_rows)
        base_yellow = 20.0 + 18.0 * ((1.0 - f_norm) ** 1.1) + rng.normal(0, 3, size=total_rows)
        base_green = 15.0 + 12.0 * (f_norm ** 0.6) + rng.normal(0, 3, size=total_rows)
        base_blue = 20.0 + 15.0 * (f_norm ** 0.6) + rng.normal(0, 3, size=total_rows)

    elif commodity == "bitter_gourd":
        # Bitter gourd: Extreme chlorophyll absorption in Red (very low Red ~5-15), high NIR
        base_nir = 220.0 + 380.0 * (f_norm ** 0.75) + bias_nir_expanded + spatial_noise_nir + sensor_noise_nir
        base_red = 45.0 - 38.0 * (f_norm ** 0.95) + bias_red_expanded + spatial_noise_red + sensor_noise_red
        base_orange = 15.0 + 50.0 * ((1.0 - f_norm) ** 1.5) + rng.normal(0, 5, size=total_rows) # intense yellowing on rot
        base_yellow = 20.0 + 70.0 * ((1.0 - f_norm) ** 1.5) + rng.normal(0, 6, size=total_rows)
        base_green = 25.0 + 55.0 * (f_norm ** 0.8) + rng.normal(0, 5, size=total_rows)
        base_blue = 15.0 + 25.0 * (f_norm ** 0.7) + rng.normal(0, 3, size=total_rows)

    else:
        # Generic / Chilli / Peas fallback
        base_nir = 250.0 + 400.0 * (f_norm ** 0.8) + bias_nir_expanded + spatial_noise_nir + sensor_noise_nir
        base_red = 60.0 - 45.0 * (f_norm ** 0.85) + bias_red_expanded + spatial_noise_red + sensor_noise_red
        base_orange = 30.0 + rng.normal(0, 5, size=total_rows)
        base_yellow = 35.0 + rng.normal(0, 5, size=total_rows)
        base_green = 30.0 + 40.0 * (f_norm ** 0.7) + rng.normal(0, 5, size=total_rows)
        base_blue = 20.0 + 20.0 * (f_norm ** 0.6) + rng.normal(0, 4, size=total_rows)

    # Physical clipping: ensure reflectances are strictly positive
    red = np.clip(np.round(base_red, 2), 3.0, 300.0)
    nir = np.clip(np.round(base_nir, 2), 25.0, 950.0)
    blue = np.clip(np.round(base_blue, 2), 2.0, 200.0)
    green = np.clip(np.round(base_green, 2), 2.0, 250.0)
    yellow = np.clip(np.round(base_yellow, 2), 2.0, 250.0)
    orange = np.clip(np.round(base_orange, 2), 2.0, 280.0)

    # 5. Deterministic Vegetation Indices
    ndvi = np.round((nir - red) / (nir + red), 4)
    gndvi = np.round((nir - green) / (nir + green), 4)
    rvi = np.round(nir / np.maximum(red, 0.1), 4)

    # 6. Observed Freshness Score (True Freshness + Sensor Reading Gaussian Noise)
    # Calibrated to real variance (~sigma = 4.0 - 7.0)
    reading_noise = rng.normal(0.0, 5.5, size=total_rows)
    observed_score = np.clip(np.round(f_true_expanded + reading_noise, 2), 0.0, 100.0)

    # 7. Clean Ground-Truth Category mapped from True Biological Freshness F_true
    # (Adheres to the noise-cleaning discovery in summary.md Section 6)
    categories = np.where(f_true_expanded >= 60.0, "Fresh", np.where(f_true_expanded >= 40.0, "Aging", "Spoiling"))
    maturity = np.where(f_true_expanded >= 75.0, "Optimal", np.where(f_true_expanded >= 60.0, "Mature", np.where(f_true_expanded >= 40.0, "Ripe_Aging", "Overripe_Spoiling")))

    df = pd.DataFrame({
        "Commodity": commodity,
        "Specimen_ID": specimen_ids,
        "Specimen_Position": positions,
        "Blue": blue,
        "Green": green,
        "Yellow": yellow,
        "Orange": orange,
        "Red": red,
        "NIR": nir,
        "NDVI": ndvi,
        "GNDVI": gndvi,
        "RVI": rvi,
        "Freshness_Score": observed_score,
        "Freshness_Category": categories,
        "Maturity_Stage": maturity,
        "Condition": "Calibrated_Synthetic",
        "Data_Source": "synthetic",
        "Dataset_Version": DATASET_VERSION,
    })
    return df


def generate_commodity_dataset(commodity: str, target_rows: int = 10_000_000, chunk_size: int = 1_000_000, seed: int = 42):
    print(f"\n=======================================================")
    print(f"Generating 10M Dataset for: {commodity.upper()}")
    print(f"Target Rows: {target_rows:,} | Chunk Size: {chunk_size:,} | Seed: {seed}")
    print(f"=======================================================")

    profiles = load_calibration_profiles()
    if commodity not in profiles:
        raise ValueError(f"Commodity '{commodity}' not found in calibration profiles. Available: {list(profiles.keys())}")

    calib = profiles[commodity]
    commodity_dir = OUTPUT_BASE_DIR / commodity
    train_dir = commodity_dir / "train"
    train_dir.mkdir(parents=True, exist_ok=True)

    rng = np.random.default_rng(seed)
    positions_per_specimen = 10
    total_specimens_target = target_rows // positions_per_specimen
    specimens_per_chunk = chunk_size // positions_per_specimen
    n_chunks = target_rows // chunk_size

    start_time = time.time()
    total_generated = 0

    manifest = {
        "commodity": commodity,
        "dataset_version": DATASET_VERSION,
        "generator_version": GENERATOR_VERSION,
        "target_rows": target_rows,
        "chunk_size": chunk_size,
        "chunks_count": n_chunks,
        "seed": seed,
        "positions_per_specimen": positions_per_specimen,
        "chunks": []
    }

    first_chunk_df = None

    for chunk_idx in range(n_chunks):
        chunk_start_time = time.time()
        start_specimen_id = (chunk_idx * specimens_per_chunk) + 1

        df_chunk = generate_specimen_batch(
            commodity=commodity,
            n_specimens=specimens_per_chunk,
            positions_per_specimen=positions_per_specimen,
            start_specimen_id=start_specimen_id,
            calib_profile=calib,
            rng=rng
        )

        chunk_filename = f"part_{chunk_idx:03d}.parquet"
        chunk_path = train_dir / chunk_filename
        df_chunk.to_parquet(str(chunk_path), compression="snappy", index=False)

        chunk_duration = time.time() - chunk_start_time
        file_size_mb = chunk_path.stat().st_size / (1024 * 1024)
        total_generated += len(df_chunk)

        manifest["chunks"].append({
            "chunk_idx": chunk_idx,
            "filename": chunk_filename,
            "rows": len(df_chunk),
            "size_mb": round(file_size_mb, 2),
            "generation_time_sec": round(chunk_duration, 2)
        })

        if chunk_idx == 0:
            first_chunk_df = df_chunk

        print(f"  [Chunk {chunk_idx + 1}/{n_chunks}] Wrote {len(df_chunk):,} rows to {chunk_filename} ({file_size_mb:.1f} MB in {chunk_duration:.2f}s) | Progress: {total_generated:,}/{target_rows:,}")

    # Export a 100k sample CSV for immediate inspection and spreadsheet compatibility
    sample_csv_path = commodity_dir / f"{commodity}_sample_100k.csv"
    if first_chunk_df is not None:
        first_chunk_df.head(100_000).to_csv(str(sample_csv_path), index=False)
        print(f"  [OK] Exported 100k CSV inspection sample to {sample_csv_path}")

    # Write Manifest
    manifest["total_rows_generated"] = total_generated
    manifest["total_time_seconds"] = round(time.time() - start_time, 2)
    manifest_path = commodity_dir / "dataset_manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    total_time = time.time() - start_time
    print(f"  [OK] Completed {commodity.upper()} 10M dataset in {total_time:.2f}s ({total_generated:,} rows total).")
    print(f"  [OK] Manifest written to {manifest_path}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate 10M row synthetic dataset for a commodity")
    parser.add_argument("--commodity", type=str, required=True, help="Canonical commodity name (carrot, brinjal, green_brinjal, beetroot, bitter_gourd)")
    parser.add_argument("--rows", type=int, default=10_000_000, help="Number of rows to generate (default: 10,000,000)")
    parser.add_argument("--chunk-size", type=int, default=1_000_000, help="Rows per chunk (default: 1,000,000)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    args = parser.parse_args()

    generate_commodity_dataset(
        commodity=args.commodity,
        target_rows=args.rows,
        chunk_size=args.chunk_size,
        seed=args.seed
    )

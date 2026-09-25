"""
generate_all_commodities.py
Orchestrates generation of 10,000,000-row synthetic datasets across all target canonical commodities:
- Carrot
- Brinjal
- Green Brinjal
- Beetroot
- Bitter Gourd
"""
import sys
import time
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from generate_commodity_dataset import generate_commodity_dataset

TARGET_COMMODITIES = [
    "carrot",
    "brinjal",
    "green_brinjal",
    "beetroot",
    "bitter_gourd",
]


def run_all(target_rows: int = 10_000_000, chunk_size: int = 1_000_000, seed: int = 42):
    print("================================================================================")
    print("      VEG QX — 10 MILLION SYNTHETIC DATASET GENERATION FACTORY")
    print(f"      Target Commodities: {', '.join(TARGET_COMMODITIES).upper()}")
    print(f"      Rows Per Commodity: {target_rows:,} | Chunk Size: {chunk_size:,}")
    print("================================================================================\n")

    overall_start = time.time()

    for idx, commodity in enumerate(TARGET_COMMODITIES, 1):
        print(f"\n>>> [{idx}/{len(TARGET_COMMODITIES)}] Starting dataset generation for {commodity.upper()}...")
        c_start = time.time()
        generate_commodity_dataset(
            commodity=commodity,
            target_rows=target_rows,
            chunk_size=chunk_size,
            seed=seed + idx * 100
        )
        c_dur = time.time() - c_start
        print(f">>> Finished {commodity.upper()} in {c_dur:.2f} seconds.\n")

    overall_dur = time.time() - overall_start
    print("================================================================================")
    print(f"  [ALL DONE] All {len(TARGET_COMMODITIES)} commodities generated in {overall_dur:.2f} seconds ({overall_dur/60:.2f} min).")
    print(f"  Total Rows Generated: {len(TARGET_COMMODITIES) * target_rows:,}")
    print("================================================================================")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--rows", type=int, default=10_000_000)
    parser.add_argument("--chunk-size", type=int, default=1_000_000)
    args = parser.parse_args()

    run_all(target_rows=args.rows, chunk_size=args.chunk_size)

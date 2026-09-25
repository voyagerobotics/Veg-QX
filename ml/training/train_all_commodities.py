"""
train_all_commodities.py
Master training pipeline orchestrator.
Trains and benchmarks all target commodities sequentially:
- Carrot
- Brinjal
- Green Brinjal
- Beetroot
- Bitter Gourd
Generates Model Cards, validation reports, and registers models in SQLite.
"""
import sys
import time
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
training_dir = Path(__file__).resolve().parent
if str(training_dir) not in sys.path:
    sys.path.insert(0, str(training_dir))

from train_commodity import train_and_benchmark
from ml.dataset_generation.validate_synthetic_data import validate_commodity_dataset

TARGET_COMMODITIES = [
    "carrot",
    "brinjal",
    "green_brinjal",
    "beetroot",
    "bitter_gourd",
]


def run_pipeline_for_all(samples: int = 500_000, seed: int = 42):
    print("================================================================================")
    print("         VEG QX MULTI-COMMODITY MODEL FACTORY & VALIDATION PIPELINE")
    print(f"         Target Commodities: {', '.join(TARGET_COMMODITIES).upper()}")
    print("================================================================================\n")

    t_start = time.time()
    all_summary = {}

    for idx, commodity in enumerate(TARGET_COMMODITIES, 1):
        print(f"\n>>>>>>>>>>>>>>> [{idx}/{len(TARGET_COMMODITIES)}] PROCESSING {commodity.upper()} <<<<<<<<<<<<<<<")

        # 1. Validate Dataset & Distribution Match
        print(f"Step 1: Validating synthetic dataset quality for {commodity}...")
        val_res = validate_commodity_dataset(commodity)

        # 2. Train, Benchmark & Package Model
        print(f"Step 2: Training and benchmarking models for {commodity}...")
        meta = train_and_benchmark(commodity, train_samples=samples, seed=seed)

        all_summary[commodity] = {
            "validation_passed": val_res["validation_suite"]["passed"],
            "regressor": meta["regressor_algorithm"],
            "classifier": meta["classifier_algorithm"],
            "regression_r2": meta["regression_r2"],
            "classification_accuracy": meta["classification_accuracy"],
            "macro_f1": meta["macro_f1"],
            "real_holdout": meta["real_holdout_metrics"]
        }

    total_duration = time.time() - t_start

    print("\n================================================================================")
    print("                      ALL COMMODITIES TRAINING SUMMARY")
    print("================================================================================")
    print(f"{'Commodity':<16} | {'Best Regressor':<12} | {'R²':<7} | {'Best Classifier':<14} | {'Accuracy':<8} | {'Macro F1':<8}")
    print("-" * 75)
    for comm, s in all_summary.items():
        print(f"{comm:<16} | {s['regressor']:<12} | {s['regression_r2']:<7.4f} | {s['classifier']:<14} | {s['classification_accuracy']*100:<7.2f}% | {s['macro_f1']:<8.4f}")
    print("================================================================================")
    print(f"Total Factory Execution Time: {total_duration:.2f} seconds ({total_duration/60:.2f} minutes)\n")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--samples", type=int, default=500_000)
    args = parser.parse_args()
    run_pipeline_for_all(samples=args.samples)

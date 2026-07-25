"""
services/database_service.py
SQLite CRUD operations. Every prediction is written to both SQLite and CSV (dual storage).
"""
import sqlite3
import csv
import os
from pathlib import Path
from datetime import datetime
from contextlib import contextmanager
from typing import Optional

from config import (
    PREDICTION_HISTORY_DB,
    PREDICTION_HISTORY_CSV,
    VERIFIED_DATASET_CSV,
)

SCHEMA_PATH = Path(__file__).parent.parent / "database" / "schema.sql"


# ─── Connection ───────────────────────────────────────────────────────────────

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(PREDICTION_HISTORY_DB))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


@contextmanager
def db_context():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_database():
    """Create all tables if they don't exist. Run once on startup."""
    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
    with db_context() as conn:
        conn.executescript(schema_sql)
    # Ensure CSV headers exist
    _ensure_prediction_csv_header()
    _ensure_verified_csv_header()


# ─── Prediction CRUD ─────────────────────────────────────────────────────────

def save_prediction(data: dict) -> int:
    """
    Insert a prediction record into SQLite and append to CSV.
    Returns the new row ID.
    """
    sql = """
    INSERT INTO predictions (
        timestamp, food_type, tomato_id, position,
        blue, green, yellow, orange, red, nir,
        ndvi, gndvi, rvi,
        freshness_score, category,
        confidence_fresh, confidence_aging, confidence_spoiling,
        model_version, input_source
    ) VALUES (
        :timestamp, :food_type, :tomato_id, :position,
        :blue, :green, :yellow, :orange, :red, :nir,
        :ndvi, :gndvi, :rvi,
        :freshness_score, :category,
        :confidence_fresh, :confidence_aging, :confidence_spoiling,
        :model_version, :input_source
    )
    """
    row = {
        "timestamp":            data.get("timestamp", datetime.utcnow().isoformat()),
        "food_type":            data.get("food_type", "tomato"),
        "tomato_id":            data.get("tomato_id"),
        "position":             data.get("position"),
        "blue":                 data.get("Blue"),
        "green":                data.get("Green"),
        "yellow":               data.get("Yellow"),
        "orange":               data.get("Orange"),
        "red":                  data.get("Red"),
        "nir":                  data.get("NIR"),
        "ndvi":                 data.get("NDVI"),
        "gndvi":                data.get("GNDVI"),
        "rvi":                  data.get("RVI"),
        "freshness_score":      data.get("freshness_score"),
        "category":             data.get("category"),
        "confidence_fresh":     data.get("confidence_fresh"),
        "confidence_aging":     data.get("confidence_aging"),
        "confidence_spoiling":  data.get("confidence_spoiling"),
        "model_version":        data.get("model_version"),
        "input_source":         data.get("input_source", "manual"),
    }
    with db_context() as conn:
        cursor = conn.execute(sql, row)
        row_id = cursor.lastrowid

    # Dual-write to CSV
    _append_prediction_csv({**row, "id": row_id})
    return row_id


def get_prediction_history(
    food_type: str = "tomato",
    limit: int = 100,
    offset: int = 0,
    category: Optional[str] = None,
) -> list[dict]:
    filters = ["food_type = :food_type"]
    params: dict = {"food_type": food_type, "limit": limit, "offset": offset}

    if category:
        filters.append("category = :category")
        params["category"] = category

    where = " AND ".join(filters)
    sql = f"""
    SELECT * FROM predictions
    WHERE {where}
    ORDER BY timestamp DESC
    LIMIT :limit OFFSET :offset
    """
    with db_context() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [dict(r) for r in rows]


def get_prediction_count(food_type: str = "tomato") -> int:
    with db_context() as conn:
        row = conn.execute(
            "SELECT COUNT(*) as cnt FROM predictions WHERE food_type = ?", (food_type,)
        ).fetchone()
    return row["cnt"]


def get_prediction_by_id(prediction_id: int) -> Optional[dict]:
    with db_context() as conn:
        row = conn.execute(
            "SELECT * FROM predictions WHERE id = ?", (prediction_id,)
        ).fetchone()
    return dict(row) if row else None


# ─── Verification ─────────────────────────────────────────────────────────────

def save_verification(prediction_id: int, actual_category: str,
                      actual_freshness: Optional[float] = None,
                      notes: Optional[str] = None) -> int:
    sql = """
    INSERT INTO verified_predictions (prediction_id, actual_category, actual_freshness_score, notes)
    VALUES (?, ?, ?, ?)
    """
    with db_context() as conn:
        cursor = conn.execute(sql, (prediction_id, actual_category, actual_freshness, notes))
        row_id = cursor.lastrowid

    # Get original prediction for CSV
    pred = get_prediction_by_id(prediction_id)
    if pred:
        _append_verified_csv({
            **pred,
            "actual_category": actual_category,
            "actual_freshness_score": actual_freshness,
            "verified_at": datetime.utcnow().isoformat(),
            "notes": notes,
        })
    return row_id


def get_verified_count() -> int:
    with db_context() as conn:
        row = conn.execute("SELECT COUNT(*) as cnt FROM verified_predictions").fetchone()
    return row["cnt"]


# ─── Model Versions ───────────────────────────────────────────────────────────

def get_all_model_versions() -> list[dict]:
    with db_context() as conn:
        rows = conn.execute(
            "SELECT * FROM model_versions ORDER BY trained_at DESC"
        ).fetchall()
    return [dict(r) for r in rows]


def get_active_model_version() -> Optional[dict]:
    with db_context() as conn:
        row = conn.execute(
            "SELECT * FROM model_versions WHERE is_active = 1 LIMIT 1"
        ).fetchone()
    return dict(row) if row else None


def upsert_model_version(version_data: dict) -> None:
    """Insert or update a model version record, setting it as active."""
    with db_context() as conn:
        # Deactivate all existing
        conn.execute("UPDATE model_versions SET is_active = 0")
        conn.execute("""
        INSERT INTO model_versions (
            version, food_type, training_samples,
            classification_accuracy, regression_r2, mae, rmse,
            is_active, pkl_path, notes
        ) VALUES (
            :version, :food_type, :training_samples,
            :classification_accuracy, :regression_r2, :mae, :rmse,
            1, :pkl_path, :notes
        )
        ON CONFLICT(version) DO UPDATE SET
            classification_accuracy = excluded.classification_accuracy,
            regression_r2           = excluded.regression_r2,
            is_active               = 1,
            trained_at              = datetime('now')
        """, version_data)


# ─── Analytics ────────────────────────────────────────────────────────────────

def get_analytics_summary(food_type: str = "tomato") -> dict:
    with db_context() as conn:
        # Total predictions
        total = conn.execute(
            "SELECT COUNT(*) as cnt FROM predictions WHERE food_type = ?", (food_type,)
        ).fetchone()["cnt"]

        # Category distribution
        dist = conn.execute("""
            SELECT category, COUNT(*) as cnt
            FROM predictions WHERE food_type = ?
            GROUP BY category
        """, (food_type,)).fetchall()

        # Average freshness
        avg_row = conn.execute("""
            SELECT AVG(freshness_score) as avg_score
            FROM predictions WHERE food_type = ?
        """, (food_type,)).fetchone()

        # Trend (last 50)
        trend = conn.execute("""
            SELECT timestamp, freshness_score, category
            FROM predictions
            WHERE food_type = ?
            ORDER BY timestamp DESC
            LIMIT 50
        """, (food_type,)).fetchall()

    category_dist = {r["category"]: r["cnt"] for r in dist}
    return {
        "total_predictions": total,
        "category_distribution": category_dist,
        "average_freshness_score": round(avg_row["avg_score"] or 0, 2),
        "fresh_count":    category_dist.get("Fresh", 0),
        "aging_count":    category_dist.get("Aging", 0),
        "spoiling_count": category_dist.get("Spoiling", 0),
        "trend": [dict(r) for r in trend],
    }


def log_retraining_run(data: dict) -> int:
    sql = """
    INSERT INTO retraining_runs (
        food_type, base_version, new_version, training_samples, verified_samples,
        new_accuracy, new_r2, performance_check_passed, deployed, notes
    ) VALUES (
        :food_type, :base_version, :new_version, :training_samples, :verified_samples,
        :new_accuracy, :new_r2, :performance_check_passed, :deployed, :notes
    )
    """
    with db_context() as conn:
        cursor = conn.execute(sql, data)
        return cursor.lastrowid


# ─── CSV Helpers ──────────────────────────────────────────────────────────────

_PREDICTION_CSV_HEADERS = [
    "id", "timestamp", "food_type", "tomato_id", "position",
    "blue", "green", "yellow", "orange", "red", "nir",
    "ndvi", "gndvi", "rvi",
    "freshness_score", "category",
    "confidence_fresh", "confidence_aging", "confidence_spoiling",
    "model_version", "input_source",
]

_VERIFIED_CSV_HEADERS = [
    "id", "timestamp", "food_type", "tomato_id", "position",
    "blue", "green", "yellow", "orange", "red", "nir",
    "ndvi", "gndvi", "rvi",
    "freshness_score", "category",
    "actual_category", "actual_freshness_score",
    "model_version", "verified_at", "notes",
]


def _ensure_prediction_csv_header():
    if not PREDICTION_HISTORY_CSV.exists():
        with open(PREDICTION_HISTORY_CSV, "w", newline="", encoding="utf-8") as f:
            csv.DictWriter(f, fieldnames=_PREDICTION_CSV_HEADERS).writeheader()


def _ensure_verified_csv_header():
    if not VERIFIED_DATASET_CSV.exists():
        with open(VERIFIED_DATASET_CSV, "w", newline="", encoding="utf-8") as f:
            csv.DictWriter(f, fieldnames=_VERIFIED_CSV_HEADERS).writeheader()


def _append_prediction_csv(row: dict):
    with open(PREDICTION_HISTORY_CSV, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=_PREDICTION_CSV_HEADERS, extrasaction="ignore")
        writer.writerow(row)


def _append_verified_csv(row: dict):
    with open(VERIFIED_DATASET_CSV, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=_VERIFIED_CSV_HEADERS, extrasaction="ignore")
        writer.writerow(row)

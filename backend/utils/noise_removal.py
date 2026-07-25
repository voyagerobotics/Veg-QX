"""
utils/noise_removal.py
Average-based noise removal for incoming datasets.
Cancels out Gaussian sensor noise (~±8 points) by averaging
all 10 position readings per Tomato_ID, then re-assigns
the Category label using true tomato-level threshold points.
"""
import pandas as pd


def remove_label_noise(
    df: pd.DataFrame,
    spoiling_threshold: float = 40.0,
    aging_threshold: float = 60.0,
    tomato_id_col: str = "Tomato_ID",
    freshness_col: str = "Freshness_",
    category_col: str = "Category",
) -> pd.DataFrame:
    """
    Removes sensor noise from the Category labels by:
    1. Averaging freshness scores per Tomato_ID (cancels zero-mean Gaussian noise).
    2. Re-assigning Category based on true threshold boundaries.
    """
    df = df.copy()

    # Step 1: Average freshness per tomato
    tomato_avg = (
        df.groupby(tomato_id_col)[freshness_col]
        .mean()
        .reset_index()
        .rename(columns={freshness_col: "Avg_Freshness"})
    )

    # Step 2: Map to clean category using true thresholds
    def _map_category(avg_score: float) -> str:
        if avg_score < spoiling_threshold:
            return "Spoiling"
        elif avg_score < aging_threshold:
            return "Aging"
        else:
            return "Fresh"

    tomato_avg["Clean_Category"] = tomato_avg["Avg_Freshness"].apply(_map_category)

    # Step 3: Merge clean labels back to all rows
    df = df.merge(
        tomato_avg[[tomato_id_col, "Clean_Category"]],
        on=tomato_id_col,
        how="left",
    )
    df[category_col] = df["Clean_Category"]
    df.drop(columns=["Clean_Category"], inplace=True)

    return df


def get_noise_removal_stats(df_original: pd.DataFrame, df_cleaned: pd.DataFrame) -> dict:
    """
    Returns statistics comparing original vs cleaned label distributions.
    """
    original_dist = df_original["Category"].value_counts().to_dict()
    cleaned_dist  = df_cleaned["Category"].value_counts().to_dict()
    changed_rows  = (df_original["Category"] != df_cleaned["Category"]).sum()

    return {
        "total_rows": len(df_original),
        "rows_relabeled": int(changed_rows),
        "relabeled_pct": round(changed_rows / len(df_original) * 100, 2),
        "original_distribution": original_dist,
        "cleaned_distribution": cleaned_dist,
    }

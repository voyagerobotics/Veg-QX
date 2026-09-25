# MODEL CARD: BRINJAL Freshness Detection System

**Commodity**: `brinjal`  
**Model Version**: `v1.0`  
**Model ID**: `veg_qx_brinjal_v1.0`  
**Trained Date**: `2026-09-23T15:22:20`  
**Organization**: Voyage Robotics  

---

## 1. Executive Summary & Algorithms
- **Selected Regressor**: `HistGradientBoosting` ($R^2 = 0.9380$, $\text{MAE} = 5.80$)
- **Selected Classifier**: `HistGradientBoosting` (Accuracy $= 92.53\%$, Macro-F1 $= 0.9062$)
- **Candidate Benchmarks Evaluated**: XGBoost, LightGBM, HistGradientBoosting.

---

## 2. Dataset & Splitting Strategy
- **Training Samples**: 70,000
- **Validation Samples**: 15,000
- **Synthetic Test Samples**: 15,000
- **Data Splitting**: Grouped by `Specimen_ID` (70% Train / 15% Val / 15% Test) ensuring **zero spatial leakage** across specimen observations.

---

## 3. Evaluation Metrics

### Synthetic Holdout Metrics
| Metric | Value |
| :--- | :--- |
| **Classification Accuracy** | `92.53%` |
| **Macro F1 Score** | `0.9062` |
| **Macro Precision** | `0.9057` |
| **Macro Recall** | `0.9067` |
| **Regression $R^2$** | `0.9380` |
| **Mean Absolute Error (MAE)** | `5.80` points |
| **Root Mean Squared Error (RMSE)** | `7.30` points |

### Confusion Matrix (Test Set)
Classes: `['Aging', 'Fresh', 'Spoiling']`
```json
[[2424, 275, 271], [327, 5503, 0], [248, 0, 5952]]
```

---

## 4. Real Laboratory Holdout Validation
- **Real Holdout Available**: `True`
- **Sample Count**: `7`
- **Mean Predicted Freshness**: `58.54`
- **Fresh/Aging Concordance**: `71.43%`
- **Category Predictions**: `{'Aging': 3, 'Spoiling': 2, 'Fresh': 2}`

---

## 5. Feature Importances
| Feature | Importance Gain |
| :--- | :--- |

---

## 6. Deployment & Registry Status
- **Status**: `ACTIVE`
- **Production Artifact**: `models/brinjal/brinjal_freshness_pipeline_v1.0.pkl`
- **Active Pointer**: `models/brinjal/brinjal_freshness_pipeline_active.pkl`

---
*VEG QX Automated Model Card — Voyage Robotics.*

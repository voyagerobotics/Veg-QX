# MODEL CARD: BITTER_GOURD Freshness Detection System

**Commodity**: `bitter_gourd`  
**Model Version**: `v1.0`  
**Model ID**: `veg_qx_bitter_gourd_v1.0`  
**Trained Date**: `2026-09-23T16:08:41`  
**Organization**: Voyage Robotics  

---

## 1. Executive Summary & Algorithms
- **Selected Regressor**: `XGBoost` ($R^2 = 0.9540$, $\text{MAE} = 4.99$)
- **Selected Classifier**: `XGBoost` (Accuracy $= 94.49\%$, Macro-F1 $= 0.9309$)
- **Candidate Benchmarks Evaluated**: XGBoost, LightGBM, HistGradientBoosting.

---

## 2. Dataset & Splitting Strategy
- **Training Samples**: 350,000
- **Validation Samples**: 75,000
- **Synthetic Test Samples**: 75,000
- **Data Splitting**: Grouped by `Specimen_ID` (70% Train / 15% Val / 15% Test) ensuring **zero spatial leakage** across specimen observations.

---

## 3. Evaluation Metrics

### Synthetic Holdout Metrics
| Metric | Value |
| :--- | :--- |
| **Classification Accuracy** | `94.49%` |
| **Macro F1 Score** | `0.9309` |
| **Macro Precision** | `0.9305` |
| **Macro Recall** | `0.9314` |
| **Regression $R^2$** | `0.9540` |
| **Mean Absolute Error (MAE)** | `4.99` points |
| **Root Mean Squared Error (RMSE)** | `6.25` points |

### Confusion Matrix (Test Set)
Classes: `['Aging', 'Fresh', 'Spoiling']`
```json
[[12886, 1120, 894], [1100, 28790, 0], [1022, 0, 29188]]
```

---

## 4. Real Laboratory Holdout Validation
- **Real Holdout Available**: `True`
- **Sample Count**: `1`
- **Mean Predicted Freshness**: `70.57`
- **Fresh/Aging Concordance**: `100.0%`
- **Category Predictions**: `{'Fresh': 1}`

---

## 5. Feature Importances
| Feature | Importance Gain |
| :--- | :--- |
| **Red** | `0.6359` |
| **NDVI** | `0.1684` |
| **RVI** | `0.1539` |
| **Yellow** | `0.0276` |
| **Green** | `0.0067` |
| **Orange** | `0.0051` |
| **Blue** | `0.0013` |
| **GNDVI** | `0.0008` |
| **NIR** | `0.0002` |

---

## 6. Deployment & Registry Status
- **Status**: `ACTIVE`
- **Production Artifact**: `models/bitter_gourd/bitter_gourd_freshness_pipeline_v1.0.pkl`
- **Active Pointer**: `models/bitter_gourd/bitter_gourd_freshness_pipeline_active.pkl`

---
*VEG QX Automated Model Card — Voyage Robotics.*

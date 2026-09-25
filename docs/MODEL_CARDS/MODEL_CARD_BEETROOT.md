# MODEL CARD: BEETROOT Freshness Detection System

**Commodity**: `beetroot`  
**Model Version**: `v1.0`  
**Model ID**: `veg_qx_beetroot_v1.0`  
**Trained Date**: `2026-09-23T16:07:43`  
**Organization**: Voyage Robotics  

---

## 1. Executive Summary & Algorithms
- **Selected Regressor**: `XGBoost` ($R^2 = 0.9247$, $\text{MAE} = 6.34$)
- **Selected Classifier**: `XGBoost` (Accuracy $= 89.73\%$, Macro-F1 $= 0.8715$)
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
| **Classification Accuracy** | `89.73%` |
| **Macro F1 Score** | `0.8715` |
| **Macro Precision** | `0.8706` |
| **Macro Recall** | `0.8724` |
| **Regression $R^2$** | `0.9247` |
| **Mean Absolute Error (MAE)** | `6.34` points |
| **Root Mean Squared Error (RMSE)** | `7.97` points |

### Confusion Matrix (Test Set)
Classes: `['Aging', 'Fresh', 'Spoiling']`
```json
[[11114, 1943, 1753], [2007, 28373, 0], [1999, 0, 27811]]
```

---

## 4. Real Laboratory Holdout Validation
- **Real Holdout Available**: `True`
- **Sample Count**: `6`
- **Mean Predicted Freshness**: `34.24`
- **Fresh/Aging Concordance**: `33.33%`
- **Category Predictions**: `{'Spoiling': 4, 'Aging': 1, 'Fresh': 1}`

---

## 5. Feature Importances
| Feature | Importance Gain |
| :--- | :--- |
| **RVI** | `0.4908` |
| **NDVI** | `0.4862` |
| **Yellow** | `0.0077` |
| **Red** | `0.0053` |
| **Orange** | `0.0037` |
| **Blue** | `0.0025` |
| **NIR** | `0.0016` |
| **Green** | `0.0015` |
| **GNDVI** | `0.0007` |

---

## 6. Deployment & Registry Status
- **Status**: `ACTIVE`
- **Production Artifact**: `models/beetroot/beetroot_freshness_pipeline_v1.0.pkl`
- **Active Pointer**: `models/beetroot/beetroot_freshness_pipeline_active.pkl`

---
*VEG QX Automated Model Card — Voyage Robotics.*

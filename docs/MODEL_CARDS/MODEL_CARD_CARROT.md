# MODEL CARD: CARROT Freshness Detection System

**Commodity**: `carrot`  
**Model Version**: `v1.0`  
**Model ID**: `veg_qx_carrot_v1.0`  
**Trained Date**: `2026-09-23T15:20:34`  
**Organization**: Voyage Robotics  

---

## 1. Executive Summary & Algorithms
- **Selected Regressor**: `XGBoost` ($R^2 = 0.9424$, $\text{MAE} = 5.50$)
- **Selected Classifier**: `XGBoost` (Accuracy $= 92.35\%$, Macro-F1 $= 0.9060$)
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
| **Classification Accuracy** | `92.35%` |
| **Macro F1 Score** | `0.9060` |
| **Macro Precision** | `0.9050` |
| **Macro Recall** | `0.9070` |
| **Regression $R^2$** | `0.9424` |
| **Mean Absolute Error (MAE)** | `5.50` points |
| **Root Mean Squared Error (RMSE)** | `6.89` points |

### Confusion Matrix (Test Set)
Classes: `['Aging', 'Fresh', 'Spoiling']`
```json
[[2514, 311, 235], [331, 5739, 0], [271, 0, 5599]]
```

---

## 4. Real Laboratory Holdout Validation
- **Real Holdout Available**: `True`
- **Sample Count**: `3`
- **Mean Predicted Freshness**: `29.15`
- **Fresh/Aging Concordance**: `0.0%`
- **Category Predictions**: `{'Spoiling': 3}`

---

## 5. Feature Importances
| Feature | Importance Gain |
| :--- | :--- |
| **NIR** | `0.4132` |
| **Orange** | `0.3357` |
| **RVI** | `0.1917` |
| **Yellow** | `0.0368` |
| **NDVI** | `0.0097` |
| **Green** | `0.0071` |
| **Blue** | `0.0044` |
| **GNDVI** | `0.0008` |
| **Red** | `0.0007` |

---

## 6. Deployment & Registry Status
- **Status**: `ACTIVE`
- **Production Artifact**: `models/carrot/carrot_freshness_pipeline_v1.0.pkl`
- **Active Pointer**: `models/carrot/carrot_freshness_pipeline_active.pkl`

---
*VEG QX Automated Model Card — Voyage Robotics.*

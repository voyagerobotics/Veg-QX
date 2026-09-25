# MODEL CARD: GREEN_BRINJAL Freshness Detection System

**Commodity**: `green_brinjal`  
**Model Version**: `v1.0`  
**Model ID**: `veg_qx_green_brinjal_v1.0`  
**Trained Date**: `2026-09-23T15:22:37`  
**Organization**: Voyage Robotics  

---

## 1. Executive Summary & Algorithms
- **Selected Regressor**: `XGBoost` ($R^2 = 0.9398$, $\text{MAE} = 5.65$)
- **Selected Classifier**: `XGBoost` (Accuracy $= 91.44\%$, Macro-F1 $= 0.8921$)
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
| **Classification Accuracy** | `91.44%` |
| **Macro F1 Score** | `0.8921` |
| **Macro Precision** | `0.8889` |
| **Macro Recall** | `0.8960` |
| **Regression $R^2$** | `0.9398` |
| **Mean Absolute Error (MAE)** | `5.65` points |
| **Root Mean Squared Error (RMSE)** | `7.10` points |

### Confusion Matrix (Test Set)
Classes: `['Aging', 'Fresh', 'Spoiling']`
```json
[[2316, 255, 289], [386, 5704, 0], [354, 0, 5696]]
```

---

## 4. Real Laboratory Holdout Validation
- **Real Holdout Available**: `True`
- **Sample Count**: `4`
- **Mean Predicted Freshness**: `53.94`
- **Fresh/Aging Concordance**: `75.0%`
- **Category Predictions**: `{'Fresh': 3, 'Spoiling': 1}`

---

## 5. Feature Importances
| Feature | Importance Gain |
| :--- | :--- |
| **RVI** | `0.6072` |
| **NDVI** | `0.3721` |
| **Green** | `0.0078` |
| **NIR** | `0.0057` |
| **Blue** | `0.0025` |
| **Yellow** | `0.0022` |
| **Orange** | `0.0011` |
| **Red** | `0.0007` |
| **GNDVI** | `0.0007` |

---

## 6. Deployment & Registry Status
- **Status**: `ACTIVE`
- **Production Artifact**: `models/green_brinjal/green_brinjal_freshness_pipeline_v1.0.pkl`
- **Active Pointer**: `models/green_brinjal/green_brinjal_freshness_pipeline_active.pkl`

---
*VEG QX Automated Model Card — Voyage Robotics.*

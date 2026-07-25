# 🍅 Tomato Freshness Detection System

> **Non-destructive quality estimation of tomatoes** using multispectral reflectance sensing, XGBoost ML models, a FastAPI backend, and a Next.js frontend dashboard.

---

## 📐 Architecture Overview

```
AS7341 Sensor (ESP32)
       │  HTTP POST JSON
       ▼
┌─────────────────────┐        ┌──────────────────────────┐
│  FastAPI Backend    │◄──────►│   Next.js Frontend       │
│  (Python · Port 8000)│       │   (TypeScript · Port 3000)│
│                     │        │                          │
│  • /predict         │        │  • Dashboard             │
│  • /sensor (WS)     │        │  • Real-time Inference   │
│  • /upload          │        │  • Analytics             │
│  • /history         │        │  • Model Management      │
│  • /retrain         │        │  • Retraining Hub        │
│  • /analytics       │        │  • History / Verify      │
└──────┬──────────────┘        └──────────────────────────┘
       │ loads .pkl
       ▼
┌─────────────────────┐
│  ML Models (XGBoost)│
│  models/            │
│  └─ pipeline v1.1   │ ← Active (81.24% acc · R² 0.9947)
└─────────────────────┘
```

---

## 🗂️ Project Structure

```
ml model/
├── README.md                              ← You are here
├── summary.md                             ← Full technical reference
├── retrain_clean_model.py                 ← Standalone noise-removal + retrain script
├── tomato_freshness_ml_pipeline.ipynb     ← End-to-end Jupyter ML pipeline (14 phases)
│
├── Tomato_Multispectral_Realistic_100k.csv   ← Primary reference dataset (100k rows)
├── Tomato_dataset 3.csv                      ← Second dataset for retraining
│
├── models/                                ← Serialized ML pipelines
│   ├── tomato_freshness_pipeline_v1.pkl   ← v1.0 (archived)
│   ├── tomato_freshness_pipeline_v1.1.pkl ← v1.1 (ACTIVE)
│   ├── xgboost_regressor.pkl              ← Production regressor
│   └── xgboost_classifier.pkl            ← Production classifier
│
├── backend/                               ← FastAPI Python backend
│   ├── main.py                            ← App entrypoint (runs on port 8000)
│   ├── config.py                          ← Paths, CORS, food configs, serial settings
│   ├── requirements.txt                   ← Python dependencies
│   ├── routers/                           ← API route handlers
│   ├── services/                          ← Business logic (inference, DB, sensor)
│   ├── models/                            ← Pydantic schemas
│   ├── utils/                             ← Helpers
│   └── database/                          ← SQLite init & queries
│
├── frontend/                              ← Next.js 15 TypeScript frontend
│   ├── app/                               ← App Router pages
│   │   ├── page.tsx                       ← Landing page
│   │   ├── dashboard/                     ← Main dashboard
│   │   ├── predict/                       ← Real-time inference UI
│   │   ├── analytics/                     ← Performance analytics
│   │   ├── history/                       ← Prediction history
│   │   ├── verify/                        ← Data verification
│   │   ├── models/                        ← Model versioning info
│   │   └── retrain/                       ← Continuous learning hub
│   ├── components/                        ← Reusable React components
│   ├── lib/                               ← API client utilities
│   └── package.json
│
├── datasets/                              ← Auto-created at runtime
│   ├── prediction_history.csv
│   ├── prediction_history.db              ← SQLite database
│   └── verified_dataset.csv
│
├── analytics/                             ← Auto-created at runtime
└── retraining/                            ← Auto-created at runtime
```

---

## ✅ Prerequisites

| Requirement | Version | Notes |
|:---|:---|:---|
| **Python** | 3.10 or 3.11 | 3.12+ may have XGBoost compatibility issues |
| **Node.js** | 18+ | LTS recommended |
| **npm** | 9+ | Comes with Node.js |

---

## 🚀 Quick Start — Running the Project

The project has **two separate servers** that must both be running.

### Terminal 1 — Backend (FastAPI)

```bash
# 1. Navigate to the backend folder
cd "d:\voyage robotics VEG QX\ml model\backend"

# 2. (First time only) Create a virtual environment
python -m venv venv

# 3. Activate the virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows CMD:
.\venv\Scripts\activate.bat

# 4. (First time only) Install dependencies
pip install -r requirements.txt

# 5. Start the backend server
python main.py
```

The backend will start at **http://127.0.0.1:8000**

> **✔ Success output:**
> ```
> 🚀 Tomato Freshness API starting up...
>   Initializing SQLite database & CSV files...
>   Preloading best active ML pipeline...
>   ✔ Model version 1.1 loaded successfully.
> 🚀 Startup complete. API is ready.
> ```

---

### Terminal 2 — Frontend (Next.js)

```bash
# 1. Navigate to the frontend folder
cd "d:\voyage robotics VEG QX\ml model\frontend"

# 2. (First time only) Install Node dependencies
npm install

# 3. Start the dev server
npm run dev
```

The frontend will start at **http://localhost:3000**

---

### Open in Browser

| URL | What it is |
|:---|:---|
| http://localhost:3000 | 🌐 Main Web Application |
| http://127.0.0.1:8000 | ⚙️ FastAPI root (status check) |
| http://127.0.0.1:8000/docs | 📋 Interactive Swagger API docs |
| http://127.0.0.1:8000/redoc | 📘 ReDoc API documentation |

---

## 🔌 ESP32 / Hardware Sensor Setup

The backend listens for real sensor data over **Serial (USB)** and/or **WebSocket**.

| Setting | Value |
|:---|:---|
| **Preferred COM Port** | `COM8` (configurable in `config.py`) |
| **Baud Rate** | `115200` |
| **Auto-Scan** | Enabled (scans all available COM ports if COM8 is unavailable) |

To change the COM port, edit `backend/config.py`:
```python
SERIAL_PREFERRED_PORT = "COM8"   # ← Change to your ESP32 port
```

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/` | API status |
| `GET` | `/health` | Health check |
| `POST` | `/predict` | Single or batch prediction from JSON spectral data |
| `POST` | `/upload` | Upload CSV for batch inference |
| `GET` | `/history` | Fetch prediction history |
| `POST` | `/verify` | Submit a verification label for a prediction |
| `GET/WS` | `/sensor` | Real-time ESP32 sensor data stream (WebSocket) |
| `GET` | `/models` | List available model versions + metadata |
| `GET` | `/analytics` | Performance analytics data |
| `POST` | `/retrain` | Trigger retraining with a new dataset |

Full interactive documentation: **http://127.0.0.1:8000/docs**

---

## 🧠 ML Model Details

### Input Features (9 total)

| Feature | Type | Description |
|:---|:---|:---|
| `Blue` | float | Spectral reflectance ~415–480 nm |
| `Green` | float | Spectral reflectance ~510–555 nm |
| `Yellow` | float | Spectral reflectance ~590 nm |
| `Orange` | float | Spectral reflectance ~630 nm |
| `Red` | float | Spectral reflectance ~680 nm |
| `NIR` | float | Near-Infrared ~910 nm |
| `NDVI` | float | `(NIR - Red) / (NIR + Red)` — auto-computed |
| `GNDVI` | float | `(NIR - Green) / (NIR + Green)` — auto-computed |
| `RVI` | float | `NIR / Red` — auto-computed |

> **Note:** NDVI, GNDVI, and RVI are **computed automatically** by the backend from the 6 raw bands. You only need to send the raw bands.

### Model Outputs

| Output | Type | Description |
|:---|:---|:---|
| `freshness_score` | float (0–100) | Continuous freshness estimate |
| `category` | string | `Fresh` · `Aging` · `Spoiling` |
| `confidence` | float (0–1) | Class probability |

### Freshness Thresholds

| Category | True Freshness Score |
|:---|:---|
| 🟢 **Fresh** | ≥ 60 |
| 🟡 **Aging** | 40 – 59.9 |
| 🔴 **Spoiling** | < 40 |

### Active Model Performance (v1.1)

| Metric | Value |
|:---|:---|
| Classification Accuracy | **81.24%** |
| Regression R² | **0.9947** |
| Training Data | 200,000 rows (reference + cleaned Dataset 3) |

---

## 🔁 Retraining a New Model

### Option A — Via the Web UI

1. Open http://localhost:3000/retrain
2. Upload a new CSV file with the required schema
3. Click **Start Retraining** — the backend handles noise removal, drift detection, training, and deployment automatically.

### Option B — Standalone Script

```bash
# From the ml model/ root directory
cd "d:\voyage robotics VEG QX\ml model"
python retrain_clean_model.py
```

This script runs two phases:
1. **Phase 1 (Noise Removal)**: Averages 10 readings per `Tomato_ID` to cancel sensor noise, then re-assigns `Category` labels using true thresholds.
2. **Phase 2 (Retraining)**: Loads the best active pipeline, trains on the 200k combined dataset, and only deploys a new version if R² ≥ 0.85 and R² regression ≤ 0.03.

### Option C — Via Jupyter Notebook

Open `tomato_freshness_ml_pipeline.ipynb` and run all 14 phases, or call:
```python
%run retrain_clean_model.py
```

---

## 🐍 Python Backend — Dependencies

```
fastapi==0.115.5
uvicorn[standard]==0.32.1
python-multipart==0.0.12
websockets==13.1
pyserial==3.5
pandas==2.2.3
numpy==1.26.4
xgboost==2.1.3
joblib==1.4.2
scikit-learn==1.5.2
scipy==1.14.1
openpyxl==3.1.5
python-dotenv==1.0.1
aiofiles==24.1.0
```

---

## 🌐 Frontend — Tech Stack

| Library | Version | Purpose |
|:---|:---|:---|
| Next.js | 15.x | App framework (App Router) |
| React | 19.x | UI layer |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling |
| Framer Motion | 11.x | Animations |
| Recharts | 2.x | Data visualization charts |
| Three.js / R3F | 0.171 / 8.x | 3D visualizations |
| Axios | 1.x | HTTP client |
| Lucide React | 0.468 | Icons |

---

## ⚙️ Configuration Reference

All backend configuration lives in `backend/config.py`:

| Config Key | Default | Description |
|:---|:---|:---|
| `CORS_ORIGINS` | `localhost:3000` | Allowed frontend origins |
| `SERIAL_PREFERRED_PORT` | `COM8` | ESP32 USB COM port |
| `SERIAL_BAUD_RATE` | `115200` | Serial communication speed |
| `PERFORMANCE_THRESHOLD_R2` | `0.85` | Minimum R² for model deployment |
| `PERFORMANCE_MAX_REGRESSION` | `0.03` | Max allowed R² drop from baseline |

---

## 🛠️ Troubleshooting

### Backend won't start
- Ensure you **activated the virtual environment** before running `python main.py`
- Check that `models/tomato_freshness_pipeline_v1.1.pkl` exists
- Verify Python version: `python --version` (must be 3.10 or 3.11)

### Frontend can't connect to backend (CORS error)
- Make sure the backend is running on port **8000**
- CORS is pre-configured for `http://localhost:3000` and `http://127.0.0.1:3000`

### Sensor not detected
- Check Device Manager for the correct COM port
- Update `SERIAL_PREFERRED_PORT` in `config.py`
- Ensure the ESP32 baud rate is `115200`

### `PermissionError` during retraining
- Close `Tomato_dataset 3.csv` if it is open in Excel
- The script automatically falls back to saving as `Tomato_dataset_3_clean.csv`

### `npm run dev` fails
```powershell
cd "d:\voyage robotics VEG QX\ml model\frontend"
Remove-Item -Recurse -Force node_modules
npm install
npm run dev
```

---

## 📊 Model Versioning History

| File | Version | Accuracy | R² | Status |
|:---|:---|:---|:---|:---|
| `tomato_freshness_pipeline_v1.pkl` | v1.0 | 80.87% | 0.9999 | Archived |
| `tomato_freshness_pipeline_v1.1.pkl` | v1.1 | **81.24%** | **0.9947** | ✅ Active |

New versions are saved automatically on successful retraining as `tomato_freshness_pipeline_v1.2.pkl`, etc.

---

## 📚 Further Reading

- [`summary.md`](summary.md) — Full technical reference: datasets, ML pipeline phases, noise analysis, design decisions
- `backend/config.py` — All configurable parameters
- **Swagger UI** at http://127.0.0.1:8000/docs — Live, interactive API explorer

---

*Built for Voyage Robotics VEG QX — Tomato Freshness Detection System v1.1*

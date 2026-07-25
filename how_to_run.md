# 🍅 Running the Tomato Freshness Detection System

This guide provides step-by-step instructions on setting up, running, configuring, and retraining the Tomato Freshness Detection System.

---

## 🏗️ Architecture at a Glance

The system operates with a dual-server architecture:
1. **Python FastAPI Backend** (Port `8000`): Handles ML inference (using XGBoost), database logs, sensor connections, and the retraining pipeline.
2. **Next.js Frontend Dashboard** (Port `3000`): Provides a premium dark-mode dashboard for real-time visualization, analytics, and manual inference testing.

---

## ⚙️ Prerequisites

Before starting, ensure your environment meets these requirements:

*   **Python**: Version **3.10** or **3.11** (recommended). *Note: Python 3.12+ might encounter compatibility issues with specific XGBoost binaries.*
*   **Node.js**: Version **18+** (LTS recommended).
*   **npm**: Version **9+** (automatically packaged with Node.js).

---

## 🚀 Running the Project (Step-by-Step)

You must run the backend and frontend in **two separate terminal windows**.

### Step 1: Start the FastAPI Backend

1.  **Open a new terminal window** and navigate to the backend folder:
    ```bash
    cd "d:\voyage robotics VEG QX\ml model\backend"
    ```

2.  **Create a Python Virtual Environment** (do this on initial setup):
    ```bash
    python -m venv venv
    ```

3.  **Activate the Virtual Environment**:
    *   **Windows PowerShell**:
        ```powershell
        .\venv\Scripts\Activate.ps1
        ```
    *   **Windows Command Prompt (CMD)**:
        ```cmd
        .\venv\Scripts\activate.bat
        ```
    *   **Linux/macOS**:
        ```bash
        source venv/bin/activate
        ```

4.  **Install Python Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

5.  **Start the Backend Server**:
    ```bash
    python main.py
    ```

    The backend starts on **`http://127.0.0.1:8000`**. You should see the following startup logs confirming the active models loaded:
    ```text
    🚀 Tomato Freshness API starting up...
      Initializing SQLite database & CSV files...
      Preloading best active ML pipeline...
      ✔ Model version 1.1 loaded successfully.
    🚀 Startup complete. API is ready.
    ```

---

### Step 2: Start the Next.js Frontend

1.  **Open a second terminal window** and navigate to the frontend folder:
    ```bash
    cd "d:\voyage robotics VEG QX\ml model\frontend"
    ```

2.  **Install Node Dependencies** (do this on initial setup):
    ```bash
    npm install
    ```

3.  **Start the Dev Server**:
    ```bash
    npm run dev
    ```

    The frontend starts on **`http://localhost:3000`**.

---

### Step 3: Access the Applications

Open your web browser and visit these endpoints:

| Application / Service | URL | Description |
| :--- | :--- | :--- |
| **🌐 Web Dashboard** | `http://localhost:3000` | The primary visual UI (Inference, Analytics, Retraining). |
| **⚙️ API Status** | `http://127.0.0.1:8000` | Basic status health check of the backend. |
| **📋 Swagger UI** | `http://127.0.0.1:8000/docs` | Interactive API documentation (send test requests directly). |
| **📘 ReDoc Docs** | `http://127.0.0.1:8000/redoc` | High-fidelity static API documentation. |

---

## 🔌 ESP32 / Hardware Sensor Setup

If you have an AS7341 spectral sensor connected via USB to your computer:
1.  Verify the serial port assigned to it (e.g. `COM8` on Windows, `/dev/ttyUSB0` on Linux).
2.  Open [backend/config.py](file:///d:/voyage%20robotics%20VEG%20QX/ml%20model/backend/config.py).
3.  Modify the preferred COM port if necessary:
    ```python
    SERIAL_PREFERRED_PORT = "COM8"  # Set to your device's COM port
    ```
4.  Restart the backend. The backend will automatically try to connect and pipe readings through a WebSocket endpoint (`ws://127.0.0.1:8000/sensor`).

---

## 🔁 How to Retrain Models

When new dataset versions arrive (e.g., `Tomato_dataset 3.csv`), you can run the retraining pipeline in three ways:

### Option A: Retrain via Dashboard UI
1.  Visit `http://localhost:3000/retrain`.
2.  Upload the new CSV file.
3.  Click **Start Retraining**. The UI displays progress, drift check outputs, and retraining logs.

### Option B: Standalone Python Script
1.  Activate your virtual environment in the project root:
    ```bash
    cd "d:\voyage robotics VEG QX\ml model"
    .\backend\venv\Scripts\Activate.ps1
    ```
2.  Execute the clean and retrain script:
    ```bash
    python retrain_clean_model.py
    ```
    This script removes Gaussian sensor noise by grouping readings per tomato, applies the true thresholds, trains the models, performs validation checks, and deploys them to production.

### Option C: Jupyter Notebook
Run the end-to-end pipeline in [tomato_freshness_ml_pipeline.ipynb](file:///d:/voyage%20robotics%20VEG%20QX/ml%20model/tomato_freshness_ml_pipeline.ipynb) cell-by-cell.

---

## 🛠️ Troubleshooting & Tips

### 1. `PermissionError` when running `retrain_clean_model.py`
*   **Cause**: You have `Tomato_dataset 3.csv` open in Excel, locking the file.
*   **Solution**: Close Excel. The script automatically handles this on Windows by falling back to saving as `Tomato_dataset_3_clean.csv`.

### 2. Backend fails to load models
*   **Cause**: The precompiled files in the `models/` directory are missing or corrupt.
*   **Solution**: Ensure `models/xgboost_regressor.pkl` and `models/xgboost_classifier.pkl` are present. If needed, run `retrain_clean_model.py` to regenerate them.

### 3. Next.js fails to build or start (`npm run dev` fails)
*   **Solution**: Clean the cached files and reinstall:
    ```bash
    cd "d:\voyage robotics VEG QX\ml model\frontend"
    rm -rf .next node_modules
    npm install
    npm run dev
    ```

### 4. API Port conflict (Port `8000` already in use)
*   **Solution**: Identify the process using port `8000` or modify the port in `backend/main.py`:
    ```python
    uvicorn.run("main:app", host="127.0.0.1", port=8080, reload=True)
    ```
    *Note: If you change the backend port, you must update the API URL in frontend config or `.env.local`.*

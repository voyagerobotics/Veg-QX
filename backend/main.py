"""
main.py — FastAPI Application Entrypoint.
Initializes SQLite database and preloads the best ML model on startup.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from config import CORS_ORIGINS
from services.database_service import init_database
from services.inference_service import get_inference_service
from routers import (
    health,
    prediction,
    upload,
    history,
    verification,
    sensor,
    models_info,
    analytics,
    retraining,
)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Tomato Freshness API starting up...")
    # 1. Initialize DB and directories
    print("  Initializing SQLite database & CSV files...")
    init_database()

    # 2. Preload active models
    print("  Preloading best active ML pipeline...")
    try:
        svc = get_inference_service("tomato")
        if svc.is_loaded():
            print(f"  ✔ Model version {svc.model_version} loaded successfully.")
        else:
            print("  ❌ Failed to load active ML model.")
    except Exception as e:
        print(f"  ❌ Error loading ML model: {e}")

    print("🚀 Startup complete. API is ready.")
    yield


# Initialize FastAPI App
app = FastAPI(
    title="Tomato Freshness Detection System API",
    description="Scientific API endpoints for real-time sensor connection, batch prediction, and model retraining.",
    version="1.1",
    lifespan=lifespan,
)

# Configure CORS for Next.js communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API Routers
app.include_router(health.router)
app.include_router(prediction.router)
app.include_router(upload.router)
app.include_router(history.router)
app.include_router(verification.router)
app.include_router(sensor.router)
app.include_router(models_info.router)
app.include_router(analytics.router)
app.include_router(retraining.router)


@app.get("/")
def read_root():
    return {
        "title": "Tomato Freshness Detection API",
        "version": "1.1",
        "documentation": "/docs",
        "status": "online",
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

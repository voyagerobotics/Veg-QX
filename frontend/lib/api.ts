// api.ts
// Axios API wrapper to make calls to the FastAPI backend

import axios from "axios";
import { API_BASE_URL } from "./constants";
import {
  PredictionRecord,
  ModelInfo,
  ModelVersion,
  USBStatus,
  RetrainingLog,
  AnalyticsSummary,
} from "./types";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const api = {
  // Health
  getHealth: async (): Promise<USBStatus> => {
    const res = await client.get("/health");
    return res.data;
  },

  // Tomato ID Generator
  getNextTomatoId: async (): Promise<{ success: boolean; next_tomato_id: number }> => {
    const res = await client.get("/tomato_id/next");
    return res.data;
  },

  // USB / Sensor controls
  connectUSB: async (port?: string): Promise<{ success: boolean; data: any; error?: string }> => {
    const res = await client.post(`/connect_usb${port ? `?port=${port}` : ""}`);
    return res.data;
  },

  disconnectUSB: async (): Promise<{ success: boolean; data: any }> => {
    const res = await client.post("/disconnect_usb");
    return res.data;
  },

  // Predictions
  predictSingle: async (reading: {
    Blue: number;
    Green: number;
    Yellow: number;
    Orange: number;
    Red: number;
    NIR: number;
    tomato_id?: number;
    position?: number;
    input_source?: string;
  }): Promise<PredictionRecord> => {
    const res = await client.post("/predict", reading);
    return res.data;
  },

  predictBatch: async (readings: Array<{
    Blue: number;
    Green: number;
    Yellow: number;
    Orange: number;
    Red: number;
    NIR: number;
    tomato_id?: number;
    position?: number;
    input_source?: string;
  }>): Promise<{
    predictions: PredictionRecord[];
    average_freshness_score: number;
    min_freshness_score: number;
    max_freshness_score: number;
    overall_category: "Fresh" | "Aging" | "Spoiling";
  }> => {
    const res = await client.post("/predict_batch", { readings });
    return res.data;
  },

  // CSV Upload
  uploadCSV: async (file: File): Promise<{
    success: boolean;
    summary: {
      auto_verified_records: number;
      saved_records: any;
      filename: string;
      total_samples: number;
      columns: string[];
      fresh_count: number;
      aging_count: number;
      spoiling_count: number;
      average_freshness: number;
    };
    preview: any[];
  }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await client.post("/upload_csv", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  // History & Verification
  getHistory: async (
    limit = 50,
    offset = 0,
    category?: string
  ): Promise<{ success: boolean; total: number; data: PredictionRecord[] }> => {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());
    if (category) params.append("category", category);
    const res = await client.get(`/prediction_history?${params.toString()}`);
    return res.data;
  },

  verifyPrediction: async (
    id: number,
    actualCategory: string,
    actualScore?: number,
    notes?: string
  ): Promise<{ success: boolean; message: string }> => {
    const res = await client.post(`/verify_prediction/${id}`, {
      actual_category: actualCategory,
      actual_freshness_score: actualScore,
      notes,
    });
    return res.data;
  },

  verifyPredictionsBulk: async (
    items: Array<{
      prediction_id: number;
      actual_category: string;
      actual_freshness_score: number;
      notes?: string;
    }>
  ): Promise<{ success: boolean; success_count: number; message: string; errors?: string[] }> => {
    const res = await client.post("/verify_prediction/bulk", { items });
    return res.data;
  },

  getVerificationStats: async (): Promise<{
    success: boolean;
    data: {
      total_audited_samples: number;
      fresh_count: number;
      aging_count: number;
      spoiling_count: number;
      retraining_readiness: boolean;
      remaining_samples_required: number;
    };
  }> => {
    const res = await client.get("/verify_prediction/stats");
    return res.data;
  },

  getVerificationHistory: async (): Promise<{
    success: boolean;
    total: number;
    data: any[];
  }> => {
    const res = await client.get("/verify_prediction/history");
    return res.data;
  },

  getDownloadVerifiedCsvUrl: (): string => {
    return `${API_BASE_URL}/verify_prediction/download_csv`;
  },

  // Model Retraining & Info
  getmodelInfo: async (): Promise<{ success: boolean; data: ModelInfo }> => {
    const res = await client.get("/model_information");
    return res.data;
  },

  getModelVersions: async (): Promise<{ success: boolean; data: ModelVersion[] }> => {
    const res = await client.get("/model_versions");
    return res.data;
  },

  activateModelVersion: async (version: string): Promise<{ success: boolean; message: string }> => {
    const res = await client.post(`/model_versions/activate/${version}`);
    return res.data;
  },

  deleteModelVersion: async (version: string): Promise<{ success: boolean; message: string }> => {
    const res = await client.delete(`/model_versions/${version}`);
    return res.data;
  },

  getRetrainingPreview: async (): Promise<{
    success: boolean;
    data: {
      reference_samples: number;
      verified_samples: number;
      merged_samples: number;
      fresh_count: number;
      aging_count: number;
      spoiling_count: number;
      retraining_readiness: boolean;
      remaining_required: number;
    };
  }> => {
    const res = await client.get("/retrain_model/preview");
    return res.data;
  },

  getRetrainingProgress: async (): Promise<{
    success: boolean;
    data: {
      is_running: boolean;
      step_name: string;
      percentage: number;
      error: string | null;
    };
  }> => {
    const res = await client.get("/retrain_model/progress");
    return res.data;
  },

  retrainModel: async (notes = ""): Promise<RetrainingLog> => {
    const res = await client.post("/retrain_model", { notes });
    return res.data;
  },

  // Analytics
  getAnalytics: async (): Promise<AnalyticsSummary> => {
    const res = await client.get("/analytics_dashboard");
    return res.data;
  },
};


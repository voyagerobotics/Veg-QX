// types.ts
// Shared TypeScript types for the Tomato Freshness Detection frontend

export interface PredictionRecord {
  id?: number;
  timestamp: string;
  food_type: string;
  tomato_id?: number;
  position?: number;
  blue: number;
  green: number;
  yellow: number;
  orange: number;
  red: number;
  nir: number;
  ndvi: number;
  gndvi: number;
  rvi: number;
  freshness_score: number;
  category: "Fresh" | "Aging" | "Spoiling";
  confidence_pct: number;
  confidence_fresh: number;
  confidence_aging: number;
  confidence_spoiling: number;
  model_version: string;
  input_source: "manual" | "usb" | "csv_upload";
}

export interface ModelInfo {
  food_type: string;
  model_version: string;
  classification_accuracy: number;
  regression_r2: number;
  training_samples: number;
  features: string[];
  classes: string[];
}

export interface ModelVersion {
  id: number;
  version: string;
  food_type: string;
  trained_at: string;
  training_samples: number;
  classification_accuracy: number;
  regression_r2: number;
  mae?: number;
  rmse?: number;
  is_active: number; // 0 or 1
  pkl_path: string;
  notes?: string;
}

export interface USBStatus {
  status: "healthy" | "degraded";
  database_connected: boolean;
  model_loaded: boolean;
  model_version: string | null;
  usb_connected: boolean;
  usb_port: string | null;
  sensor_ready: boolean;
}

export interface COMStatus {
  is_connected: boolean;
  port: string | null;
  baud_rate: number | null;
  serial_available: boolean;
  available_ports: Array<{
    port: string;
    description: string;
    hwid: string;
    is_esp32: boolean;
  }>;
  esp32_detected: boolean;
}

export interface RetrainingLog {
  error: string;
  success: boolean;
  message: string;
  base_version: string;
  new_version: string;
  metrics: {
    old_r2: number;
    new_r2: number;
    old_accuracy: number;
    new_accuracy: number;
    mae?: number;
    rmse?: number;
  };
}

export interface AnalyticsSummary {
  success: boolean;
  summary: {
    total_predictions: number;
    average_freshness_score: number;
    fresh_count: number;
    aging_count: number;
    spoiling_count: number;
  };
  category_distribution: Array<{ name: string; value: number }>;
  feature_importance: Array<{ feature: string; importance: number }>;
  trend: Array<{
    timestamp: string;
    freshness_score: number;
    category: string;
  }>;
  model_performance: {
    classification_accuracy: number;
    regression_r2: number;
  };
}

"use client";

import { useEffect, useState, useRef } from "react";
import USBStatusPanel from "@/components/sensor/USBStatusPanel";
import SensorCard from "@/components/sensor/SensorCard";
import SpectralChart from "@/components/sensor/SpectralChart";
import IndexDisplay from "@/components/prediction/IndexDisplay";
import FreshnessGauge from "@/components/prediction/FreshnessGauge";
import CategoryCard from "@/components/prediction/CategoryCard";
import ConfidenceBar from "@/components/prediction/ConfidenceBar";
import { WS_BASE_URL } from "@/lib/constants";
import { api } from "@/lib/api";
import { SENSOR_BAND_COLORS } from "@/lib/constants";
import { Cpu, HelpCircle, Activity } from "lucide-react";

interface SensorAccumulator {
  sum: number;
  min: number;
  max: number;
  count: number;
}

const initialAccumulator = () => ({
  sum: 0,
  min: Infinity,
  max: -Infinity,
  count: 0,
});

export default function LiveDashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [latestReading, setLatestReading] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  
  // Historical stats accumulators for Module 3 (Min, Max, Avg, Current)
  const [accumulators, setAccumulators] = useState<Record<string, SensorAccumulator>>({
    Blue: initialAccumulator(),
    Green: initialAccumulator(),
    Yellow: initialAccumulator(),
    Orange: initialAccumulator(),
    Red: initialAccumulator(),
    NIR: initialAccumulator(),
  });

  const wsRef = useRef<WebSocket | null>(null);

  // Set up WebSocket connection when USB link state changes
  useEffect(() => {
    if (isConnected) {
      console.log("Connecting WebSocket to", `${WS_BASE_URL}/live_sensor_data`);
      const ws = new WebSocket(`${WS_BASE_URL}/live_sensor_data`);
      wsRef.current = ws;

      ws.onmessage = async (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.status === "reading" && payload.data) {
            const raw = payload.data;
            setLatestReading(raw);

            // 1. Update stats accumulators dynamically
            setAccumulators((prev) => {
              const updated = { ...prev };
              Object.keys(updated).forEach((band) => {
                const val = raw[band];
                if (val !== undefined) {
                  const acc = { ...updated[band] };
                  acc.sum += val;
                  acc.count += 1;
                  if (val < acc.min) acc.min = val;
                  if (val > acc.max) acc.max = val;
                  updated[band] = acc;
                }
              });
              return updated;
            });

            // 2. Set prediction state directly from WebSocket payload
            setPrediction(raw);
          }
        } catch (err) {
          console.error("WebSocket message parse error:", err);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed.");
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
      };
    } else {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isConnected]);

  // Formulate data structure for Recharts
  const chartData = [
    { name: "Blue", value: latestReading?.Blue || 0, color: SENSOR_BAND_COLORS.Blue },
    { name: "Green", value: latestReading?.Green || 0, color: SENSOR_BAND_COLORS.Green },
    { name: "Yellow", value: latestReading?.Yellow || 0, color: SENSOR_BAND_COLORS.Yellow },
    { name: "Orange", value: latestReading?.Orange || 0, color: SENSOR_BAND_COLORS.Orange },
    { name: "Red", value: latestReading?.Red || 0, color: SENSOR_BAND_COLORS.Red },
    { name: "NIR", value: latestReading?.NIR || 0, color: SENSOR_BAND_COLORS.NIR },
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="border-b border-slate-900 pb-4">
        <h2 className="text-2xl font-bold text-white font-mono tracking-wide uppercase flex items-center gap-3">
          <img src="/voyage_robotics_logo.png" alt="Voyage Robotics Logo" className="w-7 h-7 object-contain filter drop-shadow-[0_0_8px_rgba(57,255,20,0.3)]" />
          <span>Live Hardware Diagnostics</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Monitor real-time spectral wave readings from AS7341 on COM8, verify calculations, and display predictive diagnostics.
        </p>
      </div>

      {/* USB Connection Panel */}
      <USBStatusPanel onStatusChange={setIsConnected} />

      {/* Main Grid: Live Cards + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* Left Side: 6 Spectral Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(accumulators).map((band) => {
            const acc = accumulators[band];
            const current = latestReading ? latestReading[band] || 0 : 0;
            const average = acc.count > 0 ? acc.sum / acc.count : 0;
            const minVal = acc.min === Infinity ? 0 : acc.min;
            const maxVal = acc.max === -Infinity ? 0 : acc.max;

            return (
              <SensorCard
                key={band}
                name={band}
                value={current}
                min={minVal}
                max={maxVal}
                avg={average}
                color={SENSOR_BAND_COLORS[band as keyof typeof SENSOR_BAND_COLORS]}
              />
            );
          })}
        </div>

        {/* Right Side: Chart Visualizer */}
        <div className="lg:col-span-1 flex flex-col">
          <SpectralChart data={chartData} />
        </div>
      </div>

      {/* Index Display (Module 4) */}
      <IndexDisplay
        ndvi={prediction?.NDVI || 0}
        gndvi={prediction?.GNDVI || 0}
        rvi={prediction?.RVI || 0}
      />

      {/* Prediction Output Panel (Module 5) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/50 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">
              Module 05
            </span>
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
              Regression Score
            </h3>
          </div>
          <FreshnessGauge score={prediction?.freshness_score || 0} />
        </div>

        <div className="flex flex-col justify-between gap-6">
          <CategoryCard
            category={prediction?.category || "Aging"}
            confidence={prediction?.confidence_pct || 0}
          />
          
          {/* Metadata information card */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800/40 text-[12px] font-mono text-slate-500 space-y-1.5 flex-1 flex flex-col justify-center">
            <div>TARGET TOMATO ID: <span className="text-white font-bold">{latestReading?.tomato_id || "None"}</span></div>
            <div>SURFACE POSITION: <span className="text-white font-bold">{latestReading?.position || "None"} / 10</span></div>
            <div>TELEM SOURCE: <span className="text-accent-green font-bold">USB_SERIAL_COM8</span></div>
            <div>VERSION IDENT: <span className="text-white font-bold">{prediction?.model_version || "unknown"}</span></div>
          </div>
        </div>

        <div>
          <ConfidenceBar
            fresh={prediction?.confidence_fresh || 0}
            aging={prediction?.confidence_aging || 0}
            spoiling={prediction?.confidence_spoiling || 0}
          />
        </div>
      </div>
    </div>
  );
}

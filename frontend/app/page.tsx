"use client";

import { useEffect, useState, useRef } from "react";
import TomatoScene from "@/components/landing/TomatoScene";
import SpectralWaves from "@/components/landing/SpectralWaves";
import ModelStatsCard from "@/components/landing/ModelStatsCard";
import Link from "next/link";
import { ArrowRight, Terminal as TerminalIcon, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  const [scanProgress, setScanProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync scanProgress with the 6s scanner loop
  useEffect(() => {
    const interval = setInterval(() => {
      setScanProgress((prev) => (prev + 4) % 104);
    }, 240); // 240ms * 25 steps = 6000ms loop
    return () => clearInterval(interval);
  }, []);

  // Scientific logs typing streaming effect
  useEffect(() => {
    const allLogs = [
      "Initializing core AS7341 spectral sensor array...",
      "Executing dynamic sensor array calibration...",
      "Capturing multispectral bands [Blue, Green, Yellow, Orange, Red, NIR]...",
      "Extracting index parameters: NDVI, GNDVI, and RVI...",
      "Running precision XGBoost classification algorithm...",
      "Regression score resolved: QUALITY_SCORE = 96.8%",
      "Classification resolved: VALUE = FRESH",
      "Model inference confidence coefficient: 99.21%",
      "Overall processing latency: 112 ms",
      "Streaming packet sequence to local SQLite DB... OK",
      "Piping live telemetry matrices through WebSockets..."
    ];

    let currentLogIndex = 0;
    
    const logInterval = setInterval(() => {
      const timestamp = new Date().toISOString().substring(11, 19);
      const text = allLogs[currentLogIndex];
      const isNotResult = !text.includes("Score") && !text.includes("Classification") && !text.includes("Confidence") && !text.includes("latency");
      const statusText = isNotResult ? " ... OK" : "";
      
      setLogs((prev) => [...prev.slice(-15), `[${timestamp}] ${text}${statusText}`]);
      
      currentLogIndex = (currentLogIndex + 1) % allLogs.length;
    }, 1100);

    return () => clearInterval(logInterval);
  }, []);

  // auto scroll to bottom of logs
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const numBlocks = Math.floor(scanProgress / 10);
  const loadingBar = "█".repeat(numBlocks) + "░".repeat(10 - numBlocks);

  return (
    <div className="space-y-4 text-slate-350">
      {/* Top Telemetry Banner */}
      <div className="border border-slate-900 bg-[#0B1020] px-5 py-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-accent-green/10 text-accent-green border border-accent-green/20 px-2 py-0.5 rounded text-[8px] font-mono tracking-widest uppercase">
              Operational Matrix
            </span>
            <span className="text-slate-650 font-mono text-[9px]">
              TELEM_SYS_ID: VEG-QX-MISSION-CONTROL
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans uppercase flex items-center gap-3">
            <img src="/voyage_robotics_logo.png" alt="Voyage Robotics Logo" className="w-8 h-8 object-contain filter drop-shadow-[0_0_8px_rgba(57,255,20,0.3)]" />
            <span>VEG QX</span>
            <span className="text-slate-500 font-mono text-xs font-normal lowercase tracking-normal">// precision AI for non-destructive vegetable analysis</span>
          </h1>
        </div>

        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 bg-accent-green text-slate-950 font-bold px-4 py-2 rounded-md text-xs transition-all duration-300 shadow-[0_0_12px_rgba(45,255,106,0.15)] hover:shadow-[0_0_20px_rgba(45,255,106,0.45)] hover:scale-[1.02] select-none shrink-0"
        >
          <span>Launch Telemetry Console</span>
          <ArrowRight size={12} />
        </Link>
      </div>

      {/* Main Mission Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Console Column */}
        <div className="lg:col-span-2 space-y-4">
          <TomatoScene />
          <SpectralWaves />
        </div>

        {/* Right Console Column */}
        <div className="flex flex-col gap-4">
          {/* Mission Status Console Card */}
          <div className="border border-slate-900 bg-[#0B1020] rounded-xl p-4 font-mono text-[10px] text-slate-400 flex flex-col justify-between h-[180px] shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-950 pb-2 mb-1">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                Spacecraft Mission Status
              </span>
              <ShieldCheck size={12} className="text-accent-green animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-white border-b border-slate-950/40 pb-1">
                <span>SYSTEM_READY</span>
                <span className="text-accent-green">██████████ 100%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SENSOR ARRAY</span>
                <span className="text-accent-green font-semibold">[ ONLINE ]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">INFERENCE ENGINE</span>
                <span className="text-accent-green font-semibold">[ ACTIVE ]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MODEL CONFIDENCE</span>
                <span className="text-accent-blue font-semibold">[ 99.21% ]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">DATABASE</span>
                <span className="text-accent-green font-semibold">[ CONNECTED ]</span>
              </div>
            </div>

            <div className="border-t border-slate-950/60 pt-2 flex justify-between items-center">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                SCAN PROGRESS
              </span>
              <span className="text-accent-green font-bold">
                {loadingBar} {Math.min(scanProgress, 100)}%
              </span>
            </div>
          </div>

          {/* Mission Terminal logs */}
          <div className="border border-slate-900 bg-[#0B1020] rounded-xl p-4 flex flex-col justify-between h-[295px] shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-950 pb-2 mb-2 font-mono">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                Mission Console Terminal
              </span>
              <TerminalIcon size={12} className="text-accent-blue animate-pulse" />
            </div>

            {/* Logs Window */}
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto font-mono text-[9.5px] text-slate-400 space-y-1.5 pr-1 scrollbar-thin"
            >
              {logs.length === 0 ? (
                <div className="text-slate-655 animate-pulse">[ AWAITING SENSOR TELEMETRY STREAM... ]</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="leading-relaxed">
                    <span className="text-slate-500 font-semibold">{log.substring(0, 10)}</span>
                    <span className={log.includes("Classification") || log.includes("Score") || log.includes("FRESH") ? "text-accent-green font-semibold" : ""}>
                      {log.substring(10)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-950/60 pt-2 mt-2 font-mono text-[8px] text-slate-600 flex justify-between">
              <span>SYS_T_STAMP: LIVE</span>
              <span>BUFFER_CAP: 15_LINES</span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Stats Section */}
      <div className="space-y-3 pt-2">
        <h2 className="text-[9px] uppercase tracking-widest text-slate-500 font-mono font-bold">
          ACTIVE ML TELEMETRY PARAMETERS
        </h2>
        <ModelStatsCard />
      </div>

      {/* Mission Diagnostics Detail Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="border border-slate-900 bg-[#0B1020] rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 border-b border-slate-950/40 pb-1.5">
            <span className="text-[9px] font-mono text-accent-blue">01 // TELEMETRY_INGEST</span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            AS7341 spectral reflectance values are computed across six visual/NIR bands (Blue, Green, Yellow, Orange, Red, NIR). Built-in ESP32 pipelines data automatically over serial interfaces.
          </p>
        </div>
        <div className="border border-slate-900 bg-[#0B1020] rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 border-b border-slate-950/40 pb-1.5">
            <span className="text-[9px] font-mono text-accent-blue">02 // VEG_INDEX_COMPUTE</span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            Vegetation indices like NDVI, GNDVI, and RVI are automatically computed on incoming raw telemetry readings to trace moisture levels and structural cell degradation.
          </p>
        </div>
        <div className="border border-slate-900 bg-[#0B1020] rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 border-b border-slate-950/40 pb-1.5">
            <span className="text-[9px] font-mono text-accent-blue">03 // DUAL_PIPELINE_LEARNING</span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            Inference packets are logged. Model retraining averages position scans to remove Gaussian sensor noise before deploying updated XGBoost weights into production.
          </p>
        </div>
      </div>
    </div>
  );
}

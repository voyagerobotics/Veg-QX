"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { USBStatus } from "@/lib/types";
import { RefreshCw, Radio, Clock, ShieldAlert, Menu } from "lucide-react";

interface TopBarProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export default function TopBar({ isSidebarOpen = true, onToggleSidebar }: TopBarProps) {
  const [status, setStatus] = useState<USBStatus>({
    status: "degraded",
    database_connected: false,
    model_loaded: false,
    model_version: null,
    usb_connected: false,
    usb_port: null,
    sensor_ready: false,
  });
  const [loading, setLoading] = useState(false);
  const [missionTime, setMissionTime] = useState("");

  // live ticking mission clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setMissionTime(d.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const tInterval = setInterval(updateTime, 1000);
    return () => clearInterval(tInterval);
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const health = await api.getHealth();
      setStatus(health);
    } catch (e) {
      setStatus({
        status: "degraded",
        database_connected: false,
        model_loaded: false,
        model_version: null,
        usb_connected: false,
        usb_port: null,
        sensor_ready: false,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-[#050814]/80 border-b border-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 text-slate-355 font-mono">
      {/* Telemetry Title */}
      <div className="flex items-center gap-4">
        {!isSidebarOpen && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1 hover:bg-slate-900/80 rounded text-accent-green hover:text-white transition-all mr-1 flex items-center justify-center border border-slate-800/40"
            title="Open Navigation Panel"
          >
            <Menu size={14} />
          </button>
        )}
        <div className="flex items-center gap-1.5 border-r border-slate-900 pr-4">
          <Radio size={14} className="text-accent-green animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Telemetry Ribbon
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <Clock size={12} className="text-accent-blue" />
          <span className="text-slate-400 font-bold">{missionTime || "CALIBRATING TIME..."}</span>
        </div>
      </div>

      {/* Centerpiece Active Sample ID */}
      <div className="hidden lg:flex items-center gap-2 bg-[#0B1020] border border-slate-900 px-3 py-1 rounded text-[9px] tracking-wider text-slate-400">
        <span className="text-slate-600 font-semibold">ACTIVE SAMPLE:</span>
        <span className="text-accent-blue font-bold">SCAN-TOMATO-1.1</span>
      </div>

      {/* Telemetry Status Grid */}
      <div className="flex items-center gap-5 text-[10px]">
        {/* Connection Latency */}
        <div className="hidden sm:flex items-center gap-1">
          <span className="text-slate-600">LATENCY:</span>
          <span className="text-accent-blue font-bold">
            {status.database_connected ? "112 ms" : "---"}
          </span>
        </div>

        {/* Database Connected */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status.database_connected ? "bg-accent-green shadow-[0_0_8px_#2DFF6A] animate-pulse" : "bg-accent-red animate-pulse"
            }`}
          />
          <span className="text-slate-500">DB:</span>
          <span className={status.database_connected ? "text-accent-green font-semibold" : "text-accent-red font-semibold"}>
            {status.database_connected ? "CONNECTED" : "OFFLINE"}
          </span>
        </div>

        {/* Model Loaded */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status.model_loaded ? "bg-accent-green shadow-[0_0_8px_#2DFF6A]" : "bg-accent-red"
            }`}
          />
          <span className="text-slate-500">MODEL:</span>
          <span className={status.model_loaded ? "text-accent-green font-semibold" : "text-accent-red font-semibold"}>
            {status.model_loaded ? `LOADED (${status.model_version || "unknown"})` : "UNLOADED"}
          </span>
        </div>

        {/* USB Connected */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status.usb_connected ? "bg-accent-green shadow-[0_0_8px_#2DFF6A] animate-pulse" : "bg-accent-red"
            }`}
          />
          <span className="text-slate-500">USB:</span>
          <span className={status.usb_connected ? "text-accent-green font-semibold" : "text-accent-red font-semibold"}>
            {status.usb_connected ? `READY (${status.usb_port})` : "INACTIVE"}
          </span>
        </div>

        {/* Refresh */}
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="text-slate-500 hover:text-slate-350 transition-colors pl-2"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
    </header>
  );
}

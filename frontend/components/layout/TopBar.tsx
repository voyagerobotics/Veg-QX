"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { USBStatus } from "@/lib/types";
import { RefreshCw, Radio, Clock, Menu } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";

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
    <header className="h-16 bg-white/90 dark:bg-[#050814]/80 border-b border-slate-200 dark:border-slate-850 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 text-slate-700 dark:text-slate-300 font-mono shadow-sm transition-colors duration-200">
      {/* Telemetry Title */}
      <div className="flex items-center gap-4">
        {!isSidebarOpen && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            suppressHydrationWarning
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-emerald-600 dark:text-emerald-400 hover:text-slate-900 dark:hover:text-white transition-all mr-1 flex items-center justify-center border border-slate-200 dark:border-slate-800"
            title="Open Navigation Panel"
          >
            <Menu size={16} />
          </button>
        )}
        <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-4">
          <img
            src="/voyage_robotics_logo.png"
            alt="Voyage Robotics Logo"
            width={20}
            height={20}
            className="w-5 h-5 object-contain"
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
          <Radio size={14} className="text-emerald-600 dark:text-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">
            VEG QX Telemetry
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
          <Clock size={14} className="text-sky-600 dark:text-sky-400" />
          <span className="text-slate-700 dark:text-slate-300 font-semibold">{missionTime || "CALIBRATING TIME..."}</span>
        </div>
      </div>

      {/* Centerpiece Active Sample ID */}
      <div className="hidden lg:flex items-center gap-2 bg-slate-50 dark:bg-[#0B1020] border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-md text-[10px] tracking-wider text-slate-600 dark:text-slate-400 shadow-xs">
        <span className="text-slate-500 dark:text-slate-500 font-semibold">ACTIVE SAMPLE:</span>
        <span className="text-sky-700 dark:text-cyan-400 font-bold">SCAN-TOMATO-{status.model_version?.replace('v', '') || '1.0'}</span>
      </div>

      {/* Telemetry Status Grid + Theme Switcher */}
      <div className="flex items-center gap-4 text-[10px]">
        {/* Connection Latency */}
        <div className="hidden sm:flex items-center gap-1">
          <span className="text-slate-400 dark:text-slate-600 font-semibold">LATENCY:</span>
          <span className="text-sky-600 dark:text-sky-400 font-bold">
            {status.database_connected ? "112 ms" : "---"}
          </span>
        </div>

        {/* Database Connected */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded border border-slate-200/80 dark:border-slate-800">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status.database_connected ? "bg-emerald-500 shadow-[0_0_6px_#10B981] animate-pulse" : "bg-red-500 animate-pulse"
            }`}
          />
          <span className="text-slate-500 dark:text-slate-400">DB:</span>
          <span className={status.database_connected ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-red-600 dark:text-red-400 font-bold"}>
            {status.database_connected ? "CONNECTED" : "OFFLINE"}
          </span>
        </div>

        {/* Model Loaded */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded border border-slate-200/80 dark:border-slate-800">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status.model_loaded ? "bg-emerald-500 shadow-[0_0_6px_#10B981]" : "bg-red-500"
            }`}
          />
          <span className="text-slate-500 dark:text-slate-400">MODEL:</span>
          <span className={status.model_loaded ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-red-600 dark:text-red-400 font-bold"}>
            {status.model_loaded ? `LOADED (${status.model_version || "unknown"})` : "UNLOADED"}
          </span>
        </div>

        {/* USB Connected */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded border border-slate-200/80 dark:border-slate-800">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status.usb_connected
                ? "bg-emerald-500 shadow-[0_0_6px_#10B981] animate-pulse"
                : status.esp32_detected
                ? "bg-amber-500 animate-pulse"
                : "bg-red-500"
            }`}
          />
          <span className="text-slate-500 dark:text-slate-400">USB:</span>
          <span
            className={
              status.usb_connected
                ? "text-emerald-700 dark:text-emerald-400 font-bold"
                : status.esp32_detected
                ? "text-amber-700 dark:text-amber-400 font-bold"
                : "text-red-600 dark:text-red-400 font-bold"
            }
          >
            {status.usb_connected
              ? `CONNECTED (${status.usb_port})`
              : status.esp32_detected
              ? `DETECTED (${status.usb_port || "Plugged"})`
              : "INACTIVE"}
          </span>
        </div>

        {/* Refresh Status */}
        <button
          onClick={fetchStatus}
          disabled={loading}
          suppressHydrationWarning
          className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1"
          title="Refresh Telemetry Status"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>

        {/* Theme Toggle Button */}
        <div className="pl-1 border-l border-slate-200 dark:border-slate-800">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

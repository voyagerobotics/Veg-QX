"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { COMStatus } from "@/lib/types";
import { Link2, Link2Off, RefreshCw, Cpu } from "lucide-react";

interface USBStatusPanelProps {
  onStatusChange?: (isConnected: boolean) => void;
}

export default function USBStatusPanel({ onStatusChange }: USBStatusPanelProps) {
  const [comStatus, setComStatus] = useState<COMStatus>({
    is_connected: false,
    port: null,
    baud_rate: null,
    serial_available: false,
    available_ports: [],
    esp32_detected: false,
  });
  const [selectedPort, setSelectedPort] = useState<string>("COM8");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPorts = async () => {
    try {
      const health = await api.getHealth();
      // Fetch telemetry details
      setComStatus(prev => ({
        ...prev,
        is_connected: health.usb_connected,
        port: health.usb_port,
        serial_available: true,
      }));
      if (onStatusChange) {
        onStatusChange(health.usb_connected);
      }
    } catch (e) {
      setError("Failed to fetch USB telemetry status.");
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.connectUSB(selectedPort);
      if (res.success) {
        setComStatus(prev => ({
          ...prev,
          is_connected: true,
          port: selectedPort,
        }));
        if (onStatusChange) onStatusChange(true);
      } else {
        setError(res.error || "Failed to establish serial connection.");
      }
    } catch (e: any) {
      setError(e.response?.data?.detail || "USB connection error.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.disconnectUSB();
      if (res.success) {
        setComStatus(prev => ({
          ...prev,
          is_connected: false,
          port: null,
        }));
        if (onStatusChange) onStatusChange(false);
      }
    } catch (e: any) {
      setError("Failed to disconnect serial connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPorts();
    const interval = setInterval(fetchPorts, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800/50 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        <div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">
            Module 01
          </span>
          <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
            ESP32 Serial Link Controller
          </h3>
        </div>
        <button
          onClick={fetchPorts}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg font-mono">
          ⚠ {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
        {/* COM Port selection */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-mono block mb-1.5">
            Target COM Interface
          </label>
          <div className="flex gap-2">
            <select
              value={selectedPort}
              onChange={(e) => setSelectedPort(e.target.value)}
              disabled={comStatus.is_connected}
              className="flex-1 bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 outline-none focus:border-accent-green disabled:opacity-50"
            >
              <option value="COM8">COM8 (ESP32 Sensor preferred)</option>
              <option value="COM3">COM3</option>
              <option value="COM4">COM4</option>
              <option value="COM7">COM7</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {comStatus.is_connected ? (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all font-semibold py-2 rounded-lg text-xs"
            >
              <Link2Off size={14} />
              <span>DISCONNECT SERIAL LINK</span>
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-accent-green text-slate-950 hover:bg-opacity-90 transition-all font-semibold py-2 rounded-lg text-xs shadow-[0_0_15px_rgba(57,255,20,0.15)]"
            >
              <Link2 size={14} />
              <span>ESTABLISH SERIAL LINK</span>
            </button>
          )}
        </div>
      </div>

      {/* Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 font-mono text-[12px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${comStatus.is_connected ? "bg-accent-green" : "bg-slate-700"}`} />
          <span>USB Connection: {comStatus.is_connected ? "Connected" : "Disconnected"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${comStatus.is_connected ? "bg-accent-green" : "bg-slate-700"}`} />
          <span>ESP32 Ready: {comStatus.is_connected ? "Yes" : "No"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${comStatus.is_connected ? "bg-accent-green" : "bg-slate-700"}`} />
          <span>Port: {comStatus.is_connected ? comStatus.port : "None"}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${comStatus.is_connected ? "bg-accent-green" : "bg-slate-700"}`} />
          <span>Baud Rate: 115200</span>
        </div>
      </div>
    </div>
  );
}

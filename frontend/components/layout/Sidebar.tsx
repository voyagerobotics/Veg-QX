"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cpu,
  History,
  TrendingUp,
  RotateCcw,
  CheckSquare,
  Award,
  Satellite,
  Activity,
  ChevronLeft,
} from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

const navItems = [
  { href: "/", label: "Control Center", icon: Satellite },
  { href: "/dashboard", label: "Live Dashboard", icon: Activity },
  { href: "/predict", label: "Prediction Engine", icon: Cpu },
  { href: "/history", label: "History Data", icon: History },
  { href: "/verify", label: "Verification Center", icon: CheckSquare },
  { href: "/retrain", label: "Retraining Center", icon: RotateCcw },
  { href: "/models", label: "Versioning Center", icon: Award },
  { href: "/analytics", label: "Analytics Panel", icon: TrendingUp },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [activeFood, setActiveFood] = useState("tomato");
  const [modelVersion, setModelVersion] = useState<string>("v1.0");
  const [usbPort, setUsbPort] = useState<string>("AUTO");

  useEffect(() => {
    const fetchActiveVersion = async () => {
      try {
        const health = await api.getHealth();
        if (health.model_version) {
          setModelVersion(health.model_version);
        }
        if (health.usb_port) {
          setUsbPort(health.usb_port);
        }
      } catch (e) {
        // quiet fallback
      }
    };
    fetchActiveVersion();
    const interval = setInterval(fetchActiveVersion, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-64 bg-white dark:bg-slate-950/80 border-r border-slate-200 dark:border-slate-850 backdrop-blur-xl flex flex-col h-full text-slate-700 dark:text-slate-300 shadow-sm transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-850 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/voyage_robotics_logo.png"
            alt="Voyage Robotics Logo"
            width={36}
            height={36}
            className="w-9 h-9 object-contain filter drop-shadow-[0_0_8px_rgba(16,185,129,0.25)]"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="flex flex-col justify-start">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tracking-widest font-sans uppercase leading-none">
              VEG QX
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono tracking-wider mt-1 uppercase font-semibold">
              Voyage Robotics
            </span>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            suppressHydrationWarning
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all"
            title="Collapse Navigation"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Food Type Selector */}
      <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-850/60">
        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-mono block mb-2 font-semibold">
          Active Food Matrix
        </label>
        <select
          value={activeFood}
          onChange={(e) => setActiveFood(e.target.value)}
          suppressHydrationWarning
          className="w-full bg-slate-50 dark:bg-[#0B1020] border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 font-mono shadow-xs"
        >
          <option value="tomato">Tomato (Active)</option>
          <option value="banana" disabled>Banana (Offline)</option>
          <option value="apple" disabled>Apple (Offline)</option>
          <option value="milk" disabled>Milk (Offline)</option>
        </select>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto font-sans">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 group border ${
                isActive
                  ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-xs font-bold"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Icon
                size={15}
                className={`transition-colors duration-200 ${
                  isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Scientific Specs Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-850 text-[10px] font-mono text-slate-500 dark:text-slate-400 space-y-1 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex justify-between"><span>SYS:</span> <span className="text-slate-700 dark:text-slate-300 font-semibold">AS7341 / ESP32</span></div>
        <div className="flex justify-between"><span>PORT:</span> <span className="text-slate-700 dark:text-slate-300 font-semibold">{usbPort} (115200)</span></div>
        <div className="flex justify-between"><span>MODEL_ACTIVE:</span> <span className="text-emerald-600 dark:text-emerald-400 font-bold">XGB_{modelVersion}</span></div>
      </div>
    </aside>
  );
}

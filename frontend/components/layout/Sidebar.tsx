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
import { useState } from "react";

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

  return (
    <aside className="w-64 bg-slate-950/80 border-r border-slate-900/60 backdrop-blur-xl flex flex-col h-screen sticky top-0 text-slate-300">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-900/60 flex items-center justify-between">
        <div className="flex flex-col justify-start">
          <span className="text-xl font-bold text-accent-green tracking-widest font-sans uppercase">
            VEG QX
          </span>
          <span className="text-[8.5px] text-slate-500 font-mono tracking-wider mt-1 uppercase">
            Advanced Spectral Quality
          </span>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-900 rounded text-slate-500 hover:text-slate-350 transition-all"
            title="Collapse Navigation"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Food Type Selector */}
      <div className="px-4 py-4 border-b border-slate-900/40">
        <label className="text-[9px] uppercase tracking-widest text-slate-500 font-mono block mb-2">
          Active Food Matrix
        </label>
        <select
          value={activeFood}
          onChange={(e) => setActiveFood(e.target.value)}
          className="w-full bg-[#0B1020] border border-slate-800 rounded-md px-3 py-1.5 text-[11px] text-slate-200 outline-none focus:border-accent-green font-mono"
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
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold tracking-wide transition-all duration-200 group border ${
                isActive
                  ? "bg-accent-green/5 border-accent-green/20 text-accent-green shadow-[0_0_12px_rgba(45,255,106,0.05)]"
                  : "border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-100"
              }`}
            >
              <Icon
                size={14}
                className={`transition-colors duration-200 ${
                  isActive ? "text-accent-green" : "text-slate-500 group-hover:text-slate-350"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Scientific Specs Footer */}
      <div className="p-4 border-t border-slate-900/60 text-[9px] font-mono text-slate-500 space-y-1 bg-slate-950/20">
        <div className="flex justify-between"><span>SYS:</span> <span className="text-slate-400">AS7341 / ESP32</span></div>
        <div className="flex justify-between"><span>PORT:</span> <span className="text-slate-400">COM8 (115200)</span></div>
        <div className="flex justify-between"><span>MODEL_ACTIVE:</span> <span className="text-accent-green">XGB_v1.1</span></div>
      </div>
    </aside>
  );
}

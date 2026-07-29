"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

const steps = [
  "INITIALIZING",
  "CALIBRATING",
  "CAPTURING SPECTRAL DATA",
  "FEATURE EXTRACTION",
  "RUNNING AI MODEL",
  "QUALITY ASSESSMENT COMPLETE"
];

export default function TomatoScene() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % steps.length);
    }, 1000); // 1000ms per step = 6s loop
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-[320px] relative rounded-2xl overflow-hidden bg-[#0B1020] border border-slate-900 flex flex-col items-center justify-center">
      {/* CSS Animation Keyframes */}
      <style>{`
        @keyframes laser-sweep-h {
          0%, 100% { transform: translateY(-42px); opacity: 0; }
          15%, 85% { opacity: 0.95; }
          50% { transform: translateY(42px); }
        }
        @keyframes laser-sweep-v {
          0%, 100% { transform: translateX(-50px); opacity: 0; }
          20%, 80% { opacity: 0.7; }
          50% { transform: translateX(50px); }
        }
        @keyframes orbit-1 {
          0% { transform: rotate(0deg) translateX(85px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(85px) rotate(-360deg); }
        }
        @keyframes orbit-2 {
          0% { transform: rotate(180deg) translateX(105px) rotate(-180deg); }
          100% { transform: rotate(540deg) translateX(105px) rotate(-540deg); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.65); opacity: 0; }
          50% { opacity: 0.35; }
          100% { transform: scale(1.45); opacity: 0; }
        }
        @keyframes blink-slow {
          0%, 100% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes breathing-glow {
          0%, 100% {
            box-shadow: 0 0 25px rgba(239, 68, 68, 0.2), inset 0 0 10px rgba(255, 255, 255, 0.08);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 35px rgba(239, 68, 68, 0.4), inset 0 0 15px rgba(255, 255, 255, 0.12);
            transform: scale(1.015);
          }
        }
      `}</style>

      {/* HUD Header info */}
      <div className="absolute top-3 left-4 z-10 font-mono text-[9px] text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
        <span>Target Acquisition Telemetry</span>
      </div>

      <div className="absolute top-3 right-4 z-10 font-mono text-[9px] text-slate-500">
        SYS_LOCK: ACTIVE_COM8
      </div>

      {/* Grid Backdrop */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px),
                            linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: "20px 20px"
        }}
      />

      {/* Center 2D Glowing Scientific Tomato Graphic */}
      <div className="relative flex items-center justify-center select-none z-10 w-[240px] h-[240px]">
        {/* Holographic grid beneath the tomato */}
        <div 
          className="absolute bottom-4 w-[180px] h-[45px] opacity-[0.08] pointer-events-none z-0"
          style={{
            backgroundImage: `linear-gradient(to right, #00E5FF 1.5px, transparent 1px),
                              linear-gradient(to bottom, #00E5FF 1.5px, transparent 1px)`,
            backgroundSize: "16px 8px",
            transform: "perspective(150px) rotateX(65deg)",
            maskImage: "radial-gradient(ellipse at center, black, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black, transparent 75%)"
          }}
        />

        {/* Pulsing Concentric Scan Waves */}
        <div className="absolute w-[150px] h-[150px] border border-accent-green/15 rounded-full animate-[pulse-ring_4s_cubic-bezier(0.215,0.61,0.355,1)_infinite]" />
        <div className="absolute w-[150px] h-[150px] border border-accent-blue/10 rounded-full animate-[pulse-ring_4s_cubic-bezier(0.215,0.61,0.355,1)_infinite_2s]" />

        {/* Rotating Circular Scanner Rings */}
        <div className="absolute w-[200px] h-[200px] border border-dashed border-accent-green/20 rounded-full animate-[spin_12s_linear_infinite]" />
        <div className="absolute w-[170px] h-[170px] border border-dotted border-accent-blue/15 rounded-full animate-[spin_8s_linear_infinite_reverse]" />

        {/* Conic-gradient Conical Radar Sweep */}
        <div 
          className="absolute w-[170px] h-[170px] rounded-full pointer-events-none opacity-[0.18] animate-[spin_4s_linear_infinite]"
          style={{
            background: "conic-gradient(from 0deg, rgba(45, 255, 106, 0.3) 0%, transparent 50%)"
          }}
        />

        {/* Corner Target Locks */}
        <div className="absolute w-[125px] h-[105px] pointer-events-none z-20">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-accent-blue/60" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-accent-blue/60" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-accent-blue/60" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-accent-blue/60" />
        </div>

        {/* Orbiting Particles */}
        <div className="absolute w-[200px] h-[200px] pointer-events-none">
          <div className="w-1.5 h-1.5 bg-accent-green shadow-[0_0_8px_#2DFF6A] rounded-full absolute top-1/2 left-1/2 -ml-0.75 -mt-0.75 animate-[orbit-1_5s_linear_infinite]" />
          <div className="w-1 h-1 bg-accent-blue shadow-[0_0_6px_#00E5FF] rounded-full absolute top-1/2 left-1/2 -ml-0.5 -mt-0.5 animate-[orbit-2_7s_linear_infinite]" />
        </div>

        {/* Tomato Graphic Wrapper */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Leaf/Stem */}
          <div className="w-3 h-4 bg-emerald-500 rounded-full absolute -top-3 shadow-[0_0_12px_rgba(16,185,129,0.4)] transform -rotate-12 z-20" />
          
          {/* Tomato Body with Breathing Glow */}
          <div className="w-24 h-20 bg-gradient-to-tr from-red-600 to-red-500 rounded-[50%_50%_45%_45%] relative border border-red-500/20 flex items-center justify-center animate-[breathing-glow_4s_ease-in-out_infinite] z-10 overflow-hidden">
            {/* Inner highlights */}
            <div className="absolute top-2 left-4 w-5 h-2 bg-white/20 rounded-[50%]" />
            
            {/* Diagnostic Crosshair overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <div className="w-full h-[0.5px] bg-accent-green" />
              <div className="h-full w-[0.5px] bg-accent-green absolute" />
            </div>

            {/* Blinking Sensor Nodes */}
            <div className="absolute top-4 left-5 w-1 h-1 rounded-full bg-accent-green shadow-[0_0_6px_#2DFF6A] animate-[blink-slow_1.5s_infinite]" />
            <div className="absolute top-10 right-4 w-1 h-1 rounded-full bg-accent-blue shadow-[0_0_6px_#00E5FF] animate-[blink-slow_2s_infinite_0.5s]" />
            <div className="absolute bottom-5 left-7 w-1 h-1 rounded-full bg-accent-green shadow-[0_0_6px_#2DFF6A] animate-[blink-slow_1.8s_infinite_0.2s]" />
            <div className="absolute bottom-6 right-8 w-1 h-1 rounded-full bg-accent-green shadow-[0_0_6px_#2DFF6A] animate-[blink-slow_2.2s_infinite_0.7s]" />

            {/* Dynamic Step Text */}
            <span className="text-[7.5px] font-mono text-accent-green tracking-wider uppercase bg-slate-950/90 px-1.5 py-0.5 rounded border border-accent-green/25 z-20">
              {steps[stepIndex]}
            </span>
          </div>

          {/* Sweeping Laser Lines (Horizontal & Vertical) */}
          <div className="absolute w-[110px] h-[1.5px] bg-gradient-to-r from-transparent via-accent-green to-transparent opacity-85 z-20 pointer-events-none animate-[laser-sweep-h_4s_ease-in-out_infinite]" />
          <div className="absolute h-[90px] w-[1.5px] bg-gradient-to-b from-transparent via-accent-blue to-transparent opacity-60 z-20 pointer-events-none animate-[laser-sweep-v_3s_ease-in-out_infinite]" />
        </div>
      </div>

      {/* Footer telemetry log */}
      <div className="absolute bottom-3 left-6 right-6 font-mono text-[8px] text-slate-550 flex justify-between">
        <div className="flex items-center gap-1.5">
          <Activity size={10} className="text-accent-green" />
          <span>SPECTRAL TARGET LOCK: VEG-QX-SOLANUM</span>
        </div>
        <span>MATRIX ACTIVE</span>
      </div>
    </div>
  );
}

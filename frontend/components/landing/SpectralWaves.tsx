"use client";

import { motion } from "framer-motion";

const bands = [
  { name: "Blue", color: "rgba(59, 130, 246, 0.4)", delay: 0 },
  { name: "Green", color: "rgba(16, 185, 129, 0.4)", delay: 0.2 },
  { name: "Yellow", color: "rgba(234, 179, 8, 0.4)", delay: 0.4 },
  { name: "Orange", color: "rgba(249, 115, 22, 0.4)", delay: 0.6 },
  { name: "Red", color: "rgba(239, 68, 68, 0.4)", delay: 0.8 },
  { name: "NIR", color: "rgba(139, 92, 246, 0.4)", delay: 1.0 },
];

export default function SpectralWaves() {
  return (
    <div className="bg-[#0B1020] border border-slate-900 rounded-xl p-4 relative overflow-hidden h-[155px] flex flex-col justify-between shadow-md">
      <div className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block mb-1">
        SPECTRAL_REFLECTANCE_TELEMETRY_WAVES
      </div>

      <div className="flex-1 flex items-center justify-around gap-2 px-2 relative min-h-[60px]">
        {/* Animated wave lines behind */}
        <div className="absolute inset-0 flex items-center justify-center opacity-45">
          <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
            {bands.map((band, idx) => (
              <motion.path
                key={band.name}
                d={`M 0,${50 + idx * 4} Q 100,${20 + idx * 6} 200,${50 + idx * 2} T 400,${50 + idx * 3}`}
                fill="none"
                stroke={idx % 2 === 0 ? "rgba(0, 229, 255, 0.45)" : "rgba(45, 255, 106, 0.45)"}
                strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: 1,
                  opacity: [0.2, 0.8, 0.2],
                  d: [
                    `M 0,${50 + idx * 4} Q 100,${20 + idx * 6} 200,${50 + idx * 2} T 400,${50 + idx * 3}`,
                    `M 0,${55 - idx * 2} Q 120,${60 + idx * 4} 240,${40 - idx * 3} T 400,${55 + idx * 2}`,
                    `M 0,${50 + idx * 4} Q 100,${20 + idx * 6} 200,${50 + idx * 2} T 400,${50 + idx * 3}`
                  ]
                }}
                transition={{
                  duration: 5 + idx,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </svg>
        </div>

        {/* Legend pills with interactive glows */}
        {bands.map((band, idx) => {
          const pillColor = idx % 2 === 0 ? "rgba(0, 229, 255, 0.45)" : "rgba(45, 255, 106, 0.45)";
          return (
            <div key={band.name} className="flex flex-col items-center gap-1 z-10">
              <motion.div
                className="w-2.5 h-8 rounded-full cursor-help relative group"
                style={{ backgroundColor: pillColor }}
                animate={{
                  scaleY: [1, 1.3, 0.9, 1.15, 1],
                  boxShadow: [
                    `0 0 4px ${pillColor}`,
                    `0 0 12px ${pillColor}`,
                    `0 0 4px ${pillColor}`
                  ]
                }}
                transition={{
                  duration: 2.5 + Math.random() * 2,
                  repeat: Infinity,
                  delay: band.delay,
                }}
              >
                {/* Tooltip info */}
                <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[8px] text-slate-355 font-mono shadow-lg whitespace-nowrap z-30">
                  {band.name} telemetry active
                </div>
              </motion.div>
              <span className="text-[8px] font-mono font-semibold text-slate-500 uppercase">
                {band.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

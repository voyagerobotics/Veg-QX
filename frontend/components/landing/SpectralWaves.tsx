"use client";

import { useEffect, useRef } from "react";

const spectralBands = [
  { name: "BLUE", wavelength: "450nm", color: "#3B82F6", freq: 0.014, amp: 34, phase: 0.0, speed: 0.024 },
  { name: "GREEN", wavelength: "530nm", color: "#10B981", freq: 0.018, amp: 26, phase: 1.4, speed: 0.019 },
  { name: "YELLOW", wavelength: "590nm", color: "#EAB308", freq: 0.012, amp: 22, phase: 2.6, speed: 0.016 },
  { name: "ORANGE", wavelength: "630nm", color: "#F97316", freq: 0.022, amp: 32, phase: 3.8, speed: 0.022 },
  { name: "RED", wavelength: "670nm", color: "#EF4444", freq: 0.015, amp: 19, phase: 4.9, speed: 0.015 },
  { name: "NIR", wavelength: "850nm", color: "#B56EFF", freq: 0.020, amp: 42, phase: 5.6, speed: 0.027 },
];

export default function SpectralWaves() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.03;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // ─── 1. Oscilloscope Laboratory Grid Lines ─────────────────────────────
      ctx.strokeStyle = "rgba(0, 255, 180, 0.05)";
      ctx.lineWidth = 1;

      // Vertical grid lines
      const gridSpacingX = width / 14;
      for (let x = 0; x <= width; x += gridSpacingX) {
        ctx.beginPath();
        ctx.setLineDash([2, 3]);
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal grid lines
      const gridSpacingY = height / 6;
      for (let y = 0; y <= height; y += gridSpacingY) {
        ctx.beginPath();
        ctx.setLineDash([2, 3]);
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.setLineDash([]); // Reset line dash

      // Baseline axis line
      ctx.strokeStyle = "rgba(0, 229, 255, 0.15)";
      ctx.beginPath();
      ctx.moveTo(0, height * 0.55);
      ctx.lineTo(width, height * 0.55);
      ctx.stroke();

      // ─── 2. Smooth Bezier Interpolated Waveform Curves ────────────────────
      spectralBands.forEach((band) => {
        ctx.save();
        ctx.strokeStyle = band.color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = band.color;
        ctx.shadowBlur = 8;

        ctx.beginPath();

        const centerY = height * 0.55;
        let prevX = 0;
        let prevY = centerY + Math.sin(time * band.speed + band.phase) * band.amp;

        ctx.moveTo(prevX, prevY);

        const step = 5;
        for (let x = step; x <= width; x += step) {
          const y =
            centerY +
            Math.sin(x * band.freq + time * band.speed + band.phase) * band.amp +
            Math.cos(x * 0.009 - time * 0.016) * 10;

          const cpX = (prevX + x) / 2;
          const cpY = (prevY + y) / 2;

          ctx.quadraticCurveTo(prevX, prevY, cpX, cpY);

          prevX = x;
          prevY = y;
        }

        ctx.lineTo(width, prevY);
        ctx.stroke();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="bg-[#070B12] border border-[rgba(0,255,180,0.15)] rounded-2xl p-5 shadow-[0_0_30px_rgba(0,255,136,0.05)] relative overflow-hidden flex flex-col justify-between select-none font-mono min-h-[265px]">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[rgba(0,255,180,0.12)] pb-3 mb-2 z-10">
        <div>
          <h3 className="text-xs font-bold text-[#00FF88] uppercase tracking-[0.15em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
            SPECTRAL REFLECTANCE TELEMETRY: SPECTRALWAVES
          </h3>
        </div>
        <span className="text-[9px] text-[#00E5FF] tracking-[0.12em] uppercase font-semibold opacity-90">
          LABORATORY OSCILLOSCOPE ANALYZER // 60 FPS LIVE
        </span>
      </div>

      {/* Canvas Oscilloscope Display */}
      <div className="relative w-full h-[150px] rounded-xl overflow-hidden bg-[#050810] border border-[rgba(0,255,180,0.12)] shadow-inner flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={150}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Bottom Wavelength Labels Legend Row */}
      <div className="grid grid-cols-6 gap-2 pt-3 border-t border-[rgba(0,255,180,0.12)] text-center z-10">
        {spectralBands.map((band) => (
          <div key={band.name} className="flex flex-col items-center">
            <span className="text-[10px] font-bold tracking-widest" style={{ color: band.color }}>
              {band.name}
            </span>
            <span className="text-[9px] text-slate-400 tracking-wider block font-mono mt-0.5 opacity-80">
              {band.wavelength}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

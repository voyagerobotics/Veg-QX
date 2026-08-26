"use client";

interface SensorCardProps {
  name: string;
  value: number;
  min: number;
  max: number;
  avg: number;
  color: string;
  maxPossible?: number;
}

export default function SensorCard({
  name,
  value,
  min,
  max,
  avg,
  color,
  maxPossible = 600,
}: SensorCardProps) {
  const safeVal = typeof value === "number" && !isNaN(value) && isFinite(value) ? value : 0;
  const safeMin = typeof min === "number" && !isNaN(min) && isFinite(min) ? min : safeVal;
  const safeMax = typeof max === "number" && !isNaN(max) && isFinite(max) ? max : safeVal;
  const safeAvg = typeof avg === "number" && !isNaN(avg) && isFinite(avg) ? avg : safeVal;

  const percentage = Math.min(100, Math.max(0, (safeVal / maxPossible) * 100));

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-slate-800/40 space-y-4 shadow-sm dark:shadow-md">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          {name} Band
        </span>
        <span className="text-lg font-mono font-extrabold" style={{ color }}>
          {safeVal.toFixed(1)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-800">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>

      {/* Grid of Telemetry Stats */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-900/60 font-mono text-[11px] text-slate-500 dark:text-slate-400">
        <div>
          <span className="block text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-semibold">MIN</span>
          <span className="text-slate-800 dark:text-slate-200 font-bold">{safeMin.toFixed(1)}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-semibold">AVG</span>
          <span className="text-slate-800 dark:text-slate-200 font-bold">{safeAvg.toFixed(1)}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-semibold">MAX</span>
          <span className="text-slate-800 dark:text-slate-200 font-bold">{safeMax.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

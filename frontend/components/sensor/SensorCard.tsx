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
  const percentage = Math.min(100, Math.max(0, (value / maxPossible) * 100));

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800/40 space-y-4">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
          {name} Band
        </span>
        <span className="text-lg font-mono font-bold" style={{ color }}>
          {value.toFixed(1)}
        </span>
      </div>

      {/* Progress Bar (Module 3 requirement: Animated progress bars) */}
      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>

      {/* Grid of Telemetry Stats (Module 3: Current, Min, Max, Average) */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900/60 font-mono text-[11px] text-slate-500">
        <div>
          <span className="block text-[10px] uppercase tracking-widest text-slate-600">MIN</span>
          <span className="text-slate-300">{min.toFixed(1)}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-widest text-slate-600">AVG</span>
          <span className="text-slate-300">{avg.toFixed(1)}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-widest text-slate-600">MAX</span>
          <span className="text-slate-300">{max.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

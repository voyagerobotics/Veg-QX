"use client";

interface FreshnessGaugeProps {
  score: number;
}

export default function FreshnessGauge({ score }: FreshnessGaugeProps) {
  // SVG circular path params
  const radius = 60;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  let color = "#ff3b30"; // Red
  if (score >= 60) {
    color = "#39ff14"; // Green
  } else if (score >= 40) {
    color = "#ffaa00"; // Orange
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-2 p-4">
      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* SVG Circle Gauge */}
        <svg className="w-full h-full transform -rotate-95" viewBox="0 0 140 140">
          {/* Background circle track */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={strokeWidth}
          />
          {/* Active value circle path */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${color}44)`,
            }}
          />
        </svg>

        {/* Text score label overlays */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
            {score.toFixed(1)}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Freshness Score
          </span>
        </div>
      </div>
    </div>
  );
}

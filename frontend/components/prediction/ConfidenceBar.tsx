"use client";

interface ConfidenceBarProps {
  fresh: number;
  aging: number;
  spoiling: number;
}

export default function ConfidenceBar({ fresh, aging, spoiling }: ConfidenceBarProps) {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800/50 space-y-4 shadow-sm dark:shadow-md transition-colors duration-200">
      <div>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5 font-semibold">
          Module 05
        </span>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
          Class Probability Confidence
        </h3>
      </div>

      <div className="space-y-3 font-mono text-xs">
        {/* Fresh */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-semibold">
            <span className="text-emerald-700 dark:text-emerald-400">🟢 FRESH</span>
            <span className="text-slate-900 dark:text-white font-bold">{(fresh * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-800">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700 shadow-[0_0_8px_#10b981]"
              style={{ width: `${fresh * 100}%` }}
            />
          </div>
        </div>

        {/* Aging */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-semibold">
            <span className="text-amber-700 dark:text-amber-400">🟡 AGING</span>
            <span className="text-slate-900 dark:text-white font-bold">{(aging * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-800">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-700 shadow-[0_0_8px_#f59e0b]"
              style={{ width: `${aging * 100}%` }}
            />
          </div>
        </div>

        {/* Spoiling */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-semibold">
            <span className="text-red-700 dark:text-red-400">🔴 SPOILING</span>
            <span className="text-slate-900 dark:text-white font-bold">{(spoiling * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-800">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-700 shadow-[0_0_8px_#ef4444]"
              style={{ width: `${spoiling * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

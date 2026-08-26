"use client";

interface IndexDisplayProps {
  ndvi: number;
  gndvi: number;
  rvi: number;
}

export default function IndexDisplay({ ndvi, gndvi, rvi }: IndexDisplayProps) {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800/50 space-y-6 shadow-sm dark:shadow-md transition-colors duration-200">
      <div>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5 font-semibold">
          Module 04
        </span>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
          Calculated Vegetation Indexes
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* NDVI */}
        <div className="bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-900 rounded-xl p-4 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-400">NDVI</span>
            <span className="text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              {ndvi.toFixed(4)}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-500 block border-t border-slate-200 dark:border-slate-900 pt-2 font-semibold">
            Formula: (NIR - Red) / (NIR + Red)
          </div>
          <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-normal">
            Normalised difference active vegetation indicator. Captures chlorophyll reflectance contrast.
          </p>
        </div>

        {/* GNDVI */}
        <div className="bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-900 rounded-xl p-4 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-400">GNDVI</span>
            <span className="text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              {gndvi.toFixed(4)}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-500 block border-t border-slate-200 dark:border-slate-900 pt-2 font-semibold">
            Formula: (NIR - Green) / (NIR + Green)
          </div>
          <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-normal">
            Green relative vegetation index. Measures water and nitrogen concentration in plant tissue.
          </p>
        </div>

        {/* RVI */}
        <div className="bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-900 rounded-xl p-4 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-400">RVI</span>
            <span className="text-sm font-mono font-extrabold text-sky-600 dark:text-sky-400">
              {rvi.toFixed(4)}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-500 block border-t border-slate-200 dark:border-slate-900 pt-2 font-semibold">
            Formula: NIR / Red
          </div>
          <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-normal">
            Ratio vegetation index. Strongly correlated with biomass density and leaf water index.
          </p>
        </div>
      </div>
    </div>
  );
}

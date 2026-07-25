"use client";

interface IndexDisplayProps {
  ndvi: number;
  gndvi: number;
  rvi: number;
}

export default function IndexDisplay({ ndvi, gndvi, rvi }: IndexDisplayProps) {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800/50 space-y-6">
      <div>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">
          Module 04
        </span>
        <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
          Calculated Vegetation Indexes
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* NDVI */}
        <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400">NDVI</span>
            <span className="text-sm font-mono font-bold text-accent-green">
              {ndvi.toFixed(4)}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-600 block border-t border-slate-900 pt-2">
            Formula: (NIR - Red) / (NIR + Red)
          </div>
          <p className="text-[12px] text-slate-500 leading-normal">
            Normalised difference active vegetation indicator. Captures chlorophyll reflectance contrast.
          </p>
        </div>

        {/* GNDVI */}
        <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400">GNDVI</span>
            <span className="text-sm font-mono font-bold text-accent-green">
              {gndvi.toFixed(4)}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-600 block border-t border-slate-900 pt-2">
            Formula: (NIR - Green) / (NIR + Green)
          </div>
          <p className="text-[12px] text-slate-500 leading-normal">
            Green relative vegetation index. Measures water and nitrogen concentration in plant tissue.
          </p>
        </div>

        {/* RVI */}
        <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400">RVI</span>
            <span className="text-sm font-mono font-bold text-accent-blue">
              {rvi.toFixed(4)}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-600 block border-t border-slate-900 pt-2">
            Formula: NIR / Red
          </div>
          <p className="text-[12px] text-slate-500 leading-normal">
            Ratio vegetation index. Strongly correlated with biomass density and leaf water index.
          </p>
        </div>
      </div>
    </div>
  );
}

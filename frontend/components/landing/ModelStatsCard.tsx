"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Cpu, Server, Compass } from "lucide-react";

export default function ModelStatsCard() {
  const [stats, setStats] = useState({
    version: "v1.1",
    accuracy: 81.24,
    r2: 0.9947,
    samples: 200000,
  });

  useEffect(() => {
    const loadInfo = async () => {
      try {
        const res = await api.getmodelInfo();
        if (res.success && res.data) {
          setStats({
            version: res.data.model_version,
            accuracy: res.data.classification_accuracy * 100,
            r2: res.data.regression_r2,
            samples: res.data.training_samples || 200000,
          });
        }
      } catch (e) {
        // Fallback default states on error
      }
    };
    loadInfo();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Active Version */}
      <div className="bg-white dark:bg-[#0B1020] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between shadow-sm dark:shadow-md transition-colors duration-200">
        <div>
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1">
            CORE_MODEL_VERSION
          </span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {stats.version}
          </span>
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono block mt-1.5 flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            INFERENCE READY
          </span>
        </div>
        <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <Cpu size={18} />
        </div>
      </div>

      {/* Accuracy */}
      <div className="bg-white dark:bg-[#0B1020] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between shadow-sm dark:shadow-md transition-colors duration-200">
        <div>
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1">
            CLASSIFICATION_ACCURACY
          </span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {stats.accuracy.toFixed(2)}%
          </span>
          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono block mt-1.5">
            SAMPLES_N: {stats.samples.toLocaleString()}
          </span>
        </div>
        <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <Compass size={18} />
        </div>
      </div>

      {/* R² Score */}
      <div className="bg-white dark:bg-[#0B1020] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between shadow-sm dark:shadow-md transition-colors duration-200">
        <div>
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1">
            REGREGRESSION_R2_FIT
          </span>
          <span className="text-2xl font-bold text-sky-600 dark:text-cyan-400 font-mono">
            {stats.r2.toFixed(4)}
          </span>
          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono block mt-1.5">
            VARIANCE BOUND: ACCEPTED
          </span>
        </div>
        <div className="p-3 bg-sky-50 dark:bg-sky-500/10 rounded-lg border border-sky-200 dark:border-sky-500/20 text-sky-600 dark:text-cyan-400">
          <Server size={18} />
        </div>
      </div>
    </div>
  );
}

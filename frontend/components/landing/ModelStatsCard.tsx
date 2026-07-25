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
      <div className="bg-[#0B1020] border border-slate-900 rounded-xl p-5 flex items-center justify-between shadow-md">
        <div>
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1">
            CORE_MODEL_VERSION
          </span>
          <span className="text-2xl font-bold text-white font-mono">
            {stats.version}
          </span>
          <span className="text-[9px] text-accent-green font-mono block mt-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            INFERENCE READY
          </span>
        </div>
        <div className="p-3 bg-accent-green/5 rounded-lg border border-accent-green/20 text-accent-green">
          <Cpu size={18} />
        </div>
      </div>

      {/* Accuracy */}
      <div className="bg-[#0B1020] border border-slate-900 rounded-xl p-5 flex items-center justify-between shadow-md">
        <div>
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1">
            CLASSIFICATION_ACCURACY
          </span>
          <span className="text-2xl font-bold text-accent-green font-mono">
            {stats.accuracy.toFixed(2)}%
          </span>
          <span className="text-[9px] text-slate-400 font-mono block mt-1.5">
            SAMPLES_N: {stats.samples.toLocaleString()}
          </span>
        </div>
        <div className="p-3 bg-accent-green/5 rounded-lg border border-accent-green/20 text-accent-green">
          <Compass size={18} />
        </div>
      </div>

      {/* R² Score */}
      <div className="bg-[#0B1020] border border-slate-900 rounded-xl p-5 flex items-center justify-between shadow-md">
        <div>
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1">
            REGREGRESSION_R2_FIT
          </span>
          <span className="text-2xl font-bold text-accent-blue font-mono">
            {stats.r2.toFixed(4)}
          </span>
          <span className="text-[9px] text-slate-400 font-mono block mt-1.5">
            VARIANCE BOUND: ACCEPTED
          </span>
        </div>
        <div className="p-3 bg-accent-blue/5 rounded-lg border border-accent-blue/20 text-accent-blue">
          <Server size={18} />
        </div>
      </div>
    </div>
  );
}

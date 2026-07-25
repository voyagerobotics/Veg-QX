"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ModelVersion } from "@/lib/types";
import { Award, Layers, Calendar, RefreshCw } from "lucide-react";

export default function ModelVersioningPage() {
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const res = await api.getModelVersions();
      if (res.success && res.data) {
        setVersions(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVersions();
  }, []);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="border-b border-slate-900 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-mono tracking-wide uppercase flex items-center gap-2">
            <Award size={24} className="text-accent-green" />
            Core Pipeline Version Control
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Module 11: Browse and audit historical version compilations of the Tomato Freshness quality models.
          </p>
        </div>
        <button
          onClick={loadVersions}
          className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Main Grid: Active Version Details + Version History list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Active Version details panel on left */}
        <div className="lg:col-span-1 glass-panel rounded-2xl p-6 border border-slate-850 space-y-6">
          <div className="border-b border-slate-900 pb-3 flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
              Active production
            </span>
            <Layers size={14} className="text-accent-green animate-pulse" />
          </div>

          {versions.filter(v => v.is_active === 1).map((active) => (
            <div key={active.id} className="space-y-4 font-mono text-xs">
              <div className="flex justify-between items-center bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                <span className="text-slate-400">Version Identifier:</span>
                <span className="text-lg font-bold text-accent-green">{active.version}</span>
              </div>
              <div className="space-y-2 border-t border-slate-900 pt-3 text-slate-400">
                <div className="flex justify-between"><span>Trained on:</span><span className="text-white">{active.trained_at.split(' ')[0]}</span></div>
                <div className="flex justify-between"><span>Training samples:</span><span className="text-white">{active.training_samples.toLocaleString()} rows</span></div>
                <div className="flex justify-between"><span>Acc Accuracy:</span><span className="text-accent-green">{(active.classification_accuracy * 100).toFixed(2)}%</span></div>
                <div className="flex justify-between"><span>Reg R²:</span><span className="text-accent-blue">{active.regression_r2.toFixed(4)}</span></div>
              </div>
              {active.notes && (
                <div className="p-3 bg-slate-950 border border-slate-900 rounded-lg text-[9px] text-slate-500 leading-normal">
                  <span className="block font-bold text-slate-400 mb-1">COMPILATION NOTES:</span>
                  {active.notes}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Versions Table list on right */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800/50 space-y-4">
          <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider border-b border-slate-900 pb-3">
            Compilation Changelog History
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full font-mono text-[10px] text-left border-collapse">
              <thead>
                <tr className="text-slate-500 border-b border-slate-950 pb-2">
                  <th className="pb-1">VER</th>
                  <th className="pb-1">TRAINED_DATE</th>
                  <th className="pb-1">SAMPLES</th>
                  <th className="pb-1">ACCURACY</th>
                  <th className="pb-1">R² SCORE</th>
                  <th className="pb-1 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-950/30">
                {versions.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-950/40">
                    <td className="py-2.5 font-bold text-white">{v.version}</td>
                    <td className="py-2.5 text-slate-400">{v.trained_at.split(' ')[0]}</td>
                    <td className="py-2.5 text-slate-400">{v.training_samples.toLocaleString()}</td>
                    <td className="py-2.5 text-slate-300 font-semibold">{(v.classification_accuracy * 100).toFixed(2)}%</td>
                    <td className="py-2.5 text-slate-300 font-semibold">{v.regression_r2.toFixed(4)}</td>
                    <td className="py-2.5 text-right">
                      {v.is_active === 1 ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-accent-green border border-emerald-500/20 font-bold text-[8px] uppercase animate-pulse">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 font-bold text-[8px] uppercase">
                          ARCHIVED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

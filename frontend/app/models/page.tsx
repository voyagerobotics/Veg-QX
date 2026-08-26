"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ModelVersion } from "@/lib/types";
import { Layers, RefreshCw, CheckCircle2, Trash2, AlertTriangle, ShieldCheck } from "lucide-react";

export default function ModelVersioningPage() {
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // 2-Step Confirmation Modal state for deletion
  const [deleteTargetVersion, setDeleteTargetVersion] = useState<string | null>(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<1 | 2 | null>(null);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const res = await api.getModelVersions();
      if (res.success && res.data) {
        setVersions(res.data);
      }
    } catch (e) {
      console.error("Error loading model versions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVersions();
  }, []);

  const handleActivate = async (version: string) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await api.activateModelVersion(version);
      if (res.success) {
        setMessage({ text: `✔ Model version ${version} is now ACTIVE in production.`, isError: false });
        await loadVersions();
      } else {
        setMessage({ text: res.message || "Failed to activate model.", isError: true });
      }
    } catch (err: any) {
      setMessage({ text: err.response?.data?.detail || err.message || "Activation error.", isError: true });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartDelete = (version: string) => {
    if (version === "v1.0" || version === "v1.1") return;
    setDeleteTargetVersion(version);
    setDeleteConfirmStep(1);
  };

  const handleProceedToDeleteStep2 = () => {
    setDeleteConfirmStep(2);
  };

  const handleCancelDelete = () => {
    setDeleteTargetVersion(null);
    setDeleteConfirmStep(null);
  };

  const handleFinalDeleteConfirm = async () => {
    if (!deleteTargetVersion) return;
    setActionLoading(true);
    setMessage(null);
    const target = deleteTargetVersion;
    
    try {
      const res = await api.deleteModelVersion(target);
      if (res.success) {
        setMessage({ text: `✔ Retrained model version ${target} deleted successfully.`, isError: false });
        handleCancelDelete();
        await loadVersions();
      } else {
        setMessage({ text: res.message || "Failed to delete model version.", isError: true });
        handleCancelDelete();
      }
    } catch (err: any) {
      setMessage({ text: err.response?.data?.detail || err.message || "Delete error.", isError: true });
      handleCancelDelete();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-wide uppercase flex items-center gap-3">
            <img src="/voyage_robotics_logo.png" alt="Voyage Robotics Logo" width={28} height={28} className="w-7 h-7 object-contain filter drop-shadow-[0_0_8px_rgba(16,185,129,0.25)]" />
            <span>Core Pipeline Version Control</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Module 11: Switch active production model versions, trigger retraining on target versions, and manage compiled models.
          </p>
        </div>
        <button
          onClick={loadVersions}
          className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors shadow-xs"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl font-mono text-xs border ${
          message.isError ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 font-medium" : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-medium"
        }`}>
          {message.text}
        </div>
      )}

      {/* Main Grid: Active Version Details + Version History list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Active Version details panel on left */}
        <div className="lg:col-span-1 glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-850 space-y-6 shadow-sm dark:shadow-md">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-semibold">
              Active production
            </span>
            <Layers size={14} className="text-emerald-600 dark:text-emerald-400 animate-pulse" />
          </div>

          {versions.filter(v => v.is_active === 1).map((active) => (
            <div key={active.id} className="space-y-4 font-mono text-xs">
              <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-lg border border-emerald-200 dark:border-emerald-500/20 shadow-xs">
                <span className="text-slate-600 dark:text-slate-400 font-semibold">Version Identifier:</span>
                <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{active.version}</span>
              </div>
              <div className="space-y-2 border-t border-slate-200 dark:border-slate-900 pt-3 text-slate-600 dark:text-slate-400">
                <div className="flex justify-between"><span>Trained on:</span><span className="text-slate-900 dark:text-white font-bold">{active.trained_at.split(' ')[0]}</span></div>
                <div className="flex justify-between"><span>Training samples:</span><span className="text-slate-900 dark:text-white font-bold">{active.training_samples.toLocaleString()} rows</span></div>
                <div className="flex justify-between"><span>Acc Accuracy:</span><span className="text-emerald-600 dark:text-emerald-400 font-bold">{(active.classification_accuracy * 100).toFixed(2)}%</span></div>
                <div className="flex justify-between"><span>Reg R²:</span><span className="text-sky-600 dark:text-sky-400 font-bold">{active.regression_r2.toFixed(4)}</span></div>
              </div>
              {active.notes && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-lg text-[9px] text-slate-600 dark:text-slate-500 leading-normal">
                  <span className="block font-bold text-slate-700 dark:text-slate-400 mb-1">COMPILATION NOTES:</span>
                  {active.notes}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Versions Table list on right */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800/50 space-y-4 shadow-sm dark:shadow-md">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-mono uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-3">
            Compilation Changelog History
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full font-mono text-[10px] text-left border-collapse">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-2 uppercase tracking-wider text-[9px]">
                  <th className="pb-2">VER</th>
                  <th className="pb-2">TRAINED_DATE</th>
                  <th className="pb-2">SAMPLES</th>
                  <th className="pb-2">ACCURACY</th>
                  <th className="pb-2">R² SCORE</th>
                  <th className="pb-2">STATUS / ACTION</th>
                  <th className="pb-2 text-right">MANAGEMENT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900/40">
                {versions.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40">
                    <td className="py-3 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{v.version}</span>
                      {(v.version === "v1.0" || v.version === "v1.1") && (
                        <span title="Permanent System Baseline">
                          <ShieldCheck size={12} className="text-amber-500" />
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{v.trained_at.split(' ')[0]}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{v.training_samples.toLocaleString()}</td>
                    <td className="py-3 text-slate-800 dark:text-slate-300 font-semibold">{(v.classification_accuracy * 100).toFixed(2)}%</td>
                    <td className="py-3 text-slate-800 dark:text-slate-300 font-semibold">{v.regression_r2.toFixed(4)}</td>
                    
                    {/* Status & Activation Action */}
                    <td className="py-3">
                      {v.is_active === 1 ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-bold text-[8px] uppercase inline-flex items-center gap-1">
                          <CheckCircle2 size={10} /> ACTIVE
                        </span>
                      ) : (
                        <button
                          onClick={() => handleActivate(v.version)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold text-[8px] uppercase rounded transition-all shadow-xs disabled:opacity-50"
                        >
                          ACTIVATE MODEL
                        </button>
                      )}
                    </td>

                    {/* Management / Deletion Column */}
                    <td className="py-3 text-right">
                      {v.version === "v1.0" || v.version === "v1.1" ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-[8px] uppercase">
                          PERMANENT BASELINE
                        </span>
                      ) : v.is_active === 1 ? (
                        <span className="text-[8px] font-mono text-slate-400 dark:text-slate-600 uppercase font-semibold">
                          ACTIVE (PROTECTED)
                        </span>
                      ) : (
                        <button
                          onClick={() => handleStartDelete(v.version)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 font-bold text-[8px] uppercase rounded transition-all inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          <Trash2 size={10} /> DELETE
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          2-Step Confirmation Delete Modal
          ─────────────────────────────────────────────────────────────────────── */}
      {deleteConfirmStep !== null && deleteTargetVersion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 max-w-md w-full font-mono space-y-6 shadow-2xl">
            
            {/* Step 1 Confirmation */}
            {deleteConfirmStep === 1 && (
              <>
                <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <AlertTriangle size={22} className="flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                      DELETE MODEL VERSION {deleteTargetVersion}
                    </h3>
                    <span className="text-[9px] text-slate-500">CONFIRMATION STEP 1 OF 2</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Are you sure you want to delete retrained model version <strong className="text-slate-900 dark:text-white">{deleteTargetVersion}</strong>? 
                  This will remove the version entry from SQLite database records.
                </p>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={handleCancelDelete}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg text-xs font-semibold"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleProceedToDeleteStep2}
                    className="px-4 py-2 bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold hover:bg-amber-500/30 rounded-lg text-xs"
                  >
                    PROCEED TO STEP 2 (1/2)
                  </button>
                </div>
              </>
            )}

            {/* Step 2 Confirmation (Final Warning) */}
            {deleteConfirmStep === 2 && (
              <>
                <div className="flex items-center gap-3 text-red-600 dark:text-red-400 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <AlertTriangle size={22} className="flex-shrink-0 animate-pulse text-red-500" />
                  <div>
                    <h3 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase">
                      FINAL CONFIRMATION: PERMANENT DELETION
                    </h3>
                    <span className="text-[9px] text-red-500 font-bold">CONFIRMATION STEP 2 OF 2</span>
                  </div>
                </div>

                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl space-y-2">
                  <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed font-bold">
                    ⚠️ FINAL WARNING: Are you 100% certain you want to permanently delete model version {deleteTargetVersion}?
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400">
                    This will permanently delete the compiled binary file (<code className="text-slate-800 dark:text-slate-300 font-bold">tomato_freshness_pipeline_{deleteTargetVersion}.pkl</code>) and associated training snapshots. This action CANNOT be undone.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={handleCancelDelete}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg text-xs font-semibold"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleFinalDeleteConfirm}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs shadow-[0_4px_14px_rgba(239,68,68,0.3)] disabled:opacity-50"
                  >
                    {actionLoading ? "DELETING..." : "PERMANENTLY DELETE MODEL (2/2)"}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

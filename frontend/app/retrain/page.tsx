"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { RotateCcw, AlertTriangle, Play, ChevronRight, CheckCircle2 } from "lucide-react";

export default function RetrainingPage() {
  const [step, setStep] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleRetrain = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.retrainModel(notes);
      if (res.success) {
        setResult(res);
        setStep(3); // Go to evaluation results
      } else {
        setError(res.error || "Retraining failed checks.");
        setStep(1);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Retraining runtime error.");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="border-b border-slate-900 pb-4">
        <h2 className="text-2xl font-bold text-white font-mono tracking-wide uppercase flex items-center gap-2">
          <RotateCcw size={24} className="text-accent-green animate-spin" style={{ animationDuration: "10s" }} />
          Human-in-the-Loop Retraining Center
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Module 10: Retrain your XGBoost models using accumulated human-verified diagnostics under strictly enforced safety gates.
        </p>
      </div>

      {/* Retraining Stepper Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 font-mono text-xs text-slate-500 border-b border-slate-900/60 pb-6">
        <div className={`flex items-center gap-2 ${step === 1 ? "text-accent-green" : ""}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${step === 1 ? "border-accent-green text-accent-green" : "border-slate-800"}`}>1</span>
          <span>DATA READINESS</span>
        </div>
        <ChevronRight size={14} className="hidden lg:block self-center" />

        <div className={`flex items-center gap-2 ${step === 2 ? "text-accent-green" : ""}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${step === 2 ? "border-accent-green text-accent-green" : "border-slate-800"}`}>2</span>
          <span>TRIGGER RUN</span>
        </div>
        <ChevronRight size={14} className="hidden lg:block self-center" />

        <div className={`flex items-center gap-2 ${step === 3 ? "text-accent-green" : ""}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${step === 3 ? "border-accent-green text-accent-green" : "border-slate-800"}`}>3</span>
          <span>EVALUATION AUDIT</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-mono">
          ❌ RETRAINING ERROR: {error}
        </div>
      )}

      {/* Stepper Content Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Step panels on left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Data Check */}
          {step === 1 && (
            <div className="glass-panel rounded-2xl p-6 border border-slate-800/50 space-y-6">
              <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                Step 1: Dataset Verification checks
              </h3>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                Retraining requires combining the 100k reference dataset with newly logged data points inside verified_dataset.csv. Only human-verified positions are utilized to guarantee zero label contamination.
              </p>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 font-mono text-[10px] space-y-2 text-slate-500">
                <div>REFERENCE DATASET SIZE: <span className="text-white font-bold">100,000 samples</span></div>
                <div>VERIFIED DATASET SIZE: <span className="text-white font-bold">Accumulating...</span></div>
                <div>MINIMUM REQUIRED ACCUMULATION: <span className="text-accent-green font-bold">10 verified samples</span></div>
              </div>
              <button
                onClick={() => setStep(2)}
                className="flex items-center justify-center gap-2 bg-accent-green text-slate-950 font-semibold py-2.5 px-6 rounded-lg text-xs font-mono shadow-[0_0_15px_rgba(57,255,20,0.15)]"
              >
                <span>PROCEED TO RETRAIN</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Step 2: Trigger Retrain */}
          {step === 2 && (
            <div className="glass-panel rounded-2xl p-6 border border-slate-800/50 space-y-6">
              <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                Step 2: Initialize Retraining Pipeline
              </h3>
              <div className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block mb-1.5 uppercase tracking-widest text-slate-500 text-[9px]">Retraining Run Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Retraining pipeline v1.2 with real-world greenhouse tomato sensor logs."
                    rows={4}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 outline-none focus:border-accent-green placeholder:text-slate-650"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-mono"
                >
                  BACK
                </button>
                <button
                  onClick={handleRetrain}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-accent-green text-slate-950 font-semibold py-2.5 rounded-lg text-xs font-mono shadow-[0_0_15px_rgba(57,255,20,0.15)] disabled:opacity-50"
                >
                  <Play size={12} />
                  <span>{loading ? "TRAINING XGBOOST..." : "RUN CONTINUOUS LEARNING RUN"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Evaluation results */}
          {step === 3 && result && (
            <div className="glass-panel rounded-2xl p-6 border border-slate-800/50 space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3 text-accent-green">
                <CheckCircle2 size={18} />
                <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                  Retraining Successful. Active Model Bumped!
                </h3>
              </div>

              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                The retrained pipeline model passed all safety performance checks (R² ≥ 0.85). Model parameters were successfully compiled and version **{result.new_version}** has been deployed to the inference pipeline.
              </p>

              {/* Side-by-Side Model comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 font-mono">
                {/* Previous model */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 space-y-3">
                  <span className="text-[9px] uppercase tracking-widest text-slate-500">PREVIOUS MODEL ({result.base_version})</span>
                  <div className="space-y-1 text-xs">
                    <div>ACCURACY: <span className="text-white">{(result.metrics.old_accuracy * 100).toFixed(2)}%</span></div>
                    <div>REGRESSION R²: <span className="text-white">{result.metrics.old_r2.toFixed(4)}</span></div>
                  </div>
                </div>

                {/* New model */}
                <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-900/30 space-y-3">
                  <span className="text-[9px] uppercase tracking-widest text-accent-green">NEW MODEL ({result.new_version})</span>
                  <div className="space-y-1 text-xs">
                    <div>ACCURACY: <span className="text-accent-green font-bold">{(result.metrics.new_accuracy * 100).toFixed(2)}%</span></div>
                    <div>REGRESSION R²: <span className="text-accent-green font-bold">{result.metrics.new_r2.toFixed(4)}</span></div>
                    {result.metrics.mae && <div>MAE: <span className="text-slate-400">{result.metrics.mae.toFixed(4)}</span></div>}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setStep(1);
                  setNotes("");
                  setResult(null);
                }}
                className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 font-semibold py-2.5 rounded-lg text-xs font-mono"
              >
                CLOSE AND AUDIT COMPLETE
              </button>
            </div>
          )}
        </div>

        {/* Retraining Gate Guidelines card on right */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/50 space-y-4">
          <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle size={16} className="text-accent-yellow" />
            Safety gates rules
          </h3>
          <div className="space-y-3 font-mono text-[9px] text-slate-400 leading-normal">
            <div>
              <span className="text-accent-yellow font-bold block">01 / OVERFITTING FLOOR</span>
              <p>Model R² score must satisfy: R² ≥ 0.85. Anything less is rejected automatically.</p>
            </div>
            <div>
              <span className="text-accent-yellow font-bold block">02 / REGRESSION SLIPGATE</span>
              <p>Performance degradation from the baseline cannot exceed 3% (R² &lt; current R² - 0.03).</p>
            </div>
            <div>
              <span className="text-accent-yellow font-bold block">03 / NO AUTO RETRAIN</span>
              <p>ML models are never automatically updated on predictions. Triggering runs requires human interaction.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

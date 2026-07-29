"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import IndexDisplay from "@/components/prediction/IndexDisplay";
import FreshnessGauge from "@/components/prediction/FreshnessGauge";
import CategoryCard from "@/components/prediction/CategoryCard";
import ConfidenceBar from "@/components/prediction/ConfidenceBar";
import { Upload, ChevronRight, Terminal, BarChart2 } from "lucide-react";

export default function PredictionPage() {
  const [activeTab, setActiveTab] = useState<"single" | "multi" | "csv">("single");

  // ───────────────────────────────────────────────────────────────────────────
  // Tab 1: Single Prediction State & Logic
  // ───────────────────────────────────────────────────────────────────────────
  const [singleInput, setSingleInput] = useState({
    Blue: 50.0,
    Green: 57.0,
    Yellow: 63.0,
    Orange: 80.0,
    Red: 62.0,
    NIR: 94.0,
    tomato_id: 1001,
    position: 1,
  });
  const [singleResult, setSingleResult] = useState<any>(null);
  const [singleLoading, setSingleLoading] = useState(false);

  const fetchNextTomatoId = async () => {
    try {
      const res = await api.getNextTomatoId();
      if (res.success && res.next_tomato_id) {
        setSingleInput((prev) => ({ ...prev, tomato_id: res.next_tomato_id }));
        setMultiTomatoId(res.next_tomato_id);
      }
    } catch (e) {
      console.error("Error fetching next Tomato ID:", e);
    }
  };

  useEffect(() => {
    fetchNextTomatoId();
  }, []);

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleLoading(true);
    try {
      const res = await api.predictSingle({
        ...singleInput,
        input_source: "manual",
      });
      setSingleResult(res);
      fetchNextTomatoId();
    } catch (err: any) {
      alert("Error calculating prediction: " + (err.response?.data?.detail || err.message));
    } finally {
      setSingleLoading(false);
    }
  };


  // ───────────────────────────────────────────────────────────────────────────
  // Tab 2: Multi-Position Tomato State & Logic (Module 6)
  // ───────────────────────────────────────────────────────────────────────────
  const [multiTomatoId, setMultiTomatoId] = useState<number>(1002);
  const [multiRows, setMultiRows] = useState<any[]>(
    Array.from({ length: 10 }, (_, idx) => ({
      position: idx + 1,
      Blue: 55 + idx,
      Green: 60 + idx,
      Yellow: 65 + idx,
      Orange: 70 - idx,
      Red: 35 + idx * 2,
      NIR: 120 - idx * 2,
    }))
  );
  const [multiResult, setMultiResult] = useState<any>(null);
  const [multiLoading, setMultiLoading] = useState(false);

  const handleMultiRowChange = (index: number, field: string, val: number) => {
    setMultiRows((prev) => {
      const updated = [...prev];
      updated[index][field] = val;
      return updated;
    });
  };

  const handleMultiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMultiLoading(true);
    try {
      const readings = multiRows.map((r) => ({
        ...r,
        tomato_id: multiTomatoId,
        input_source: "manual",
      }));
      const res = await api.predictBatch(readings);
      setMultiResult(res);
      fetchNextTomatoId();
    } catch (err: any) {
      alert("Batch prediction failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setMultiLoading(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Tab 3: CSV Upload State & Logic (Module 2)
  // ───────────────────────────────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvResult, setCsvResult] = useState<any>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setCsvResult(null);
      setValidationMessages([]);
    }
  };

  const handleCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setCsvLoading(true);
    setValidationMessages([]);

    // Local dry validation (Module 2 requirements)
    const msgs = [];
    msgs.push(`✔ Loaded ${selectedFile.name}`);
    msgs.push(`✔ File size: ${(selectedFile.size / 1024).toFixed(2)} KB`);

    try {
      const res = await api.uploadCSV(selectedFile);
      setCsvResult(res);
      msgs.push(`✔ Schema Validation: Success`);
      msgs.push(`✔ Scanned ${res.summary.total_samples} valid rows.`);
      msgs.push(`✔ Categories mapped: Fresh (${res.summary.fresh_count}), Aging (${res.summary.aging_count}), Spoiling (${res.summary.spoiling_count})`);
      if (res.summary.saved_records) {
        msgs.push(`✔ Saved ${res.summary.saved_records} dataset records into SQLite database.`);
      }
      if (res.summary.auto_verified_records > 0) {
        msgs.push(`✔ Automatically populated ${res.summary.auto_verified_records} verified ground truth records for Retraining & Verification Center.`);
      }
      setValidationMessages(msgs);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message;
      setValidationMessages([...msgs, `❌ Validation Failed: ${errMsg}`]);
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="border-b border-slate-900 pb-4">
        <h2 className="text-2xl font-bold text-white font-mono tracking-wide uppercase flex items-center gap-3">
          <img src="/voyage_robotics_logo.png" alt="Voyage Robotics Logo" className="w-7 h-7 object-contain filter drop-shadow-[0_0_8px_rgba(57,255,20,0.3)]" />
          <span>Freshness Prediction Engine</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Perform live machine learning diagnostics via manual values, multi-position arrays, or uploaded datasets.
        </p>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-900 font-mono text-xs">
        <button
          onClick={() => setActiveTab("single")}
          className={`px-4 py-2 border-b-2 font-semibold transition-all ${
            activeTab === "single" ? "border-accent-green text-accent-green" : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          01 / SINGLE READING MANUAL INPUT
        </button>
        <button
          onClick={() => setActiveTab("multi")}
          className={`px-4 py-2 border-b-2 font-semibold transition-all ${
            activeTab === "multi" ? "border-accent-green text-accent-green" : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          02 / 10-POSITION TOMATO ARRAY
        </button>
        <button
          onClick={() => setActiveTab("csv")}
          className={`px-4 py-2 border-b-2 font-semibold transition-all ${
            activeTab === "csv" ? "border-accent-green text-accent-green" : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          03 / DATASET UPLOAD (.CSV/.XLSX)
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────
          Tab 1: Single Prediction View
          ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === "single" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Sliders Input Form */}
          <form onSubmit={handleSingleSubmit} className="lg:col-span-1 glass-panel rounded-2xl p-6 border border-slate-800/50 space-y-6">
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider border-b border-slate-900 pb-3">
              Spectral band inputs
            </h3>

            <div className="space-y-4 font-mono text-[11px] text-slate-400">
              {/* Tomato ID & Position */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 uppercase tracking-widest text-slate-500 text-[9px]">Tomato ID</label>
                  <input
                    type="number"
                    value={singleInput.tomato_id}
                    onChange={(e) => setSingleInput({ ...singleInput, tomato_id: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-accent-green"
                  />
                </div>
                <div>
                  <label className="block mb-1 uppercase tracking-widest text-slate-500 text-[9px]">Position (1-10)</label>
                  <input
                    type="number"
                    value={singleInput.position}
                    onChange={(e) => setSingleInput({ ...singleInput, position: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-accent-green"
                  />
                </div>
              </div>

              {/* Spectral bands */}
              {["Blue", "Green", "Yellow", "Orange", "Red", "NIR"].map((band) => (
                <div key={band} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="uppercase tracking-widest text-[9px] text-slate-500">{band} Band</span>
                    <span className="text-white font-bold">{singleInput[band as keyof typeof singleInput].toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="600"
                    step="0.5"
                    value={singleInput[band as keyof typeof singleInput]}
                    onChange={(e) => setSingleInput({ ...singleInput, [band]: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-accent-green"
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={singleLoading}
              className="w-full bg-accent-green text-slate-950 font-semibold py-2.5 rounded-lg text-xs hover:bg-opacity-95 transition-all shadow-[0_0_15px_rgba(57,255,20,0.15)] uppercase tracking-wider font-mono"
            >
              {singleLoading ? "COMPUTING INFERENCE..." : "EVALUATE Telemetry"}
            </button>
          </form>

          {/* Results Display */}
          <div className="lg:col-span-2 space-y-6">
            {singleResult ? (
              <>
                <IndexDisplay ndvi={singleResult.NDVI} gndvi={singleResult.GNDVI} rvi={singleResult.RVI} />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                  <div className="glass-panel rounded-2xl p-6 border border-slate-800/50 flex flex-col justify-between">
                    <h4 className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">
                      Regression Score
                    </h4>
                    <FreshnessGauge score={singleResult.freshness_score} />
                  </div>
                  <div className="flex flex-col justify-between gap-6">
                    <CategoryCard category={singleResult.category} confidence={singleResult.confidence_pct} />
                    <div className="glass-panel rounded-2xl p-4 border border-slate-800/40 text-[10px] font-mono text-slate-500 space-y-1">
                      <div>SYS ACTIVE MODEL: <span className="text-white">{singleResult.model_version}</span></div>
                      <div>TELEMETRY INDEX: <span className="text-accent-green">MANUAL_ENTRY</span></div>
                      <div>ID RECORDED: <span className="text-white">db_row_{singleResult.id}</span></div>
                    </div>
                  </div>
                  <ConfidenceBar
                    fresh={singleResult.confidence_fresh}
                    aging={singleResult.confidence_aging}
                    spoiling={singleResult.confidence_spoiling}
                  />
                </div>
              </>
            ) : (
              <div className="h-[400px] flex items-center justify-center border border-dashed border-slate-800 rounded-2xl text-slate-500 font-mono text-xs">
                Select inputs and click 'EVALUATE' to view model predictions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          Tab 2: Multi-Position Tomato View (Module 6)
          ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === "multi" && (
        <form onSubmit={handleMultiSubmit} className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800/50 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-900 pb-3 gap-4">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">
                  Module 06
                </span>
                <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                  Tomato-Level Position Calibration (10 Positions)
                </h3>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-slate-400">Tomato ID:</span>
                <input
                  type="number"
                  value={multiTomatoId}
                  onChange={(e) => setMultiTomatoId(parseInt(e.target.value) || 0)}
                  className="bg-slate-900 border border-slate-800 rounded px-3 py-1 text-xs text-slate-200 outline-none focus:border-accent-green w-24"
                />
              </div>
            </div>

            {/* Table of positions */}
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-[10px] text-left border-collapse">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-900">
                    <th className="py-2">POS</th>
                    <th className="py-2">BLUE</th>
                    <th className="py-2">GREEN</th>
                    <th className="py-2">YELLOW</th>
                    <th className="py-2">ORANGE</th>
                    <th className="py-2">RED</th>
                    <th className="py-2">NIR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {multiRows.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-950/40">
                      <td className="py-2 font-bold text-accent-green">{row.position}</td>
                      {["Blue", "Green", "Yellow", "Orange", "Red", "NIR"].map((band) => (
                        <td key={band} className="py-1">
                          <input
                            type="number"
                            value={row[band as keyof typeof row]}
                            onChange={(e) => handleMultiRowChange(index, band, parseFloat(e.target.value) || 0)}
                            className="bg-slate-900 border border-slate-800/80 rounded px-2 py-0.5 w-16 text-slate-200 outline-none focus:border-accent-green"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="submit"
              disabled={multiLoading}
              className="w-full bg-accent-green text-slate-950 font-semibold py-2.5 rounded-lg text-xs hover:bg-opacity-95 transition-all shadow-[0_0_15px_rgba(57,255,20,0.15)] uppercase tracking-wider font-mono"
            >
              {multiLoading ? "RUNNING BATCH PREDICTION..." : "EVALUATE WHOLE TOMATO"}
            </button>
          </div>

          {/* Results */}
          {multiResult && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Aggregated Overall Tomato Health Details */}
              <div className="glass-panel rounded-2xl p-6 border border-slate-800/50 space-y-6">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">
                    Aggregation Output
                  </span>
                  <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                    Tomato Level Metrics
                  </h3>
                </div>

                <div className="space-y-4 font-mono text-xs border-t border-slate-900 pt-4">
                  {/* Category */}
                  <div>
                    <span className="block text-[8px] uppercase tracking-widest text-slate-500 mb-1">OVERALL CATEGORY</span>
                    <span className={`text-lg font-black uppercase tracking-wider ${
                      multiResult.overall_category === "Fresh" ? "text-emerald-400" :
                      multiResult.overall_category === "Aging" ? "text-amber-400" : "text-red-400"
                    }`}>
                      {multiResult.overall_category}
                    </span>
                  </div>

                  {/* Avg Score */}
                  <div>
                    <span className="block text-[8px] uppercase tracking-widest text-slate-500 mb-0.5">AVERAGE FRESHNESS SCORE</span>
                    <span className="text-2xl font-extrabold text-white">{multiResult.average_freshness_score.toFixed(2)}</span>
                  </div>

                  {/* Min / Max Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[8px] uppercase tracking-widest text-slate-500 mb-0.5">MIN POSITION</span>
                      <span className="text-slate-300 font-bold">{multiResult.min_freshness_score.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase tracking-widest text-slate-500 mb-0.5">MAX POSITION</span>
                      <span className="text-slate-300 font-bold">{multiResult.max_freshness_score.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Batch list preview */}
              <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800/50 space-y-4">
                <h4 className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider border-b border-slate-900 pb-3">
                  Individual Position Telemetries
                </h4>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full font-mono text-[10px] text-left border-collapse">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-950 pb-2">
                        <th className="pb-1">POS</th>
                        <th className="pb-1">NDVI</th>
                        <th className="pb-1">RVI</th>
                        <th className="pb-1">SCORE</th>
                        <th className="pb-1 text-right">CATEGORY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-950/30">
                      {multiResult.predictions.map((p: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-950/40">
                          <td className="py-2 text-slate-300 font-bold">{p.position}</td>
                          <td className="py-2 text-slate-400">{(p.NDVI ?? p.ndvi)?.toFixed(4) || "0.0000"}</td>
                          <td className="py-2 text-slate-400">{(p.RVI ?? p.rvi)?.toFixed(2) || "0.00"}</td>
                          <td className="py-2 text-white font-bold">{(p.freshness_score ?? 0).toFixed(1)}</td>
                          <td className="py-2 text-right">
                            <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] uppercase ${
                              p.category === "Fresh" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              p.category === "Aging" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                              "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}>
                              {p.category}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </form>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          Tab 3: CSV Dataset Upload View (Module 2)
          ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === "csv" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* File selector card */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800/50 space-y-6">
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider border-b border-slate-900 pb-3">
              Dataset upload portal
            </h3>

            <form onSubmit={handleCsvSubmit} className="space-y-4">
              <div className="border border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent-green hover:bg-slate-950/20 transition-all">
                <Upload size={32} className="text-slate-500 mb-3" />
                <span className="text-xs text-slate-300 font-semibold mb-1">
                  Upload CSV or Excel sheet
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Supported: .csv, .xls, .xlsx
                </span>
                <input
                  type="file"
                  accept=".csv, .xls, .xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-file-input"
                />
                <label
                  htmlFor="csv-file-input"
                  className="mt-3 px-3 py-1.5 bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-300 rounded text-[10px] font-mono cursor-pointer"
                >
                  SELECT FILE
                </label>
              </div>

              {selectedFile && (
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 truncate max-w-[180px]">{selectedFile.name}</span>
                  <span className="text-slate-500 text-[10px]">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>
              )}

              <button
                type="submit"
                disabled={csvLoading || !selectedFile}
                className="w-full bg-accent-green text-slate-950 font-semibold py-2.5 rounded-lg text-xs hover:bg-opacity-95 transition-all shadow-[0_0_15px_rgba(57,255,20,0.15)] uppercase tracking-wider font-mono disabled:opacity-50"
              >
                {csvLoading ? "VALIDATING & PREDICTING..." : "PROCESS DATASET"}
              </button>
            </form>
          </div>

          {/* Validation Logs & Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Terminal logs (Module 2 requirements: Validate columns, validate values, row counts) */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800/50 font-mono text-[11px] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Dataset Validation Logs
                </h4>
                <Terminal size={14} className="text-accent-green" />
              </div>
              <div className="space-y-1.5 text-slate-500 max-h-40 overflow-y-auto">
                {validationMessages.length > 0 ? (
                  validationMessages.map((msg, idx) => (
                    <div key={idx} className={msg.startsWith("❌") ? "text-accent-red" : "text-slate-400"}>
                      {msg}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-600">Waiting for file upload trigger...</div>
                )}
              </div>
            </div>

            {/* Results Preview (Module 2: Preview Dataset, Number of samples) */}
            {csvResult && (
              <div className="glass-panel rounded-2xl p-6 border border-slate-800/50 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <BarChart2 size={14} className="text-accent-green" />
                    Dataset Preview (First 100 Rows)
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">
                    Total Rows: {csvResult.summary.total_samples}
                  </span>
                </div>

                <div className="overflow-x-auto max-h-60">
                  <table className="w-full font-mono text-[9px] text-left border-collapse">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-950 pb-2">
                        <th className="pb-1">TOMATO_ID</th>
                        <th className="pb-1">POS</th>
                        <th className="pb-1">BLUE</th>
                        <th className="pb-1">GREEN</th>
                        <th className="pb-1">RED</th>
                        <th className="pb-1">NIR</th>
                        <th className="pb-1">NDVI</th>
                        <th className="pb-1">SCORE</th>
                        <th className="pb-1 text-right">CATEGORY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-950/30 text-slate-400">
                      {csvResult.preview.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-950/40">
                          <td className="py-1.5 text-slate-300 font-bold">{row.Tomato_ID || "N/A"}</td>
                          <td className="py-1.5">{row.Tomato_position || "N/A"}</td>
                          <td className="py-1.5">{row.Blue.toFixed(1)}</td>
                          <td className="py-1.5">{row.Green.toFixed(1)}</td>
                          <td className="py-1.5">{row.Red.toFixed(1)}</td>
                          <td className="py-1.5">{row.NIR.toFixed(1)}</td>
                          <td className="py-1.5">{row.NDVI?.toFixed(4) || "N/A"}</td>
                          <td className="py-1.5 text-white font-semibold">{row.freshness_score?.toFixed(1)}</td>
                          <td className="py-1.5 text-right">
                            <span className={`px-1 rounded text-[8px] font-bold uppercase ${
                              row.category === "Fresh" ? "bg-emerald-500/10 text-emerald-400" :
                              row.category === "Aging" ? "bg-amber-500/10 text-amber-400" :
                              "bg-red-500/10 text-red-400"
                            }`}>
                              {row.category}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

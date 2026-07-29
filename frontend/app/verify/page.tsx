"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { CheckSquare, ArrowRight, BookOpen, Database, AlertCircle, Download, RefreshCw } from "lucide-react";

export default function VerificationCenter() {
  const [stats, setStats] = useState({
    total_audited_samples: 0,
    fresh_count: 0,
    aging_count: 0,
    spoiling_count: 0,
    retraining_readiness: false,
    remaining_samples_required: 10,
  });
  const [verifiedRecords, setVerifiedRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, historyRes] = await Promise.all([
        api.getVerificationStats(),
        api.getVerificationHistory(),
      ]);

      if (statsRes.success) {
        setStats(statsRes.data);
      }
      if (historyRes.success) {
        setVerifiedRecords(historyRes.data);
      }
    } catch (e) {
      console.error("Error loading verification stats:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatTimestamp = (ts: string) => {
    if (!ts) return "N/A";
    const clean = ts.includes("Z") || ts.includes("+") ? ts : ts.replace(" ", "T") + "Z";
    const d = new Date(clean);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="border-b border-slate-900 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-mono tracking-wide uppercase flex items-center gap-2">
            <CheckSquare size={24} className="text-accent-green" />
            Verified Dataset Center
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review and audit human-labeled dataset records stored permanently in SQLite.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={api.getDownloadVerifiedCsvUrl()}
            download
            className="flex items-center gap-1.5 px-3 py-2 bg-accent-green/10 border border-accent-green/30 hover:bg-accent-green/20 text-accent-green rounded text-xs font-mono font-bold transition-all shadow-[0_0_10px_rgba(57,255,20,0.1)]"
          >
            <Download size={14} />
            <span>DOWNLOAD VERIFIED DATASET</span>
          </a>
          <button
            onClick={loadData}
            className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/40 font-mono">
          <span className="text-[9px] uppercase tracking-widest text-slate-500 block mb-1">TOTAL AUDITED SAMPLES</span>
          <span className="text-3xl font-extrabold text-white">{stats.total_audited_samples}</span>
          <span className="text-[9px] text-slate-400 block mt-1">Ready for retraining</span>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/40 font-mono">
          <span className="text-[9px] uppercase tracking-widest text-slate-500 block mb-1">🟢 VERIFIED FRESH</span>
          <span className="text-3xl font-extrabold text-emerald-400">{stats.fresh_count}</span>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/40 font-mono">
          <span className="text-[9px] uppercase tracking-widest text-slate-500 block mb-1">🟡 VERIFIED AGING</span>
          <span className="text-3xl font-extrabold text-amber-400">{stats.aging_count}</span>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/40 font-mono">
          <span className="text-[9px] uppercase tracking-widest text-slate-500 block mb-1">🔴 VERIFIED SPOILING</span>
          <span className="text-3xl font-extrabold text-red-400">{stats.spoiling_count}</span>
        </div>
      </div>

      {/* Audit Table */}
      <div className="glass-panel rounded-2xl border border-slate-800/50 overflow-hidden space-y-3 p-4">
        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
          <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <Database size={14} className="text-accent-green" />
            Active Verified Records Audit Queue (SQLite)
          </h3>
          <span className="text-[10px] font-mono text-slate-500">
            {verifiedRecords.length} Active Records
          </span>
        </div>

        <div className="max-h-[460px] overflow-y-auto overflow-x-auto pr-1">
          <table className="w-full font-mono text-[11px] text-slate-300 text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md">
              <tr className="text-slate-500 border-b border-slate-800 uppercase tracking-wider text-[9px]">
                <th className="p-2.5">V_ID</th>
                <th className="p-2.5">TOMATO_ID</th>
                <th className="p-2.5">POS</th>
                <th className="p-2.5">BLUE / NIR</th>
                <th className="p-2.5">NDVI</th>
                <th className="p-2.5">PRED CLASS</th>
                <th className="p-2.5">VERIFIED CLASS</th>
                <th className="p-2.5">VERIFIED SCORE</th>
                <th className="p-2.5">VERIFIED AT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60 text-[10px]">
              {verifiedRecords.length > 0 ? (
                verifiedRecords.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-950/20">
                    <td className="p-2.5 font-bold text-slate-400">v_{row.id}</td>
                    <td className="p-2.5 font-bold text-white">{row.tomato_id || "N/A"}</td>
                    <td className="p-2.5">{row.position || "N/A"}</td>
                    <td className="p-2.5 text-slate-400">{row.blue?.toFixed(1)} / {row.nir?.toFixed(1)}</td>
                    <td className="p-2.5 text-slate-400">{row.ndvi?.toFixed(4)}</td>
                    <td className="p-2.5 text-slate-500">{row.predicted_category}</td>
                    <td className="p-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        row.actual_category === "Fresh" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        row.actual_category === "Aging" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {row.actual_category}
                      </span>
                    </td>
                    <td className="p-2.5 text-white font-bold">
                      {(row.actual_freshness_score ?? row.freshness_score)?.toFixed(1)}
                    </td>
                    <td className="p-2.5 text-slate-500">{formatTimestamp(row.verified_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-600">
                    No active verified records found. Verify predictions in History to populate the training queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guidelines & RETRAIN Link */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Guidelines Card */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/50 space-y-4">
          <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <BookOpen size={16} className="text-accent-green" />
            Human Labeled Protocols (Module 09)
          </h3>
          <div className="space-y-3 font-mono text-[10px] text-slate-400">
            <div className="flex gap-2">
              <span className="text-accent-green font-bold">01 /</span>
              <p>Verify tomatoes only after physical/sensory inspection. Match predictions against physical characteristics.</p>
            </div>
            <div className="flex gap-2">
              <span className="text-accent-green font-bold">02 /</span>
              <p>Store verified labels directly in SQLite via the Verify audit modal in prediction history.</p>
            </div>
            <div className="flex gap-2">
              <span className="text-accent-green font-bold">03 /</span>
              <p>Ensure class distribution is balanced before triggering retraining runs to prevent bias.</p>
            </div>
          </div>
        </div>

        {/* Retraining checklist call to action */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/50 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Database size={16} className="text-accent-green" />
              Retraining Readiness Check
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-2 bg-slate-950/60 p-3 rounded-lg border border-slate-900">
              <AlertCircle size={14} className="text-accent-yellow flex-shrink-0" />
              <span>
                Minimum 10 verified samples required. Current status:{" "}
                <strong className={stats.retraining_readiness ? "text-accent-green" : "text-amber-400"}>
                  {stats.retraining_readiness ? "READY" : `INSUFFICIENT DATA (${stats.remaining_samples_required} needed)`}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Link
              href="/history"
              className="flex-1 flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold py-2.5 rounded-lg text-xs font-mono"
            >
              <span>AUDIT HISTORY</span>
            </Link>
            <Link
              href="/retrain"
              className="flex-1 flex items-center justify-center gap-2 bg-accent-green text-slate-950 font-semibold py-2.5 rounded-lg text-xs font-mono shadow-[0_0_15px_rgba(57,255,20,0.15)] hover:scale-[1.02] transition-all"
            >
              <span>GO TO RETRAINING</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


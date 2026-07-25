"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AnalyticsSummary } from "@/lib/types";
import {
  TrendingUp,
  Cpu,
  BarChart3,
  Percent,
  Calendar,
  PieChart as PieIcon,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getAnalytics();
      if (res.success) {
        setData(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="border-b border-slate-900 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-mono tracking-wide uppercase flex items-center gap-2">
            <TrendingUp size={24} className="text-accent-green" />
            Performance & Insights Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Module 12: Real-time telemetry analytics, historical prediction trends, and feature gain rankings.
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {data ? (
        <>
          {/* Diagnostic Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Analyzed */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800/40 font-mono">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 block mb-1">TOTAL ANALYSED</span>
              <span className="text-3xl font-extrabold text-white">
                {data.summary.total_predictions.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-400 block mt-1">Telemetry rows logged</span>
            </div>

            {/* Average Freshness */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800/40 font-mono">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 block mb-1">AVG FRESHNESS SCORE</span>
              <span className="text-3xl font-extrabold text-white">
                {data.summary.average_freshness_score.toFixed(1)} / 100
              </span>
              <span className="text-[9px] text-accent-green block mt-1">● STRUCTURAL HEALTH OK</span>
            </div>

            {/* Classification Accuracy */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800/40 font-mono">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 block mb-1">CLASSIFIER ACCURACY</span>
              <span className="text-3xl font-extrabold text-accent-green">
                {(data.model_performance.classification_accuracy * 100).toFixed(2)}%
              </span>
              <span className="text-[9px] text-slate-400 block mt-1">XGBoost cross val</span>
            </div>

            {/* Regression R² */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800/40 font-mono">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 block mb-1">REGRESSOR R² SCORE</span>
              <span className="text-3xl font-extrabold text-accent-blue">
                {data.model_performance.regression_r2.toFixed(4)}
              </span>
              <span className="text-[9px] text-slate-400 block mt-1">Variance fit index</span>
            </div>
          </div>

          {/* Charts Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Time Series Trend (Left, 2 columns) */}
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800/50 h-[320px] flex flex-col justify-between">
              <div className="flex items-center gap-2 font-mono">
                <Calendar size={14} className="text-slate-500" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Historical Freshness Trend (Last 50)
                </span>
              </div>
              <div className="flex-1 w-full mt-4 font-mono text-[9px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#00d2ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                    <XAxis
                      dataKey="timestamp"
                      stroke="#475569"
                      tickFormatter={(t) => new Date(t).toLocaleTimeString()}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#94a3b8" }}
                    />
                    <YAxis stroke="#475569" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "rgba(255,255,255,0.08)",
                        borderRadius: "8px",
                        color: "#e2e8f0",
                      }}
                      labelClassName="font-mono text-slate-400"
                    />
                    <Area
                      type="monotone"
                      dataKey="freshness_score"
                      name="Freshness Score"
                      stroke="#00d2ff"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#trendGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category distribution (Right, 1 column) */}
            <div className="glass-panel rounded-2xl p-6 border border-slate-800/50 h-[320px] flex flex-col justify-between">
              <div className="flex items-center gap-2 font-mono">
                <PieIcon size={14} className="text-slate-500" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Category Distribution
                </span>
              </div>
              <div className="flex-1 w-full mt-4 flex items-center justify-center font-mono text-[9px]">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={data.category_distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {data.category_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "rgba(255,255,255,0.08)",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex items-center justify-around font-mono text-[9px] text-slate-400 pt-2 border-t border-slate-900/60">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Fresh ({data.summary.fresh_count})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Aging ({data.summary.aging_count})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Spoiling ({data.summary.spoiling_count})
                </span>
              </div>
            </div>
          </div>

          {/* Feature Importance Rankings (SHAP & Gain analysis) */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800/50 h-[320px] flex flex-col justify-between">
            <div className="flex items-center gap-2 font-mono">
              <BarChart3 size={14} className="text-slate-500" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                XGBoost Feature Gain / SHAP Global Importance
              </span>
            </div>
            <div className="flex-1 w-full mt-4 font-mono text-[9px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.feature_importance} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                  <XAxis dataKey="feature" stroke="#475569" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
                  <YAxis stroke="#475569" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "rgba(255,255,255,0.08)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="importance" name="Relative Gain" radius={[4, 4, 0, 0]}>
                    {data.feature_importance.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.feature === "RVI" || entry.feature === "NDVI" ? "#39ff14" : "#475569"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <div className="h-96 flex items-center justify-center border border-dashed border-slate-800 rounded-2xl text-slate-500 font-mono text-xs">
          Loading diagnostic analytics data...
        </div>
      )}
    </div>
  );
}

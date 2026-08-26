"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/components/theme/ThemeProvider";

interface SpectralChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export default function SpectralChart({ data }: SpectralChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-200 dark:border-slate-800/50 h-full min-h-[380px] flex flex-col justify-between shadow-sm dark:shadow-xl transition-colors duration-200">
      <div>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5 font-semibold">
          Module 03
        </span>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
          Real-Time Reflectance Wave Distribution
        </h3>
      </div>

      <div className="flex-1 w-full h-[280px] min-h-[260px] mt-4 font-mono text-[10px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 15, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isDark ? "#00FF88" : "#10B981"} stopOpacity={0.35} />
                <stop offset="95%" stopColor={isDark ? "#00FF88" : "#10B981"} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"} />
            <XAxis
              dataKey="name"
              stroke={isDark ? "#475569" : "#94A3B8"}
              tickLine={false}
              axisLine={false}
              tick={{ fill: isDark ? "#00E5FF" : "#0284C7", fontSize: 11, fontWeight: "bold" }}
            />
            <YAxis
              stroke={isDark ? "#475569" : "#94A3B8"}
              tickLine={false}
              axisLine={false}
              tick={{ fill: isDark ? "#94a3b8" : "#64748B" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#070B12" : "#FFFFFF",
                borderColor: isDark ? "rgba(0,255,180,0.2)" : "#E2E8F0",
                borderRadius: "10px",
                color: isDark ? "#e2e8f0" : "#0F172A",
                boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.5)" : "0 4px 20px rgba(0,0,0,0.08)",
              }}
              labelClassName="font-mono font-bold"
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isDark ? "#00FF88" : "#059669"}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

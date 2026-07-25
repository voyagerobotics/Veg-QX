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

interface SpectralChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export default function SpectralChart({ data }: SpectralChartProps) {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800/50 h-[300px] flex flex-col justify-between">
      <div>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">
          Module 03
        </span>
        <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
          Real-Time Reflectance Wave Distribution
        </h3>
      </div>

      <div className="flex-1 w-full h-full mt-4 font-mono text-[10px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#39ff14" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#39ff14" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis
              dataKey="name"
              stroke="#475569"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8" }}
            />
            <YAxis
              stroke="#475569"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#e2e8f0",
              }}
              labelClassName="font-mono text-slate-400"
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#39ff14"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

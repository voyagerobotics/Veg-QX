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
    <div className="glass-panel rounded-2xl p-6 border border-slate-800/50 h-full min-h-[380px] flex flex-col justify-between shadow-xl">
      <div>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">
          Module 03
        </span>
        <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
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
                <stop offset="5%" stopColor="#00FF88" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#00FF88" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="name"
              stroke="#475569"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#00E5FF", fontSize: 11 }}
            />
            <YAxis
              stroke="#475569"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#070B12",
                borderColor: "rgba(0,255,180,0.2)",
                borderRadius: "10px",
                color: "#e2e8f0",
              }}
              labelClassName="font-mono text-[#00FF88]"
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#00FF88"
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

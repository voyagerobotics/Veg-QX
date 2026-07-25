"use client";

import { CATEGORY_COLORS } from "@/lib/constants";
import { CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";

interface CategoryCardProps {
  category: "Fresh" | "Aging" | "Spoiling";
  confidence: number;
}

export default function CategoryCard({ category, confidence }: CategoryCardProps) {
  const styles = CATEGORY_COLORS[category] || CATEGORY_COLORS.Aging;

  const getIcon = () => {
    switch (category) {
      case "Fresh":
        return <CheckCircle2 size={24} className="text-emerald-400" />;
      case "Aging":
        return <AlertTriangle size={24} className="text-amber-400" />;
      case "Spoiling":
        return <ShieldAlert size={24} className="text-red-400" />;
    }
  };

  return (
    <div
      className={`glass-panel border rounded-2xl p-6 flex items-center justify-between transition-all duration-300 ${styles.border} ${styles.bg} ${styles.glow}`}
    >
      <div className="space-y-1">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
          Classification Target Output
        </span>
        <h4 className={`text-2xl font-black uppercase tracking-wider ${styles.text}`}>
          {category}
        </h4>
        <div className="text-[12px] font-mono text-slate-400">
          Confidence Probability:{" "}
          <span className="text-white font-bold">{confidence.toFixed(1)}%</span>
        </div>
      </div>

      <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5">
        {getIcon()}
      </div>
    </div>
  );
}

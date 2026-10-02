import type { LucideIcon } from "lucide-react";
import { toneSoft, toneText, type Tone } from "../../lib/status";
import Sparkline from "./Sparkline";

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: Tone;
  trend?: number[];
}

export default function StatCard({ label, value, hint, icon: Icon, tone = "neutral", trend }: StatCardProps) {
  return (
    <div className="surface-card group p-4 transition duration-300 hover:-translate-y-1 hover:border-neutral-400/40 sm:p-5">
      <div className="flex items-center gap-2.5">
        <span className={`grid size-9 place-items-center rounded-xl border transition-transform duration-300 group-hover:scale-110 ${toneSoft[tone]} ${tone === "neutral" ? "text-neutral-200" : toneText[tone]}`}>
          <Icon size={16} />
        </span>
        <span className="text-sm text-neutral-400">{label}</span>
      </div>
      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-2xl font-medium tracking-tight text-neutral-50">{value}</p>
          <p className="mt-1 truncate text-xs text-neutral-500">{hint}</p>
        </div>
        {trend && <Sparkline values={trend} className={toneText[tone]} />}
      </div>
    </div>
  );
}

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { LatencyPoint } from "../../types/metrics";

const colors = {
  p50: "#f5f5f5",
  p95: "#a3a3a3",
  threshold: "#f59e0b",
  grid: "#1c1c1c",
  tick: "#737373",
};

const tick = { fill: colors.tick, fontSize: 11 };

interface ResponseTimeChartProps {
  data: LatencyPoint[];
  thresholdMs: number;
}

export default function ResponseTimeChart({ data, thresholdMs }: ResponseTimeChartProps) {
  return (
    <div className="px-2 pb-4 font-mono">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="p50-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.p50} stopOpacity={0.22} />
              <stop offset="100%" stopColor={colors.p50} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={colors.grid} vertical={false} />
          <XAxis dataKey="time" tick={tick} tickLine={false} axisLine={false} interval={3} dy={6} />
          <YAxis tick={tick} tickLine={false} axisLine={false} width={56} tickFormatter={(value) => `${value}ms`} />
          <Tooltip
            cursor={{ stroke: "#2a2a2a" }}
            contentStyle={{ background: "#0c0c0c", border: "1px solid #2a2a2a", borderRadius: 12, fontSize: 12, boxShadow: "0 12px 30px rgba(0,0,0,.5)" }}
            labelStyle={{ color: "#a3a3a3", marginBottom: 4 }}
            itemStyle={{ padding: 0 }}
            formatter={(value) => `${value}ms`}
          />
          <ReferenceLine y={thresholdMs} stroke={colors.threshold} strokeDasharray="4 4" strokeOpacity={0.6} />
          <Area type="monotone" dataKey="p95" name="p95" stroke={colors.p95} strokeDasharray="3 3" strokeWidth={1.25} fill="none" animationDuration={700} />
          <Area
            type="monotone"
            dataKey="p50"
            name="p50"
            stroke={colors.p50}
            strokeWidth={1.5}
            fill="url(#p50-fill)"
            animationDuration={700}
            activeDot={{ r: 3.5, fill: colors.p50, stroke: "#050505", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 px-4 font-sans text-xs text-neutral-500">
        <li className="flex items-center gap-2">
          <span className="h-px w-4 bg-neutral-100" /> p50
        </li>
        <li className="flex items-center gap-2">
          <span className="w-4 border-t border-dashed border-neutral-500" /> p95
        </li>
        <li className="flex items-center gap-2">
          <span className="w-4 border-t border-dashed border-amber-500" /> {thresholdMs}ms threshold
        </li>
      </ul>
    </div>
  );
}

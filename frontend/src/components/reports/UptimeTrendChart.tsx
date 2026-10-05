import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const colors = { healthy: "#22c55e", dip: "#f59e0b", outage: "#ef4444", grid: "#1a1a1a", tick: "#737373" };
const tick = { fill: colors.tick, fontSize: 11 };

export interface UptimePoint {
  time: string;
  uptime: number | null;
}

// Bars start at 90% so small dips stay visible; anything lower is clamped to the floor.
const FLOOR = 90;
const barColor = (uptime: number) => (uptime >= 99.9 ? colors.healthy : uptime >= 95 ? colors.dip : colors.outage);

export default function UptimeTrendChart({ data, tickFormatter }: { data: UptimePoint[]; tickFormatter?: (label: string) => string }) {
  const bars = data.map((point) => ({ ...point, bar: point.uptime === null ? null : Math.max(point.uptime, FLOOR) }));
  return (
    <div className="px-2 pb-4 font-mono">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={bars} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={colors.grid} vertical={false} />
          <XAxis dataKey="time" tick={tick} tickLine={false} axisLine={false} interval={3} dy={6} tickFormatter={tickFormatter} />
          <YAxis domain={[FLOOR, 100]} ticks={[90, 95, 100]} tick={tick} tickLine={false} axisLine={false} width={56} tickFormatter={(value) => `${value}%`} />
          <Tooltip
            cursor={{ fill: "rgb(255 255 255 / 0.03)" }}
            contentStyle={{ background: "#0c0c0c", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#a3a3a3", marginBottom: 4 }}
            itemStyle={{ padding: 0 }}
            formatter={(_value, _name, item) => [`${(item.payload as UptimePoint).uptime}%`, "Uptime"]}
          />
          <Bar dataKey="bar" radius={[2, 2, 0, 0]} animationDuration={700}>
            {bars.map((point, i) => (
              <Cell key={i} fill={point.uptime === null ? "transparent" : barColor(point.uptime)} fillOpacity={0.75} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

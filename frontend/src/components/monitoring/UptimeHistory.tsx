import { Activity } from "lucide-react";
import EmptyState from "../common/EmptyState";
import { healthLabel, healthTone, toneDot } from "../../lib/status";
import type { UptimeHistoryRow } from "../../types/metrics";

export default function UptimeHistory({ rows, windowDays }: { rows: UptimeHistoryRow[]; windowDays: number }) {
  if (rows.length === 0) {
    return (
      <div className="border-t border-line">
        <EmptyState icon={Activity} title="No APIs yet" description="Register an API and its daily uptime will appear here." />
      </div>
    );
  }
  return (
    <div className="border-t border-line">
      <ul className="divide-y divide-line">
        {rows.map((row) => (
          <li key={row.apiName} className="px-5 py-4">
            <div className="mb-2.5 flex items-center justify-between gap-4 text-sm">
              <span className="text-neutral-200">{row.apiName}</span>
              <span className="font-mono text-neutral-400">{row.uptimePercent === null ? "—" : `${row.uptimePercent}%`}</span>
            </div>
            <div role="img" aria-label={`${row.apiName}: ${row.uptimePercent ?? "no"}% uptime over ${windowDays} days`} className="flex h-6 gap-px sm:gap-0.5">
              {row.days.map((day, i) => {
                const daysAgo = row.days.length - 1 - i;
                return (
                  <span
                    key={i}
                    title={`${daysAgo === 0 ? "Today" : `${daysAgo} days ago`} · ${healthLabel[day]}`}
                    className={`flex-1 rounded-[2px] ${toneDot[healthTone[day]]} ${day === "healthy" ? "opacity-35 hover:opacity-80" : ""}`}
                  />
                );
              })}
            </div>
          </li>
        ))}
      </ul>
      <p className="flex justify-between border-t border-line px-5 py-2.5 text-xs text-neutral-600">
        <span>{windowDays} days ago</span>
        <span>Today</span>
      </p>
    </div>
  );
}

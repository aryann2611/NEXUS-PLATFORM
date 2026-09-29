import { bucketLabel, duration, percent } from "../../lib/report";
import { healthLabel, healthTone, toneDot } from "../../lib/status";
import type { ApiReport, Report } from "../../types/report";

interface ApiUptimeListProps {
  report: Report;
}

/** One row per API: uptime, downtime, and the worst outcome in each time bucket. */
export default function ApiUptimeList({ report }: ApiUptimeListProps) {
  const label = (i: number) => bucketLabel(report.buckets[i].start, report.range);
  return (
    <div className="border-t border-line">
      <ul className="divide-y divide-line">
        {report.apis.map((api: ApiReport) => (
          <li key={api.id} className="px-5 py-4">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
              <span className="min-w-0 truncate text-neutral-200">{api.name}</span>
              <span className="flex gap-4 font-mono text-xs text-neutral-500">
                <span>{api.downtimeSeconds ? `${duration(api.downtimeSeconds)} down` : "No downtime"}</span>
                <span className="text-sm text-neutral-300">{percent(api.uptimePercent)}</span>
              </span>
            </div>
            <div
              role="img"
              aria-label={`${api.name}: ${api.uptimePercent === null ? "no checks" : `${api.uptimePercent}% uptime`}`}
              className="flex h-6 gap-px sm:gap-0.5"
            >
              {api.history.map((outcome, i) => (
                <span
                  key={i}
                  title={`${label(i)} · ${outcome ? healthLabel[outcome] : "No checks"}`}
                  className={`flex-1 rounded-[2px] ${
                    outcome === null
                      ? "bg-white/[0.04]"
                      : `${toneDot[healthTone[outcome]]} ${outcome === "healthy" ? "opacity-35 hover:opacity-80" : ""}`
                  }`}
                />
              ))}
            </div>
          </li>
        ))}
      </ul>
      <p className="flex justify-between border-t border-line px-5 py-2.5 text-xs text-neutral-600">
        <span>{label(0)}</span>
        <span>Now</span>
      </p>
    </div>
  );
}

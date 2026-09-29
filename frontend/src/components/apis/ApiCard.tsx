import { ArrowRight, Box, Clock } from "lucide-react";
import { timeAgo } from "../../lib/format";
import { healthTone, toneText } from "../../lib/status";
import type { MonitoredApi } from "../../types/api";
import { StatusBadge } from "../common/Badge";
import { ButtonLink } from "../common/Button";
import Sparkline from "../common/Sparkline";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 first:pl-0 sm:px-4">
      <p className="font-mono text-base text-neutral-50 sm:text-lg">{value}</p>
      <p className="text-xs whitespace-nowrap text-neutral-500">{label}</p>
    </div>
  );
}

export default function ApiCard({ api }: { api: MonitoredApi }) {
  return (
    <article className="rounded-xl border border-line bg-surface p-5 transition-colors hover:border-line-strong">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-surface-3 text-neutral-300">
          <Box size={18} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-neutral-100">{api.name}</h3>
          <p className="truncate font-mono text-xs text-neutral-500">{api.baseUrl}</p>
        </div>
        <StatusBadge health={api.health} />
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div className="flex divide-x divide-line">
          <Metric label="Endpoints" value={api.endpointCount === null ? "—" : String(api.endpointCount)} />
          <Metric label="Uptime" value={api.uptimePercent === null ? "—" : `${api.uptimePercent}%`} />
          <Metric label="Avg Latency" value={api.avgLatencyMs === null ? "—" : `${api.avgLatencyMs}ms`} />
        </div>
        {api.latencyTrend.length > 1 && <Sparkline values={api.latencyTrend} className={`hidden sm:block ${toneText[healthTone[api.health]]}`} />}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs text-neutral-500">
          <Clock size={13} />
          {api.lastCheckedAt ? `Last checked ${timeAgo(api.lastCheckedAt)}` : "Not checked yet"}
        </p>
        <ButtonLink to={`/reports?api=${api.id}`} size="sm">
          View Report <ArrowRight size={14} />
        </ButtonLink>
      </div>
    </article>
  );
}

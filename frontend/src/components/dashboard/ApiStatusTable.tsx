import { timeAgo } from "../../lib/format";
import { ms, percent } from "../../lib/report";
import type { ApiReport } from "../../types/report";
import { StatusBadge } from "../common/Badge";

const th = "px-5 py-2.5 font-medium";

/** Current status and last-24h figures per API, worst first. */
export default function ApiStatusTable({ apis }: { apis: ApiReport[] }) {
  const rank = { down: 0, degraded: 1, pending: 2, healthy: 3 };
  const sorted = [...apis].sort((a, b) => rank[a.status] - rank[b.status] || a.name.localeCompare(b.name));
  return (
    <div className="overflow-x-auto border-t border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-neutral-500">
            <th className={th}>API</th>
            <th className={th}>Status</th>
            <th className={`${th} text-right`}>Uptime</th>
            <th className={`${th} text-right`}>Avg</th>
            <th className={`${th} hidden text-right sm:table-cell`}>p95</th>
            <th className={`${th} hidden text-right md:table-cell`}>Last Checked</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {sorted.map((api) => (
            <tr key={api.id} className="transition-colors hover:bg-white/[0.02]">
              <td className="px-5 py-3">
                <p className="max-w-64 truncate text-neutral-200">{api.name}</p>
                <p className="max-w-64 truncate font-mono text-xs text-neutral-500">{api.baseUrl}</p>
              </td>
              <td className="px-5 py-3">
                <StatusBadge health={api.status} />
              </td>
              <td className="px-5 py-3 text-right font-mono tabular-nums text-neutral-200">{percent(api.uptimePercent)}</td>
              <td className="px-5 py-3 text-right font-mono tabular-nums text-neutral-200">{ms(api.latency.avg)}</td>
              <td className="hidden px-5 py-3 text-right font-mono tabular-nums text-neutral-400 sm:table-cell">{ms(api.latency.p95)}</td>
              <td className="hidden px-5 py-3 text-right whitespace-nowrap text-neutral-500 md:table-cell">
                {api.lastCheckedAt ? timeAgo(api.lastCheckedAt, "long") : "Not yet"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
